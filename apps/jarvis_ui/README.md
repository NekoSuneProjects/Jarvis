# NekoSune Jarvis Flutter UI

Cross-platform HUD client for the Jarvis Core.

## Run

Start the backend first:

```bash
npm install
npm run dev
```

Then run Flutter:

```bash
cd apps/jarvis_ui
flutter pub get
flutter run
```

To use another core URL:

```bash
flutter run --dart-define=JARVIS_BASE_URL=http://192.168.1.100:3000
```

For an Android emulator, the host machine is commonly reachable through:

```bash
flutter run --dart-define=JARVIS_BASE_URL=http://10.0.2.2:3000
```

Current UI:

- Animated Jarvis orb
- Chat
- Health status
- Integration state
- Timers
- Alarms
- Reminders
- WebSocket events
- Responsive desktop/mobile layout
