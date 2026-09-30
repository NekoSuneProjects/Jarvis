import type { JarvisDatabase } from "../storage/database.js";

const now = () => new Date().toISOString();

export class AssistantStore {
  constructor(private readonly database: JarvisDatabase) {}

  createNote(title: string, body = "", tags: string[] = []) {
    const at = now();
    const result = this.database.db
      .prepare("INSERT INTO notes (title,body,tags,created_at,updated_at) VALUES (?,?,?,?,?)")
      .run(title, body, JSON.stringify(tags), at, at);
    return this.getNote(Number(result.lastInsertRowid));
  }

  getNote(id: number) {
    return this.database.db.prepare("SELECT * FROM notes WHERE id=?").get(id);
  }

  listNotes() {
    return this.database.db.prepare("SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC").all();
  }

  deleteNote(id: number) {
    return this.database.db.prepare("DELETE FROM notes WHERE id=?").run(id).changes > 0;
  }

  ensureList(name: string) {
    const existing = this.database.db.prepare("SELECT * FROM lists WHERE name=?").get(name);
    if (existing) return existing;
    const result = this.database.db
      .prepare("INSERT INTO lists (name,created_at) VALUES (?,?)")
      .run(name, now());
    return this.database.db.prepare("SELECT * FROM lists WHERE id=?").get(result.lastInsertRowid);
  }

  addListItem(listName: string, text: string) {
    const list = this.ensureList(listName) as { id: number };
    const result = this.database.db
      .prepare("INSERT INTO list_items (list_id,text,created_at) VALUES (?,?,?)")
      .run(list.id, text, now());
    return this.database.db.prepare("SELECT * FROM list_items WHERE id=?").get(result.lastInsertRowid);
  }

  getList(listName: string) {
    const list = this.database.db.prepare("SELECT * FROM lists WHERE name=?").get(listName) as { id:number } | undefined;
    if (!list) return { name: listName, items: [] };
    const items = this.database.db.prepare("SELECT * FROM list_items WHERE list_id=? ORDER BY id").all(list.id);
    return { ...list, items };
  }

  checkListItem(id: number, checked: boolean) {
    return this.database.db.prepare("UPDATE list_items SET checked=? WHERE id=?").run(checked ? 1 : 0, id).changes > 0;
  }

  clearChecked(listName: string) {
    const list = this.database.db.prepare("SELECT id FROM lists WHERE name=?").get(listName) as {id:number}|undefined;
    if (!list) return 0;
    return this.database.db.prepare("DELETE FROM list_items WHERE list_id=? AND checked=1").run(list.id).changes;
  }

  createTimer(name: string, durationMs: number) {
    const createdAt = now();
    const endsAt = new Date(Date.now() + durationMs).toISOString();
    const result = this.database.db
      .prepare("INSERT INTO timers (name,duration_ms,ends_at,created_at) VALUES (?,?,?,?)")
      .run(name, durationMs, endsAt, createdAt);
    return this.database.db.prepare("SELECT * FROM timers WHERE id=?").get(result.lastInsertRowid);
  }

  listTimers() {
    return this.database.db.prepare("SELECT * FROM timers WHERE state!='cancelled' ORDER BY ends_at").all();
  }

  setTimerState(id:number, state:string, remainingMs:number|null = null) {
    return this.database.db.prepare("UPDATE timers SET state=?, remaining_ms=? WHERE id=?").run(state, remainingMs, id).changes > 0;
  }

  createAlarm(name: string, fireAt: string, repeatRule?: string) {
    const result = this.database.db
      .prepare("INSERT INTO alarms (name,fire_at,repeat_rule,created_at) VALUES (?,?,?,?)")
      .run(name, fireAt, repeatRule ?? null, now());
    return this.database.db.prepare("SELECT * FROM alarms WHERE id=?").get(result.lastInsertRowid);
  }

  listAlarms() {
    return this.database.db.prepare("SELECT * FROM alarms WHERE enabled=1 ORDER BY fire_at").all();
  }

  disableAlarm(id:number) {
    return this.database.db.prepare("UPDATE alarms SET enabled=0 WHERE id=?").run(id).changes > 0;
  }

  createReminder(text: string, fireAt: string, repeatRule?: string) {
    const result = this.database.db
      .prepare("INSERT INTO reminders (text,fire_at,repeat_rule,created_at) VALUES (?,?,?,?)")
      .run(text, fireAt, repeatRule ?? null, now());
    return this.database.db.prepare("SELECT * FROM reminders WHERE id=?").get(result.lastInsertRowid);
  }

  listReminders() {
    return this.database.db.prepare("SELECT * FROM reminders WHERE completed=0 ORDER BY fire_at").all();
  }

  completeReminder(id:number) {
    return this.database.db.prepare("UPDATE reminders SET completed=1 WHERE id=?").run(id).changes > 0;
  }

  dueTimers() {
    return this.database.db.prepare("SELECT * FROM timers WHERE state='running' AND ends_at<=?").all(now());
  }

  dueAlarms() {
    return this.database.db.prepare("SELECT * FROM alarms WHERE enabled=1 AND fire_at<=?").all(now());
  }

  dueReminders() {
    return this.database.db.prepare("SELECT * FROM reminders WHERE completed=0 AND fire_at<=?").all(now());
  }

  audit(actor:string, action:string, detail:unknown={}) {
    this.database.db.prepare("INSERT INTO audit_log (at,actor,action,detail_json) VALUES (?,?,?,?)")
      .run(now(), actor, action, JSON.stringify(detail));
  }
}
