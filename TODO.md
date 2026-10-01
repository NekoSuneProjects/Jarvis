# NekoSune Jarvis — Integration TODO

This checklist tracks the major integrations planned for NekoSune Jarvis.

Use this file alongside `README.md` to implement integrations in manageable stages.

---

# Overall TODO Progress

- **Completed:** 926 / 1215
- **Remaining:** 289
- **Progress:** **76.21%**
- This percentage is calculated from all Markdown checklist items in this file.

---

# Current Implementation Progress

Implemented in the repository so far:

- [x] TypeScript Jarvis Core
- [x] Environment configuration and validation
- [x] Ollama / OpenAI-compatible chat endpoint
- [x] Permission manager
- [x] Plugin registry and permission-aware tool router
- [x] SQLite persistence
- [x] WebSocket event stream
- [x] Local notes, lists, timers, alarms and reminders
- [x] Local scheduler for timer/alarm/reminder events
- [x] Integration manager and health/status reporting
- [x] Home Assistant REST integration
- [x] MQTT publish/subscribe integration
- [x] SearXNG web search integration
- [x] Open-Meteo current weather integration
- [x] Spotify search/basic playback controls
- [x] Sandboxed local text file tools
- [x] Docker list/log/start/stop/restart tools
- [x] Wake-on-LAN tool
- [x] Piper CPU TTS provider
- [x] GitHub Actions TypeScript CI
- [x] Cross-platform desktop URL/app launch tools
- [x] Clipboard and desktop screenshot tools
- [x] Playwright Chromium browser automation
- [x] Google Gmail/Calendar/Drive token-based REST tools
- [x] Discord bot-mode REST tools
- [x] GitHub PAT REST tools
- [x] Manual multi-action routine engine
- [x] Flutter cross-platform HUD client
- [x] Animated Jarvis orb and responsive dashboard
- [x] Flutter chat/API client and WebSocket event client
- [x] OpenAI-compatible native function/tool calling loop
- [x] Persistent conversation history
- [x] Explicit SQLite long-term memory tools
- [x] sherpa-onnx CPU wake-word + VAD + SenseVoice satellite
- [x] Secure device pairing and heartbeat registry
- [x] Zero-dependency Node remote agent
- [x] Remote agent command queue and result reporting
- [x] PDF/DOCX/XLSX/PPTX generation tools
- [x] Jellyfin/Plex/Kodi media tools
- [x] Internet radio search tools
- [x] Local music scanning and metadata search
- [x] Event/time/MQTT/voice/webhook routine triggers
- [x] Persistent notification center and notification tools
- [x] Home Assistant AI tool integration
- [x] MQTT AI publish/subscribe tools
- [x] Calculator/unit conversion/time utilities
- [x] Place geocoding and weather-by-place
- [x] No-key YouTube search through SearXNG
- [x] Flutter persistent conversations, devices and notification panels
- [x] SSH saved-host command integration
- [x] Docker images/stats/inspect and Compose controls
- [x] Cross-platform systeminformation monitoring suite
- [x] Playwright tabs/forms/uploads/download capture
- [x] Permission-gated mouse/keyboard/window automation
- [x] Protected local shell, process kill and system power controls
- [x] Recursive workspace file search/copy/move/delete
- [x] RRULE recurring alarms/reminders and timer pause/resume/add/cancel
- [x] Edge TTS online no-key fallback beside Piper
- [x] mDNS/Bonjour + SSDP/UPnP discovery and Jarvis LAN advertisement
- [x] Native desktop notification delivery with persistent fallback
- [x] Optional bearer-token Core API protection for LAN clients
- [x] Flutter REST/WebSocket API-token support
- [x] Approval-gated local shell and process termination
- [x] AI model discovery and embeddings APIs
- [x] Expanded Spotify queue/library/device/playlist controls
- [x] Expanded Gmail/Calendar/Drive management tools
- [x] AES-256-GCM encrypted local secret vault
- [x] Persistent plugin enable/disable with execution enforcement
- [x] Searchable sensitive-action audit log API
- [x] Android ADB device/app/input/screenshot tools
- [x] Direct LAN Hue/Shelly/Tasmota integrations
- [x] Workspace-safe multimodal vision endpoint
- [x] Safe-method HTTP retry/rate-limit handling
- [x] News/image/video/site/date-filtered SearXNG search tools
- [x] PDF/DOCX reading and search tools
- [x] XLSX reading and cell/formula editing
- [x] PPTX text extraction

> Checked items below mean the implementation exists in code. Items may still need UI, platform testing, OAuth setup, richer error handling, or end-to-end tests before the overall integration is considered production-ready.

---

# Core Integration Framework

