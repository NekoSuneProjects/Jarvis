# NekoSune Jarvis

A cross-platform, self-hosted **Jarvis-style AI assistant** designed to combine the best parts of a desktop AI agent, Alexa, Google Home, smart-home automation, computer control, voice interaction, media control, memory, vision, and developer tools.

NekoSune Jarvis is intended to run across:

- Windows
- Linux
- Raspberry Pi
- macOS
- Android
- iOS *(future / planned)*

The goal is to provide one shared assistant ecosystem where desktops, laptops, Raspberry Pi devices, phones, smart-home devices, servers, and media devices can all communicate through the same assistant.

---

## ✨ Main Features

### 🤖 AI Assistant

- Ollama support
- OpenAI-compatible API support
- Tool calling
- Conversation context
- Long-term memory
- Vision model support
- Local and remote AI support
- Multiple configurable AI providers
- Custom personalities
- Custom assistant name
- Custom wake phrase

Example commands:

```text
"Hey Neko, explain quantum computing."

"Summarise this error."

"What is on my screen?"

"Help me fix this Docker container."

"Remember that this server is my media server."
```

---

# 🖥️ Cross-Platform Support

| Platform | Support |
|---|---|
| Windows 10 / 11 | ✅ Full |
| Linux x64 | ✅ Full |
| Linux ARM64 | ✅ Planned / Full Target |
| Raspberry Pi | ✅ Lightweight / Satellite |
| macOS Intel | 🛠 Source Support |
| macOS Apple Silicon | 🛠 Source Support |
| Android | ✅ Planned / Full Client |
| iOS | 🔮 Future |
| Web Dashboard | 🔮 Optional |

macOS and iOS project files can be included, but Apple application builds must be compiled and signed on macOS hardware.

---

# 🏗️ Architecture

```text
                           ┌────────────────────────────────┐
                           │       NEKOSUNE JARVIS UI       │
                           │                                │
                           │ Flutter                        │
                           │ Windows / Linux / Raspberry Pi │
                           │ macOS / Android / future iOS   │
                           │                                │
                           │ HUD + Orb + Chat + Dashboard   │
                           │ animations / visualizer        │
                           └───────────────┬────────────────┘
                                           │
                                  WebSocket / IPC
                                           │
                    ┌──────────────────────▼─────────────────────┐
                    │               JARVIS CORE                 │
                    │           Node.js / TypeScript            │
                    │                                            │
                    │ • tool router                              │
                    │ • permissions                              │
                    │ • conversation state                       │
                    │ • intent router                            │
                    │ • automation engine                        │
                    │ • plugin manager                           │
                    │ • device registry                          │
                    │ • routines                                 │
                    │ • alarms / reminders / timers              │
                    │ • multi-room coordination                  │
                    └─────┬─────────────┬───────────────┬────────┘
                          │             │               │
              ┌───────────▼──────┐ ┌────▼─────────┐ ┌──▼──────────────┐
              │     AI BRAIN     │ │    VOICE     │ │     MEMORY      │
              │                  │ │              │ │                 │
              │ Ollama           │ │ Wake word    │ │ SQLite          │
              │ OpenAI APIs      │ │ VAD          │ │ Vector memory   │
              │ Vision models    │ │ STT          │ │ Conversations   │
              │ Tool calling     │ │ TTS          │ │ Devices/People  │
              └───────────┬──────┘ └────┬─────────┘ └─────────────────┘
                          │             │
                          │             ├─ sherpa-onnx
                          │             ├─ Piper
                          │             ├─ Edge TTS
                          │             └─ optional remote TTS
                          │
                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              JARVIS TOOLS                                 │
├─────────────────┬──────────────────┬──────────────────┬───────────────────┤
│ COMPUTER        │ WEB / BROWSER    │ COMMUNICATION    │ MEDIA             │
│                 │                  │                  │                   │
│ mouse           │ web search       │ Gmail            │ Spotify           │
│ keyboard        │ Playwright       │ Calendar         │ YouTube           │
│ screenshots     │ webpage reading  │ Google Drive     │ YouTube Music     │
│ open programs   │ browser tabs     │ Discord          │ SoundCloud        │
│ close programs  │ downloads        │ notifications    │ local music       │
│ window control  │ forms            │ announcements    │ radio             │
│ clipboard       │ page actions     │ intercom         │ media keys        │
│ PowerShell      │ autofill         │                  │ volume            │
├─────────────────┼──────────────────┼──────────────────┼───────────────────┤
│ FILES           │ SMART HOME       │ DEVELOPMENT      │ SYSTEM            │
│                 │                  │                  │                   │
│ PDF             │ Home Assistant   │ GitHub           │ CPU               │
│ DOCX            │ MQTT             │ terminals        │ RAM               │
│ XLSX            │ Matter           │ scripts          │ GPU               │
│ PPTX            │ Zigbee*          │ Docker           │ temperatures      │
│ TXT / MD        │ Hue              │ SSH              │ disk space        │
│ JSON / CSV      │ Tuya             │ logs             │ network           │
│ folders         │ Tasmota          │ services         │ battery           │
│ file search     │ smart plugs      │ containers       │ Wi-Fi             │
├─────────────────┼──────────────────┼──────────────────┼───────────────────┤
│ ASSISTANT       │ AUTOMATION       │ DEVICES          │ VISION            │
│                 │                  │                  │                   │
│ alarms          │ routines         │ phone            │ screenshot read   │
│ reminders       │ IF/THEN rules    │ PCs              │ UI understanding  │
│ timers          │ schedules        │ Raspberry Pi     │ error detection   │
│ shopping lists  │ events           │ smart speakers   │ button finding    │
│ notes           │ conditions       │ TVs              │ visual Q&A        │
│ weather         │ triggers         │ Chromecast       │ OCR when needed   │
│ calculations    │ webhooks         │ tablets          │                   │
│ conversions     │ device states    │ NAS              │                   │
└─────────────────┴──────────────────┴──────────────────┴───────────────────┘
```

