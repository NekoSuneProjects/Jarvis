# NekoSune Jarvis — Integration TODO

This checklist tracks the major integrations planned for NekoSune Jarvis.

Use this file alongside `README.md` to implement integrations in manageable stages.

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

> Checked items below mean the implementation exists in code. Items may still need UI, platform testing, OAuth setup, richer error handling, or end-to-end tests before the overall integration is considered production-ready.

---

# Core Integration Framework

- [x] Create shared integration interface
- [ ] Create plugin manifest format
- [ ] Add integration enable/disable toggle
- [x] Add per-integration permissions
- [ ] Add per-device permissions
- [ ] Add OAuth token storage
- [ ] Add API key storage
- [ ] Add encrypted secrets storage
- [ ] Add connection status UI
- [ ] Add reconnect support
- [ ] Add refresh-token support
- [x] Add integration health checks
- [ ] Add rate-limit handling
- [ ] Add retry handling
- [x] Add timeout handling
- [ ] Add integration logs
- [ ] Add audit logs for sensitive actions
- [ ] Add integration capability discovery
- [x] Add integration versioning
- [ ] Add plugin dependency system
- [ ] Add plugin update system
- [ ] Add integration test framework
- [ ] Add mock integration mode for development
- [ ] Add offline fallback support where possible
- [x] Add WebSocket event support
- [ ] Add webhook event support
- [ ] Add scheduled polling support
- [ ] Add background event queue
- [ ] Add integration error notifications

---

# AI Providers

## Ollama

- [x] Add Ollama-compatible endpoint setting
- [x] Add custom base URL
- [x] Add model selection
- [ ] Add model auto-discovery
- [x] Add chat completion support
- [ ] Add streaming responses
- [x] Add tool calling support
- [ ] Add vision model support
- [ ] Add embeddings support
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
- [ ] Add model selection
- [ ] Add streaming
- [ ] Add tool calls
- [ ] Add vision
- [ ] Add embeddings
- [ ] Add provider presets
- [ ] Add connection test

## Future AI Providers

- [ ] Anthropic-compatible provider
- [ ] Gemini provider
- [ ] Groq provider
- [ ] OpenRouter provider
- [ ] Local llama.cpp provider
- [ ] LM Studio provider
- [ ] Custom HTTP AI provider
- [ ] Multi-provider fallback routing

---

# Voice Integrations

## sherpa-onnx

- [ ] Add wake word detection
- [ ] Add VAD
- [ ] Add STT
- [ ] Add TTS
- [ ] Add model download manager
- [ ] Add model selection
- [ ] Add CPU-only mode
- [ ] Add ARM64 support
- [ ] Add Raspberry Pi testing
- [ ] Add Android support
- [ ] Add macOS support
- [ ] Add future iOS support

## Piper

- [x] Add Piper TTS provider
- [ ] Add local voice model selection
- [ ] Add UK English voices
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
- [ ] Add speed control
- [ ] Add pitch control
- [x] Add online/offline detection
- [ ] Add fallback voice if service fails

## Custom TTS API

- [ ] Add custom TTS endpoint
- [ ] Add authentication support
- [ ] Add voice parameter mapping
- [ ] Add audio format setting
- [ ] Add streamed audio response
- [ ] Add connection test

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

- [ ] Add pluggable search provider interface
- [ ] Add news search
- [ ] Add image search
- [ ] Add video search
- [ ] Add site-specific search
- [ ] Add date-filtered search
- [ ] Add source citations
- [ ] Add search result summarisation

## Playwright

- [x] Add browser launch
- [x] Add Chromium support
- [ ] Add Firefox support
- [ ] Add persistent profiles
- [x] Add open URL
- [x] Add webpage reading
- [x] Add click
- [x] Add typing
- [x] Add form filling
- [x] Add tab control
- [x] Add downloads
- [x] Add uploads
- [x] Add page screenshots
- [ ] Add cookie storage
- [ ] Add login session support
- [ ] Add safe autofill permissions
- [ ] Add anti-loop protection
- [ ] Add browser action confirmation for sensitive actions

---

# Google Integrations

## Gmail

