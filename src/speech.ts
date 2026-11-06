// French text-to-speech for the phrasebook, using the device's own voices (Web Speech API).
// No network needed once the phone has a French voice, which iOS and Android ship by default.

const LANG = 'fr-FR';
const RATE = 0.85;   // a little slower than conversational, so it's easier to copy

type Listener = (playing: string | null) => void;

class FrenchSpeaker {
  private voice: SpeechSynthesisVoice | null = null;
  private playing: string | null = null;
  private listeners = new Set<Listener>();
  readonly supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  constructor() {
    if (!this.supported) return;
    this.pickVoice();
    // Voices load asynchronously on most browsers.
    speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
  }

  /** Speak `text`; tapping the phrase that's already playing stops it. */
  toggle(text: string): void {
    if (!this.supported) return;
    const wasPlaying = this.playing === text;
    speechSynthesis.cancel();
    this.setPlaying(null);
    if (wasPlaying) return;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG;
    u.rate = RATE;
    if (this.voice) u.voice = this.voice;
    const finish = () => { if (this.playing === text) this.setPlaying(null); };
    u.addEventListener('end', finish);
    u.addEventListener('error', finish);
    this.setPlaying(text);
    speechSynthesis.speak(u);
  }

  onChange(fn: Listener): void { this.listeners.add(fn); }

  private setPlaying(text: string | null): void {
    this.playing = text;
    this.listeners.forEach(fn => fn(text));
  }

  /** Prefer an on-device France-French voice (works offline), then any French voice. */
  private pickVoice(): void {
    const voices = speechSynthesis.getVoices();
    const fr = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('fr'));
    this.voice =
      fr.find(v => v.lang.replace('_', '-') === LANG && v.localService) ??
      fr.find(v => v.lang.replace('_', '-') === LANG) ??
      fr[0] ?? null;
  }
}

export const speaker = new FrenchSpeaker();
