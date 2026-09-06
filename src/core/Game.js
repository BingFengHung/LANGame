import * as THREE from 'three';
import { SceneManager } from '../graphics/SceneManager.js';
import { DualCamera } from '../graphics/DualCamera.js';
import { WorldCollision } from '../physics/WorldCollision.js';
import { PlayerController } from '../physics/PlayerController.js';
import { WeaponView } from '../graphics/WeaponView.js';
import { ParticleSystem } from '../graphics/ParticleSystem.js';
import { WeaponInventory } from '../combat/WeaponInventory.js';
import { AIBot } from '../combat/AIBot.js';
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

    // 6. 特效系統 (打牆火星、血液噴濺、彈孔貼圖、曳光線)
    this.particleSystem = new ParticleSystem(this.sceneManager.scene);

    // 7. 第一人稱持槍模型 (ViewModel)
    this.weaponView = new WeaponView(this.dualCamera.viewmodelScene);

    // 8. 射線求交器
    this.raycaster = new THREE.Raycaster();

    // 9. HUD 介面 (包含擊殺推播、血量護甲、受傷泛紅與陣亡倒數)
    this.hud = new HUD(this.uiContainer, {
      onStartSinglePlayer: () => this.lockPointer(),
      onOpenMultiplayer: () => this.lockPointer()
    });

    // 10. 敵方電腦戰鬥機器人 (AI Bots)
    const botOptions = {
      worldCollision: this.worldCollision,
      particleSystem: this.particleSystem,
      onShootPlayer: (bot, damage) => this.handlePlayerDamage(bot, damage),
      onKilled: (bot, isHeadshot) => {
        const weaponName = this.inventory.getCurrentWeapon().name;
        this.hud.addKill('You', bot.name, weaponName, isHeadshot);
      }
    };

    this.bots = [
      new AIBot(this.sceneManager.scene, 'Phoenix', new THREE.Vector3(0, 0, -12), botOptions),
      new AIBot(this.sceneManager.scene, 'Cobra', new THREE.Vector3(-14, 0, -14), botOptions),
      new AIBot(this.sceneManager.scene, 'Viper', new THREE.Vector3(15, 3, -18), botOptions),
      new AIBot(this.sceneManager.scene, 'Hunter', new THREE.Vector3(-25, 0, 8), botOptions)
    ];

    // 11. 武器背包管理器
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

    // 初始化狀態
    this.hud.updateAmmo(this.inventory.getCurrentWeapon());
    this.hud.updateHealth(this.player.hp, this.player.armor);

    // 監聽指針鎖定狀態以切換 UI
    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === this.canvas;
      this.hud.setLocked(isLocked);
    });

    // 視窗縮放監聽
    window.addEventListener('resize', () => this.onWindowResize());
  }

  lockPointer() {
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) {
        p.catch((err) => console.warn('Pointer lock failed:', err));
      }
    } catch (err) {
      console.warn('Pointer lock error:', err);
    }
  }

  handlePlayerDamage(bot, damage) {
    if (this.player.isDead) return;

    const res = this.player.takeDamage(damage);
    if (!res) return;

    // 更新 HUD 血量與受傷泛紅特效
    this.hud.updateHealth(res.hp, res.armor);
    this.hud.showDamageFlash();

    // 玩家陣亡處理
    if (res.isDead) {
      this.hud.addKill(bot.name, 'You', 'AK-47', false);
      this.hud.showDeathScreen(bot.name);

      // 2.5 秒後在基地重生
      setTimeout(() => {
        this.player.respawn(new THREE.Vector3(0, 2, 8), 0);
        this.hud.updateHealth(this.player.hp, this.player.armor);
        this.hud.hideDeathScreen();
      }, 2500);
    }
  }

  handleShoot(weapon) {
    if (this.player.isDead) return;

    const currentSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    const spread = weapon.calculateSpread(currentSpeed, this.player.onGround);

    // 1. 計算後座力曲線
    let pitchKick = weapon.recoilVertical;
    let yawKick = 0;

    if (weapon.id === 'ak47') {
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
    this.raycaster.set(ray.origin, ray.direction);

    // 收集活體 Bot 的 Hitbox
    const allBotHitboxes = [];
    for (const bot of this.bots) {
      if (!bot.isDead) {
        allBotHitboxes.push(...bot.getHitboxes());
      }
    }

    const botIntersects = this.raycaster.intersectObjects(allBotHitboxes, false);
    const wallHit = this.worldCollision.rayIntersect(ray);

    // 3. 計算槍口在世界空間的起點 (發射曳光線)
    const tracerStart = this.player.camera.position.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.player.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(this.player.camera.quaternion);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.camera.quaternion);
    tracerStart.addScaledVector(right, 0.18).addScaledVector(down, 0.14).addScaledVector(fwd, 0.4);

    let hitBot = null;
    if (botIntersects.length > 0) {
      if (!wallHit || botIntersects[0].distance < wallHit.distance) {
        hitBot = botIntersects[0];
      }
    }

    if (hitBot) {
      // 命中電腦敵人部位
      const part = hitBot.object.userData.part;
      const bot = hitBot.object.userData.bot;
      const res = bot.takeDamage(weapon.damage, part);

      // 噴血特效與曳光彈道
      this.particleSystem.createBloodEffect(hitBot.point);
      this.particleSystem.createTracer(tracerStart, hitBot.point);

      // 觸發準星 Hitmarker 與傷害跳字
      if (res) {
        this.hud.showHitmarker(res.isHeadshot, res.damage);
      }
    } else if (wallHit) {
      // 命中牆面：生成火星與彈孔
      this.particleSystem.createImpactEffect(wallHit.point, wallHit.normal);
      this.particleSystem.createTracer(tracerStart, wallHit.point);
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

    // 更新角色物理與移動 (存活時才更新操作)
    if (!this.player.isDead) {
      this.player.update(delta);
    }

    // 更新武器背包與射擊狀態
    this.inventory.update(delta);

    // 更新粒子與特效
    this.particleSystem.update(delta);

    // 更新電腦戰鬥機器人 (巡邏、開火射擊、走位與重生)
    const playerPos = this.player.getPosition();
    for (const bot of this.bots) {
      bot.update(delta, playerPos, !this.player.isDead);
    }

    // 同步持槍相機旋轉
    this.dualCamera.updateViewModel();

    // 傳遞滑鼠轉向慣性擺動 (Mouse Look Sway)
    const mouseDelta = this.player.getAndClearMouseDelta();
    this.weaponView.applyMouseSway(mouseDelta.x, mouseDelta.y);

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