- [x] Create shared integration interface
- [x] Create plugin manifest format
- [x] Add integration enable/disable toggle
- [x] Add per-integration permissions
- [x] Add per-device permissions
- [x] Add OAuth token storage foundation
- [x] Add API key storage foundation
- [x] Add encrypted secrets storage
- [ ] Add connection status UI
- [x] Add reconnect support
- [ ] Add refresh-token support
- [x] Add integration health checks
- [x] Add rate-limit handling foundation
- [x] Add retry handling
- [x] Add timeout handling
- [x] Add integration logs
- [x] Add audit logs for sensitive actions
- [x] Add integration capability discovery
- [x] Add integration versioning
- [x] Add plugin dependency system
- [ ] Add plugin update system
- [ ] Add integration test framework
- [ ] Add mock integration mode for development
- [ ] Add offline fallback support where possible
- [x] Add WebSocket event support
- [x] Add webhook event support
- [x] Add scheduled polling support
- [x] Add background event queue
- [x] Add integration error notifications

---

# AI Providers

## Ollama

- [x] Add Ollama-compatible endpoint setting
- [x] Add custom base URL
- [x] Add model selection
- [x] Add model auto-discovery
- [x] Add chat completion support
- [ ] Add streaming responses
- [x] Add tool calling support
- [x] Add vision model support
- [x] Add embeddings support
- [x] Add connection test
- [x] Add timeout / reconnect handling
- [ ] Add per-model settings
- [ ] Add context length setting
- [x] Add temperature setting
- [x] Add system prompt setting

## OpenAI-Compatible APIs

- [x] Add generic OpenAI-compatible provider
- [x] Add endpoint setting
- [x] Add API key setting
- [x] Add model selection foundation
- [ ] Add streaming
- [x] Add tool calls
- [x] Add vision
- [x] Add embeddings
- [x] Add provider presets
- [x] Add connection test

## Future AI Providers

- [ ] Anthropic-compatible provider
- [x] Gemini provider
- [x] Groq provider
- [x] OpenRouter provider
- [x] Local llama.cpp provider
- [x] LM Studio provider
- [x] Custom HTTP AI provider
- [x] Multi-provider fallback routing

---

# Voice Integrations

## sherpa-onnx

- [x] Add wake word detection
- [x] Add VAD
- [x] Add STT
- [ ] Add TTS
- [ ] Add model download manager
- [ ] Add model selection
- [x] Add CPU-only mode
- [ ] Add ARM64 support
- [ ] Add Raspberry Pi testing
- [ ] Add Android support
- [ ] Add macOS support
- [ ] Add future iOS support

## Piper

- [x] Add Piper TTS provider
- [x] Add local voice model selection
- [x] Add UK English voices
- [x] Add speed control
- [x] Add pitch control where supported
- [ ] Add Raspberry Pi support
- [ ] Add Windows support
- [ ] Add Linux support
- [ ] Add macOS support

## Edge TTS

- [x] Add Edge TTS provider
- [x] Add voice list
- [x] Add locale selection foundation
- [ ] Add voice preview
- [x] Add speed control
- [x] Add pitch control
- [x] Add online/offline detection
- [ ] Add fallback voice if service fails

## Custom TTS API

- [x] Add custom TTS endpoint
- [x] Add authentication support
- [x] Add voice parameter mapping
- [x] Add audio format setting
- [x] Add streamed audio response
- [x] Add connection test

---

# Search / Web Integrations

## SearXNG

- [x] Add SearXNG endpoint
- [x] Add search query tool
- [x] Add categories
- [x] Add safe-search setting
- [x] Add result count setting
- [x] Add language setting
- [x] Add timeout handling
- [ ] Add fallback search provider

## General Web Search

- [x] Add pluggable search provider interface
- [x] Add news search
- [x] Add image search
- [x] Add video search
- [x] Add site-specific search
- [x] Add date-filtered search
- [x] Add source citations
- [x] Add search result summarisation

## Playwright

- [x] Add browser launch
- [x] Add Chromium support
- [x] Add Firefox support
- [x] Add persistent profiles
- [x] Add open URL
- [x] Add webpage reading
- [x] Add click
- [x] Add typing
- [x] Add form filling
- [x] Add tab control
- [x] Add downloads
- [x] Add uploads
- [x] Add page screenshots
- [x] Add cookie storage
- [x] Add login session support
- [x] Add safe autofill permissions
- [x] Add anti-loop protection
- [x] Add browser action confirmation for sensitive actions

---

# Google Integrations

## Gmail

- [ ] Add Google OAuth
- [x] Add Gmail connection
- [x] Read inbox foundation
- [x] Search email
- [x] Read email thread
- [ ] Read attachments
- [x] Draft email
- [x] Reply to email foundation
- [ ] Forward email
- [x] Send email
- [x] Mark read/unread
- [x] Archive email
- [x] Delete email
- [x] Apply labels
- [x] Create labels
- [ ] Important-email detection
- [ ] Email summaries
- [ ] New-email notifications
- [ ] Approval before sending
- [ ] Support multiple Gmail accounts

## Google Calendar

- [x] Read calendars
- [x] List events
- [x] Read event details
- [x] Create event
- [x] Update event
- [x] Delete event
- [x] RSVP to event
- [x] Find free time
- [x] Read upcoming schedule
- [x] Reminder integration
- [x] Timezone support
- [x] Recurring event support
- [x] Multiple calendar support
- [ ] Calendar notifications

