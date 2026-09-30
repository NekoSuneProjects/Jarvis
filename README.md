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

## âœ¨ Main Features

### ðŸ¤– AI Assistant

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

# ðŸ–¥ï¸ Cross-Platform Support

| Platform | Support |
|---|---|
| Windows 10 / 11 | âœ… Full |
| Linux x64 | âœ… Full |
| Linux ARM64 | âœ… Planned / Full Target |
| Raspberry Pi | âœ… Lightweight / Satellite |
| macOS Intel | ðŸ›  Source Support |
| macOS Apple Silicon | ðŸ›  Source Support |
| Android | âœ… Planned / Full Client |
| iOS | ðŸ”® Future |
| Web Dashboard | ðŸ”® Optional |

macOS and iOS project files can be included, but Apple application builds must be compiled and signed on macOS hardware.

---

# ðŸ—ï¸ Architecture

```text
                           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                           â”‚       NEKOSUNE JARVIS UI       â”‚
                           â”‚                                â”‚
                           â”‚ Flutter                        â”‚
                           â”‚ Windows / Linux / Raspberry Pi â”‚
                           â”‚ macOS / Android / future iOS   â”‚
                           â”‚                                â”‚
                           â”‚ HUD + Orb + Chat + Dashboard   â”‚
                           â”‚ animations / visualizer        â”‚
                           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                           â”‚
                                  WebSocket / IPC
                                           â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚               JARVIS CORE                 â”‚
                    â”‚           Node.js / TypeScript            â”‚
                    â”‚                                            â”‚
                    â”‚ â€¢ tool router                              â”‚
                    â”‚ â€¢ permissions                              â”‚
                    â”‚ â€¢ conversation state                       â”‚
                    â”‚ â€¢ intent router                            â”‚
                    â”‚ â€¢ automation engine                        â”‚
                    â”‚ â€¢ plugin manager                           â”‚
                    â”‚ â€¢ device registry                          â”‚
                    â”‚ â€¢ routines                                 â”‚
                    â”‚ â€¢ alarms / reminders / timers              â”‚
                    â”‚ â€¢ multi-room coordination                  â”‚
                    â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                          â”‚             â”‚               â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â”‚     AI BRAIN     â”‚ â”‚    VOICE     â”‚ â”‚     MEMORY      â”‚
              â”‚                  â”‚ â”‚              â”‚ â”‚                 â”‚
              â”‚ Ollama           â”‚ â”‚ Wake word    â”‚ â”‚ SQLite          â”‚
              â”‚ OpenAI APIs      â”‚ â”‚ VAD          â”‚ â”‚ Vector memory   â”‚
              â”‚ Vision models    â”‚ â”‚ STT          â”‚ â”‚ Conversations   â”‚
              â”‚ Tool calling     â”‚ â”‚ TTS          â”‚ â”‚ Devices/People  â”‚
              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                          â”‚             â”‚
                          â”‚             â”œâ”€ sherpa-onnx
                          â”‚             â”œâ”€ Piper
                          â”‚             â”œâ”€ Edge TTS
                          â”‚             â””â”€ optional remote TTS
                          â”‚
                          â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                              JARVIS TOOLS                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ COMPUTER        â”‚ WEB / BROWSER    â”‚ COMMUNICATION    â”‚ MEDIA             â”‚
â”‚                 â”‚                  â”‚                  â”‚                   â”‚
â”‚ mouse           â”‚ web search       â”‚ Gmail            â”‚ Spotify           â”‚
â”‚ keyboard        â”‚ Playwright       â”‚ Calendar         â”‚ YouTube           â”‚
â”‚ screenshots     â”‚ webpage reading  â”‚ Google Drive     â”‚ YouTube Music     â”‚
â”‚ open programs   â”‚ browser tabs     â”‚ Discord          â”‚ SoundCloud        â”‚
â”‚ close programs  â”‚ downloads        â”‚ notifications    â”‚ local music       â”‚
â”‚ window control  â”‚ forms            â”‚ announcements    â”‚ radio             â”‚
â”‚ clipboard       â”‚ page actions     â”‚ intercom         â”‚ media keys        â”‚
â”‚ PowerShell      â”‚ autofill         â”‚                  â”‚ volume            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ FILES           â”‚ SMART HOME       â”‚ DEVELOPMENT      â”‚ SYSTEM            â”‚
â”‚                 â”‚                  â”‚                  â”‚                   â”‚
â”‚ PDF             â”‚ Home Assistant   â”‚ GitHub           â”‚ CPU               â”‚
â”‚ DOCX            â”‚ MQTT             â”‚ terminals        â”‚ RAM               â”‚
â”‚ XLSX            â”‚ Matter           â”‚ scripts          â”‚ GPU               â”‚
â”‚ PPTX            â”‚ Zigbee*          â”‚ Docker           â”‚ temperatures      â”‚
â”‚ TXT / MD        â”‚ Hue              â”‚ SSH              â”‚ disk space        â”‚
â”‚ JSON / CSV      â”‚ Tuya             â”‚ logs             â”‚ network           â”‚
â”‚ folders         â”‚ Tasmota          â”‚ services         â”‚ battery           â”‚
â”‚ file search     â”‚ smart plugs      â”‚ containers       â”‚ Wi-Fi             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ ASSISTANT       â”‚ AUTOMATION       â”‚ DEVICES          â”‚ VISION            â”‚
â”‚                 â”‚                  â”‚                  â”‚                   â”‚
â”‚ alarms          â”‚ routines         â”‚ phone            â”‚ screenshot read   â”‚
â”‚ reminders       â”‚ IF/THEN rules    â”‚ PCs              â”‚ UI understanding  â”‚
â”‚ timers          â”‚ schedules        â”‚ Raspberry Pi     â”‚ error detection   â”‚
â”‚ shopping lists  â”‚ events           â”‚ smart speakers   â”‚ button finding    â”‚
â”‚ notes           â”‚ conditions       â”‚ TVs              â”‚ visual Q&A        â”‚
â”‚ weather         â”‚ triggers         â”‚ Chromecast       â”‚ OCR when needed   â”‚
â”‚ calculations    â”‚ webhooks         â”‚ tablets          â”‚                   â”‚
â”‚ conversions     â”‚ device states    â”‚ NAS              â”‚                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

# ðŸŽ™ï¸ Voice Assistant

NekoSune Jarvis should support both lightweight offline voice processing and optional higher-quality remote voice services.

## Voice Pipeline

```text
Microphone
   â”‚
   â–¼
