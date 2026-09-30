import type { AssistantStore } from "./store.js";
import type { EventBus } from "../events/event-bus.js";

export class Scheduler {
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly store: AssistantStore,
    private readonly events: EventBus
  ) {}

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 500);
    this.tick();
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
  }

  private tick(): void {
    for (const timer of this.store.dueTimers() as Array<{id:number;name:string}>) {
      if (this.store.setTimerState(timer.id, "finished", 0)) {
        this.events.publish("timer.finished", timer);
      }
    }

    for (const alarm of this.store.dueAlarms() as Array<{id:number;name:string;repeat_rule:string|null}>) {
      this.events.publish("alarm.fired", alarm);
      // Repeating rules are intentionally kept for the recurrence engine.
      if (!alarm.repeat_rule) {
        // Disable one-shot alarm after firing.
        // Direct SQL is avoided here; recurrence support will move into the store.
        (this.store as any).database.db.prepare("UPDATE alarms SET enabled=0 WHERE id=?").run(alarm.id);
      }
    }

    for (const reminder of this.store.dueReminders() as Array<{id:number;text:string;repeat_rule:string|null}>) {
      this.events.publish("reminder.fired", reminder);
      if (!reminder.repeat_rule) this.store.completeReminder(reminder.id);
    }
  }
}