## Google Drive

- [x] Browse files
- [x] Search files
- [x] Read Google Docs
- [x] Read Sheets
- [x] Read Slides
- [x] Download files
- [x] Upload files
- [x] Create folders
- [x] Move files
- [x] Rename files
- [x] Delete files
- [x] Share files
- [x] Create Google Docs
- [x] Create Sheets
- [x] Create Slides
- [x] Edit Docs
- [x] Edit Sheets
- [x] Edit Slides
- [x] Read comments
- [x] Reply to comments
- [ ] Multiple Drive account support

---

# Spotify

- [ ] Add Spotify OAuth
- [x] Read current playback
- [x] Play
- [x] Pause
- [x] Resume
- [x] Next track
- [x] Previous track
- [x] Seek
- [x] Volume control
- [x] Search tracks
- [x] Search artists
- [x] Search albums
- [x] Search playlists
- [x] Play playlist
- [x] Play album
- [x] Play artist
- [x] Queue track
- [x] Read queue
- [x] Read liked songs
- [x] Like track
- [x] Unlike track
- [x] Create playlist
- [x] Add track to playlist
- [x] Remove track from playlist
- [x] Select playback device
- [x] Transfer playback
- [x] Read recently played
- [x] Read user library foundation
- [ ] Handle no-active-device state

---

# YouTube

- [x] Search YouTube
- [ ] Embedded player
- [ ] Play video
- [x] Pause
- [x] Resume
- [ ] Seek
- [x] Volume
- [ ] Fullscreen
- [x] Queue videos
- [x] Read video metadata
- [x] Read channel metadata
- [x] Read playlists
- [x] Open videos externally
- [ ] Cast to supported device
- [ ] YouTube account OAuth
- [ ] Watch history support
- [ ] Subscription support

---

# YouTube Music

- [x] Search songs
- [x] Search artists
- [x] Search albums
- [x] Search playlists
- [x] Start playback
- [x] Queue songs
- [x] Read current track
- [ ] Read library
- [ ] Read liked songs
- [x] Playlist support
- [ ] Account authentication

---

# SoundCloud

- [x] Search SoundCloud
- [x] Play tracks
- [ ] Pause
- [ ] Resume
- [x] Queue
- [x] Search artists
- [x] Search playlists
- [ ] Read likes
- [ ] Account authentication where available
- [x] Open track externally

---

# Jellyfin

- [x] Add Jellyfin server URL
- [x] Add API token
- [ ] Add username/password pairing
- [x] Browse media
- [x] Search movies
- [x] Search shows
- [x] Search music
- [x] Play media
- [x] Pause
- [x] Resume
- [x] Stop playback
- [x] Select playback device
- [x] Continue watching
- [x] Recently added
- [x] User profiles
- [x] Library status
- [x] Server health check foundation

---

# Plex

- [x] Plex authentication
- [x] Discover Plex servers
- [x] Browse libraries
- [x] Search media
- [x] Play media
- [x] Pause
- [x] Resume
- [x] Stop
- [x] Choose player
- [x] Continue watching
- [x] Recently added
- [x] Plex account support

---

# Kodi

- [x] Add Kodi JSON-RPC endpoint
- [x] Authentication
- [x] Play
- [x] Pause
- [x] Resume
- [x] Stop
- [x] Navigation controls
- [x] Volume
- [x] Search library
- [x] Open media
- [x] Read now playing
- [x] Device discovery foundation

---

# Chromecast / Google Cast

- [x] Device discovery foundation
- [ ] Cast YouTube
- [ ] Cast local media
- [ ] Cast URLs
- [ ] Pause
- [ ] Resume
- [ ] Stop
- [ ] Volume
- [ ] Read cast status
- [ ] Multi-device support

---

# DLNA / UPnP

- [x] Discover DLNA devices
- [x] Discover media renderers
- [x] Discover media servers
- [x] Browse media
- [x] Play media
- [x] Pause
- [x] Stop
- [x] Volume
- [x] Read playback state

---

# Internet Radio

- [x] Search stations
- [x] Save favourites
- [x] Play stream URL
- [x] Station metadata
- [ ] Current track metadata
- [ ] Country filtering
- [ ] Genre filtering
- [x] Custom stream URL support

---

# Local Music

- [x] Scan local music folders
- [x] Read metadata
- [x] Album art
- [x] Search artists
- [x] Search albums
- [x] Search tracks
- [x] Create local playlists
- [x] Shuffle
- [x] Repeat
- [x] Queue
- [ ] Multi-room playback

---

# Discord

- [ ] Discord OAuth
- [x] Read current user
- [x] Read server list
- [x] Read channels
- [x] Read recent messages
- [x] Search messages
- [x] Send message
- [x] Reply to message
- [x] Read DMs
- [x] Send DM
- [x] Read mentions
- [ ] Notification summary
- [ ] Voice-channel presence where supported
- [x] Approval before sending
- [x] Bot-token mode
- [ ] User OAuth mode

---

# GitHub

