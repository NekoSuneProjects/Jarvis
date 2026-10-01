import { rrulestr } from "rrule";
import type { AssistantStore } from "./store.js";
import type { EventBus } from "../events/event-bus.js";

function nextOccurrence(rule:string,currentFireAt:string):string|null{
  try{
    const normalized=rule.trim().replace(/^RRULE:/i,"");
    const recurrence=rrulestr(normalized,{
      dtstart:new Date(currentFireAt),
      forceset:false
    });
    const next=recurrence.after(new Date(currentFireAt),false);
    return next?.toISOString() ?? null;
  }catch{
    return null;
  }
}

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
        if(this.store.getSetting<boolean>("timers.tts",false)){
          this.events.publish("voice.tts.requested",{text:`${timer.name || "Timer"} finished`,source:"timer"});
        }
        const notification=this.store.createNotification(
          "Timer finished",
          timer.name || "Timer",
          "normal",
          "timer"
        );
        this.events.publish("notification.created",notification);
      }
    }

    for (const alarm of this.store.dueAlarms() as Array<{
      id:number;
      name:string;
      fire_at:string;
      repeat_rule:string|null;
    }>) {
      this.events.publish("alarm.fired", alarm);
      const alarmSound=this.store.getSetting<string>("alarms.sound","");
      if(alarmSound){
        this.events.publish("alarm.sound.requested",{alarmId:alarm.id,sound:alarmSound});
      }
      if(this.store.getSetting<boolean>("alarms.tts",false)){
        this.events.publish("voice.tts.requested",{text:alarm.name || "Alarm",source:"alarm"});
      }
      const alarmNotification=this.store.createNotification(
        "Alarm",
        alarm.name || "Alarm",
        "high",
        "alarm"
      );
      this.events.publish("notification.created",alarmNotification);

      if (alarm.repeat_rule) {
        const next=nextOccurrence(alarm.repeat_rule,alarm.fire_at);
        if(next) this.store.updateAlarmFireAt(alarm.id,next);
        else this.store.disableAlarm(alarm.id);
      } else {
        this.store.disableAlarm(alarm.id);
      }
    }

    for (const reminder of this.store.dueReminders() as Array<{
      id:number;
      text:string;
      fire_at:string;
      repeat_rule:string|null;
    }>) {
      this.events.publish("reminder.fired", reminder);
      if(this.store.getSetting<boolean>("reminders.readAloud",false)){
        this.events.publish("voice.tts.requested",{text:reminder.text,source:"reminder"});
      }
      const reminderNotification=this.store.createNotification(
        "Reminder",
        reminder.text,
        "normal",
        "reminder"
      );
      this.events.publish("notification.created",reminderNotification);

      if (reminder.repeat_rule) {
        const next=nextOccurrence(reminder.repeat_rule,reminder.fire_at);
        if(next) this.store.updateReminderFireAt(reminder.id,next);
        else this.store.completeReminder(reminder.id);
      } else {
        this.store.completeReminder(reminder.id);
      }
    }
  }
}
