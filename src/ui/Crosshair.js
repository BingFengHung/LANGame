export class Crosshair {
  constructor(container) {
    this.container = container;
    this.spread = 10; // 基礎擴散像素
    this.element = null;

    this.init();
  }

  init() {
    const wrap = document.createElement('div');
    wrap.id = 'crosshair-wrap';
    wrap.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 經典 CS 競技高對比純綠色準星 (#00ff00) 帶 1px 黑色外框
    const lineStyle = `
      position: absolute;
      background: #00ff00;
      border: 1px solid rgba(0, 0, 0, 0.85);
      box-sizing: border-box;
    `;

    // 上
    this.topLine = document.createElement('div');
    this.topLine.style.cssText = `${lineStyle}; width: 3px; height: 9px; transform: translateY(-${this.spread}px);`;
    // 下
    this.bottomLine = document.createElement('div');
    this.bottomLine.style.cssText = `${lineStyle}; width: 3px; height: 9px; transform: translateY(${this.spread}px);`;
    // 左
    this.leftLine = document.createElement('div');
    this.leftLine.style.cssText = `${lineStyle}; height: 3px; width: 9px; transform: translateX(-${this.spread}px);`;
    // 右
    this.rightLine = document.createElement('div');
    this.rightLine.style.cssText = `${lineStyle}; height: 3px; width: 9px; transform: translateX(${this.spread}px);`;

    // 中心微小精確瞄準點
    this.centerDot = document.createElement('div');
    this.centerDot.style.cssText = `${lineStyle}; width: 3px; height: 3px; border-radius: 1px;`;

    wrap.appendChild(this.topLine);
    wrap.appendChild(this.bottomLine);
    wrap.appendChild(this.leftLine);
    wrap.appendChild(this.rightLine);
    wrap.appendChild(this.centerDot);

    this.container.appendChild(wrap);
    this.element = wrap;
  }

  /**
   * 根據移動速度與射擊後座力動態調整準星擴散
   * @param {number} spreadPx
   */
  setSpread(spreadPx) {
    this.spread = Math.max(6, Math.min(spreadPx, 35));
    this.topLine.style.transform = `translateY(-${this.spread}px)`;
    this.bottomLine.style.transform = `translateY(${this.spread}px)`;
    this.leftLine.style.transform = `translateX(-${this.spread}px)`;
    this.rightLine.style.transform = `translateX(${this.spread}px)`;
  }

  show(visible = true) {
    if (this.element) {
      this.element.style.display = visible ? 'flex' : 'none';
    }
  }
}
