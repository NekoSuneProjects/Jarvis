import type { JarvisDatabase } from "../storage/database.js";
import type { EventBus } from "../events/event-bus.js";

const now = () => new Date().toISOString();

export class AssistantStore {
  constructor(
    private readonly database: JarvisDatabase,
    private readonly events?:EventBus
  ) {}

  private changed(type:string,payload:unknown){
    this.events?.publish(`sync.${type}`,payload);
  }

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

  searchConversations(query:string,limit=50) {
    const like=`%${query}%`;
    return this.database.db.prepare(
      `SELECT DISTINCT c.*
       FROM conversations c
       LEFT JOIN conversation_messages m ON m.conversation_id=c.id
       WHERE c.id LIKE ? OR COALESCE(c.title,'') LIKE ? OR COALESCE(m.content,'') LIKE ?
       ORDER BY c.updated_at DESC
       LIMIT ?`
    ).all(like,like,like,limit);
  }

  exportConversation(id:string) {
    const conversation=this.database.db.prepare("SELECT * FROM conversations WHERE id=?").get(id);
    if(!conversation) return null;
    return {
      conversation,
      messages:this.conversationMessages(id,100000)
    };
  }

  deleteConversation(id:string) {
    const tx=this.database.db.transaction((conversationId:string)=>{
      this.database.db.prepare("DELETE FROM conversation_messages WHERE conversation_id=?").run(conversationId);
      return this.database.db.prepare("DELETE FROM conversations WHERE id=?").run(conversationId).changes>0;
    });
    return tx(id);
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
    const note=this.getNote(Number(result.lastInsertRowid));
    this.changed("notes",{action:"create",note});
    return note;
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
    const note=this.getNote(id);
    this.changed("notes",{action:"update",note});
    return note;
  }

  searchNotes(query:string,limit=100) {
    const like=`%${query}%`;
    return this.database.db.prepare(
      "SELECT * FROM notes WHERE title LIKE ? OR body LIKE ? OR tags LIKE ? ORDER BY pinned DESC,updated_at DESC LIMIT ?"
    ).all(like,like,like,limit);
  }

  deleteNote(id: number) {
    const ok=this.database.db.prepare("DELETE FROM notes WHERE id=?").run(id).changes > 0;
    if(ok) this.changed("notes",{action:"delete",id});
    return ok;
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
    const item=this.database.db.prepare("SELECT * FROM list_items WHERE id=?").get(result.lastInsertRowid);
    this.changed("lists",{action:"add",list:listName,item});
    return item;
  }

  getList(listName: string) {
    const list = this.database.db.prepare("SELECT * FROM lists WHERE name=?").get(listName) as { id:number } | undefined;
    if (!list) return { name: listName, items: [] };
    const items = this.database.db.prepare("SELECT * FROM list_items WHERE list_id=? ORDER BY id").all(list.id);
    return { ...list, items };
  }

  checkListItem(id: number, checked: boolean) {
    const ok=this.database.db.prepare("UPDATE list_items SET checked=? WHERE id=?").run(checked ? 1 : 0, id).changes > 0;
    if(ok) this.changed("lists",{action:"check",id,checked});
    return ok;
  }

  removeListItem(id:number) {
    const ok=this.database.db.prepare("DELETE FROM list_items WHERE id=?").run(id).changes>0;
    if(ok) this.changed("lists",{action:"remove",id});
    return ok;
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
    const timer=this.database.db.prepare("SELECT * FROM timers WHERE id=?").get(result.lastInsertRowid);
    this.changed("timers",{action:"create",timer});
    return timer;
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
    const ok=this.database.db.prepare(
      "UPDATE timers SET state='cancelled' WHERE id=? AND state IN ('running','paused')"
    ).run(id).changes>0;
    if(ok) this.changed("timers",{action:"cancel",id});
    return ok;
  }

  createAlarm(name: string, fireAt: string, repeatRule?: string) {
    const result = this.database.db
      .prepare("INSERT INTO alarms (name,fire_at,repeat_rule,created_at) VALUES (?,?,?,?)")
      .run(name, fireAt, repeatRule ?? null, now());
    const alarm=this.database.db.prepare("SELECT * FROM alarms WHERE id=?").get(result.lastInsertRowid);
    this.changed("alarms",{action:"create",alarm});
    return alarm;
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
    const ok=this.database.db.prepare("DELETE FROM alarms WHERE id=?").run(id).changes>0;
    if(ok) this.changed("alarms",{action:"delete",id});
    return ok;
  }