- [ ] Add Google OAuth
- [x] Add Gmail connection
- [ ] Read inbox
- [x] Search email
- [x] Read email thread
- [ ] Read attachments
- [ ] Draft email
- [ ] Reply to email
- [ ] Forward email
- [x] Send email
- [ ] Mark read/unread
- [ ] Archive email
- [ ] Delete email
- [ ] Apply labels
- [ ] Create labels
- [ ] Important-email detection
- [ ] Email summaries
- [ ] New-email notifications
- [ ] Approval before sending
- [ ] Support multiple Gmail accounts

## Google Calendar

- [ ] Read calendars
- [x] List events
- [x] Read event details
- [x] Create event
- [ ] Update event
- [ ] Delete event
- [ ] RSVP to event
- [ ] Find free time
- [ ] Read upcoming schedule
- [ ] Reminder integration
- [ ] Timezone support
- [ ] Recurring event support
- [ ] Multiple calendar support
- [ ] Calendar notifications

## Google Drive

- [x] Browse files
- [x] Search files
- [ ] Read Google Docs
- [ ] Read Sheets
- [ ] Read Slides
- [ ] Download files
- [ ] Upload files
- [x] Create folders
- [x] Move files
- [x] Rename files
- [x] Delete files
- [ ] Share files
- [ ] Create Google Docs
- [ ] Create Sheets
- [ ] Create Slides
- [ ] Edit Docs
- [ ] Edit Sheets
- [ ] Edit Slides
- [ ] Read comments
- [ ] Reply to comments
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
- [ ] Seek
- [x] Volume control
- [x] Search tracks
- [x] Search artists
- [x] Search albums
- [x] Search playlists
- [x] Play playlist
- [ ] Play album
- [ ] Play artist
- [ ] Queue track
- [ ] Read queue
- [ ] Read liked songs
- [ ] Like track
- [ ] Unlike track
- [ ] Create playlist
- [ ] Add track to playlist
- [ ] Remove track from playlist
- [ ] Select playback device
- [ ] Transfer playback
- [ ] Read recently played
- [ ] Read user library
- [ ] Handle no-active-device state

---

# YouTube

- [ ] Search YouTube
- [ ] Embedded player
- [ ] Play video
- [x] Pause
- [x] Resume
- [ ] Seek
- [x] Volume
- [ ] Fullscreen
- [ ] Queue videos
- [ ] Read video metadata
- [ ] Read channel metadata
- [ ] Read playlists
- [ ] Open videos externally
- [ ] Cast to supported device
- [ ] YouTube account OAuth
- [ ] Watch history support
- [ ] Subscription support

---

# YouTube Music

- [ ] Search songs
- [x] Search artists
- [x] Search albums
- [ ] Search playlists
- [ ] Start playback
- [ ] Queue songs
- [ ] Read current track
- [ ] Read library
- [ ] Read liked songs
- [ ] Playlist support
- [ ] Account authentication

---

# SoundCloud

- [ ] Search SoundCloud
- [ ] Play tracks
- [ ] Pause
- [ ] Resume
- [ ] Queue
- [ ] Search artists
- [ ] Search playlists
- [ ] Read likes
- [ ] Account authentication where available
- [ ] Open track externally

---

# Jellyfin

- [x] Add Jellyfin server URL
- [x] Add API token
- [ ] Add username/password pairing
- [ ] Browse media
- [x] Search movies
- [x] Search shows
- [x] Search music
- [ ] Play media
- [ ] Pause
- [ ] Resume
- [x] Stop playback
- [ ] Select playback device
- [ ] Continue watching
- [ ] Recently added
- [ ] User profiles
- [ ] Library status
- [x] Server health check foundation

---

# Plex

- [x] Plex authentication
- [ ] Discover Plex servers
- [x] Browse libraries
- [x] Search media
- [ ] Play media
- [ ] Pause
- [ ] Resume
- [ ] Stop
- [ ] Choose player
- [ ] Continue watching
- [ ] Recently added
- [ ] Plex account support

---

# Kodi

- [x] Add Kodi JSON-RPC endpoint
- [x] Authentication
- [ ] Play
- [ ] Pause
- [ ] Resume
- [ ] Stop
- [ ] Navigation controls
- [ ] Volume
- [ ] Search library
- [ ] Open media
- [ ] Read now playing
- [x] Device discovery foundation

---

# Chromecast / Google Cast

- [ ] Device discovery
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

- [ ] Discover DLNA devices
- [ ] Discover media renderers
- [ ] Discover media servers
- [ ] Browse media
- [ ] Play media
- [ ] Pause
- [ ] Stop
- [ ] Volume
- [ ] Read playback state