Wake Word Detector
   â”‚
   â–¼
Voice Activity Detection
   â”‚
   â–¼
Speech-to-Text
   â”‚
   â–¼
Intent Router / AI
   â”‚
   â–¼
Tool Execution
   â”‚
   â–¼
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

# ðŸ”Š Lightweight TTS / Speech

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

â— Sherpa ONNX
  CPU: Low
  GPU: Not Required

â—‹ Piper
  CPU: Low
  GPU: Not Required

â—‹ Edge TTS
  CPU: Very Low
  Internet: Required

â—‹ Remote API
  Processing: Remote
```

---

# ðŸ¥§ Raspberry Pi Mode

Raspberry Pi devices can operate as lightweight Jarvis satellites.

```text
Raspberry Pi
      â”‚
      â”‚ Voice command
      â–¼
Local Wake Word
      â”‚
      â–¼
Local Intent Router
      â”‚
      â”œâ”€â”€ Local command â†’ execute instantly
      â”‚
      â””â”€â”€ AI request â†’ send to remote Ollama server
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

# âš¡ Local Intent Routing

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

# ðŸ§  Memory

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
[âœ“] Conversations
[âœ“] Preferences
[âœ“] Projects
[âœ“] Devices
[ ] Sensitive Data

[ View Memory ]
[ Edit ]
[ Forget ]
[ Clear ]
```

Passwords, authentication secrets, and private keys should never be stored in long-term memory by default.

---

# ðŸ–±ï¸ Computer Control

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

# ðŸ‘ï¸ Vision

Jarvis can optionally understand what is displayed on a screen.

Example pipeline:

```text
Screenshot
   â”‚
   â–¼