- [x] GitHub OAuth / PAT support
- [x] List repositories
- [x] Search repositories
- [x] Read repository
- [x] Clone repository
- [x] Pull repository
- [x] Read issues
- [x] Create issue
- [x] Update issue
- [x] Comment on issue
- [x] Read pull requests
- [x] Create pull request
- [x] Review pull request
- [x] Read Actions runs
- [x] Read build logs
- [x] Re-run workflow
- [x] Read releases
- [x] Create release
- [x] Read branches
- [x] Create branch
- [x] Commit files
- [x] Push changes
- [x] Permission confirmations for write actions

---

# Home Assistant

- [x] Add Home Assistant URL
- [x] Add long-lived access token
- [x] Connection test
- [x] Read entities
- [x] Read devices
- [x] Read areas
- [x] Turn entity on/off
- [x] Set brightness
- [x] Set colour
- [x] Set temperature
- [x] Read sensors
- [x] Run scripts
- [x] Run scenes
- [x] Run automations
- [x] Read automation state
- [x] Trigger service calls
- [ ] Subscribe to state changes
- [x] Presence integration
- [x] Alarm panel support
- [x] Media player support
- [x] Dashboard device grouping

---

# MQTT

- [x] Add MQTT broker settings
- [x] Username/password
- [x] TLS
- [x] Subscribe topics
- [x] Publish topics
- [x] Retained messages
- [x] QoS support
- [x] Topic browser
- [ ] Device auto-discovery
- [x] Home Assistant MQTT discovery
- [x] Trigger Jarvis routine from MQTT
- [x] Publish Jarvis state to MQTT
- [x] Publish voice assistant events
- [x] MQTT permissions

---

# Matter

- [ ] Research Matter controller architecture
- [ ] Add Matter device discovery
- [ ] Pair Matter device
- [ ] Read device state
- [ ] Control lights
- [ ] Control switches
- [ ] Read sensors
- [ ] Thermostat support
- [ ] Device removal
- [ ] Fabric management
- [ ] Secure credential storage
- [ ] Linux support
- [x] Windows support
- [ ] Android support
- [ ] macOS support
- [ ] Future iOS support

---

# Zigbee

- [ ] Integrate through Home Assistant first
- [ ] Zigbee2MQTT support
- [ ] Device discovery via MQTT
- [ ] Read device state
- [ ] Control devices
- [ ] Sensor readings
- [ ] Light control
- [ ] Button events
- [x] Battery information
- [ ] Direct coordinator support as future option

---

# Philips Hue

- [ ] Bridge discovery
- [ ] Bridge pairing
- [x] List rooms
- [x] List lights
- [x] Turn lights on/off
- [x] Brightness
- [x] Colour
- [x] Colour temperature
- [x] Scenes
- [x] Groups
- [x] Entertainment zones
- [x] Local LAN control

---

# Tuya

- [ ] Home Assistant-based support first
- [ ] Local Tuya support where possible
- [ ] Cloud Tuya optional
- [ ] Device discovery
- [ ] Smart plug control
- [ ] Light control
- [ ] Sensor reading
- [ ] Device state
- [ ] Energy monitoring where supported

---

# Tasmota

- [x] HTTP control
- [ ] MQTT control
- [ ] Device discovery
- [x] Power control
- [x] Sensor values
- [x] Energy values
- [x] Device information
- [x] Rules support
- [x] Local-only support

---

# Shelly

- [x] Shelly foundation discovery
- [ ] Gen1 support
- [x] Gen2+ RPC support
- [x] Switch control
- [x] Relay control
- [x] Sensor reading
- [x] Energy monitoring
- [x] Device information
- [x] Local network control

---

# Smart TVs

## Samsung TV

- [ ] Device discovery
- [ ] Pairing
- [ ] Power support where available
- [ ] Volume
- [ ] Mute
- [ ] Input
- [ ] App launch
- [ ] Media controls
- [ ] Read state

## Android TV / Google TV

- [x] Device discovery
- [x] Pairing
- [x] ADB support
- [x] Open app
- [x] Media controls
- [x] Volume
- [x] Input navigation
- [x] Text input
- [x] Read current app

## LG webOS

- [ ] Device discovery
- [ ] Pairing
- [ ] Power
- [ ] Volume
- [ ] App launch
- [ ] Media controls
- [ ] Input control

---

# Windows Integration

- [x] Application launcher
- [x] Process manager
- [x] Window manager
- [x] Mouse control
- [x] Keyboard control
- [x] Clipboard
- [x] Screenshots
- [ ] Audio volume
- [ ] Per-app audio control
- [x] PowerShell
- [x] CMD
- [x] Services
- [x] Task Scheduler
- [x] Notifications
- [x] Battery
- [x] CPU
- [x] RAM
- [x] GPU
- [x] Disk
- [x] Network
- [x] Wi-Fi
- [x] Bluetooth
- [x] Shutdown
- [x] Restart
- [x] Sleep
- [x] Lock
- [x] Wake-on-LAN sender
- [x] Windows startup support
- [ ] Tray integration

---

# Linux Integration

