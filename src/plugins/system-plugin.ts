import os from "node:os";
import type { JarvisPlugin } from "./plugin-registry.js";

export const systemPlugin: JarvisPlugin = {
  id: "system",
  name: "System",
  version: "0.1.0",
  description: "Safe local system information tools.",
  tools: [
    {
      name: "system.info",
      description: "Read basic operating system, CPU, memory, uptime, and load information.",
      capability: "system.read",
      async execute() {
        const cpus = os.cpus();

        return {
          platform: process.platform,
          arch: process.arch,
          hostname: os.hostname(),
          release: os.release(),
          uptimeSeconds: os.uptime(),
          cpu: {
            model: cpus[0]?.model ?? "unknown",
            cores: cpus.length,
            loadAverage: os.loadavg()
          },
          memory: {
            totalBytes: os.totalmem(),
            freeBytes: os.freemem()
          }
        };
      }
    }
  ]
};
