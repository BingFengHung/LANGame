import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('找不到 #game-canvas 元素');
    return;
  }

  const game = new Game(canvas);
  game.start();
  console.log('LANGame 初始化成功！');
});