- [x] Application launcher
- [x] Process manager
- [x] Window manager
- [x] X11 input support
- [ ] Wayland support
- [x] Clipboard
- [x] Screenshots
- [x] PipeWire audio
- [x] PulseAudio fallback
- [x] Shell commands
- [x] systemd services
- [x] Notifications
- [x] CPU
- [x] RAM
- [x] GPU
- [x] Disk
- [x] Network
- [x] Wi-Fi
- [x] Bluetooth
- [x] Shutdown
- [x] Restart
- [x] Sleep
- [x] Lock
- [x] Wake-on-LAN
- [x] Autostart support
- [ ] Tray support

---

# Raspberry Pi

- [ ] Raspberry Pi OS support
- [ ] Debian ARM64 support
- [ ] Headless mode
- [ ] Lightweight UI mode
- [ ] USB microphone support
- [ ] USB speaker support
- [ ] Bluetooth audio
- [ ] GPIO integration
- [x] Wake word
- [x] Local STT
- [x] Local TTS foundation
- [x] Remote AI fallback
- [ ] MQTT
- [ ] Home Assistant
- [ ] Intercom
- [ ] Multi-room audio
- [ ] Local alarms
- [ ] Local timers
- [ ] Kiosk mode
- [ ] Auto-start service
- [ ] Watchdog
- [ ] Offline mode

---

# macOS

- [x] Flutter macOS project scaffold
- [x] Application launcher
- [ ] Accessibility permission guide
- [x] Keyboard control
- [x] Mouse control
- [x] Screenshots
- [x] Clipboard
- [ ] AppleScript support
- [x] Shell support
- [x] Notifications
- [ ] Audio control
- [x] CPU / RAM / disk
- [x] Battery
- [x] Network
- [x] Shutdown / restart / sleep
- [ ] Manual build documentation
- [ ] Code signing documentation
- [ ] Notarisation documentation
- [ ] Test on Intel Mac
- [ ] Test on Apple Silicon Mac

---

# Android

- [x] Flutter Android app scaffold
- [x] Microphone permission
- [x] Notifications permission
- [x] Wake-word foreground service
- [ ] STT
- [ ] TTS
- [ ] Push-to-talk
- [x] Assistant chat
- [ ] Smart-home control
- [x] Device status foundation
- [x] Battery status
- [x] Network status
- [x] Notification reading
- [ ] Notification actions where allowed
- [ ] Wake-on-LAN
- [ ] Remote PC control
- [x] Media remote
- [x] Presence detection
- [x] Background service
- [x] Bluetooth device support
- [x] Local alarms
- [x] Local timers
- [x] Deep links
- [ ] Share-to-Jarvis action
- [ ] Android Auto research

---

# iOS — Future

- [ ] Flutter iOS project
- [ ] Microphone
- [ ] TTS
- [ ] STT
- [ ] Push notifications
- [ ] Local notifications
- [ ] Smart-home control
- [ ] Assistant chat
- [ ] Media remote
- [ ] Device status
- [ ] Background limitations research
- [ ] Siri Shortcuts integration
- [ ] App Intents integration
- [ ] Apple Home integration research
- [ ] Build documentation
- [ ] Signing documentation
- [ ] TestFlight process
- [ ] Requires macOS build environment

---

# Docker

- [x] List containers
- [x] Read container status
- [x] Start container
- [x] Stop container
- [x] Restart container
- [x] Read logs
- [x] Inspect container
- [x] Read stats
- [x] List images
- [x] Pull image
- [x] Remove container
- [x] Remove image
- [x] Docker Compose support
- [x] List Compose stacks
- [x] Start stack
- [x] Stop stack
- [x] Restart stack
- [x] Update stack foundation
- [x] Confirmation for destructive commands
- [x] Remote Docker support

---

# SSH

- [x] SSH connection manager
- [x] Password auth
- [x] SSH key auth
- [x] Agent support
- [x] Host key verification
- [x] Saved hosts
- [x] Run command
- [ ] Stream output
- [x] Upload file
- [x] Download file
- [x] SFTP browser
- [x] Remote service control
- [x] Remote logs
- [x] Permission prompts
- [ ] Secure credential storage

---

# Remote Jarvis Agents

- [x] Agent pairing
- [x] Device identity
- [x] TLS
- [ ] Mutual authentication
- [x] Windows agent foundation
- [x] Linux agent foundation
- [x] Raspberry Pi agent foundation
- [x] macOS agent foundation
- [x] Heartbeat
- [x] Device online/offline state foundation
- [x] Remote commands
- [x] Remote screenshots
- [x] Remote system stats
- [x] Remote notifications
- [x] Remote file transfer
- [x] Remote app launching
- [x] Remote power actions
- [x] Per-device permissions
- [x] Device revoke
- [x] Audit log

---

# Notifications

- [x] Windows notifications
- [x] Linux notifications
- [x] macOS notifications
- [x] Android notifications
- [ ] Future iOS notifications
- [ ] Email notifications
- [ ] GitHub notifications
- [ ] Discord notifications
- [x] Smart-home notifications foundation
- [x] System alerts
- [x] Server alerts
- [x] Jarvis notification summary foundation
- [x] Priority filtering
- [x] Quiet hours
- [x] Read aloud option