Vision Model
   â”‚
   â–¼
Screen Understanding
   â”‚
   â–¼
Tool Planner
   â”‚
   â–¼
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

# ðŸŒ Browser Automation

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

# ðŸ“„ File Creation

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

# ðŸ“§ Communication Integrations

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

# ðŸŽµ Media

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

# ðŸ  Smart Home

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

# â° Alexa / Google Home Style Features

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

# ðŸ” Routines

Jarvis can run Alexa-style routines.

Example:

```text
Routine:
Good Morning

â†’ Stop alarm
â†’ Turn bedroom light on
â†’ Brightness 25%
â†’ Read weather
â†’ Read calendar
â†’ Read reminders
â†’ Start Spotify
```

Another example:

```text
Routine:
Good Night

â†’ Pause music
â†’ Turn lights off
â†’ Lock PC
â†’ Enable Do Not Disturb
â†’ Read next alarm
```

---

# ðŸ§© IF / THEN Automations

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

# ðŸ“¢ Multi-Room Assistant

Multiple Jarvis devices can act as assistant satellites.

Example:

```text
Bedroom Pi
      â”‚
Living Room Pi
      â”‚
Main PC
      â”‚
Android Phone
      â”‚
Laptop
      â”‚
      â–¼
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

# ðŸ“ž Intercom

Supported through peer-to-peer or local network audio.

Suggested transport:

```text
WebRTC
```

Example:

```text
Living Room Pi
       â†•
Bedroom Pi
```

---

# ðŸ” Device Discovery

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

# ðŸ“± Android Client

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

# ðŸŽ iOS

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

# ðŸ–¥ï¸ Remote PC / Server Agents

Optional Jarvis agents can run on remote machines.

```text
MAIN JARVIS
      â”‚
      â”œâ”€â”€â”€â”€ Windows Gaming PC
      â”‚         Jarvis Agent
      â”‚
      â”œâ”€â”€â”€â”€ Linux Server
      â”‚         Jarvis Agent
      â”‚
      â”œâ”€â”€â”€â”€ Raspberry Pi
      â”‚         Jarvis Agent
      â”‚
      â””â”€â”€â”€â”€ Laptop
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

# ðŸ‘¨â€ðŸ’» Developer / Server Tools

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

# ðŸ“Š System Monitoring

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
â•­â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•®
â”‚              NEKOSUNE AI                â”‚
â”‚                                         â”‚
â”‚                    â—‰                    â”‚
â”‚                Listening                â”‚
â”‚                                         â”‚
â”‚ â–â–ƒâ–…â–‡â–†â–ƒâ–‚â–…â–‡â–…â–ƒâ–                           â”‚
â”‚                                         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Bedroom       21.4Â°C       Lights ON    â”‚
â”‚ PC            ONLINE       GPU 46Â°C     â”‚
â”‚ Phone         71%          HOME         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Timer: Pizza                  12:31      â”‚
â”‚ Alarm: Tomorrow               07:00      â”‚
â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•¯
```

---

# ðŸŽ¨ UI

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

# âš™ï¸ Performance Modes

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

# ðŸ” Permissions

Because Jarvis can control the operating system, permissions must be built into the core.

Example permissions:

```text
Safe
âœ“ Weather
âœ“ Timers
âœ“ Music
âœ“ System information

Computer
âœ“ Mouse
âœ“ Keyboard
âœ“ Open applications
âœ“ Screenshots

Files
âœ“ Read
âœ“ Create
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

# ðŸ”Œ Plugin System

Jarvis should use a plugin-based architecture.

Example:

```text
plugins/
â”œâ”€â”€ spotify/
â”œâ”€â”€ youtube/
â”œâ”€â”€ gmail/
â”œâ”€â”€ google-drive/
â”œâ”€â”€ calendar/
â”œâ”€â”€ discord/
â”œâ”€â”€ github/
â”œâ”€â”€ weather/
â”œâ”€â”€ home-assistant/
â”œâ”€â”€ windows/
â”œâ”€â”€ browser/
â””â”€â”€ docker/
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

# ðŸ“‚ Proposed Repository Structure

```text
NekoSuneJarvis/
â”‚
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ desktop-mobile/
â”‚   â”‚   â””â”€â”€ Flutter
â”‚   â”‚
â”‚   â”œâ”€â”€ web-dashboard/
â”‚   â””â”€â”€ tray/
â”‚
â”œâ”€â”€ core/
â”‚   â”œâ”€â”€ agent/
â”‚   â”œâ”€â”€ llm/
â”‚   â”œâ”€â”€ vision/
â”‚   â”œâ”€â”€ intents/
â”‚   â”œâ”€â”€ tools/
â”‚   â”œâ”€â”€ permissions/
â”‚   â”œâ”€â”€ memory/
â”‚   â””â”€â”€ plugins/
â”‚
â”œâ”€â”€ voice/
â”‚   â”œâ”€â”€ wakeword/
â”‚   â”œâ”€â”€ vad/
â”‚   â”œâ”€â”€ stt/
â”‚   â””â”€â”€ tts/
â”‚
â”œâ”€â”€ assistant/
â”‚   â”œâ”€â”€ alarms/
â”‚   â”œâ”€â”€ timers/
â”‚   â”œâ”€â”€ reminders/
â”‚   â”œâ”€â”€ notes/
â”‚   â”œâ”€â”€ lists/
â”‚   â”œâ”€â”€ routines/
â”‚   â””â”€â”€ announcements/
â”‚
â”œâ”€â”€ automation/
â”‚   â”œâ”€â”€ triggers/
â”‚   â”œâ”€â”€ conditions/
â”‚   â”œâ”€â”€ actions/
â”‚   â””â”€â”€ scheduler/
â”‚
â”œâ”€â”€ computer/
â”‚   â”œâ”€â”€ windows/
â”‚   â”œâ”€â”€ linux/
â”‚   â”œâ”€â”€ macos/
â”‚   â”œâ”€â”€ input/
â”‚   â”œâ”€â”€ screenshots/
â”‚   â””â”€â”€ window-manager/
â”‚
â”œâ”€â”€ browser/
â”‚   â”œâ”€â”€ playwright/
â”‚   â”œâ”€â”€ search/
â”‚   â””â”€â”€ downloads/
â”‚
â”œâ”€â”€ integrations/
â”‚   â”œâ”€â”€ spotify/
â”‚   â”œâ”€â”€ youtube/
â”‚   â”œâ”€â”€ gmail/
â”‚   â”œâ”€â”€ google-calendar/
â”‚   â”œâ”€â”€ google-drive/
â”‚   â”œâ”€â”€ discord/
â”‚   â”œâ”€â”€ github/
â”‚   â”œâ”€â”€ home-assistant/
â”‚   â”œâ”€â”€ mqtt/
â”‚   â””â”€â”€ matter/
â”‚
â”œâ”€â”€ documents/
â”‚   â”œâ”€â”€ pdf/
â”‚   â”œâ”€â”€ docx/
â”‚   â”œâ”€â”€ xlsx/
â”‚   â””â”€â”€ pptx/
â”‚
â”œâ”€â”€ devices/
â”‚   â”œâ”€â”€ discovery/
â”‚   â”œâ”€â”€ satellites/
â”‚   â”œâ”€â”€ android/
â”‚   â”œâ”€â”€ raspberry-pi/
â”‚   â””â”€â”€ remote-agent/
â”‚
â”œâ”€â”€ media/
â”‚   â”œâ”€â”€ spotify/
â”‚   â”œâ”€â”€ youtube/
â”‚   â”œâ”€â”€ radio/
â”‚   â”œâ”€â”€ local/
â”‚   â””â”€â”€ multiroom/
â”‚
â”œâ”€â”€ server/
â”‚   â”œâ”€â”€ api/
â”‚   â”œâ”€â”€ websocket/
â”‚   â”œâ”€â”€ auth/
â”‚   â””â”€â”€ device-registry/
â”‚
â”œâ”€â”€ shared/
â”‚   â”œâ”€â”€ models/
â”‚   â”œâ”€â”€ protocol/
â”‚   â””â”€â”€ config/
â”‚
â””â”€â”€ platform/
    â”œâ”€â”€ windows/
    â”œâ”€â”€ linux/
    â”œâ”€â”€ raspberry-pi/
    â”œâ”€â”€ macos/
    â”œâ”€â”€ android/
    â””â”€â”€ ios/
