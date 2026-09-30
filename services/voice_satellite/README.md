# Voice Satellite

CPU-oriented microphone satellite for NekoSune Jarvis.

It uses sherpa-onnx for:

- Open-vocabulary keyword spotting
- Silero VAD
- SenseVoice speech recognition
- CPU inference

No GPU is required.

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows:

```powershell
.venv\Scripts\activate
pip install -r requirements.txt
```

You need local sherpa-onnx model files for keyword spotting, Silero VAD, and SenseVoice.

Example:

```bash
python satellite.py \
  --core-url http://127.0.0.1:3000 \
  --kws-tokens models/kws/tokens.txt \
  --kws-encoder models/kws/encoder.onnx \
  --kws-decoder models/kws/decoder.onnx \
  --kws-joiner models/kws/joiner.onnx \
  --keywords-file models/kws/keywords.txt \
  --vad-model models/silero_vad.onnx \
  --asr-model models/sensevoice/model.int8.onnx \
  --asr-tokens models/sensevoice/tokens.txt
```

A Raspberry Pi deployment should prefer INT8 models and 1-2 CPU threads.