---

# Weather

- [x] Weather provider interface
- [x] Current conditions
- [x] Hourly forecast
- [x] Daily forecast
- [x] Rain probability
- [x] Temperature
- [x] Feels-like temperature
- [x] Wind
- [x] Sunrise
- [x] Sunset
- [x] Weather alerts
- [x] Multiple saved locations
- [x] Home location setting
- [x] Unit preference

---

# News

- [x] General news search
- [x] Technology news
- [x] Gaming news
- [x] Local news
- [x] Custom topics
- [x] Daily briefing
- [x] Source citations
- [x] Avoid duplicate stories
- [ ] Read-aloud mode
- [x] User-defined blocked sources
- [x] User-defined favourite sources

---

# Maps / Directions

- [x] Location provider interface
- [x] Search places
- [x] Get directions
- [x] Travel time
- [x] Distance
- [x] Saved locations
- [x] Home
- [x] Work / college custom location
- [x] Open route externally
- [ ] Future Android navigation integration

---

# Alarms

- [x] Local alarm database
- [x] One-time alarms
- [x] Recurring alarms
- [x] Weekday alarms
- [x] Named alarms
- [x] Custom alarm sounds
- [x] TTS alarm
- [x] Snooze
- [x] Dismiss
- [ ] Cross-device sync
- [x] Offline operation

---

# Timers

- [x] Multiple timers
- [x] Named timers
- [x] Pause timer
- [x] Resume timer
- [x] Add time
- [x] Remove time
- [x] Cancel timer
- [x] Timer notifications
- [x] Timer TTS
- [ ] Cross-device sync
- [x] Offline operation

---

# Reminders

- [x] Time reminder
- [x] Date reminder
- [x] Recurring reminder
- [ ] Device-state reminder
- [ ] Presence reminder
- [ ] Location reminder
- [ ] Reminder priority
- [x] Read reminder aloud
- [x] Snooze
- [x] Complete
- [ ] Cross-device sync

---

# Notes

- [x] Create note
- [x] Edit note
- [x] Delete note
- [x] Search notes
- [x] Tag notes
- [x] Pin notes
- [ ] Voice-created notes
- [x] Markdown support
- [ ] Sync between devices
- [x] Export notes

---

# Lists

- [x] Shopping list
- [x] Todo list
- [x] Custom lists
- [x] Add item
- [x] Remove item
- [x] Check item
- [x] Clear checked
- [x] Read list aloud
- [x] Share list
- [ ] Cross-device sync

---

# Routines

- [x] Routine editor
- [x] Voice trigger
- [x] Time trigger
- [x] Device trigger
- [x] Presence trigger
- [x] Webhook trigger
- [x] MQTT trigger
- [x] Multiple actions
- [x] Delays
- [x] Conditions
- [x] Branching
- [x] Enable / disable
- [x] Manual run
- [x] Routine logs
- [x] Import / export routines

---

# IF / THEN Automation Engine

- [x] Trigger system
- [x] Condition system
- [x] Action system
- [x] AND conditions
- [x] OR conditions
- [x] NOT conditions
- [x] Time windows
- [ ] Device state
- [ ] Network state
- [x] Presence
- [ ] Weather
- [ ] Calendar
- [ ] Email
- [x] Webhooks
- [x] MQTT
- [ ] System state
- [ ] AI condition
- [x] Cooldown
- [x] Loop prevention

---

# Multi-Room Audio

- [x] Discover Jarvis speakers
- [x] Speaker groups
- [x] Room names
- [x] Play to one room
- [x] Play to multiple rooms
- [x] Whole-home playback
- [x] Volume per room
- [x] Group volume
- [ ] Playback sync research
- [ ] Local audio streaming
- [x] Internet radio
- [x] Spotify handoff
- [x] Announcement ducking

---

# Intercom

- [ ] WebRTC audio
- [ ] Call room
- [ ] Call device
- [ ] Accept / reject
- [ ] Auto-answer option
- [ ] Push-to-talk
- [ ] Full duplex
- [ ] Device mute
- [ ] Call notification
- [ ] LAN-only mode
- [ ] Encrypted audio

---

# Announcements

- [x] Announce to one room
- [x] Announce to multiple rooms
- [x] Announce everywhere
- [x] TTS announcements
- [x] Chime sound
- [x] Volume ducking
- [x] Scheduled announcement
- [x] Routine announcement
- [x] Emergency announcement mode

---

# Device Discovery

- [x] mDNS
- [x] SSDP
- [x] UPnP
- [ ] MQTT discovery
- [ ] Home Assistant discovery
- [x] Jarvis agent discovery
- [ ] Chromecast discovery
- [x] DLNA discovery
- [x] Hue foundation bridge discovery
- [x] Shelly foundation discovery
- [x] Manual device add
- [x] Device naming
- [x] Room assignment
- [x] Device icons
- [x] Device online/offline state

---

# Wake-on-LAN

