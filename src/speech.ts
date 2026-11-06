// Phrasebook audio. Each phrase has a pre-recorded clip (tools/speech/phrases.py) so every
// phone plays the same voice, offline once cached. A phrase without a clip falls back to
// the device's own French text-to-speech.
import audio from './phrases.audio.json';

const CLIPS: Record<string, string> = audio.clips;
const LANG = 'fr-FR';
const RATE = 0.85;

type Listener = (playing: string | null) => void;

class FrenchSpeaker {
  private playing: string | null = null;
  private player: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private readonly tts = typeof window !== 'undefined' && 'speechSynthesis' in window;
  private prefetched = false;

  /** Whether `text` can be played at all on this device. */
  canSpeak(text: string): boolean { return text in CLIPS || this.tts; }

  /** Play `text`; tapping the phrase that's already playing stops it. */
  toggle(text: string): void {
    const wasPlaying = this.playing === text;
    this.stop();
    if (!wasPlaying) this.play(text);
  }

  onChange(fn: Listener): void { this.listeners.add(fn); }

  /** Fetch every clip once so the service worker caches them for offline use. */
  prefetch(): void {
    if (this.prefetched || !navigator.onLine) return;
    this.prefetched = true;
    for (const url of Object.values(CLIPS)) fetch(url, { priority: 'low' } as RequestInit).catch(() => { this.prefetched = false; });
  }

  private play(text: string): void {
    const url = CLIPS[text];
    this.setPlaying(text);
    if (url) {
      const a = (this.player ??= new Audio());
      a.src = url;
      a.onended = () => this.finished(text);
      // Clip unavailable (offline before it was cached): fall back to the device voice.
      // Both the error event and the play() rejection report the failure; act on the first.
      let fellBack = false;
      const fallBack = () => {
        if (fellBack || this.playing !== text) return;
        fellBack = true;
        this.speakWithDevice(text);
      };
      a.onerror = fallBack;
      a.play().catch(fallBack);
    } else {
      this.speakWithDevice(text);
    }
  }

  private speakWithDevice(text: string): void {
    if (!this.tts) { this.finished(text); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG;
    u.rate = RATE;
    u.onend = u.onerror = () => this.finished(text);
    speechSynthesis.speak(u);
  }

  private stop(): void {
    if (this.player) { this.player.onended = this.player.onerror = null; this.player.pause(); }
    if (this.tts) speechSynthesis.cancel();
    this.setPlaying(null);
  }

  private finished(text: string): void {
    if (this.playing === text) this.setPlaying(null);
  }

  private setPlaying(text: string | null): void {
    this.playing = text;
    this.listeners.forEach(fn => fn(text));
  }
}

export const speaker = new FrenchSpeaker();
