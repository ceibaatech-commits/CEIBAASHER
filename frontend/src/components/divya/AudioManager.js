class AudioManager {
  constructor() {
    this.ctx = null;
    this.currentSource = null;
    this.currentAudio = null;
    this.onStart = null;
    this.onEnd = null;
  }

  // Must be called from a user gesture (click handler)
  warmUp() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  async play(base64Audio, onStart, onEnd) {
    this.stop();
    this.onStart = onStart;
    this.onEnd = onEnd;

    // Decode base64 to bytes
    const raw = atob(base64Audio);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const blobUrl = URL.createObjectURL(blob);

    // Strategy 1: AudioContext + MediaElementSource (most reliable for autoplay)
    if (this.ctx && this.ctx.state === 'running') {
      try {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = blobUrl;
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.ctx.destination);
        this.currentAudio = audio;

        audio.onended = () => { this._cleanup(blobUrl); };
        audio.onerror = () => { this._cleanup(blobUrl); };

        this.onStart?.();
        await audio.play();
        return true;
      } catch (e) {
        console.warn('AudioContext MediaElement play failed:', e);
      }
    }

    // Strategy 2: Plain Audio element (works if user recently interacted)
    try {
      const audio = new Audio(blobUrl);
      this.currentAudio = audio;
      audio.onended = () => { this._cleanup(blobUrl); };
      audio.onerror = () => { this._cleanup(blobUrl); };
      this.onStart?.();
      await audio.play();
      return true;
    } catch (e) {
      console.warn('Direct Audio.play failed:', e);
      URL.revokeObjectURL(blobUrl);
      this._cleanup(null);
      return false;
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio = null;
    }
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch {}
      this.currentSource = null;
    }
    this.onEnd?.();
  }

  _cleanup(blobUrl) {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    this.currentAudio = null;
    this.currentSource = null;
    this.onEnd?.();
  }
}

// Export singleton audio manager
export const audioMgr = new AudioManager();