  createReminder(text: string, fireAt: string, repeatRule?: string) {
    const result = this.database.db
      .prepare("INSERT INTO reminders (text,fire_at,repeat_rule,created_at) VALUES (?,?,?,?)")
      .run(text, fireAt, repeatRule ?? null, now());
    const reminder=this.database.db.prepare("SELECT * FROM reminders WHERE id=?").get(result.lastInsertRowid);
    this.changed("reminders",{action:"create",reminder});
    return reminder;
  }

  listReminders() {
    return this.database.db.prepare("SELECT * FROM reminders WHERE completed=0 ORDER BY fire_at").all();
  }

  completeReminder(id:number) {
    const ok=this.database.db.prepare("UPDATE reminders SET completed=1 WHERE id=?").run(id).changes > 0;
    if(ok) this.changed("reminders",{action:"complete",id});
    return ok;
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
    const ok=this.database.db.prepare("DELETE FROM reminders WHERE id=?").run(id).changes>0;
    if(ok) this.changed("reminders",{action:"delete",id});
    return ok;
  }

  createNotification(title:string,body:string,priority="normal",source="jarvis") {
    const result=this.database.db.prepare(
      "INSERT INTO notifications (title,body,priority,source,created_at) VALUES (?,?,?,?,?)"
    ).run(title,body,priority,source,now());
    return this.database.db.prepare("SELECT * FROM notifications WHERE id=?").get(result.lastInsertRowid);
  }

  listNotifications(limit=100, unreadOnly=false, minPriority:"low"|"normal"|"high"|"critical"="low") {
    const rank={low:0,normal:1,high:2,critical:3}[minPriority];
    const rows=this.database.db.prepare(
      `SELECT * FROM notifications
       WHERE (?=0 OR is_read=0)
       ORDER BY created_at DESC LIMIT ?`
    ).all(unreadOnly?1:0,limit) as any[];
    const priorities:Record<string,number>={low:0,normal:1,high:2,critical:3};
    return rows.filter((row)=> (priorities[row.priority] ?? 1)>=rank);
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

  exportRoutines() {
    return (this.listRoutines() as any[]).map((row)=>({
      name:row.name,
      enabled:Boolean(row.enabled),
      trigger:JSON.parse(row.trigger_json),
      actions:JSON.parse(row.actions_json),
      conditions:JSON.parse(row.conditions_json || "[]")
    }));
  }

  importRoutines(items:Array<{name:string;enabled?:boolean;trigger:unknown;actions:unknown[];conditions?:unknown[]}>) {
    const created=[];
    for(const item of items){
      const routine=this.createRoutine(item.name,item.trigger,item.actions,item.conditions ?? []) as any;
      if(item.enabled===false && routine?.id) this.setRoutineEnabled(Number(routine.id),false);
      created.push(routine);
    }
    return created;
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

  setSetting(key:string,value:unknown) {
    const at=now();
    this.database.db.prepare(
      `INSERT INTO settings (key,value_json,updated_at)
       VALUES (?,?,?)
       ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at`
    ).run(key,JSON.stringify(value),at);
    return {key,value,updatedAt:at};
  }

  getSetting<T=unknown>(key:string, fallback?:T):T|undefined {
    const row=this.database.db.prepare(
      "SELECT value_json FROM settings WHERE key=?"
    ).get(key) as {value_json:string}|undefined;
    if(!row) return fallback;
    try{return JSON.parse(row.value_json) as T;}catch{return fallback;}
  }

  listSettings() {
    const rows=this.database.db.prepare(
      "SELECT key,value_json,updated_at FROM settings ORDER BY key"
    ).all() as Array<{key:string;value_json:string;updated_at:string}>;
    return rows.map((row)=>({
      key:row.key,
      value:JSON.parse(row.value_json),
      updatedAt:row.updated_at
    }));
  }

  importSettings(entries:Array<{key:string;value:unknown}>) {
    const tx=this.database.db.transaction((items:Array<{key:string;value:unknown}>)=>{
      for(const item of items) this.setSetting(item.key,item.value);
    });
    tx(entries);
    return this.listSettings();
  }

  resetSettings() {
    this.database.db.prepare("DELETE FROM settings").run();
    return true;
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
