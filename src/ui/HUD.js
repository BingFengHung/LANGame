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

    // ==========================================================
    // 1. 左上角：經典 CS 動態圓形小地圖雷達 (CS Mini-Radar)
    // ==========================================================
    this.radarWrap = document.createElement('div');
    this.radarWrap.id = 'hud-radar-wrap';
    this.radarWrap.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    `;

    this.radarCanvas = document.createElement('canvas');
    this.radarCanvas.id = 'cs-radar';
    this.radarCanvas.width = 136;
    this.radarCanvas.height = 136;
    this.radarCanvas.style.cssText = `
      border-radius: 50%;
      background: rgba(12, 16, 22, 0.82);
      border: 2px solid rgba(72, 187, 120, 0.75);
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(0, 255, 65, 0.15);
    `;
    this.radarCtx = this.radarCanvas.getContext('2d');
    this.radarWrap.appendChild(this.radarCanvas);

    // 雷達下方地圖名稱與當前區域標籤
    this.locationLabel = document.createElement('div');
    this.locationLabel.style.cssText = `
      font-family: monospace;
      font-size: 11px;
      font-weight: bold;
      color: #9ae6b4;
      background: rgba(0, 0, 0, 0.6);
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
      border: 1px solid rgba(72, 187, 120, 0.3);
    `;
    this.locationLabel.textContent = 'DE_DUST2 • CT BASE';
    this.radarWrap.appendChild(this.locationLabel);
    this.hudWrap.appendChild(this.radarWrap);

    // ==========================================================
    // 2. 頂部中央：經典 CS 隊伍比分欄與回合時鐘 (Match Top Bar)
    // ==========================================================
    this.matchTopBar = document.createElement('div');
    this.matchTopBar.id = 'hud-match-topbar';
    this.matchTopBar.style.cssText = `
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      background: rgba(15, 20, 26, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      padding: 6px 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      font-family: monospace;
      gap: 16px;
    `;

    this.matchTopBar.innerHTML = `
      <!-- CT 陣營 -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">🛡️</span>
        <span style="font-size: 14px; font-weight: bold; color: #63b3ed; letter-spacing: 1px;">CT</span>
        <span id="hud-ct-score" style="font-size: 22px; font-weight: bold; color: #ffffff;">0</span>
      </div>

      <!-- 回合電子時鐘 -->
      <div style="
        background: rgba(0, 0, 0, 0.5);
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid rgba(72, 187, 120, 0.3);
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <span style="font-size: 13px; color: #48bb78;">⏱️</span>
        <span id="hud-round-timer" style="font-size: 18px; font-weight: bold; color: #ecc94b; letter-spacing: 1px;">01:45</span>
      </div>

      <!-- T 陣營與 4 名 Bot 狀態點 -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <span id="hud-t-score" style="font-size: 22px; font-weight: bold; color: #ffffff;">0</span>
        <span style="font-size: 14px; font-weight: bold; color: #fc8181; letter-spacing: 1px;">T</span>
        <span style="font-size: 18px;">💣</span>
        <!-- 4 個敵方 Bot 存活頭像小圖示 -->
        <div id="hud-t-bots" style="display: flex; gap: 4px; margin-left: 6px;">
          <span class="bot-icon" style="font-size: 14px; color: #f56565;">👤</span>
          <span class="bot-icon" style="font-size: 14px; color: #f56565;">👤</span>
          <span class="bot-icon" style="font-size: 14px; color: #f56565;">👤</span>
          <span class="bot-icon" style="font-size: 14px; color: #f56565;">👤</span>
        </div>
      </div>
    `;
    this.hudWrap.appendChild(this.matchTopBar);

    // ==========================================================
    // 3. 左下角：經典 CS 生命、護甲與綠色金錢計數器
    // ==========================================================
    const statusPanel = document.createElement('div');
    statusPanel.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 30px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: monospace;
      text-shadow: 0 0 8px rgba(0,0,0,0.95);
    `;

    // 金錢計數器 ($16,000)
    this.money = 16000;
    this.moneyEl = document.createElement('div');
    this.moneyEl.id = 'hud-money';
    this.moneyEl.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      color: #48bb78;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 1px;
    `;
    this.moneyEl.innerHTML = `<span>$</span><span id="hud-money-val">16,000</span>`;
    statusPanel.appendChild(this.moneyEl);

    // HP 與 ARMOR
    const healthRow = document.createElement('div');
    healthRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 24px;
      font-size: 32px;
      font-weight: bold;
    `;
    healthRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #48bb78;">
        <span style="font-size: 20px; opacity: 0.9;">+</span>
        <span id="hud-hp">100</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; color: #63b3ed;">
        <span style="font-size: 20px; opacity: 0.9;">🛡</span>
        <span id="hud-armor">100</span>
      </div>
    `;
    statusPanel.appendChild(healthRow);
    this.hudWrap.appendChild(statusPanel);

    // ==========================================================
    // 4. 右下角：武器名稱、大號彈藥卡片與換彈提示
    // ==========================================================
    this.ammoPanel = document.createElement('div');
    this.ammoPanel.style.cssText = `
      position: absolute;
      bottom: 24px;
      right: 30px;
      text-align: right;
      font-family: monospace;
      text-shadow: 0 0 8px rgba(0,0,0,0.95);
    `;
    this.ammoPanel.innerHTML = `
      <div id="hud-weapon-name" style="font-size: 19px; font-weight: bold; color: #e2e8f0; margin-bottom: 4px; letter-spacing: 1.5px;">AK-47</div>
      <div style="font-size: 38px; font-weight: bold; color: #f6e05e;">
        <span id="hud-ammo-clip">30</span>
        <span id="hud-ammo-divider" style="font-size: 22px; opacity: 0.6;"> / </span>
        <span id="hud-ammo-reserve" style="font-size: 24px; opacity: 0.85;">90</span>
      </div>
      <div id="hud-reload-hint" style="font-size: 13px; color: #fc8181; display: none; margin-top: 2px; font-weight: bold;">[R] RELOAD</div>
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

  /**
   * 經典 CS 動態圓形小地圖雷達即時渲染 (Radar Render Loop)
   * @param {THREE.Vector3} playerPos 玩家當前世界坐標
   * @param {number} playerYaw 玩家當前視角水平旋轉角度
   * @param {Array} bots 4 名電腦戰鬥機器人
   * @param {Array} activeSmokes 正在場上起煙的煙霧彈雲團列表
   */
  updateRadar(playerPos, playerYaw, bots = [], activeSmokes = []) {
    if (!this.radarCtx || !playerPos) return;

    const ctx = this.radarCtx;
    const size = 136;
    const center = size / 2;
    const radarScale = 1.15; // 1 公尺約 1.15 像素 (雷達可視半徑約 58 公尺)

    ctx.clearRect(0, 0, size, size);

    // 1. 繪製雷達同心測距圓環與十字刻度
    ctx.strokeStyle = 'rgba(72, 187, 120, 0.22)';
    ctx.lineWidth = 1;

    // 25m 與 50m 測距環
    ctx.beginPath();
    ctx.arc(center, center, 25 * radarScale, 0, Math.PI * 2);
    ctx.arc(center, center, 48 * radarScale, 0, Math.PI * 2);
    ctx.stroke();

    // 十字刻度軸
    ctx.beginPath();
    ctx.moveTo(center, 8);
    ctx.lineTo(center, size - 8);
    ctx.moveTo(8, center);
    ctx.lineTo(size - 8, center);
    ctx.stroke();

    // 2. 繪製經典包點方位標誌 (A 點與 B 點)
    const sites = [
      { name: 'A', x: 40, z: -37 },
      { name: 'B', x: -40, z: -26 }
    ];

    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const site of sites) {
      const dx = (site.x - playerPos.x) * radarScale;
      const dz = (site.z - playerPos.z) * radarScale;
      const dist = Math.hypot(dx, dz);
      const maxR = center - 12;

      let rx = center + dx;
      let rz = center + dz;
      if (dist > maxR) {
        // 若超出雷達邊界，吸附在雷達邊緣指示方位
        rx = center + (dx / dist) * maxR;
        rz = center + (dz / dist) * maxR;
      }

      ctx.fillStyle = '#e53e3e';
      ctx.fillText(`[${site.name}]`, rx, rz);
    }

    // 3. 繪製起煙中的煙霧彈 (灰白色半透明雲霧覆蓋區)
    if (activeSmokes && activeSmokes.length > 0) {
      for (const smoke of activeSmokes) {
        const dx = (smoke.position.x - playerPos.x) * radarScale;
        const dz = (smoke.position.z - playerPos.z) * radarScale;
        const rx = center + dx;
        const rz = center + dz;

        ctx.fillStyle = 'rgba(180, 190, 205, 0.45)';
        ctx.beginPath();
        ctx.arc(rx, rz, 8 * radarScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(230, 235, 245, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 4. 繪製敵方 Bot (鮮紅實心圓點，死亡為灰紅 X 叉)
    for (const bot of bots) {
      const bPos = bot.position || (bot.group ? bot.group.position : null);
      if (!bPos) continue;

      const dx = (bPos.x - playerPos.x) * radarScale;
      const dz = (bPos.z - playerPos.z) * radarScale;
      const dist = Math.hypot(dx, dz);
      const maxR = center - 8;

      let rx = center + dx;
      let rz = center + dz;
      if (dist > maxR) {
        rx = center + (dx / dist) * maxR;
        rz = center + (dz / dist) * maxR;
      }

      if (bot.isDead) {
        // 陣亡標記：暗紅 ×
        ctx.strokeStyle = 'rgba(245, 101, 101, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx - 3, rz - 3);
        ctx.lineTo(rx + 3, rz + 3);
        ctx.moveTo(rx + 3, rz - 3);
        ctx.lineTo(rx - 3, rz + 3);
        ctx.stroke();
      } else {
        // 存活敵人：鮮紅實心圓點 + 外圈高光
        ctx.fillStyle = '#f56565';
        ctx.beginPath();
        ctx.arc(rx, rz, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff5f5';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 5. 繪製中心自身位置與視野方向 (綠色實心三角箭頭)
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(-playerYaw); // 根據玩家自身朝向旋轉箭頭

    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. 更新左上角當前所處戰術地圖區域標籤
    this.updateLocationLabel(playerPos);
  }

  /**
   * 根據坐標判斷經典 CS Dust2 區域名稱
   */
  updateLocationLabel(pos) {
    if (!this.locationLabel) return;

    let loc = 'COURTYARD';
    if (pos.z > 32) {
      loc = 'CT SPAWN';
    } else if (pos.x > 18 && pos.z < -16) {
      loc = 'BOMBSITE A';
    } else if (pos.x < -18 && pos.z < -8) {
      loc = 'BOMBSITE B';
    } else if (Math.abs(pos.x) <= 15 && pos.z >= -10 && pos.z <= 26) {
      loc = 'MID DOORS';
    } else if (pos.z < -45) {
      loc = 'T BASE';
    }

    this.locationLabel.textContent = `DE_DUST2 • ${loc}`;
  }

  /**
   * 更新頂部比分與 1:45 回合電子倒數時計
   */
  updateMatchInfo(remainingSeconds, ctScore, tScore, bots = []) {
    const timerEl = document.getElementById('hud-round-timer');
    if (timerEl) {
      const s = Math.max(0, Math.floor(remainingSeconds));
      const m = Math.floor(s / 60);
      const sec = s % 60;
      timerEl.textContent = `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;

      // 剩餘時間不足 20 秒時時鐘變紅急促警示
      if (s <= 20) {
        timerEl.style.color = '#fc8181';
      } else {
        timerEl.style.color = '#ecc94b';
      }
    }

    const ctScoreEl = document.getElementById('hud-ct-score');
    if (ctScoreEl) ctScoreEl.textContent = ctScore;

    const tScoreEl = document.getElementById('hud-t-score');
    if (tScoreEl) tScoreEl.textContent = tScore;

    // 更新 4 名敵方 Bot 的存活頭像
    const botsWrap = document.getElementById('hud-t-bots');
    if (botsWrap && bots.length > 0) {
      const botIcons = botsWrap.querySelectorAll('.bot-icon');
      bots.forEach((b, idx) => {
        if (botIcons[idx]) {
          if (b.isDead) {
            botIcons[idx].textContent = '💀';
            botIcons[idx].style.color = '#718096';
            botIcons[idx].style.opacity = '0.4';
          } else {
            botIcons[idx].textContent = '👤';
            botIcons[idx].style.color = '#f56565';
            botIcons[idx].style.opacity = '1';
          }
        }
      });
    }
  }

  /**
   * 增加金錢並播放浮動金色數字跳躍動畫 (+$300 擊殺獎勵)
   */
  addMoney(amount = 300) {
    this.money = (this.money || 16000) + amount;
    const valEl = document.getElementById('hud-money-val');
    if (valEl) {
      valEl.textContent = this.money.toLocaleString();
    }

    // 飄出 +$300 綠色浮動文字
    const floatEl = document.createElement('div');
    floatEl.style.cssText = `
      position: absolute;
      bottom: 60px;
      left: 120px;
      font-family: monospace;
      font-weight: bold;
      font-size: 20px;
      color: #48bb78;
      text-shadow: 0 0 6px rgba(0, 0, 0, 0.9);
      pointer-events: none;
      transition: transform 0.8s ease-out, opacity 0.8s ease-out;
      z-index: 100;
    `;
    floatEl.textContent = `+$${amount}`;
    this.hudWrap.appendChild(floatEl);

    requestAnimationFrame(() => {
      floatEl.style.transform = 'translateY(-35px)';
      floatEl.style.opacity = '0';
    });

    setTimeout(() => floatEl.remove(), 800);
  }
}
