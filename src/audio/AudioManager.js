export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isUnlocked = false;

    // 當使用者首次點擊畫面時自動解鎖 AudioContext (遵守瀏覽器 Autoplay 政策)
    const unlock = () => {
      this.init();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isUnlocked = true;
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * 播放武器開火音效 (AK-47 / Deagle)
   */
  playGunshot(weaponId = 'ak47') {
    this.ensureContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    if (weaponId === 'ak47') {
      // AK-47: 渾厚低頻底音 + 金屬槍機撞擊 + 高頻槍口爆音
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);
      oscGain.gain.setValueAtTime(0.7, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      this.playNoiseBlast(0.18, 1200, 0.55);
    } else if (weaponId === 'deagle') {
      // 沙漠之鷹: 重型低音猛擊 + 清脆槍口震鳴
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.22);
      oscGain.gain.setValueAtTime(0.9, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);

      this.playNoiseBlast(0.24, 1800, 0.7);
    }
  }

  /**
   * 播放白噪聲爆裂 (槍口爆風 / 炸裂)
   */
  playNoiseBlast(duration, filterFreq, volume = 0.5) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
  }

  /**
   * 播放小刀揮擊破空聲 (Knife Whoosh / Slash)
   */
  playKnifeSlash(isHeavy = false) {
    this.ensureContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const duration = isHeavy ? 0.28 : 0.16;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHeavy ? 1800 : 2600, t);
    filter.frequency.exponentialRampToValueAtTime(isHeavy ? 400 : 700, t + duration);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isHeavy ? 0.6 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
  }

  /**
   * 播放小刀擊中音效 (砍肉 flesh 或 砍牆 metal/stone)
   */
  playKnifeHit(isFlesh = true) {
    this.ensureContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    if (isFlesh) {
      // 割入皮肉：沉悶割裂聲
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      this.playNoiseBlast(0.1, 800, 0.4);
    } else {
      // 砍在牆面：金屬清脆火星碰撞敲擊聲
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2800, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  /**
   * 播放手榴彈金屬彈跳敲擊聲
   */
  playGrenadeBounce() {
    this.ensureContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750 + Math.random() * 150, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * 播放高爆手榴彈爆炸音效 (巨大轟鳴 + 重低音震波)
   */
  playExplosion() {
    this.ensureContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    // 1. 次重低音衝擊波
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);
    oscGain.gain.setValueAtTime(1.0, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.95);

    // 2. 漫長滾動爆炸轟鳴聲
    this.playNoiseBlast(1.2, 700, 0.9);
  }

  /**
   * 播放閃光彈爆閃音效 (清脆爆裂 + CS 經典 4kHz 高頻耳鳴聲)
   */
  playFlashbang(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    // 1. 爆裂聲
    this.playNoiseBlast(0.18, 3200, 0.85);

    // 2. 經典 CS 4000Hz 銳利持續耳鳴聲 (Tinnitus Ringing - 延長至 5.0 秒震撼體感)
    if (intensity > 0.2) {
      const ringOsc = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(4100, t);

      const duration = 5.2 * intensity;
      ringGain.gain.setValueAtTime(0.38 * intensity, t + 0.05);
      ringGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      ringOsc.connect(ringGain);
      ringGain.connect(ctx.destination);

      ringOsc.start(t);
      ringOsc.stop(t + duration + 0.1);
    }
  }

  /**
   * 播放煙霧彈噴發持續嘶嘶聲 (Smoke Hissing)
   */
  playSmokeHiss(duration = 14) {
    this.ensureContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    // 建立 4 秒連續高壓氣流噴發音
    const soundLen = Math.min(duration, 8);
    const bufferSize = Math.floor(ctx.sampleRate * soundLen);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + soundLen);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
  }
}
