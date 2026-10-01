import type { JarvisDatabase } from "../storage/database.js";

const now = () => new Date().toISOString();

export class AssistantStore {
  constructor(private readonly database: JarvisDatabase) {}

  ensureConversation(id:string, title?:string) {
    const existing=this.database.db.prepare("SELECT * FROM conversations WHERE id=?").get(id);
    if(existing) return existing;
    const at=now();
    this.database.db.prepare(
      "INSERT INTO conversations (id,title,created_at,updated_at) VALUES (?,?,?,?)"
    ).run(id,title ?? null,at,at);
    return this.database.db.prepare("SELECT * FROM conversations WHERE id=?").get(id);
  }

  appendConversationMessage(conversationId:string, role:string, content:string) {
    this.ensureConversation(conversationId);
    const at=now();
    const result=this.database.db.prepare(
      "INSERT INTO conversation_messages (conversation_id,role,content,created_at) VALUES (?,?,?,?)"
    ).run(conversationId,role,content,at);
    this.database.db.prepare("UPDATE conversations SET updated_at=? WHERE id=?").run(at,conversationId);
    return this.database.db.prepare("SELECT * FROM conversation_messages WHERE id=?").get(result.lastInsertRowid);
  }

  conversationMessages(conversationId:string, limit=30) {
    return this.database.db.prepare(
      "SELECT role,content,created_at FROM conversation_messages WHERE conversation_id=? ORDER BY id DESC LIMIT ?"
    ).all(conversationId,limit).reverse();
  }

  listConversations(limit=50) {
    return this.database.db.prepare(
      "SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ?"
    ).all(limit);
  }

  remember(category:string,key:string,value:string) {
    const at=now();
    this.database.db.prepare(
      `INSERT INTO memories (category,key,value,created_at,updated_at)
       VALUES (?,?,?,?,?)
       ON CONFLICT(category,key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`
    ).run(category,key,value,at,at);
    return this.database.db.prepare(
      "SELECT * FROM memories WHERE category=? AND key=?"
    ).get(category,key);
  }

  searchMemories(query:string,category?:string,limit=20) {
    const like=`%${query}%`;
    if(category){
      return this.database.db.prepare(
        "SELECT * FROM memories WHERE category=? AND (key LIKE ? OR value LIKE ?) ORDER BY updated_at DESC LIMIT ?"
      ).all(category,like,like,limit);
    }
    return this.database.db.prepare(
      "SELECT * FROM memories WHERE key LIKE ? OR value LIKE ? ORDER BY updated_at DESC LIMIT ?"
    ).all(like,like,limit);
  }

  listMemories(category?:string,limit=100) {
    if(category) return this.database.db.prepare(
      "SELECT * FROM memories WHERE category=? ORDER BY updated_at DESC LIMIT ?"
    ).all(category,limit);
    return this.database.db.prepare(
      "SELECT * FROM memories ORDER BY updated_at DESC LIMIT ?"
    ).all(limit);
  }

  forgetMemory(id:number) {
    return this.database.db.prepare("DELETE FROM memories WHERE id=?").run(id).changes>0;
  }

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

  updateNote(id:number, fields:{title?:string;body?:string;tags?:string[];pinned?:boolean}) {
    const current=this.getNote(id) as {title:string;body:string;tags:string;pinned:number}|undefined;
    if(!current) return null;
    const title=fields.title ?? current.title;
    const body=fields.body ?? current.body;
    const tags=fields.tags ? JSON.stringify(fields.tags) : current.tags;
    const pinned=fields.pinned===undefined ? current.pinned : (fields.pinned?1:0);
    this.database.db.prepare(
      "UPDATE notes SET title=?,body=?,tags=?,pinned=?,updated_at=? WHERE id=?"
    ).run(title,body,tags,pinned,now(),id);
    return this.getNote(id);
  }