---

# 🎙️ Voice Assistant

NekoSune Jarvis should support both lightweight offline voice processing and optional higher-quality remote voice services.

## Voice Pipeline

```text
Microphone
   │
   ▼
Wake Word Detector
   │
   ▼
Voice Activity Detection
   │
   ▼
Speech-to-Text
   │
   ▼
Intent Router / AI
   │
   ▼
Tool Execution
   │
   ▼
Text-to-Speech
```

---

## Wake Words

Configurable wake phrases such as:

```text
Hey Neko
Hey Jarvis
Neko
Computer
Hey NekoSune
```

---

## Listening Modes

```text
OFF
Microphone completely disabled

WAKE WORD
Only activates when the wake phrase is detected

CONTINUOUS
Natural conversation mode

PUSH TO TALK
Keyboard / controller / mouse activation

STREAMER
Optimised for use while gaming or streaming
```

---

# 🔊 Lightweight TTS / Speech

The default voice stack should work without a dedicated GPU.

Suggested engines:

### sherpa-onnx

Used for:

- Speech recognition
- Keyword spotting
- Voice activity detection
- Text-to-speech

### Piper

CPU-friendly local TTS.

### Edge TTS

Optional online TTS requiring very little local CPU.

### Remote TTS

Custom API endpoint for users with a dedicated speech server.

Example configuration:

```text
Voice Engine

● Sherpa ONNX
  CPU: Low
  GPU: Not Required

○ Piper
  CPU: Low
  GPU: Not Required

○ Edge TTS
  CPU: Very Low
  Internet: Required

○ Remote API
  Processing: Remote
```

---

# 🥧 Raspberry Pi Mode

Raspberry Pi devices can operate as lightweight Jarvis satellites.

