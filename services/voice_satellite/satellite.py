#!/usr/bin/env python3
"""
NekoSune Jarvis lightweight voice satellite.

CPU-oriented pipeline:
  microphone -> sherpa-onnx keyword spotter -> Silero VAD -> SenseVoice -> Jarvis Core

Models are not bundled. Pass local model paths on the command line.
"""

from __future__ import annotations

import argparse
import json
import queue
import sys
import time
from pathlib import Path

import numpy as np
import requests
import sherpa_onnx
import sounddevice as sd

SAMPLE_RATE = 16000
SAMPLES_PER_READ = int(0.1 * SAMPLE_RATE)


def existing_file(value: str) -> str:
    path = Path(value)
    if not path.is_file():
        raise argparse.ArgumentTypeError(f"File does not exist: {value}")
    return str(path)


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--core-url", default="http://127.0.0.1:3000")
    parser.add_argument("--device", type=int, default=None)
    parser.add_argument("--num-threads", type=int, default=2)

    parser.add_argument("--kws-tokens", type=existing_file, required=True)
    parser.add_argument("--kws-encoder", type=existing_file, required=True)
    parser.add_argument("--kws-decoder", type=existing_file, required=True)
    parser.add_argument("--kws-joiner", type=existing_file, required=True)
    parser.add_argument("--keywords-file", type=existing_file, required=True)
    parser.add_argument("--keywords-score", type=float, default=1.0)
    parser.add_argument("--keywords-threshold", type=float, default=0.25)

    parser.add_argument("--vad-model", type=existing_file, required=True)
    parser.add_argument("--asr-model", type=existing_file, required=True)
    parser.add_argument("--asr-tokens", type=existing_file, required=True)
    parser.add_argument("--language", default="en")
    return parser.parse_args()


def post(core_url: str, path: str, body: dict) -> dict | None:
    url = core_url.rstrip("/") + path
    try:
        response = requests.post(url, json=body, timeout=90)
        response.raise_for_status()
        if not response.content:
            return None
        return response.json()
    except Exception as exc:
        print(json.dumps({"type": "core.error", "error": str(exc)}), flush=True)
        return None


def create_keyword_spotter(cfg: argparse.Namespace):
    return sherpa_onnx.KeywordSpotter(
        tokens=cfg.kws_tokens,
        encoder=cfg.kws_encoder,
        decoder=cfg.kws_decoder,
        joiner=cfg.kws_joiner,
        num_threads=cfg.num_threads,
        max_active_paths=4,
        keywords_file=cfg.keywords_file,
        keywords_score=cfg.keywords_score,
        keywords_threshold=cfg.keywords_threshold,
        num_trailing_blanks=1,
        provider="cpu",
    )


def create_vad(cfg: argparse.Namespace):
    vad_config = sherpa_onnx.VadModelConfig()
    vad_config.silero_vad.model = cfg.vad_model
    vad_config.silero_vad.threshold = 0.5
    vad_config.silero_vad.min_silence_duration = 0.35
    vad_config.silero_vad.min_speech_duration = 0.2
    vad_config.silero_vad.max_speech_duration = 20
    vad_config.sample_rate = SAMPLE_RATE
    return sherpa_onnx.VoiceActivityDetector(
        vad_config,
        buffer_size_in_seconds=30,
    )


def create_recognizer(cfg: argparse.Namespace):
    return sherpa_onnx.OfflineRecognizer.from_sense_voice(
        model=cfg.asr_model,
        tokens=cfg.asr_tokens,
        num_threads=cfg.num_threads,
        provider="cpu",
        language=cfg.language,
        use_itn=True,
        debug=False,
    )


def transcribe(recognizer, samples: np.ndarray) -> str:
    stream = recognizer.create_stream()
    stream.accept_waveform(SAMPLE_RATE, samples)
    recognizer.decode_stream(stream)
    return stream.result.text.strip()


def main() -> int:
    cfg = args()

    if cfg.device is not None:
        sd.default.device[0] = cfg.device

    devices = sd.query_devices()
    if not len(devices):
        print("No microphone devices found", file=sys.stderr)
        return 2

    kws = create_keyword_spotter(cfg)
    vad = create_vad(cfg)
    recognizer = create_recognizer(cfg)
    kws_stream = kws.create_stream()

    state = "wake"
    last_wake = 0.0

    print(
        json.dumps(
            {
                "type": "satellite.ready",
                "sampleRate": SAMPLE_RATE,
                "device": sd.default.device[0],
                "mode": "cpu",
            }
        ),
        flush=True,
    )

    with sd.InputStream(
        channels=1,
        dtype="float32",
        samplerate=SAMPLE_RATE,
        device=cfg.device,
    ) as microphone:
        while True:
            samples, _ = microphone.read(SAMPLES_PER_READ)
            samples = np.copy(samples.reshape(-1))

            if state == "wake":
                kws_stream.accept_waveform(SAMPLE_RATE, samples)

                while kws.is_ready(kws_stream):
                    kws.decode_stream(kws_stream)

                keyword = kws.get_result(kws_stream)
                if keyword:
                    kws.reset_stream(kws_stream)
                    last_wake = time.time()
                    state = "command"
                    print(
                        json.dumps({"type": "wake", "keyword": keyword}),
                        flush=True,
                    )
                    post(
                        cfg.core_url,
                        "/api/v1/satellite/wake",
                        {"keyword": keyword},
                    )
                continue

            vad.accept_waveform(samples)

            if time.time() - last_wake > 12 and vad.empty():
                state = "wake"
                kws_stream = kws.create_stream()
                post(
                    cfg.core_url,
                    "/api/v1/satellite/state",
                    {"state": "idle"},
                )
                continue

            while not vad.empty():
                segment = np.asarray(vad.front.samples, dtype=np.float32)
                vad.pop()

                text = transcribe(recognizer, segment)
                if not text:
                    continue

                print(
                    json.dumps({"type": "transcript", "text": text}),
                    flush=True,
                )

                result = post(
                    cfg.core_url,
                    "/api/v1/satellite/transcript",
                    {"text": text, "respond": True},
                )

                if result:
                    print(
                        json.dumps(
                            {
                                "type": "assistant.reply",
                                "text": result.get("reply", ""),
                            }
                        ),
                        flush=True,
                    )

                state = "wake"
                kws_stream = kws.create_stream()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print(json.dumps({"type": "satellite.stopped"}), flush=True)
