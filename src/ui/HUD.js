import { Crosshair } from './Crosshair.js';

export class HUD {
  constructor(container) {
    this.container = container;
    this.crosshair = new Crosshair(this.container);
    this.blocker = null;

    this.initOverlay();
    this.initGameHUD();
  }

  initOverlay() {
    this.blocker = document.createElement('div');
    this.blocker.id = 'instructions-blocker';
    this.blocker.className = 'interactive';
    this.blocker.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(13, 15, 18, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 100;
      transition: opacity 0.2s ease;
    `;

    this.blocker.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 30px; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; background: rgba(20, 24, 30, 0.85); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <h1 style="font-size: 2.2rem; margin-bottom: 12px; color: #f6ad55; letter-spacing: 2px;">3D 區網對戰射擊</h1>
        <p style="font-size: 1.1rem; margin-bottom: 24px; color: #a0aec0;">點擊任意處鎖定滑鼠進入戰鬥</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left; font-size: 0.9rem; color: #cbd5e0; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;">
          <div><b style="color: #63b3ed;">[W / A / S / D]</b> 移動</div>
          <div><b style="color: #63b3ed;">[空白鍵 Space]</b> 跳躍</div>
          <div><b style="color: #63b3ed;">[Shift]</b> 靜音慢走</div>
          <div><b style="color: #63b3ed;">[Ctrl / C]</b> 蹲下</div>
          <div><b style="color: #63b3ed;">[滑鼠移動]</b> 轉動視角</div>
          <div><b style="color: #63b3ed;">[ESC]</b> 釋放滑鼠</div>
        </div>
        <div style="margin-top: 20px; font-size: 0.8rem; color: #718096;">
          純區網 WebRTC 閉環架構 • 極限 1~3ms 延遲
        </div>
      </div>
    `;

    this.container.appendChild(this.blocker);
  }

  initGameHUD() {
    this.hudWrap = document.createElement('div');
    this.hudWrap.id = 'in-game-hud';
    this.hudWrap.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: none;
    `;

    // 左下角血量與護甲
    const statusPanel = document.createElement('div');
    statusPanel.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 30px;
      display: flex;
      gap: 20px;
      font-family: monospace;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 0 4px rgba(0,0,0,0.8);
    `;
    statusPanel.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #e53e3e;">
        <span style="font-size: 16px; opacity: 0.8;">HP</span>
        <span id="hud-hp">100</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; color: #3182ce;">
        <span style="font-size: 16px; opacity: 0.8;">ARMOR</span>
        <span id="hud-armor">100</span>
      </div>
    `;
    this.hudWrap.appendChild(statusPanel);

    // 右下角彈藥數
    const ammoPanel = document.createElement('div');
    ammoPanel.style.cssText = `
      position: absolute;
      bottom: 24px;
      right: 30px;
      font-family: monospace;
      font-size: 28px;
      font-weight: bold;
      color: #ecc94b;
      text-shadow: 0 0 4px rgba(0,0,0,0.8);
    `;
    ammoPanel.innerHTML = `
      <span id="hud-ammo-clip">30</span>
      <span style="font-size: 18px; opacity: 0.7;"> / </span>
      <span id="hud-ammo-reserve" style="font-size: 20px; opacity: 0.8;">90</span>
    `;
    this.hudWrap.appendChild(ammoPanel);

    this.container.appendChild(this.hudWrap);
  }

  setLocked(isLocked) {
    if (isLocked) {
      this.blocker.style.display = 'none';
      this.hudWrap.style.display = 'block';
      this.crosshair.show(true);
    } else {
      this.blocker.style.display = 'flex';
      this.crosshair.show(false);
    }
  }

  updateSpread(speed) {
    // 依據速度微調準星寬度
    const baseSpread = 8;
    const dynamicSpread = baseSpread + speed * 1.5;
    this.crosshair.setSpread(dynamicSpread);
  }
}