---

# Internet Radio

- [x] Search stations
- [ ] Save favourites
- [ ] Play stream URL
- [x] Station metadata
- [ ] Current track metadata
- [ ] Country filtering
- [ ] Genre filtering
- [ ] Custom stream URL support

---

# Local Music

- [x] Scan local music folders
- [x] Read metadata
- [ ] Album art
- [ ] Search artists
- [ ] Search albums
- [x] Search tracks
- [ ] Create local playlists
- [ ] Shuffle
- [ ] Repeat
- [ ] Queue
- [ ] Multi-room playback

---

# Discord

- [ ] Discord OAuth
- [x] Read current user
- [x] Read server list
- [x] Read channels
- [x] Read recent messages
- [ ] Search messages
- [x] Send message
- [ ] Reply to message
- [ ] Read DMs
- [ ] Send DM
- [ ] Read mentions
- [ ] Notification summary
- [ ] Voice-channel presence where supported
- [ ] Approval before sending
- [x] Bot-token mode
- [ ] User OAuth mode

---

# GitHub

- [x] GitHub OAuth / PAT support
- [x] List repositories
- [ ] Search repositories
- [x] Read repository
- [ ] Clone repository
- [ ] Pull repository
- [x] Read issues
- [x] Create issue
- [ ] Update issue
- [ ] Comment on issue
- [x] Read pull requests
- [ ] Create pull request
- [ ] Review pull request
- [x] Read Actions runs
- [ ] Read build logs
- [ ] Re-run workflow
- [ ] Read releases
- [ ] Create release
- [ ] Read branches
- [ ] Create branch
- [ ] Commit files
- [ ] Push changes
- [ ] Permission confirmations for write actions

---

# Home Assistant

- [x] Add Home Assistant URL
- [x] Add long-lived access token
- [ ] Connection test
- [x] Read entities
- [ ] Read devices
- [ ] Read areas
- [x] Turn entity on/off
- [ ] Set brightness
- [ ] Set colour
- [ ] Set temperature
- [ ] Read sensors
- [ ] Run scripts
- [ ] Run scenes
- [ ] Run automations
- [ ] Read automation state
- [x] Trigger service calls
- [ ] Subscribe to state changes
- [ ] Presence integration
- [ ] Alarm panel support
- [ ] Media player support
- [ ] Dashboard device grouping

---

# MQTT

- [x] Add MQTT broker settings
- [x] Username/password
- [ ] TLS
- [x] Subscribe topics
- [x] Publish topics
- [x] Retained messages
- [x] QoS support
- [ ] Topic browser
- [ ] Device auto-discovery
- [ ] Home Assistant MQTT discovery
- [x] Trigger Jarvis routine from MQTT
- [ ] Publish Jarvis state to MQTT
- [ ] Publish voice assistant events
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
- [ ] List rooms
- [ ] List lights
- [ ] Turn lights on/off
- [ ] Brightness
- [ ] Colour
- [ ] Colour temperature
- [ ] Scenes
- [ ] Groups
- [ ] Entertainment zones
- [ ] Local LAN control

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

- [ ] HTTP control
- [ ] MQTT control
- [ ] Device discovery
- [ ] Power control
- [ ] Sensor values
- [ ] Energy values
- [ ] Device information
- [ ] Rules support
- [ ] Local-only support

---

# Shelly

- [ ] Shelly discovery
- [ ] Gen1 support
- [ ] Gen2+ RPC support
- [ ] Switch control
- [ ] Relay control
- [ ] Sensor reading
- [ ] Energy monitoring
- [ ] Device information
- [ ] Local network control

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

- [ ] Device discovery
- [ ] Pairing
- [ ] ADB support
- [ ] Open app
- [ ] Media controls
- [ ] Volume
- [ ] Input navigation
- [ ] Text input
- [ ] Read current app

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
- [ ] Window manager
- [x] Mouse control
- [x] Keyboard control
- [x] Clipboard
- [x] Screenshots
- [ ] Audio volume
- [ ] Per-app audio control
- [ ] PowerShell
- [ ] CMD
- [ ] Services
- [ ] Task Scheduler
- [ ] Notifications
- [ ] Battery
- [ ] CPU
- [ ] RAM
- [ ] GPU
- [ ] Disk
- [ ] Network
- [ ] Wi-Fi
- [ ] Bluetooth
- [ ] Shutdown
- [ ] Restart
- [ ] Sleep
- [ ] Lock
- [ ] Wake-on-LAN sender
- [ ] Windows startup support
- [ ] Tray integration