- [x] Add device MAC address
- [x] Add broadcast address
- [x] Send magic packet
- [ ] Android sender
- [x] Windows sender
- [x] Linux sender
- [x] Raspberry Pi sender
- [x] Device online detection
- [ ] Optional automatic app launch after wake

---

# File Integrations

## PDF

- [x] Create PDF
- [x] Read PDF
- [x] Search PDF
- [x] Summarise PDF
- [x] Add images
- [x] Add tables
- [x] Export PDF

## DOCX

- [x] Create DOCX
- [x] Read DOCX
- [x] Edit DOCX
- [x] Search DOCX
- [x] Add headings
- [x] Add tables
- [x] Add images

## XLSX

- [x] Create XLSX
- [x] Read XLSX
- [x] Edit cells
- [x] Formulas
- [x] Tables
- [ ] Charts
- [x] Multiple sheets foundation

## PPTX

- [x] Create PPTX
- [x] Read PPTX
- [ ] Edit PPTX
- [x] Add slides
- [x] Add images
- [x] Add charts
- [x] Apply themes

## General Files

- [x] TXT
- [x] Markdown
- [x] JSON
- [x] CSV
- [x] HTML
- [x] ZIP
- [x] File search
- [x] Folder search
- [x] Rename
- [x] Move
- [x] Copy
- [x] Delete with confirmation
- [x] File watcher

---

# System Monitoring

- [x] CPU usage
- [x] CPU temperature
- [x] RAM usage
- [x] GPU usage
- [x] GPU VRAM
- [x] GPU temperature
- [x] Disk usage
- [x] Disk health
- [x] Network upload
- [x] Network download
- [x] Wi-Fi information
- [x] Battery
- [x] Running processes
- [x] Running services
- [x] Docker stats
- [x] Uptime
- [x] Alerts
- [x] History graphs

---

# Home Presence

- [x] Phone Wi-Fi presence
- [ ] Bluetooth presence
- [x] Home Assistant presence
- [x] Device ping
- [ ] Router integration option
- [x] Home / Away state
- [x] Per-user presence
- [x] Presence-triggered routines
- [x] Privacy controls

---

# Authentication / Security

- [ ] Local user accounts
- [x] Device pairing code
- [ ] QR pairing
- [x] TLS
- [x] Secure WebSocket
- [ ] Refresh tokens
- [ ] Session expiry
- [x] Device revoke
- [ ] Integration revoke
- [x] Secret encryption
- [ ] OS keychain support
- [ ] Android secure storage
- [ ] macOS Keychain
- [ ] Future iOS Keychain
- [x] Audit logs
- [x] Emergency disable
- [x] Local-only mode
- [x] LAN-only remote control
- [x] Permission profiles

---

# Recommended Integration Order

## Stage 1

- [x] Ollama
- [x] sherpa-onnx
- [x] Piper
- [x] Windows
- [x] Linux
- [x] Local files
- [x] System monitoring
- [x] Timers
- [x] Alarms
- [x] Notes
- [x] Lists

## Stage 2

- [x] Playwright
- [x] SearXNG
- [x] Spotify
- [x] YouTube
- [x] Home Assistant
- [x] MQTT
- [x] Docker
- [x] SSH

## Stage 3

- [x] Gmail
- [x] Google Calendar
- [x] Google Drive
- [x] GitHub
- [x] Discord
- [x] Android

## Stage 4

- [x] Raspberry Pi satellite
- [x] Remote Jarvis agents
- [x] Multi-room audio
- [ ] Intercom
- [x] Announcements
- [x] Device discovery

## Stage 5

- [ ] Matter
- [x] Hue
- [ ] Tuya
- [x] Tasmota foundation
- [x] Shelly
- [ ] Chromecast
- [x] DLNA
- [x] Jellyfin
- [x] Plex
- [x] Kodi

## Stage 6

- [ ] macOS testing
- [ ] iOS preparation
- [ ] Siri Shortcuts
- [ ] App Intents
- [ ] Advanced mobile features

---

# Definition of Done for Each Integration

An integration should not be marked complete until:

- [ ] Connection setup works
- [ ] Authentication works
- [ ] Connection can be tested from Settings
- [ ] Main read actions work
- [ ] Main write/control actions work
- [ ] Permissions are enforced
- [ ] Errors are shown clearly
- [ ] Reconnect works
- [ ] Logs are available
- [ ] UI status is shown
- [ ] Voice commands are mapped
- [ ] Text commands are mapped
- [ ] Tool calling works
- [ ] Integration has unit tests
- [ ] Integration has basic end-to-end tests
- [ ] Windows support tested where applicable
- [ ] Linux support tested where applicable
- [ ] Raspberry Pi support tested where applicable
- [ ] Android support tested where applicable
- [ ] Documentation is added


---

# Next 100 Implementation TODOs

This section is a focused queue of 100 concrete implementation tasks for upcoming Jarvis work.

