import si from "systeminformation";
import { z } from "zod";
import type { JarvisPlugin } from "./plugin-registry.js";
import type { AssistantStore } from "../assistant/store.js";
import type { EventBus } from "../events/event-bus.js";

export function createMonitoringPlugin(store:AssistantStore,events:EventBus):JarvisPlugin{
return {
  id:"monitoring",
  name:"System Monitoring",
  version:"0.1.0",
  description:"Cross-platform CPU, RAM, GPU, storage, battery and network monitoring.",
  tools:[
    {
      name:"system.monitor.summary",
      description:"Get a cross-platform system health snapshot including CPU, memory, disks, GPU, battery and network.",
      capability:"system.read",
      parameters:{type:"object",properties:{},additionalProperties:false},
      async execute(){
        const [
          currentLoad,
          cpuTemperature,
          memory,
          filesystems,
          graphics,
          battery,
          networkStats,
          time
        ]=await Promise.all([
          si.currentLoad(),
          si.cpuTemperature(),
          si.mem(),
          si.fsSize(),
          si.graphics(),
          si.battery(),
          si.networkStats(),
          si.time()
        ]);

        return {
          cpu:{
            loadPercent:currentLoad.currentLoad,
            userPercent:currentLoad.currentLoadUser,
            systemPercent:currentLoad.currentLoadSystem,
            temperatureC:cpuTemperature.main,
            coresC:cpuTemperature.cores
          },
          memory:{
            total:memory.total,
            used:memory.used,
            available:memory.available,
            active:memory.active,
            swapTotal:memory.swaptotal,
            swapUsed:memory.swapused
          },
          disks:filesystems.map((disk)=>({
            fs:disk.fs,
            type:disk.type,
            size:disk.size,
            used:disk.used,
            available:disk.available,
            usePercent:disk.use,
            mount:disk.mount
          })),
          gpu:graphics.controllers.map((gpu)=>({
            vendor:gpu.vendor,
            model:gpu.model,
            vramMb:gpu.vram,
            vramDynamic:gpu.vramDynamic,
            utilizationGpu:gpu.utilizationGpu,
            utilizationMemory:gpu.utilizationMemory,
            temperatureGpu:gpu.temperatureGpu,
            memoryTotal:gpu.memoryTotal,
            memoryUsed:gpu.memoryUsed,
            memoryFree:gpu.memoryFree
          })),
          battery:{
            hasBattery:battery.hasBattery,
            percent:battery.percent,
            charging:battery.isCharging,
            acConnected:battery.acConnected,
            timeRemaining:battery.timeRemaining
          },
          network:networkStats.map((item)=>({
            interface:item.iface,
            rxBytes:item.rx_bytes,
            txBytes:item.tx_bytes,
            rxSec:item.rx_sec,
            txSec:item.tx_sec
          })),
          uptimeSeconds:time.uptime
        };
      }
    },
    {
      name:"system.monitor.processes",
      description:"List running processes with CPU and memory usage.",
      capability:"system.read",
      async execute(input){
        const value=z.object({
          limit:z.number().int().min(1).max(500).default(50),
          sort:z.enum(["cpu","memory"]).default("cpu")
        }).parse(input ?? {});
        const data=await si.processes();
        const sorted=[...data.list].sort((a,b)=>
          value.sort==="cpu" ? (b.cpu-a.cpu) : (b.mem-a.mem)
        );
        return sorted.slice(0,value.limit).map((process)=>({
          pid:process.pid,
          parentPid:process.parentPid,
          name:process.name,
          command:process.command,
          cpuPercent:process.cpu,
          memoryPercent:process.mem,
          memoryRss:process.memRss,
          state:process.state,
          user:process.user
        }));
      }
    },
    {
      name:"system.monitor.network",
      description:"Read network interfaces and live traffic statistics.",
      capability:"system.read",
      async execute(){
        const [interfaces,stats]=await Promise.all([
          si.networkInterfaces(),
          si.networkStats()
        ]);
        return {interfaces,stats};
      }
    },
    {
      name:"system.monitor.disk_health",
      description:"Read physical disk health and SMART-related details when available.",
      capability:"system.read",
      async execute(){
        const disks=await si.diskLayout();
        return disks.map((disk)=>({
          device:disk.device,
          type:disk.type,
          name:disk.name,
          vendor:disk.vendor,
          size:disk.size,
          interfaceType:disk.interfaceType,
          smartStatus:disk.smartStatus,
          temperature:disk.temperature
        }));
      }
    },
    {
      name:"system.monitor.services",
      description:"List operating-system services and their running state.",
      capability:"system.read",
      async execute(input){
        const value=z.object({name:z.string().default("*")}).parse(input ?? {});
        return si.services(value.name);
      }
    },
    {
      name:"system.monitor.alerts",
      description:"Evaluate system thresholds and optionally create system/server notifications.",
      capability:"system.read",
      async execute(input){
        const value=z.object({
          cpuPercent:z.number().min(1).max(100).default(90),
          memoryPercent:z.number().min(1).max(100).default(90),
          diskPercent:z.number().min(1).max(100).default(90),
          temperatureC:z.number().default(85),
          source:z.enum(["system","server"]).default("system"),
          notify:z.boolean().default(true)
        }).parse(input??{});
        const [load,mem,disks,temp]=await Promise.all([
          si.currentLoad(),si.mem(),si.fsSize(),si.cpuTemperature()
        ]);
        const alerts:Array<{kind:string;message:string;value:number}>= [];
        const memPercent=mem.total?mem.used/mem.total*100:0;
        if(load.currentLoad>=value.cpuPercent) alerts.push({kind:"cpu",message:`CPU load is ${load.currentLoad.toFixed(1)}%`,value:load.currentLoad});
        if(memPercent>=value.memoryPercent) alerts.push({kind:"memory",message:`Memory usage is ${memPercent.toFixed(1)}%`,value:memPercent});
        for(const disk of disks){
          if(disk.use>=value.diskPercent) alerts.push({kind:"disk",message:`${disk.mount||disk.fs} disk usage is ${disk.use.toFixed(1)}%`,value:disk.use});
        }
        if((temp.main??0)>=value.temperatureC) alerts.push({kind:"temperature",message:`CPU temperature is ${temp.main}°C`,value:temp.main??0});
        if(value.notify){
          for(const alert of alerts){
            const notification=store.createNotification(
              value.source==="server"?"Server alert":"System alert",
              alert.message,
              alert.kind==="temperature"?"critical":"high",
              value.source
            );
            events.publish("notification.created",notification);
          }
        }
        return {alerts};
      }
    },
    {
      name:"system.monitor.history.record",
      description:"Record a lightweight monitoring snapshot for graph/history views.",
      capability:"system.read",
      async execute(){
        const [load,mem,disks]=await Promise.all([si.currentLoad(),si.mem(),si.fsSize()]);
        const snapshot={
          at:new Date().toISOString(),
          cpuPercent:load.currentLoad,
          memoryPercent:mem.total?mem.used/mem.total*100:0,
          disks:disks.map((disk)=>({mount:disk.mount,fs:disk.fs,usePercent:disk.use}))
        };
        const history=store.getSetting<any[]>("monitoring.history",[]) ?? [];
        history.push(snapshot);
        if(history.length>2000) history.splice(0,history.length-2000);
        store.setSetting("monitoring.history",history);
        return snapshot;
      }
    },
    {
      name:"system.monitor.history",
      description:"Read stored monitoring history for UI graphs.",
      capability:"system.read",
      async execute(input){
        const value=z.object({limit:z.number().int().min(1).max(2000).default(500)}).parse(input??{});
        const history=store.getSetting<any[]>("monitoring.history",[]) ?? [];
        return history.slice(-value.limit);
      }
    },
    {
      name:"system.monitor.wifi",
      description:"Read Wi-Fi interfaces/connections when supported by the operating system.",
      capability:"system.read",
      async execute(){
        const [interfaces,connections]=await Promise.all([
          si.wifiInterfaces(),
          si.wifiConnections()
        ]);
        return {interfaces,connections};
      }
    }
  ]
};
}
