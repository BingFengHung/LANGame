import * as THREE from 'three';
import { SceneManager } from '../graphics/SceneManager.js';
import { DualCamera } from '../graphics/DualCamera.js';
import { WorldCollision } from '../physics/WorldCollision.js';
import { PlayerController } from '../physics/PlayerController.js';
import { WeaponView } from '../graphics/WeaponView.js';
import { ParticleSystem } from '../graphics/ParticleSystem.js';
import { WeaponInventory } from '../combat/WeaponInventory.js';
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

    // 6. 特效系統 (打牆火星、彈孔貼圖、曳光線)
    this.particleSystem = new ParticleSystem(this.sceneManager.scene);

    // 7. 第一人稱持槍模型 (ViewModel)
    this.weaponView = new WeaponView(this.dualCamera.viewmodelScene);

    // 8. HUD 介面
    this.hud = new HUD(this.uiContainer);

    // 9. 武器背包管理器
    this.inventory = new WeaponInventory({
      onShoot: (weapon) => this.handleShoot(weapon),
      onWeaponChange: (weapon) => {
        this.weaponView.setWeapon(weapon.id);
        this.hud.updateAmmo(weapon);
      },
      onAmmoChange: (weapon) => {
        this.hud.updateAmmo(weapon);
      }
    });

    // 初始化武器狀態至 HUD
    this.hud.updateAmmo(this.inventory.getCurrentWeapon());

    // 監聽指針鎖定狀態以切換 UI
    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === this.canvas;
      this.hud.setLocked(isLocked);
    });

    // 視窗縮放監聽
    window.addEventListener('resize', () => this.onWindowResize());
  }

  handleShoot(weapon) {
    const currentSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    const spread = weapon.calculateSpread(currentSpeed, this.player.onGround);

    // 1. 計算後座力曲線
    let pitchKick = weapon.recoilVertical;
    let yawKick = 0;

    if (weapon.id === 'ak47') {
      // 經典 AK-47 連射 T 字型彈道：前 4 發直衝，5~12 發右擺，13+ 發左擺
      if (weapon.continuousShots > 12) {
        pitchKick *= 0.15;
        yawKick = -weapon.recoilHorizontal;
      } else if (weapon.continuousShots > 4) {
        pitchKick *= 0.35;
        yawKick = weapon.recoilHorizontal;
      }
    }

    // 施加相機後座力視角震動
    this.player.applyRecoil(pitchKick, yawKick);

    // 第一人稱持槍開火動作與火光
    this.weaponView.triggerShoot(weapon.recoilVertical);

    // 2. 命中射線檢測 (Hitscan Raycast)
    const ray = this.player.getShootRay(spread);
    const hit = this.worldCollision.rayIntersect(ray);

    // 3. 計算槍口在世界空間的起點 (用於發射曳光線)
    const tracerStart = this.player.camera.position.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.player.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(this.player.camera.quaternion);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.camera.quaternion);
    tracerStart.addScaledVector(right, 0.18).addScaledVector(down, 0.14).addScaledVector(fwd, 0.4);

    if (hit) {
      // 命中牆面：生成火星與彈孔
      this.particleSystem.createImpactEffect(hit.point, hit.normal);
      this.particleSystem.createTracer(tracerStart, hit.point);
    } else {
      // 未命中實體：射向遠方
      const farPoint = ray.origin.clone().addScaledVector(ray.direction, 80);
      this.particleSystem.createTracer(tracerStart, farPoint);
    }
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

    // 更新武器背包與射擊狀態
    this.inventory.update(delta);

    // 更新粒子與特效
    this.particleSystem.update(delta);

    // 同步持槍相機旋轉
    this.dualCamera.updateViewModel();

    // 更新第一人稱槍枝呼吸與行走擺動
    const currentSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    this.weaponView.update(delta, currentSpeed, this.player.onGround && currentSpeed > 0.5);

    // 更新準星動態擴散 (速度 + 當前武器後座力)
    const currentWeapon = this.inventory.getCurrentWeapon();
    const currentSpread = currentWeapon.calculateSpread(currentSpeed, this.player.onGround);
    this.hud.updateSpread(8 + currentSpread * 600);

    // 雙相機雙通道渲染 (杜絕貼牆穿模)
    this.dualCamera.render(this.renderer, this.sceneManager.scene);
  }
}