```text
Raspberry Pi
      │
      │ Voice command
      ▼
Local Wake Word
      │
      ▼
Local Intent Router
      │
      ├── Local command → execute instantly
      │
      └── AI request → send to remote Ollama server
```

Local capabilities:

- Wake word
- VAD
- Lightweight STT
- Lightweight TTS
- Timers
- Alarms
- Smart-home commands
- MQTT
- Home Assistant
- Media control
- Intercom
- Local routines
- Announcements

Heavy tasks can be sent to another machine.

---

# ⚡ Local Intent Routing

Simple commands should not require an LLM.

Example:

```text
"Volume 40%"
```

becomes:

```text
Intent:
MEDIA_VOLUME

Value:
40

Action:
set_volume(40)
```

This makes common commands fast and reliable.

LLM calls are reserved for more complex requests.

---

# 🧠 Memory

Long-term assistant memory using SQLite and optional vector search.

Possible memory categories:

```text
People
Preferences
Devices
Projects
Applications
Servers
Conversation summaries
Tasks
Locations
Notes
```

Memory controls:

```text
[✓] Conversations
[✓] Preferences
[✓] Projects
[✓] Devices
[ ] Sensitive Data

[ View Memory ]
[ Edit ]
[ Forget ]
[ Clear ]
```

Passwords, authentication secrets, and private keys should never be stored in long-term memory by default.

---

# 🖱️ Computer Control

Jarvis can control supported desktop operating systems.

Capabilities:

- Open applications
- Close applications
- Mouse movement
- Mouse click
- Double click
- Keyboard typing
- Keyboard shortcuts
- Window management
- Clipboard
- Screenshots
- Active window detection
- Volume
- PowerShell
- Shell commands
- Lock PC
- Shutdown
- Restart
- Open URLs

Example commands:

```text
"Open Discord."

"Close Steam."

"Open Spotify."

"Move this window to my second monitor."

"Take a screenshot."

"What's this error?"

"Click the Settings button."

"Type this message."

"Turn my PC volume down."

"Lock my PC."
```

---

# 👁️ Vision

Jarvis can optionally understand what is displayed on a screen.

Example pipeline:

```text
Screenshot
   │
   ▼
Vision Model
   │
   ▼
Screen Understanding
   │
   ▼
Tool Planner
   │
   ▼
Action
```

Example commands:

```text
"What's on my screen?"

"Why did this application crash?"

"Where is the settings button?"

"Click the green button."

"Read this error message."
```

---

# 🌐 Browser Automation

Browser automation should prefer webpage structure over screen coordinates.

Suggested browser backend:

```text
Playwright
```

Capabilities:

- Web search
- Open pages
- Read webpages
- Browse websites
- Form interaction
- Downloads
- Search pages
- Follow links
- Autofill
- Browser tab management
- Website status checks

Example commands:

```text
"Search the web for this error."

"Open YouTube."

"Find this on GitHub."

"Download this file."

"Read this webpage."

"Fill this form."

"Check whether my website is online."
```

---

# 📄 File Creation

Jarvis can create and manage files.

Supported formats:

```text
PDF
DOCX
XLSX
PPTX
TXT
Markdown
HTML
JSON
CSV
Images
ZIP archives
```

Example commands:

```text
"Create a PDF."

"Make me a Word document."

"Create an Excel spreadsheet."

"Make a PowerPoint."

"Save this as JSON."

"Create a project folder."

"Find the file containing this text."
```

---

# 📧 Communication Integrations

Planned integrations:

- Gmail
- Google Calendar
- Google Drive
- Discord
- Notifications
- GitHub
- Future messaging integrations

Example commands:

```text
"Do I have any important emails?"

"What's on my calendar tomorrow?"

"Find my latest document in Google Drive."

"Read my Discord notifications."

"Check my GitHub issues."
```

---

# 🎵 Media

Supported / planned:

- Spotify
- YouTube
- YouTube Music
- SoundCloud
- Local music
- Internet radio
- Jellyfin
- Plex
- DLNA
- Kodi
- Chromecast