---

# Linux Integration

- [ ] Application launcher
- [ ] Process manager
- [ ] Window manager
- [ ] X11 input support
- [ ] Wayland support
- [ ] Clipboard
- [ ] Screenshots
- [ ] PipeWire audio
- [ ] PulseAudio fallback
- [ ] Shell commands
- [ ] systemd services
- [ ] Notifications
- [ ] CPU
- [ ] RAM
- [ ] GPU
- [ ] Disk
- [ ] Network
- [ ] Wi-Fi
- [ ] Bluetooth
- [ ] Shutdown
- [ ] Restart
- [ ] Sleep
- [ ] Lock
- [ ] Wake-on-LAN
- [ ] Autostart support
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
- [ ] Application launcher
- [ ] Accessibility permission guide
- [ ] Keyboard control
- [ ] Mouse control
- [ ] Screenshots
- [ ] Clipboard
- [ ] AppleScript support
- [ ] Shell support
- [ ] Notifications
- [ ] Audio control
- [ ] CPU / RAM / disk
- [ ] Battery
- [ ] Network
- [ ] Shutdown / restart / sleep
- [ ] Manual build documentation
- [ ] Code signing documentation
- [ ] Notarisation documentation
- [ ] Test on Intel Mac
- [ ] Test on Apple Silicon Mac

---

# Android

- [x] Flutter Android app scaffold
- [ ] Microphone permission
- [ ] Notifications permission
- [ ] Wake-word foreground service
- [ ] STT
- [ ] TTS
- [ ] Push-to-talk
- [x] Assistant chat
- [ ] Smart-home control
- [x] Device status foundation
- [ ] Battery status
- [ ] Network status
- [ ] Notification reading
- [ ] Notification actions where allowed
- [ ] Wake-on-LAN
- [ ] Remote PC control
- [ ] Media remote
- [ ] Presence detection
- [ ] Background service
- [ ] Bluetooth device support
- [ ] Local alarms
- [ ] Local timers
- [ ] Deep links
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
- [ ] Remove container
- [ ] Remove image
- [x] Docker Compose support
- [ ] List Compose stacks
- [x] Start stack
- [x] Stop stack
- [x] Restart stack
- [x] Update stack foundation
- [ ] Confirmation for destructive commands
- [ ] Remote Docker support

---

# SSH

- [x] SSH connection manager
- [x] Password auth
- [x] SSH key auth
- [ ] Agent support
- [ ] Host key verification
- [x] Saved hosts
- [x] Run command
- [ ] Stream output
- [ ] Upload file
- [ ] Download file
- [ ] SFTP browser
- [ ] Remote service control
- [ ] Remote logs
- [x] Permission prompts
- [ ] Secure credential storage

---

# Remote Jarvis Agents

- [x] Agent pairing
- [x] Device identity
- [ ] TLS
- [ ] Mutual authentication
- [x] Windows agent foundation
- [x] Linux agent foundation
- [x] Raspberry Pi agent foundation
- [x] macOS agent foundation
- [x] Heartbeat
- [x] Device online/offline state foundation
- [x] Remote commands
- [ ] Remote screenshots
- [x] Remote system stats
- [ ] Remote notifications
- [ ] Remote file transfer
- [x] Remote app launching
- [ ] Remote power actions
- [ ] Per-device permissions
- [x] Device revoke
- [x] Audit log

---

# Notifications

- [ ] Windows notifications
- [ ] Linux notifications
- [ ] macOS notifications
- [ ] Android notifications
- [ ] Future iOS notifications
- [ ] Email notifications
- [ ] GitHub notifications
- [ ] Discord notifications
- [x] Smart-home notifications foundation
- [ ] System alerts
- [ ] Server alerts
- [x] Jarvis notification summary foundation
- [ ] Priority filtering
- [ ] Quiet hours
- [ ] Read aloud option

---

# Weather