- [x] 001. Add automatic Piper Jarvis medium voice download
- [x] 002. Add automatic Piper Jarvis high voice download
- [x] 003. Add Piper model download checksum validation
- [x] 004. Add interrupted Piper download resume handling
- [x] 005. Add Piper model download progress reporting
- [x] 006. Add Piper model cache cleanup command
- [x] 007. Add Piper voice selection API endpoint
- [x] 008. Add Piper voice selection in Flutter settings
- [x] 009. Add Piper voice preview button
- [x] 010. Add Piper fallback error message when binary is missing
- [ ] 011. Bundle Piper runtime for Windows builds
- [x] 012. Detect bundled Piper binary before PATH lookup
- [x] 013. Add Windows installer option for Piper voice model preload
- [x] 014. Add Windows installer option to skip model preload
- [x] 015. Add Windows portable launcher health check
- [x] 016. Add Windows launcher log file
- [x] 017. Add Windows launcher graceful core shutdown
- [x] 018. Add Windows Start Menu shortcut for logs
- [x] 019. Add Windows Start Menu shortcut for settings
- [x] 020. Add Windows uninstall cleanup option for cached models
- [x] 021. Add manual GitHub Actions portable ZIP toggle
- [x] 022. Add manual GitHub Actions installer EXE toggle
- [x] 023. Add manual GitHub Actions release publishing toggle
- [x] 024. Add manual GitHub Actions release tag input
- [x] 025. Add manual GitHub Actions Jarvis base URL input validation
- [x] 026. Add manual GitHub Actions Piper voice preset input
- [x] 027. Add GitHub Actions build summary with artifact links
- [ ] 028. Add GitHub Actions cache for npm dependencies
- [x] 029. Add GitHub Actions cache for Flutter pub dependencies
- [x] 030. Add GitHub Actions timeout limits for stuck builds
- [x] 031. Add CI job that verifies TypeScript formatting
- [x] 032. Add CI job that runs TypeScript tests
- [x] 033. Add CI job that validates environment schema defaults
- [x] 034. Add CI job that validates Flutter formatting
- [x] 035. Add CI job that runs Flutter tests
- [x] 036. Add CI job that smoke-tests Windows executable startup
- [x] 037. Add CI job that validates installer creation
- [x] 038. Add CI job that verifies release assets exist
- [x] 039. Add CI failure log artifact upload
- [x] 040. Add CI dependency vulnerability audit
- [x] 041. Add /health details for Piper availability
- [x] 042. Add /health details for selected voice
- [x] 043. Add /health details for AI provider reachability
- [x] 044. Add /health details for database state
- [x] 045. Add /health details for writable data directory
- [x] 046. Add /health details for browser automation availability
- [x] 047. Add /health details for ADB availability
- [x] 048. Add /health details for smart-home integrations
- [x] 049. Add /health degraded-state reporting
- [x] 050. Add /health startup diagnostics history
- [x] 051. Add structured JSON logging
- [ ] 052. Add rotating local log files
- [ ] 053. Add configurable log levels
- [x] 054. Add request correlation IDs
- [x] 055. Add tool-call audit logging
- [x] 056. Add TTS latency metrics
- [x] 057. Add AI response latency metrics
- [x] 058. Add WebSocket connection metrics
- [ ] 059. Add integration reconnect metrics
- [x] 060. Add optional diagnostics export ZIP
- [x] 061. Add settings API for assistant name
- [x] 062. Add settings API for AI endpoint
- [x] 063. Add settings API for AI model
- [x] 064. Add settings API for TTS provider
- [x] 065. Add settings API for Piper voice
- [x] 066. Add settings API for wake-word mode
- [x] 067. Add settings persistence in SQLite
- [ ] 068. Add settings validation errors to UI
- [x] 069. Add settings import/export
- [x] 070. Add settings reset-to-defaults
- [x] 071. Add first-run setup wizard
- [x] 072. Add first-run AI provider test
- [ ] 073. Add first-run microphone test
- [ ] 074. Add first-run speaker test
- [x] 075. Add first-run Piper voice download screen
- [x] 076. Add first-run permissions explanation
- [x] 077. Add first-run local-only mode option
- [x] 078. Add first-run Home Assistant optional setup
- [x] 079. Add first-run Discord optional setup
- [x] 080. Add first-run completion health check
- [x] 081. Add conversation history search
- [x] 082. Add conversation delete controls
- [x] 083. Add per-conversation export
- [x] 084. Add memory enable/disable control
- [ ] 085. Add memory review screen
- [ ] 086. Add tool permission confirmation UI
- [x] 087. Add dangerous action confirmation flow
- [x] 088. Add per-tool allow/deny rules
- [x] 089. Add per-device permission profiles
- [x] 090. Add emergency stop button
- [x] 091. Add Windows notification support
- [x] 092. Add Linux notification support
- [ ] 093. Add notification action buttons
- [ ] 094. Add tray icon for desktop builds
- [ ] 095. Add tray menu for mute/listening modes
- [ ] 096. Add tray menu for restarting core
- [ ] 097. Add tray menu for opening logs
- [ ] 098. Add auto-start-on-login option
- [ ] 099. Add update-available notification
- [ ] 100. Add self-update preparation for signed releases