Example commands:

```text
"Play Frenchcore."

"Skip this song."

"Turn Spotify down to 40%."

"Play music downstairs."

"Play my gaming playlist."

"Pause the TV."

"Open YouTube."

"Cast this video downstairs."
```

---

# 🏠 Smart Home

NekoSune Jarvis is intended to act as a self-hosted alternative to Alexa and Google Home.

Integrations:

- Home Assistant
- MQTT
- Matter
- Zigbee via compatible bridges
- Philips Hue
- Tuya
- Tasmota
- Shelly
- Smart plugs
- Smart lights
- Sensors
- Thermostats
- TVs
- Media devices

Example commands:

```text
"Turn my bedroom light on."

"Make the lights green."

"Turn everything downstairs off."

"What's the bedroom temperature?"

"Is my door closed?"

"Set my lights to 30%."

"Turn my PC plug on."
```

---

# ⏰ Alexa / Google Home Style Features

## Alarms

```text
"Set an alarm for 7:30 AM."

"Wake me up in two hours."

"Set an alarm every weekday."
```

Alarms are stored and executed locally instead of relying on the LLM.

---

## Timers

Supports multiple named timers.

```text
"Set a pizza timer for 15 minutes."

"Set a tea timer for 3 minutes."

"How long is left on the pizza timer?"
```

Example:

```text
Pizza      12:43 remaining
Laundry    38:12 remaining
Tea         2:51 remaining
```

---

## Reminders

Supported types:

- Time reminders
- Date reminders
- Recurring reminders
- Device-state reminders
- Location reminders where supported

Examples:

```text
"Remind me at 8 PM."

"Remind me every Friday."

"Remind me when I get home."

"Remind me when my download finishes."
```

---

## Notes

```text
"Take a note."

"Remember this project idea."

"Create a note called server upgrades."
```

Explicit notes remain separate from automatic assistant memory.

---

## Lists

Supports custom lists.

Examples:

```text
Shopping
Projects
Games
Server Tasks
College
Music Ideas
```

Commands:

```text
"Add milk to my shopping list."

"Add a USB cable."

"What's on my shopping list?"
```

---

# 🔁 Routines

Jarvis can run Alexa-style routines.

Example:

```text
Routine:
Good Morning

→ Stop alarm
→ Turn bedroom light on
→ Brightness 25%
→ Read weather
→ Read calendar
→ Read reminders
→ Start Spotify
```

Another example:

```text
Routine:
Good Night

→ Pause music
→ Turn lights off
→ Lock PC
→ Enable Do Not Disturb
→ Read next alarm
```

---

# 🧩 IF / THEN Automations

Advanced routines can use conditions.

Example:

```text
IF
time > 22:00

AND
PC == ON

THEN
say:
"It's getting late."
```

Another example:

```text
IF
phone joins home Wi-Fi

THEN
set presence = HOME

AND
run Welcome Home routine
```

---

# 📢 Multi-Room Assistant

Multiple Jarvis devices can act as assistant satellites.

Example:

```text
Bedroom Pi
      │
Living Room Pi
      │
Main PC
      │
Android Phone
      │
Laptop
      │
      ▼
NekoSune Jarvis Server
```

Commands:

```text
"Play music downstairs."

"Announce dinner is ready everywhere."

"Broadcast that I'm going out."

"Stop music upstairs."

"Call the bedroom."
```

---

# 📞 Intercom

Supported through peer-to-peer or local network audio.

Suggested transport:

```text
WebRTC
```

Example:

```text
Living Room Pi
       ↕
Bedroom Pi
```

---

# 🔍 Device Discovery

Possible discovery methods:

- mDNS
- SSDP
- UPnP
- MQTT
- Matter
- Home Assistant

Detected devices could include:

```text
Samsung TV
Chromecast
Raspberry Pi
Smart Bulb
Smart Plug
Desktop PC
Laptop
NAS
Printer
Home Assistant
MQTT Broker
```

---

# 📱 Android Client

The Android client should function as a real assistant, not just a remote.

Planned capabilities:

- Wake phrase
- Microphone
- TTS
- Notifications
- Battery status
- Reminders
- Timers
- Smart-home control
- PC remote control
- Media remote
- Jarvis chat
- Device presence
- Wake-on-LAN
- Remote actions

Example:

```text
"Turn my PC on."

"Open Steam on my PC."

"What's my PC GPU temperature?"
```

---

# 🍎 iOS

iOS support is planned for the future.

The shared architecture should be designed from the beginning so that the iOS client can later reuse:

- Core API
- Authentication
- Device protocol
- UI components
- Assistant state
- Integrations
- Voice services where supported

Apple builds must be compiled and signed using macOS hardware.

---

# 🖥️ Remote PC / Server Agents

Optional Jarvis agents can run on remote machines.

```text
MAIN JARVIS
      │
      ├──── Windows Gaming PC
      │         Jarvis Agent
      │
      ├──── Linux Server
      │         Jarvis Agent
      │
      ├──── Raspberry Pi
      │         Jarvis Agent
      │
      └──── Laptop
                Jarvis Agent
```

Example remote commands:

```text
"What's my gaming PC GPU temperature?"

"Restart Docker on my server."

"Check disk space on my NAS."

"Restart nginx."

"Show me the last 50 log lines."
```

---

# 👨‍💻 Developer / Server Tools

Planned tools:

- GitHub
- Git
- Docker
- SSH
- Terminal
- PowerShell
- Bash
- Process monitoring
- Logs
- Service management
- Port monitoring
- Network diagnostics

Examples:

```text
"Check Docker containers."

"Restart nginx."

"SSH into my server."

"Why did this container crash?"

"Show GPU usage."

"What's using port 8080?"

"Check my GitHub issues."

"Clone this repository."

"Run npm install."

"Build this project."
```

---

# 📊 System Monitoring

Jarvis can display or read:

- CPU usage
- RAM usage
- GPU usage
- GPU temperature
- CPU temperature
- Disk usage
- Battery
- Network traffic
- Wi-Fi
- Running processes
- Services
- Docker containers

Example dashboard:

```text
╭─────────────────────────────────────────╮
│              NEKOSUNE AI                │
│                                         │
│                    ◉                    │
│                Listening                │
│                                         │
│ ▁▃▅▇▆▃▂▅▇▅▃▁                           │
│                                         │
├─────────────────────────────────────────┤
│ Bedroom       21.4°C       Lights ON    │
│ PC            ONLINE       GPU 46°C     │
│ Phone         71%          HOME         │
├─────────────────────────────────────────┤
│ Timer: Pizza                  12:31      │
│ Alarm: Tomorrow               07:00      │
╰─────────────────────────────────────────╯
```

---

# 🎨 UI

The UI should feel like a real Jarvis interface rather than a standard chatbot.

Planned visual features:

- Sci-fi HUD
- Animated central orb
- Audio waveform
- Rotating rings
- Particle effects
- Thinking animation
- Listening animation
- Speaking animation
- Error animation
- System graphs
- Transparent mode
- Borderless mode
- Fullscreen mode
- Floating mini assistant
- Multi-monitor support
- Audio-reactive visualiser
- Custom themes
- Dark mode
- Green / blue / purple / red / rainbow themes

---

# ⚙️ Performance Modes

```text
ULTRA
Desktop gaming PCs
Full effects
Particles
Blur
Advanced animations

BALANCED
Normal PCs and laptops

LIGHTWEIGHT
Raspberry Pi
Integrated graphics
Reduced effects

HEADLESS
No graphical interface
Voice assistant only
```

---

# 🔐 Permissions

Because Jarvis can control the operating system, permissions must be built into the core.

Example permissions:

```text
Safe
✓ Weather
✓ Timers
✓ Music
✓ System information

Computer
✓ Mouse
✓ Keyboard
✓ Open applications
✓ Screenshots

Files
✓ Read
✓ Create
? Move
? Delete

System
? PowerShell
? Shell commands
? Docker
? SSH

Sensitive
? Install software
? Admin commands
? Shutdown machines
? Delete files
```

Permission modes:

```text
Allow
Allow Once
Ask Every Time
Deny
```

Example confirmation:

```text
Jarvis wants to execute:

Remove-Item C:\Example

[ Allow Once ]
[ Always Allow ]
[ Deny ]
```

---

# 🔌 Plugin System

Jarvis should use a plugin-based architecture.

Example:

```text
plugins/
├── spotify/
├── youtube/
├── gmail/
├── google-drive/
├── calendar/
├── discord/
├── github/
├── weather/
├── home-assistant/
├── windows/
├── browser/
└── docker/
```

Each plugin exposes tools.

Example:

```ts
export default {
  name: "spotify",

  tools: [
    "spotify.play",
    "spotify.pause",
    "spotify.next",
    "spotify.previous",
    "spotify.search",
    "spotify.volume"
  ]
};
```

---

# 📂 Proposed Repository Structure

```text
NekoSuneJarvis/
│
├── apps/
│   ├── desktop-mobile/
│   │   └── Flutter
│   │
│   ├── web-dashboard/
│   └── tray/
│
├── core/
│   ├── agent/
│   ├── llm/
│   ├── vision/
│   ├── intents/
│   ├── tools/
│   ├── permissions/
│   ├── memory/
│   └── plugins/
│
├── voice/
│   ├── wakeword/
│   ├── vad/
│   ├── stt/
│   └── tts/
│
├── assistant/
│   ├── alarms/
│   ├── timers/
│   ├── reminders/
│   ├── notes/
│   ├── lists/
│   ├── routines/
│   └── announcements/
│
├── automation/
│   ├── triggers/
│   ├── conditions/
│   ├── actions/
│   └── scheduler/
│
├── computer/
│   ├── windows/
│   ├── linux/
│   ├── macos/
│   ├── input/
│   ├── screenshots/
│   └── window-manager/
│
├── browser/
│   ├── playwright/
│   ├── search/
│   └── downloads/
│
├── integrations/
│   ├── spotify/
│   ├── youtube/
│   ├── gmail/
│   ├── google-calendar/
│   ├── google-drive/
│   ├── discord/
│   ├── github/
│   ├── home-assistant/
│   ├── mqtt/
│   └── matter/
│
├── documents/
│   ├── pdf/
│   ├── docx/
│   ├── xlsx/
│   └── pptx/
│
├── devices/
│   ├── discovery/
│   ├── satellites/
│   ├── android/
│   ├── raspberry-pi/
│   └── remote-agent/
│
├── media/
│   ├── spotify/
│   ├── youtube/
│   ├── radio/
│   ├── local/
│   └── multiroom/
│
├── server/
│   ├── api/
│   ├── websocket/
│   ├── auth/
│   └── device-registry/
│
├── shared/
│   ├── models/
│   ├── protocol/
│   └── config/
│
└── platform/
    ├── windows/
    ├── linux/
    ├── raspberry-pi/
    ├── macos/
    ├── android/
    └── ios/
```

---

# 🌐 Offline Support

Core features should remain available without the internet.

Offline:

```text
✓ Wake word
✓ Speech recognition
✓ TTS
✓ Time
✓ Alarms
✓ Timers
✓ Reminders
✓ Volume
✓ Local music
✓ Computer control
✓ MQTT
✓ Home Assistant LAN
✓ Smart-home actions
✓ Routines
✓ Shutdown / restart
```

Online / Remote:

```text
Web search
Cloud email
Spotify cloud
YouTube
Remote AI
Complex research
Cloud integrations
```