```

---

# ðŸŒ Offline Support

Core features should remain available without the internet.

Offline:

```text
âœ“ Wake word
âœ“ Speech recognition
âœ“ TTS
âœ“ Time
âœ“ Alarms
âœ“ Timers
âœ“ Reminders
âœ“ Volume
âœ“ Local music
âœ“ Computer control
âœ“ MQTT
âœ“ Home Assistant LAN
âœ“ Smart-home actions
âœ“ Routines
âœ“ Shutdown / restart
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

# ðŸ—ºï¸ Development Roadmap

## Phase 1 â€” Core

- [ ] Flutter desktop application
- [ ] Node.js / TypeScript Jarvis Core
- [ ] Ollama integration
- [ ] OpenAI-compatible API support
- [ ] Basic chat
- [ ] Settings system
- [ ] Plugin loader
- [ ] Permission manager
- [ ] SQLite database

## Phase 2 â€” Voice

- [ ] Wake word
- [ ] VAD
- [ ] Local STT
- [ ] Piper / sherpa-onnx TTS
- [ ] Edge TTS
- [ ] Push-to-talk
- [ ] Continuous conversation

## Phase 3 â€” Desktop Control

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

## Phase 4 â€” Browser / Vision

- [ ] Playwright
- [ ] Web search
- [ ] Webpage reading
- [ ] Downloads
- [ ] Vision model
- [ ] Screen understanding
- [ ] Visual interaction

## Phase 5 â€” Alexa / Google Home Features

- [ ] Timers
- [ ] Alarms
- [ ] Reminders
- [ ] Notes
- [ ] Lists
- [ ] Routines
- [ ] Announcements
- [ ] Intercom
- [ ] Multi-room assistant

## Phase 6 â€” Smart Home

- [ ] Home Assistant
- [ ] MQTT
- [ ] Matter
- [ ] Device discovery
- [ ] Smart lights
- [ ] Sensors
- [ ] Smart plugs
- [ ] TVs
- [ ] Media devices

## Phase 7 â€” Integrations

- [ ] Spotify
- [ ] YouTube
- [ ] Gmail
- [ ] Google Calendar
- [ ] Google Drive
- [ ] Discord
- [ ] GitHub
- [ ] Jellyfin
- [ ] Plex

## Phase 8 â€” Mobile

- [ ] Android client
- [ ] Notifications
- [ ] Mobile microphone
- [ ] Mobile TTS
- [ ] Phone presence
- [ ] Wake-on-LAN
- [ ] Remote PC control
- [ ] iOS project preparation

## Phase 9 â€” Remote Agents

- [ ] Windows agent
- [ ] Linux agent
- [ ] Raspberry Pi satellite
- [ ] Secure pairing
- [ ] Remote commands
- [ ] Remote telemetry
- [ ] Device permissions

---

# ðŸŽ¯ Project Goal

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

# âš ï¸ Security

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

# ðŸ“œ License

A license has not yet been selected.

Recommended options:

- MIT
- Apache-2.0
- GPL-3.0

---

# ðŸš§ Status

NekoSune Jarvis is currently a planned project / work in progress.

The architecture and feature set may change during development.