- [x] Weather provider interface
- [x] Current conditions
- [ ] Hourly forecast
- [ ] Daily forecast
- [ ] Rain probability
- [x] Temperature
- [x] Feels-like temperature
- [ ] Wind
- [ ] Sunrise
- [ ] Sunset
- [ ] Weather alerts
- [ ] Multiple saved locations
- [ ] Home location setting
- [ ] Unit preference

---

# News

- [ ] General news search
- [ ] Technology news
- [ ] Gaming news
- [ ] Local news
- [ ] Custom topics
- [ ] Daily briefing
- [ ] Source citations
- [ ] Avoid duplicate stories
- [ ] Read-aloud mode
- [ ] User-defined blocked sources
- [ ] User-defined favourite sources

---

# Maps / Directions

- [ ] Location provider interface
- [x] Search places
- [ ] Get directions
- [ ] Travel time
- [ ] Distance
- [ ] Saved locations
- [ ] Home
- [ ] Work / college custom location
- [ ] Open route externally
- [ ] Future Android navigation integration

---

# Alarms

- [ ] Local alarm database
- [x] One-time alarms
- [ ] Recurring alarms
- [ ] Weekday alarms
- [ ] Named alarms
- [ ] Custom alarm sounds
- [ ] TTS alarm
- [ ] Snooze
- [ ] Dismiss
- [ ] Cross-device sync
- [ ] Offline operation

---

# Timers

- [x] Multiple timers
- [x] Named timers
- [x] Pause timer
- [x] Resume timer
- [ ] Add time
- [ ] Remove time
- [x] Cancel timer
- [ ] Timer notifications
- [ ] Timer TTS
- [ ] Cross-device sync
- [ ] Offline operation

---

# Reminders

- [x] Time reminder
- [x] Date reminder
- [x] Recurring reminder
- [ ] Device-state reminder
- [ ] Presence reminder
- [ ] Location reminder
- [ ] Reminder priority
- [ ] Read reminder aloud
- [ ] Snooze
- [ ] Complete
- [ ] Cross-device sync

---

# Notes

- [x] Create note
- [ ] Edit note
- [x] Delete note
- [ ] Search notes
- [ ] Tag notes
- [ ] Pin notes
- [ ] Voice-created notes
- [ ] Markdown support
- [ ] Sync between devices
- [ ] Export notes

---

# Lists

- [x] Shopping list
- [x] Todo list
- [x] Custom lists
- [x] Add item
- [ ] Remove item
- [x] Check item
- [x] Clear checked
- [ ] Read list aloud
- [ ] Share list
- [ ] Cross-device sync

---

# Routines

- [x] Routine editor
- [x] Voice trigger
- [x] Time trigger
- [ ] Device trigger
- [ ] Presence trigger
- [x] Webhook trigger
- [x] MQTT trigger
- [x] Multiple actions
- [x] Delays
- [x] Conditions
- [ ] Branching
- [x] Enable / disable
- [x] Manual run
- [ ] Routine logs
- [ ] Import / export routines

---

# IF / THEN Automation Engine

- [x] Trigger system
- [x] Condition system
- [x] Action system
- [ ] AND conditions
- [ ] OR conditions
- [ ] NOT conditions
- [ ] Time windows
- [ ] Device state
- [ ] Network state
- [ ] Presence
- [ ] Weather
- [ ] Calendar
- [ ] Email
- [x] Webhooks
- [ ] MQTT
- [ ] System state
- [ ] AI condition
- [ ] Cooldown
- [x] Loop prevention

---

# Multi-Room Audio

- [ ] Discover Jarvis speakers
- [ ] Speaker groups
- [ ] Room names
- [ ] Play to one room
- [ ] Play to multiple rooms
- [ ] Whole-home playback
- [ ] Volume per room
- [ ] Group volume
- [ ] Playback sync research
- [ ] Local audio streaming
- [ ] Internet radio
- [ ] Spotify handoff
- [ ] Announcement ducking

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

- [ ] Announce to one room
- [ ] Announce to multiple rooms
- [ ] Announce everywhere
- [ ] TTS announcements
- [ ] Chime sound
- [ ] Volume ducking
- [ ] Scheduled announcement
- [ ] Routine announcement
- [ ] Emergency announcement mode

---

# Device Discovery

