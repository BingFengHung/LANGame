import * as THREE from 'three';
import { SceneManager } from '../graphics/SceneManager.js';
import { DualCamera } from '../graphics/DualCamera.js';
import { WorldCollision } from '../physics/WorldCollision.js';
import { PlayerController } from '../physics/PlayerController.js';
import { WeaponView } from '../graphics/WeaponView.js';
import { HUD } from '../ui/HUD.js';

export class Game {
  constructor(canvas, uiContainer) {
    this.canvas = canvas;
    this.uiContainer = uiContainer;
    this.clock = new THREE.Clock();
    this.isRunning = false;

    this.init();
  }

  init() {
    // 1. 建立 WebGL 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. 雙相機系統
    this.dualCamera = new DualCamera();

    // 3. 場景管理器 (包含沙盒對戰地圖與光影)
    this.sceneManager = new SceneManager();

    // 4. 八叉樹物理碰撞系統
    this.worldCollision = new WorldCollision();
    this.worldCollision.buildFromMeshGroup(this.sceneManager.getCollisionGroup());

    // 5. 角色控制器 (Capsule 碰撞 + CS 手感)
    this.player = new PlayerController(
      this.dualCamera.worldCamera,
      this.canvas,
      this.worldCollision
    );

    // 6. 第一人稱持槍模型 (ViewModel)
    this.weaponView = new WeaponView(this.dualCamera.viewmodelScene);

    // 7. HUD 介面
    this.hud = new HUD(this.uiContainer);

    // 監聽指針鎖定狀態以切換 UI
    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === this.canvas;
      this.hud.setLocked(isLocked);
    });

    // 視窗縮放監聽
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.dualCamera.onWindowResize(width, height);
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // 更新角色物理與移動
    this.player.update(delta);

    // 同步持槍相機旋轉
    this.dualCamera.updateViewModel();

    // 更新第一人稱槍枝呼吸與行走擺動
    const currentSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    this.weaponView.update(delta, currentSpeed, this.player.onGround && currentSpeed > 0.5);

    // 更新準星動態擴散
    this.hud.updateSpread(currentSpeed);

    // 雙相機雙通道渲染 (杜絕貼牆穿模)
    this.dualCamera.render(this.renderer, this.sceneManager.scene);
  }
}