---

# 🗺️ Development Roadmap

## Phase 1 — Core

- [ ] Flutter desktop application
- [ ] Node.js / TypeScript Jarvis Core
- [ ] Ollama integration
- [ ] OpenAI-compatible API support
- [ ] Basic chat
- [ ] Settings system
- [ ] Plugin loader
- [ ] Permission manager
- [ ] SQLite database

## Phase 2 — Voice

- [ ] Wake word
- [ ] VAD
- [ ] Local STT
- [ ] Piper / sherpa-onnx TTS
- [ ] Edge TTS
- [ ] Push-to-talk
- [ ] Continuous conversation

## Phase 3 — Desktop Control

- [ ] Application launcher
- [ ] Keyboard
- [ ] Mouse
- [ ] Screenshots
- [ ] Window management
- [ ] Clipboard
- [ ] PowerShell
- [ ] Bash
- [ ] Linux support
- [ ] macOS source support

## Phase 4 — Browser / Vision

- [ ] Playwright
- [ ] Web search
- [ ] Webpage reading
- [ ] Downloads
- [ ] Vision model
- [ ] Screen understanding
- [ ] Visual interaction

## Phase 5 — Alexa / Google Home Features

- [ ] Timers
- [ ] Alarms
- [ ] Reminders
- [ ] Notes
- [ ] Lists
- [ ] Routines
- [ ] Announcements
- [ ] Intercom
- [ ] Multi-room assistant

## Phase 6 — Smart Home

- [ ] Home Assistant
- [ ] MQTT
- [ ] Matter
- [ ] Device discovery
- [ ] Smart lights
- [ ] Sensors
- [ ] Smart plugs
- [ ] TVs
- [ ] Media devices

## Phase 7 — Integrations

- [ ] Spotify
- [ ] YouTube
- [ ] Gmail
- [ ] Google Calendar
- [ ] Google Drive
- [ ] Discord
- [ ] GitHub
- [ ] Jellyfin
- [ ] Plex

## Phase 8 — Mobile

- [ ] Android client
- [ ] Notifications
- [ ] Mobile microphone
- [ ] Mobile TTS
- [ ] Phone presence
- [ ] Wake-on-LAN
- [ ] Remote PC control
- [ ] iOS project preparation

## Phase 9 — Remote Agents

- [ ] Windows agent
- [ ] Linux agent
- [ ] Raspberry Pi satellite
- [ ] Secure pairing
- [ ] Remote commands
- [ ] Remote telemetry
- [ ] Device permissions

---

# 🎯 Project Goal

The goal of NekoSune Jarvis is to create a self-hosted assistant that combines:

```text
Jarvis
+
Alexa
+
Google Home
+
Desktop AI Agent
+
Smart Home
+
Voice Assistant
+
Computer Automation
+
Developer Assistant
+
Media Controller
+
Multi-device Assistant
```

into one platform that the user owns and controls.

It should work both as:

```text
A full animated desktop assistant
```

and:

```text
A tiny Raspberry Pi voice satellite
```

while sharing the same assistant identity, memory, integrations, routines, permissions, devices, and AI services.

---

# ⚠️ Security

NekoSune Jarvis can potentially control computers, files, servers, smart-home devices, and online services.

The project should therefore follow these rules:

- Never expose remote control APIs directly to the public internet without authentication.
- Require device pairing.
- Encrypt device communication.
- Store OAuth tokens securely.
- Never log passwords.
- Never store private keys in assistant memory.
- Require confirmation for destructive operations.
- Provide per-device permissions.
- Provide per-plugin permissions.
- Provide an emergency assistant disable switch.
- Keep audit logs for sensitive actions.

---

# 📜 License

A license has not yet been selected.

Recommended options:

- MIT
- Apache-2.0
- GPL-3.0

---

# 🚧 Status

NekoSune Jarvis is currently a planned project / work in progress.

The architecture and feature set may change during development.

