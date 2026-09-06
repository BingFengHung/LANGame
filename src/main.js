import { Game } from './core/Game.js';

// 全域錯誤捕獲器：若發生任何運行時錯誤，直接在畫面頂部以紅色醒目橫幅顯示，免去開 F12 控制台的麻煩
function showGlobalError(msg) {
  let errBox = document.getElementById('global-error-banner');
  if (!errBox) {
    errBox = document.createElement('div');
    errBox.id = 'global-error-banner';
    errBox.style.cssText = `
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(220, 38, 38, 0.95);
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-family: monospace;
      z-index: 99999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      max-width: 90%;
      word-break: break-all;
    `;
    document.body.appendChild(errBox);
  }
  errBox.innerHTML = `⚠️ <b>遊戲運行錯誤</b>: ${msg}`;
}

window.addEventListener('error', (e) => {
  console.error('全域錯誤捕獲:', e.message, e.filename, e.lineno);
  showGlobalError(`${e.message} (${e.filename ? e.filename.split('/').pop() : 'script'}:${e.lineno})`);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('未處理的 Promise 拒絕:', e.reason);
  showGlobalError(e.reason ? (e.reason.message || e.reason) : '未知非同步錯誤');
});

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const uiContainer = document.getElementById('ui-container');

  if (!canvas || !uiContainer) {
    showGlobalError('找不到必要的 DOM 元素 (#game-canvas 或 #ui-container)');
    return;
  }

  try {
    const GameClass = typeof Game !== 'undefined' ? Game : window.Game;
    const game = new GameClass(canvas, uiContainer);
    game.start();
    console.log('LANGame 核心啟動成功！');
  } catch (err) {
    showGlobalError(err.message || '啟動失敗');
    console.error(err);
  }
});