  searchNotes(query:string,limit=100) {
    const like=`%${query}%`;
    return this.database.db.prepare(
      "SELECT * FROM notes WHERE title LIKE ? OR body LIKE ? OR tags LIKE ? ORDER BY pinned DESC,updated_at DESC LIMIT ?"
    ).all(like,like,like,limit);
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

  removeListItem(id:number) {
    return this.database.db.prepare("DELETE FROM list_items WHERE id=?").run(id).changes>0;
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

  timer(id:number) {
    return this.database.db.prepare("SELECT * FROM timers WHERE id=?").get(id);
  }

  pauseTimer(id:number) {
    const timer=this.timer(id) as {state:string;ends_at:string}|undefined;
    if(!timer || timer.state!=="running") return false;
    const remaining=Math.max(0,new Date(timer.ends_at).getTime()-Date.now());
    return this.database.db.prepare(
      "UPDATE timers SET state='paused',remaining_ms=? WHERE id=?"
    ).run(remaining,id).changes>0;
  }

  resumeTimer(id:number) {
    const timer=this.timer(id) as {state:string;remaining_ms:number|null}|undefined;
    if(!timer || timer.state!=="paused") return false;
    const remaining=Math.max(0,timer.remaining_ms ?? 0);
    const endsAt=new Date(Date.now()+remaining).toISOString();
    return this.database.db.prepare(
      "UPDATE timers SET state='running',remaining_ms=NULL,ends_at=? WHERE id=?"
    ).run(endsAt,id).changes>0;
  }

  addTimerTime(id:number,deltaMs:number) {
    const timer=this.timer(id) as {state:string;remaining_ms:number|null;ends_at:string}|undefined;
    if(!timer) return false;
    if(timer.state==="paused"){
      const next=Math.max(0,(timer.remaining_ms ?? 0)+deltaMs);
      return this.database.db.prepare("UPDATE timers SET remaining_ms=? WHERE id=?").run(next,id).changes>0;
    }
    if(timer.state==="running"){
      const next=new Date(Math.max(Date.now(),new Date(timer.ends_at).getTime()+deltaMs)).toISOString();
      return this.database.db.prepare("UPDATE timers SET ends_at=? WHERE id=?").run(next,id).changes>0;
    }
    return false;
  }

  cancelTimer(id:number) {
    return this.database.db.prepare(
      "UPDATE timers SET state='cancelled' WHERE id=? AND state IN ('running','paused')"
    ).run(id).changes>0;
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

  updateAlarmFireAt(id:number,fireAt:string) {
    return this.database.db.prepare("UPDATE alarms SET fire_at=? WHERE id=?").run(fireAt,id).changes>0;
  }

  deleteAlarm(id:number) {
    return this.database.db.prepare("DELETE FROM alarms WHERE id=?").run(id).changes>0;
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

  updateReminderFireAt(id:number,fireAt:string) {
    return this.database.db.prepare(
      "UPDATE reminders SET fire_at=?,completed=0 WHERE id=?"
    ).run(fireAt,id).changes>0;
  }

  snoozeReminder(id:number,durationMs:number) {
    return this.updateReminderFireAt(id,new Date(Date.now()+durationMs).toISOString());
  }

  deleteReminder(id:number) {
    return this.database.db.prepare("DELETE FROM reminders WHERE id=?").run(id).changes>0;
  }

  createNotification(title:string,body:string,priority="normal",source="jarvis") {
    const result=this.database.db.prepare(
      "INSERT INTO notifications (title,body,priority,source,created_at) VALUES (?,?,?,?,?)"
    ).run(title,body,priority,source,now());
    return this.database.db.prepare("SELECT * FROM notifications WHERE id=?").get(result.lastInsertRowid);
  }

  listNotifications(limit=100, unreadOnly=false) {
    if(unreadOnly) return this.database.db.prepare(
      "SELECT * FROM notifications WHERE is_read=0 ORDER BY created_at DESC LIMIT ?"
    ).all(limit);
    return this.database.db.prepare(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?"
    ).all(limit);
  }

  markNotificationRead(id:number,read=true) {
    return this.database.db.prepare("UPDATE notifications SET is_read=? WHERE id=?").run(read?1:0,id).changes>0;
  }

  createRoutine(name:string, trigger:unknown, actions:unknown[], conditions:unknown[] = []) {
    const at=now();
    const result=this.database.db.prepare(
      "INSERT INTO routines (name,trigger_json,actions_json,conditions_json,created_at,updated_at) VALUES (?,?,?,?,?,?)"
    ).run(name,JSON.stringify(trigger),JSON.stringify(actions),JSON.stringify(conditions),at,at);
    return this.getRoutine(Number(result.lastInsertRowid));
  }

  getRoutine(id:number) {
    return this.database.db.prepare("SELECT * FROM routines WHERE id=?").get(id);
  }

  listRoutines() {
    return this.database.db.prepare("SELECT * FROM routines ORDER BY name").all();
  }

  setRoutineEnabled(id:number,enabled:boolean) {
    return this.database.db.prepare("UPDATE routines SET enabled=?,updated_at=? WHERE id=?").run(enabled?1:0,now(),id).changes>0;
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

  listAudit(limit=200,actor?:string,action?:string) {
    const clauses:string[]=[];
    const values:unknown[]=[];

    if(actor){
      clauses.push("actor=?");
      values.push(actor);
    }
    if(action){
      clauses.push("action LIKE ?");
      values.push(`%${action}%`);
    }

    const where=clauses.length?`WHERE ${clauses.join(" AND ")}`:"";
    const rows=this.database.db.prepare(
      `SELECT * FROM audit_log ${where} ORDER BY id DESC LIMIT ?`
    ).all(...values,limit) as Array<{
      id:number;at:string;actor:string;action:string;detail_json:string;
    }>;

    return rows.map((row)=>({
      id:row.id,
      at:row.at,
      actor:row.actor,
      action:row.action,
      detail:JSON.parse(row.detail_json)
    }));
  }
}
