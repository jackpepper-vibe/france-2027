"""Record the phrasebook audio: one MP3 per phrase in src/phrases.json.

Uses Microsoft's neural French voices through edge-tts, so every phone plays the same
female voice (browsers can't be asked for a female voice, and iOS defaults to a male
one) and the clips work offline. Writes:

    public/audio/phrases/<hash>.mp3   one clip per phrase; the hash covers voice, rate and
                                      text, so changing any of them busts the cache
    src/phrases.audio.json            French text -> clip URL, read by src/speech.ts

Clips no longer referenced are deleted. Unchanged phrases are not re-recorded.

    pip install edge-tts
    python tools/speech/phrases.py
"""
from __future__ import annotations

import asyncio
import hashlib
import json
from pathlib import Path

import edge_tts

VOICE = 'fr-FR-EloiseNeural'   # a young girl's voice; fr-FR-DeniseNeural is an adult woman
RATE = '-10%'                  # a touch slower than conversational, easier to copy

ROOT = Path(__file__).resolve().parents[2]
PHRASES = ROOT / 'src' / 'phrases.json'
MANIFEST = ROOT / 'src' / 'phrases.audio.json'
AUDIO_DIR = ROOT / 'public' / 'audio' / 'phrases'
URL_PREFIX = '/audio/phrases/'


def clip_name(text: str) -> str:
    digest = hashlib.sha1(f'{VOICE}|{RATE}|{text}'.encode('utf-8')).hexdigest()[:12]
    return f'{digest}.mp3'


async def record(text: str, path: Path) -> None:
    tmp = path.with_suffix('.part')
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(tmp))
    if tmp.stat().st_size < 1000:
        tmp.unlink()
        raise SystemExit(f'recording "{text}" came back empty')
    tmp.replace(path)


async def main() -> None:
    texts = [p['fr'] for p in json.loads(PHRASES.read_text(encoding='utf-8'))]
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    for text in texts:
        name = clip_name(text)
        path = AUDIO_DIR / name
        if path.exists():
            print(f'  kept      {text}')
        else:
            await record(text, path)
            print(f'  recorded  {text}  ({path.stat().st_size // 1024} KB)')
        manifest[text] = URL_PREFIX + name

    keep = {Path(u).name for u in manifest.values()}
    for old in AUDIO_DIR.glob('*.mp3'):
        if old.name not in keep:
            old.unlink()
            print(f'  removed   {old.name}')

    MANIFEST.write_text(json.dumps({'voice': VOICE, 'clips': manifest}, ensure_ascii=False, indent=2) + '\n',
                        encoding='utf-8', newline='\n')
    print(f'{len(manifest)} clips, voice {VOICE}')


if __name__ == '__main__':
    asyncio.run(main())
