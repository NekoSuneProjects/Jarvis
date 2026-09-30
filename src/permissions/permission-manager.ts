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
