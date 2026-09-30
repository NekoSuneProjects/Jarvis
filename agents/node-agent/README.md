# NekoSune Jarvis Node Agent

Lightweight remote device agent using only Node.js built-ins.

## First pairing

Configure the Jarvis Core:

```env
JARVIS_PAIRING_CODE=choose-a-long-random-pairing-code
```

Run the agent:

```bash
JARVIS_CORE_URL=http://192.168.1.10:3000 \
JARVIS_PAIRING_CODE=choose-a-long-random-pairing-code \
node agent.mjs
```

The returned device token is saved under `~/.nekosune-jarvis/agent.json`.

After pairing, the pairing code is no longer required by that device.

Current agent capability:

- Secure random bearer token
- Device ID
- Heartbeats
- CPU/memory/OS telemetry
- Windows/Linux/macOS/ARM support through Node.js
