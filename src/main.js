import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const uiContainer = document.getElementById('ui-container');

  if (!canvas || !uiContainer) {
    console.error('找不到必要的 DOM 元素 (#game-canvas 或 #ui-container)');
    return;
  }

  const game = new Game(canvas, uiContainer);
  game.start();
  console.log('LANGame 核心啟動成功！');
});
