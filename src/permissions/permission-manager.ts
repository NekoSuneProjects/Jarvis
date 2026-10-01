export type PermissionDecision = "allow" | "ask" | "deny";

export interface PermissionRule {
  capability: string;
  decision: PermissionDecision;
}

const DEFAULT_RULES: PermissionRule[] = [
  { capability: "assistant.chat", decision: "allow" },
  { capability: "assistant.local", decision: "allow" },
  { capability: "smart-home.read", decision: "allow" },
  { capability: "smart-home.control", decision: "ask" },
  { capability: "mqtt.subscribe", decision: "allow" },
  { capability: "mqtt.publish", decision: "ask" },
  { capability: "web.search", decision: "allow" },
  { capability: "weather.read", decision: "allow" },
  { capability: "media.read", decision: "allow" },
  { capability: "media.control", decision: "allow" },
  { capability: "docker.read", decision: "allow" },
  { capability: "docker.control", decision: "ask" },
  { capability: "network.wol", decision: "ask" },
  { capability: "computer.clipboard", decision: "ask" },
  { capability: "computer.screenshot", decision: "ask" },
  { capability: "computer.input", decision: "ask" },
  { capability: "computer.window", decision: "ask" },
  { capability: "system.power", decision: "ask" },
  { capability: "browser.navigate", decision: "allow" },
  { capability: "browser.read", decision: "allow" },
  { capability: "browser.interact", decision: "ask" },
  { capability: "communication.read", decision: "allow" },
  { capability: "communication.send", decision: "ask" },
  { capability: "calendar.read", decision: "allow" },
  { capability: "calendar.write", decision: "ask" },
  { capability: "drive.read", decision: "allow" },
  { capability: "drive.write", decision: "ask" },
  { capability: "development.read", decision: "allow" },
  { capability: "development.write", decision: "ask" },
  { capability: "memory.read", decision: "allow" },
  { capability: "memory.write", decision: "ask" },
  { capability: "devices.read", decision: "allow" },
  { capability: "devices.manage", decision: "ask" },
  { capability: "notifications.read", decision: "allow" },
  { capability: "notifications.send", decision: "allow" },
  { capability: "utility.read", decision: "allow" },
  { capability: "secrets.manage", decision: "ask" },
  { capability: "android.read", decision: "allow" },
  { capability: "android.control", decision: "ask" },
  { capability: "system.read", decision: "allow" },
  { capability: "computer.open_app", decision: "ask" },
  { capability: "computer.keyboard", decision: "ask" },
  { capability: "computer.mouse", decision: "ask" },
  { capability: "files.read", decision: "ask" },
  { capability: "files.write", decision: "ask" },
  { capability: "files.delete", decision: "deny" },
  { capability: "system.shell", decision: "ask" },
  { capability: "system.admin", decision: "deny" }
];

export class PermissionManager {
  private readonly rules = new Map<string, PermissionDecision>();
  private readonly toolRules = new Map<string, PermissionDecision>();
  private readonly oneTimeApprovals = new Set<string>();
  private emergencyStopped=false;

  constructor(rules: PermissionRule[] = DEFAULT_RULES) {
    for (const rule of rules) {
      this.rules.set(rule.capability, rule.decision);
    }
  }

  get(capability: string): PermissionDecision {
    return this.rules.get(capability) ?? "ask";
  }

  set(capability: string, decision: PermissionDecision): void {
    this.rules.set(capability, decision);
  }

  list(): PermissionRule[] {
    return [...this.rules.entries()].map(([capability, decision]) => ({
      capability,
      decision
    }));
  }

  listToolRules(){
    return [...this.toolRules.entries()].map(([tool,decision])=>({tool,decision}));
  }

  setTool(tool:string,decision:PermissionDecision){
    this.toolRules.set(tool,decision);
  }

  approveOnce(tool:string){
    this.oneTimeApprovals.add(tool);
  }

  setEmergencyStop(enabled:boolean){
    this.emergencyStopped=enabled;
  }

  get emergencyStop(){
    return this.emergencyStopped;
  }

  assertToolAllowed(tool:string,capability:string):void{
    const safeDuringEmergency=
      capability==="assistant.chat" ||
      capability==="assistant.local" ||
      capability.endsWith(".read") ||
      capability==="weather.read" ||
      capability==="web.search" ||
      capability==="utility.read";
    if(this.emergencyStopped && !safeDuringEmergency){
      throw new Error(`Emergency stop active: ${tool}`);
    }

    if(this.oneTimeApprovals.delete(tool)) return;

    const decision=this.toolRules.get(tool) ?? this.get(capability);
    if(decision!=="allow"){
      throw new Error(
        decision==="deny"
          ? `Permission denied: ${tool}`
          : `Permission requires approval: ${tool}`
      );
    }
  }

  assertAllowed(capability: string): void {
    const decision = this.get(capability);
    if (decision !== "allow") {
      throw new Error(
        decision === "deny"
          ? `Permission denied: ${capability}`
          : `Permission requires approval: ${capability}`
      );
    }
  }
}