- [ ] mDNS
- [ ] SSDP
- [ ] UPnP
- [ ] MQTT discovery
- [ ] Home Assistant discovery
- [ ] Jarvis agent discovery
- [ ] Chromecast discovery
- [ ] DLNA discovery
- [ ] Hue bridge discovery
- [ ] Shelly discovery
- [ ] Manual device add
- [ ] Device naming
- [ ] Room assignment
- [ ] Device icons
- [ ] Device online/offline state

---

# Wake-on-LAN

- [x] Add device MAC address
- [x] Add broadcast address
- [x] Send magic packet
- [ ] Android sender
- [ ] Windows sender
- [ ] Linux sender
- [ ] Raspberry Pi sender
- [ ] Device online detection
- [ ] Optional automatic app launch after wake

---

# File Integrations

## PDF

- [x] Create PDF
- [ ] Read PDF
- [ ] Search PDF
- [ ] Summarise PDF
- [ ] Add images
- [ ] Add tables
- [ ] Export PDF

## DOCX

- [x] Create DOCX
- [ ] Read DOCX
- [ ] Edit DOCX
- [ ] Search DOCX
- [ ] Add headings
- [ ] Add tables
- [ ] Add images

## XLSX

- [x] Create XLSX
- [ ] Read XLSX
- [ ] Edit cells
- [ ] Formulas
- [ ] Tables
- [ ] Charts
- [ ] Multiple sheets

## PPTX

- [x] Create PPTX
- [ ] Read PPTX
- [ ] Edit PPTX
- [ ] Add slides
- [ ] Add images
- [ ] Add charts
- [ ] Apply themes

## General Files

- [x] TXT
- [ ] Markdown
- [x] JSON
- [ ] CSV
- [ ] HTML
- [ ] ZIP
- [x] File search
- [ ] Folder search
- [ ] Rename
- [ ] Move
- [ ] Copy
- [ ] Delete with confirmation
- [ ] File watcher

---

# System Monitoring

- [x] CPU usage
- [x] CPU temperature
- [x] RAM usage
- [x] GPU usage
- [x] GPU VRAM
- [x] GPU temperature
- [x] Disk usage
- [ ] Disk health
- [x] Network upload
- [x] Network download
- [x] Wi-Fi information
- [ ] Battery
- [x] Running processes
- [ ] Running services
- [ ] Docker stats
- [x] Uptime
- [ ] Alerts
- [ ] History graphs

---

# Home Presence

- [ ] Phone Wi-Fi presence
- [ ] Bluetooth presence
- [ ] Home Assistant presence
- [ ] Device ping
- [ ] Router integration option
- [ ] Home / Away state
- [ ] Per-user presence
- [ ] Presence-triggered routines
- [ ] Privacy controls

---

# Authentication / Security

- [ ] Local user accounts
- [ ] Device pairing code
- [ ] QR pairing
- [ ] TLS
- [ ] Secure WebSocket
- [ ] Refresh tokens
- [ ] Session expiry
- [ ] Device revoke
- [ ] Integration revoke
- [ ] Secret encryption
- [ ] OS keychain support
- [ ] Android secure storage
- [ ] macOS Keychain
- [ ] Future iOS Keychain
- [ ] Audit logs
- [ ] Emergency disable
- [ ] Local-only mode
- [ ] LAN-only remote control
- [ ] Permission profiles

---

# Recommended Integration Order

## Stage 1

- [ ] Ollama
- [ ] sherpa-onnx
- [ ] Piper
- [ ] Windows
- [ ] Linux
- [ ] Local files
- [ ] System monitoring
- [ ] Timers
- [ ] Alarms
- [ ] Notes
- [ ] Lists

## Stage 2

- [ ] Playwright
- [ ] SearXNG
- [ ] Spotify
- [ ] YouTube
- [ ] Home Assistant
- [ ] MQTT
- [ ] Docker
- [ ] SSH

## Stage 3

- [ ] Gmail
- [ ] Google Calendar
- [ ] Google Drive
- [ ] GitHub
- [ ] Discord
- [ ] Android

## Stage 4

- [ ] Raspberry Pi satellite
- [ ] Remote Jarvis agents
- [ ] Multi-room audio
- [ ] Intercom
- [ ] Announcements
- [ ] Device discovery

## Stage 5

- [ ] Matter
- [ ] Hue
- [ ] Tuya
- [ ] Tasmota
- [ ] Shelly
- [ ] Chromecast
- [ ] DLNA
- [ ] Jellyfin
- [ ] Plex
- [ ] Kodi

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
