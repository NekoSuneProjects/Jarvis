import si from "systeminformation";
import { z } from "zod";
import type { JarvisPlugin } from "./plugin-registry.js";

export const monitoringPlugin:JarvisPlugin={
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
