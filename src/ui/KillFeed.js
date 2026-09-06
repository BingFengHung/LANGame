export class KillFeed {
  constructor(container) {
    this.container = container;
    this.feedWrap = document.createElement('div');
    this.feedWrap.id = 'kill-feed';
    this.feedWrap.style.cssText = `
      position: absolute;
      top: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: none;
      z-index: 50;
    `;
    this.container.appendChild(this.feedWrap);
  }

  /**
   * 推播一筆擊殺通知 (CS 風格)
   * @param {string} killer 擊殺者名字
   * @param {string} victim 陣亡者名字
   * @param {string} weapon 武器代號
   * @param {boolean} isHeadshot 是否爆頭
   */
  addKill(killer, victim, weapon = 'AK-47', isHeadshot = false) {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(18, 22, 28, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      color: #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      animation: fadeIn 0.2s ease;
      transition: opacity 0.5s ease, transform 0.5s ease;
    `;

    const killerColor = killer === 'You' ? '#48bb78' : '#e53e3e';
    const victimColor = victim === 'You' ? '#e53e3e' : '#4299e1';

    item.innerHTML = `
      <span style="color: ${killerColor};">${killer}</span>
      <span style="color: #a0aec0; font-size: 12px; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px;">
        ${weapon}
      </span>
      ${isHeadshot ? '<span style="color: #ecc94b; font-size: 16px;" title="HEADSHOT">🎯</span>' : ''}
      <span style="color: ${victimColor};">${victim}</span>
    `;

    this.feedWrap.appendChild(item);

    // 4 秒後淡出並移除
    setTimeout(() => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      setTimeout(() => item.remove(), 500);
    }, 3800);
  }
}
