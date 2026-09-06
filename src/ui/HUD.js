import { Crosshair } from './Crosshair.js';
import { KillFeed } from './KillFeed.js';

export class HUD {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.onStartSinglePlayer = callbacks.onStartSinglePlayer || callbacks.onStart || null;
    this.onOpenMultiplayer = callbacks.onOpenMultiplayer || null;

    this.hasStarted = false;

    this.crosshair = new Crosshair(this.container);
    this.killFeed = new KillFeed(this.container);
    this.blocker = null;
    this.pauseOverlay = null;

    this.initOverlay();
    this.initPauseOverlay();
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
      background: rgba(10, 12, 16, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      transition: opacity 0.2s ease;
    `;

    this.blocker.innerHTML = `
      <div style="text-align: center; max-width: 580px; width: 90%; padding: 32px; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; background: rgba(22, 27, 34, 0.95); box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
        <div style="display: inline-block; padding: 4px 12px; background: rgba(246, 173, 85, 0.15); border-radius: 20px; font-size: 0.8rem; color: #f6ad55; font-weight: bold; margin-bottom: 12px; letter-spacing: 1px;">
          AIR-GAPPED 1~3MS LAN FPS
        </div>
        <h1 style="font-size: 2.3rem; margin-bottom: 8px; color: #ffffff; letter-spacing: 2px;">3D 競技對戰射擊</h1>
        <p style="font-size: 0.95rem; margin-bottom: 24px; color: #a0aec0;">安全基地已就緒，請選擇遊玩模式</p>

        <!-- 模式選擇按鈕群 -->
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
          <button id="btn-single-player" style="
            background: linear-gradient(135deg, #dd6b20, #ed8936);
            color: #ffffff;
            border: none;
            padding: 15px 24px;
            font-size: 1.15rem;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(237, 137, 54, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          ">
            <span>⚔️</span> 進入單人對戰模式（對抗 4 名電腦 Bot）
          </button>

          <button id="btn-multiplayer" style="
            background: rgba(49, 130, 206, 0.15);
            color: #63b3ed;
            border: 1px solid rgba(99, 179, 237, 0.5);
            padding: 13px 24px;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          ">
            <span>🌐</span> 區網多人對戰大廳（WebRTC 配對）
          </button>
        </div>

        <!-- 按鍵說明 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; font-size: 0.85rem; color: #cbd5e0; background: rgba(0,0,0,0.35); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div><b style="color: #63b3ed;">[W / A / S / D]</b> 移動與急停</div>
          <div><b style="color: #63b3ed;">[左鍵]</b> 開火 / 揮刀 / 投擲</div>
          <div><b style="color: #63b3ed;">[1 / 2 / 3]</b> 步槍 / 手槍 / 小刀</div>
          <div><b style="color: #63b3ed;">[右鍵]</b> 小刀重刺 (背刺致命)</div>
          <div><b style="color: #63b3ed;">[4 / 5 / 6]</b> 手榴彈 / 閃光彈 / 煙霧彈</div>
          <div><b style="color: #63b3ed;">[空白鍵 Space]</b> 跳躍</div>
          <div><b style="color: #63b3ed;">[Shift]</b> 慢走 / <b style="color: #63b3ed;">[Ctrl/C]</b> 蹲下壓槍</div>
          <div><b style="color: #63b3ed;">[R]</b> 裝填彈匣 / <b style="color: #63b3ed;">[ESC]</b> 暫停</div>
        </div>

        <div style="margin-top: 14px; font-size: 0.82rem; color: #48bb78; font-weight: bold; letter-spacing: 0.5px;">
          ✓ 最新版本 v0.3.5 • 戰術煙霧彈封煙、5.5s長效致盲、近戰背刺與擬真恐怖分子已就緒
        </div>
      </div>
    `;

    this.container.appendChild(this.blocker);

    // 綁定單人模式進入按鈕 (點擊立即隱藏選單，絕不等待卡住)
    const btnSingle = this.blocker.querySelector('#btn-single-player');
    if (btnSingle) {
      btnSingle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startGame();
      });
    }

    // 綁定多人對戰按鈕
    const btnMulti = this.blocker.querySelector('#btn-multiplayer');
    if (btnMulti) {
      btnMulti.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onOpenMultiplayer) {
          this.onOpenMultiplayer();
        } else {
          this.startGame();
        }
      });
    }

    // 點擊面板周圍空白處亦可直接開始遊戲
    this.blocker.addEventListener('click', () => {
      this.startGame();
    });
  }

  initPauseOverlay() {
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.id = 'pause-overlay';
    this.pauseOverlay.className = 'interactive';
    this.pauseOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 12, 16, 0.65);
      backdrop-filter: blur(4px);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 90;
      cursor: pointer;
    `;
    this.pauseOverlay.innerHTML = `
      <div style="text-align: center; padding: 24px 36px; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; background: rgba(22, 27, 34, 0.95); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <h2 style="font-size: 2rem; color: #f6ad55; margin-bottom: 8px;">⏸️ 遊戲暫停</h2>
        <p style="font-size: 1rem; color: #e2e8f0; margin-bottom: 20px;">點擊任意處鎖定滑鼠並繼續戰鬥</p>
        <button id="btn-resume" style="
          background: #ed8936;
          color: #ffffff;
          border: none;
          padding: 12px 30px;
          font-size: 1.1rem;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
        ">繼續戰鬥</button>
      </div>
    `;

    this.container.appendChild(this.pauseOverlay);

    // 點擊暫停面板立即恢復遊戲
    this.pauseOverlay.addEventListener('click', () => {
      this.resumeGame();
    });
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

    // 玩家受傷時邊緣泛紅特效 (Damage Vignette)
    this.damageVignette = document.createElement('div');
    this.damageVignette.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      box-shadow: inset 0 0 80px rgba(220, 38, 38, 0.85);
      opacity: 0;
      transition: opacity 0.1s ease;
      pointer-events: none;
    `;
    this.hudWrap.appendChild(this.damageVignette);

    // 閃光彈致盲全螢幕純白覆蓋層 (Flashbang Whiteout Overlay)
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.id = 'hud-flash-overlay';
    this.flashOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      opacity: 0;
      pointer-events: none;
      z-index: 85;
      transition: opacity 0.05s ease;
    `;
    this.hudWrap.appendChild(this.flashOverlay);

    // 身處煙霧彈內部全螢幕濃煙罩層 (Inside Smoke Overlay)
    this.smokeOverlay = document.createElement('div');
    this.smokeOverlay.id = 'hud-smoke-overlay';
    this.smokeOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(140, 150, 160, 0.9);
      backdrop-filter: blur(10px);
      opacity: 0;
      pointer-events: none;
      z-index: 82;
      transition: opacity 0.3s ease;
    `;
    this.hudWrap.appendChild(this.smokeOverlay);

    // 準星 Hitmarker (受擊命中 X 叉叉)
    this.hitmarker = document.createElement('div');
    this.hitmarker.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      width: 16px;
      height: 16px;
      border: 2px solid #fc8181;
      border-radius: 2px;
      display: none;
      pointer-events: none;
      box-shadow: 0 0 6px rgba(255, 0, 0, 0.6);
    `;
    this.hudWrap.appendChild(this.hitmarker);

    // 左上角目前模式標籤
    const modeBadge = document.createElement('div');
    modeBadge.id = 'hud-mode-badge';
    modeBadge.style.cssText = `
      position: absolute;
      top: 20px;
      left: 24px;
      padding: 6px 14px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      font-size: 13px;
      color: #ecc94b;
      letter-spacing: 1px;
    `;
    modeBadge.textContent = '⚔️ 單人電腦對抗戰 (4 BOTS ACTIVE)';
    this.hudWrap.appendChild(modeBadge);

    // 左下角血量與護甲
    const statusPanel = document.createElement('div');
    statusPanel.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 30px;
      display: flex;
      gap: 24px;
      font-family: monospace;
      font-size: 26px;
      font-weight: bold;
      text-shadow: 0 0 6px rgba(0,0,0,0.9);
    `;
    statusPanel.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #fc8181;">
        <span style="font-size: 16px; opacity: 0.8;">+ HP</span>
        <span id="hud-hp">100</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; color: #63b3ed;">
        <span style="font-size: 16px; opacity: 0.8;">🛡 ARMOR</span>
        <span id="hud-armor">100</span>
      </div>
    `;
    this.hudWrap.appendChild(statusPanel);

    // 右下角武器名稱與彈藥
    this.ammoPanel = document.createElement('div');
    this.ammoPanel.style.cssText = `
      position: absolute;
      bottom: 24px;
      right: 30px;
      text-align: right;
      font-family: monospace;
      text-shadow: 0 0 6px rgba(0,0,0,0.9);
    `;
    this.ammoPanel.innerHTML = `
      <div id="hud-weapon-name" style="font-size: 18px; color: #e2e8f0; margin-bottom: 4px; letter-spacing: 1px;">AK-47</div>
      <div style="font-size: 32px; font-weight: bold; color: #f6e05e;">
        <span id="hud-ammo-clip">30</span>
        <span id="hud-ammo-divider" style="font-size: 20px; opacity: 0.6;"> / </span>
        <span id="hud-ammo-reserve" style="font-size: 22px; opacity: 0.85;">90</span>
      </div>
      <div id="hud-reload-hint" style="font-size: 13px; color: #fc8181; display: none; margin-top: 2px;">RELOADING...</div>
    `;
    this.hudWrap.appendChild(this.ammoPanel);

    // 玩家陣亡覆蓋層 (Death Screen)
    this.deathOverlay = document.createElement('div');
    this.deathOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(180, 0, 0, 0.4);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      text-shadow: 0 0 10px rgba(0,0,0,0.9);
    `;
    this.deathOverlay.innerHTML = `
      <h2 style="font-size: 3rem; color: #ffffff; margin-bottom: 12px; letter-spacing: 3px;">💀 YOU WERE KILLED</h2>
      <p id="death-killer-text" style="font-size: 1.4rem; color: #fecaca; margin-bottom: 16px;">Killed by Bot</p>
      <p style="font-size: 1.1rem; color: #e2e8f0;">Respawning in 2.5s...</p>
    `;
    this.hudWrap.appendChild(this.deathOverlay);

    this.container.appendChild(this.hudWrap);
  }

  /**
   * 點擊開始遊戲：立刻隱藏遮罩，絕不等待，同時觸發滑鼠鎖定
   */
  startGame() {
    this.hasStarted = true;
    this.blocker.style.display = 'none';
    if (this.pauseOverlay) this.pauseOverlay.style.display = 'none';
    this.hudWrap.style.display = 'block';
    this.crosshair.show(true);

    if (this.onStartSinglePlayer) {
      this.onStartSinglePlayer();
    }
  }

  resumeGame() {
    if (this.pauseOverlay) this.pauseOverlay.style.display = 'none';
    this.crosshair.show(true);

    if (this.onStartSinglePlayer) {
      this.onStartSinglePlayer();
    }
  }

  setLocked(isLocked) {
    if (isLocked) {
      this.blocker.style.display = 'none';
      if (this.pauseOverlay) this.pauseOverlay.style.display = 'none';
      this.hudWrap.style.display = 'block';
      this.crosshair.show(true);
    } else {
      // 只有在已開始遊戲過後按 ESC，才顯示小暫停面板；未開始前保留主選單
      if (this.hasStarted) {
        if (this.pauseOverlay) this.pauseOverlay.style.display = 'flex';
        this.crosshair.show(false);
      } else {
        this.blocker.style.display = 'flex';
        this.crosshair.show(false);
      }
    }
  }

  showDamageFlash() {
    this.damageVignette.style.opacity = '1';
    clearTimeout(this.damageTimer);
    this.damageTimer = setTimeout(() => {
      this.damageVignette.style.opacity = '0';
    }, 150);
  }

  updateHealth(hp, armor) {
    const hpEl = document.getElementById('hud-hp');
    const armorEl = document.getElementById('hud-armor');
    if (hpEl) hpEl.textContent = Math.max(0, Math.round(hp));
    if (armorEl) armorEl.textContent = Math.max(0, Math.round(armor));
  }

  showDeathScreen(killerName) {
    const textEl = document.getElementById('death-killer-text');
    if (textEl) textEl.textContent = `Eliminated by [BOT] ${killerName}`;
    this.deathOverlay.style.display = 'flex';
  }

  hideDeathScreen() {
    this.deathOverlay.style.display = 'none';
  }

  addKill(killer, victim, weapon, isHeadshot) {
    this.killFeed.addKill(killer, victim, weapon, isHeadshot);
  }

  showHitmarker(isHeadshot = false, damage = 0) {
    this.hitmarker.style.display = 'block';
    this.hitmarker.style.borderColor = isHeadshot ? '#f6e05e' : '#fc8181';
    clearTimeout(this.hitmarkerTimer);
    this.hitmarkerTimer = setTimeout(() => {
      this.hitmarker.style.display = 'none';
    }, 130);

    if (damage > 0) {
      const dmgEl = document.createElement('div');
      dmgEl.style.cssText = `
        position: absolute;
        top: 46%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: monospace;
        font-weight: bold;
        font-size: ${isHeadshot ? '22px' : '16px'};
        color: ${isHeadshot ? '#ecc94b' : '#ffffff'};
        text-shadow: 0 0 6px rgba(0,0,0,0.9);
        pointer-events: none;
        transition: transform 0.5s ease-out, opacity 0.5s ease-out;
      `;
      dmgEl.textContent = isHeadshot ? `💥 HEADSHOT -${damage}` : `-${damage}`;
      this.hudWrap.appendChild(dmgEl);

      requestAnimationFrame(() => {
        dmgEl.style.transform = 'translate(-50%, -85px)';
        dmgEl.style.opacity = '0';
      });

      setTimeout(() => dmgEl.remove(), 550);
    }
  }

  /**
   * 觸發閃光彈致盲全白效果與長效平滑退白 (5.5 秒震撼致盲)
   * @param {number} intensity 致盲強度 (0.0 ~ 1.0)
   */
  triggerFlashbang(intensity = 1.0) {
    if (!this.flashOverlay) return;

    // 清除先前的退白計時
    if (this.flashFadeInterval) {
      clearInterval(this.flashFadeInterval);
      this.flashFadeInterval = null;
    }

    let currentOpacity = Math.min(1.0, Math.max(0.1, intensity));
    this.flashOverlay.style.opacity = currentOpacity;

    // 經典 CS 閃光彈衰減曲線：前 1.5 秒維持全白，隨後 4 秒緩慢衰減 (總計 5.5 秒)
    const totalDuration = intensity > 0.6 ? 5500 : 3000;
    const holdFullTime = intensity > 0.6 ? 1500 : 600;
    const startTime = performance.now();

    this.flashFadeInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= totalDuration) {
        this.flashOverlay.style.opacity = '0';
        clearInterval(this.flashFadeInterval);
        this.flashFadeInterval = null;
        return;
      }

      if (elapsed <= holdFullTime) {
        this.flashOverlay.style.opacity = currentOpacity.toFixed(3);
      } else {
        // 非線性平滑衰減 (漸漸看得見周遭景物)
        const decayProgress = (elapsed - holdFullTime) / (totalDuration - holdFullTime);
        const decay = Math.pow(1.0 - decayProgress, 1.8);
        this.flashOverlay.style.opacity = (currentOpacity * decay).toFixed(3);
      }
    }, 40);
  }

  /**
   * 設置身處煙霧彈內部時的全螢幕濃霧盲區罩層
   */
  setSmokeScreen(inSmoke) {
    if (!this.smokeOverlay) return;
    this.smokeOverlay.style.opacity = inSmoke ? '0.88' : '0';
  }

  updateAmmo(weapon) {
    const nameEl = document.getElementById('hud-weapon-name');
    const clipEl = document.getElementById('hud-ammo-clip');
    const reserveEl = document.getElementById('hud-ammo-reserve');
    const dividerEl = document.getElementById('hud-ammo-divider');
    const reloadHint = document.getElementById('hud-reload-hint');

    if (nameEl) nameEl.textContent = weapon.name;

    if (weapon.type === 'melee') {
      if (clipEl) clipEl.textContent = '近戰';
      if (dividerEl) dividerEl.style.display = 'inline';
      if (reserveEl) {
        reserveEl.style.display = 'inline';
        reserveEl.textContent = '左:揮砍 | 右:重刺';
      }
      if (reloadHint) reloadHint.style.display = 'none';
    } else if (weapon.type === 'grenade') {
      if (clipEl) clipEl.textContent = `剩餘 ${weapon.currentClip}`;
      if (dividerEl) dividerEl.style.display = 'none';
      if (reserveEl) {
        reserveEl.style.display = 'inline';
        reserveEl.textContent = '枚';
      }
      if (reloadHint) reloadHint.style.display = 'none';
    } else {
      if (reserveEl) reserveEl.style.display = 'inline';
      if (dividerEl) dividerEl.style.display = 'inline';
      if (clipEl) clipEl.textContent = weapon.currentClip;
      if (reserveEl) reserveEl.textContent = weapon.currentReserve;

      if (reloadHint) {
        reloadHint.style.display = weapon.isReloading ? 'block' : 'none';
      }
    }
  }

  updateSpread(spreadPx) {
    this.crosshair.setSpread(spreadPx);
  }
}
