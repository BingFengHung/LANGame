import * as THREE from 'three';

export class AIBot {
  constructor(scene, name, spawnPos, options = {}) {
    this.scene = scene;
    this.name = name;
    this.spawnPos = spawnPos.clone();
    this.worldCollision = options.worldCollision || null;
    this.onShootPlayer = options.onShootPlayer || null;
    this.onKilled = options.onKilled || null;
    this.particleSystem = options.particleSystem || null;

    this.maxHp = 100;
    this.hp = this.maxHp;
    this.isDead = false;
    this.respawnTimer = 0;

    // AI 行為參數
    this.state = 'PATROL'; // 'PATROL' | 'COMBAT'
    this.moveSpeed = 3.6;
    this.currentWaypoint = this.getRandomWaypoint();
    this.patrolWaitTimer = 0;

    // 戰鬥開火參數
    this.fireRate = 0.16; // 連射間隔
    this.burstCount = 0;
    this.burstMax = 3;
    this.burstCooldown = 1.0;
    this.nextFireTime = 0;
    this.nextBurstTime = 0;

    // 行走步頻動畫
    this.walkAnimTimer = 0;

    // 碰撞 Hitbox 列表
    this.hitboxes = [];

    // 建立 3D 人物模型
    this.group = new THREE.Group();
    this.group.position.copy(this.spawnPos);
    this.scene.add(this.group);

    this.buildModel();
    this.createUI();
  }

  buildModel() {
    // 敵方角色材質 (經典 CS 恐怖分子風格：紅棕色夾克、迷彩褲、面罩頭部)
    this.jacketMat = new THREE.MeshStandardMaterial({ color: 0x9c4221, roughness: 0.65 });
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x3d4852, roughness: 0.8 });
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.5 });
    this.gunMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.3, metalness: 0.8 });

    // 1. 軀幹 (Torso)
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.65, 0.28);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.jacketMat);
    this.torsoMesh.position.set(0, 1.15, 0);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.userData = { bot: this, part: 'body' };
    this.group.add(this.torsoMesh);
    this.hitboxes.push(this.torsoMesh);

    // 2. 頭部 (Head)
    const headGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.position.set(0, 1.62, 0);
    this.headMesh.castShadow = true;
    this.headMesh.userData = { bot: this, part: 'head' };
    this.group.add(this.headMesh);
    this.hitboxes.push(this.headMesh);

    // 頭部黑色護目鏡/面罩 (強調 CS 敵人視覺)
    const maskGeo = new THREE.BoxGeometry(0.25, 0.08, 0.12);
    const maskMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const mask = new THREE.Mesh(maskGeo, maskMat);
    mask.position.set(0, 1.63, 0.09);
    this.group.add(mask);

    // 3. 雙腿 (Legs) - 具備跑步前後擺動 pivot
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.14, 0.82, 0);
    const legGeo = new THREE.BoxGeometry(0.18, 0.78, 0.22);
    this.leftLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    this.leftLegMesh.position.set(0, -0.39, 0);
    this.leftLegMesh.castShadow = true;
    this.leftLegMesh.userData = { bot: this, part: 'legs' };
    this.leftLegPivot.add(this.leftLegMesh);
    this.group.add(this.leftLegPivot);
    this.hitboxes.push(this.leftLegMesh);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.14, 0.82, 0);
    this.rightLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    this.rightLegMesh.position.set(0, -0.39, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegMesh.userData = { bot: this, part: 'legs' };
    this.rightLegPivot.add(this.rightLegMesh);
    this.group.add(this.rightLegPivot);
    this.hitboxes.push(this.rightLegMesh);

    // 4. 右手持槍手部 (Arm & Rifle)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.32, 1.35, 0);
    const armGeo = new THREE.BoxGeometry(0.12, 0.55, 0.14);
    const rightArm = new THREE.Mesh(armGeo, this.jacketMat);
    rightArm.position.set(0, -0.22, 0);
    rightArm.rotation.x = -Math.PI / 4; // 舉槍瞄準姿勢
    this.rightArmPivot.add(rightArm);
    this.group.add(this.rightArmPivot);

    // 武器模型 (步槍)
    const rifleGeo = new THREE.BoxGeometry(0.06, 0.08, 0.55);
    const rifle = new THREE.Mesh(rifleGeo, this.gunMat);
    rifle.position.set(0.26, 1.25, 0.3);
    this.group.add(rifle);

    // 槍口起點
    this.muzzlePoint = new THREE.Vector3(0.26, 1.25, 0.62);

    // 槍火光
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true });
    this.flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), flashMat);
    this.flashMesh.position.set(0.26, 1.25, 0.65);
    this.flashMesh.visible = false;
    this.group.add(this.flashMesh);
  }

  createUI() {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 36;
    this.uiCanvas = canvas;
    this.uiCtx = canvas.getContext('2d');

    this.uiTexture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.uiTexture,
      depthTest: false
    });

    this.uiSprite = new THREE.Sprite(spriteMat);
    this.uiSprite.scale.set(1.2, 0.27, 1);
    this.uiSprite.position.set(0, 2.05, 0);
    this.group.add(this.uiSprite);

    this.renderUI();
  }

  renderUI() {
    const ctx = this.uiCtx;
    ctx.clearRect(0, 0, 160, 36);

    // 名稱
    ctx.fillStyle = '#fc8181';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[BOT] ${this.name}`, 80, 14);

    // 底框
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 20, 140, 10);

    // 血條
    const pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = pct > 0.5 ? '#48bb78' : pct > 0.25 ? '#ecc94b' : '#e53e3e';
    ctx.fillRect(11, 21, Math.floor(138 * pct), 8);

    this.uiTexture.needsUpdate = true;
  }

  getRandomWaypoint() {
    // 在出生點半徑 12m 內隨機巡邏點
    const angle = Math.random() * Math.PI * 2;
    const dist = 3.0 + Math.random() * 9.0;
    return new THREE.Vector3(
      this.spawnPos.x + Math.cos(angle) * dist,
      this.spawnPos.y,
      this.spawnPos.z + Math.sin(angle) * dist
    );
  }

  takeDamage(baseDamage, part = 'body') {
    if (this.isDead) return null;

    let multiplier = 1.0;
    let isHeadshot = false;

    if (part === 'head') {
      multiplier = 4.0;
      isHeadshot = true;
    } else if (part === 'legs') {
      multiplier = 0.75;
    }

    const actualDamage = Math.round(baseDamage * multiplier);
    this.hp = Math.max(0, this.hp - actualDamage);
    this.renderUI();

    // 受傷泛紅
    this.flashRed();

    // 死亡判定
    if (this.hp <= 0) {
      this.die(isHeadshot);
    }

    return {
      damage: actualDamage,
      isHeadshot: isHeadshot,
      isDead: this.hp <= 0,
      hitPoint: this.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
    };
  }

  flashRed() {
    this.jacketMat.color.setHex(0xff2222);
    this.headMat.color.setHex(0xff0000);
    setTimeout(() => {
      this.jacketMat.color.setHex(0x9c4221);
      this.headMat.color.setHex(0xd69e2e);
    }, 120);
  }

  die(isHeadshot = false) {
    this.isDead = true;
    this.respawnTimer = 4.0; // 4 秒後重生

    // 倒地姿勢
    this.group.rotation.x = -Math.PI / 2;
    this.group.position.y = this.spawnPos.y - 0.7;
    this.uiSprite.visible = false;
    this.flashMesh.visible = false;

    if (this.onKilled) {
      this.onKilled(this, isHeadshot);
    }
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.group.position.copy(this.spawnPos);
    this.group.rotation.set(0, Math.random() * Math.PI * 2, 0);
    this.uiSprite.visible = true;
    this.renderUI();
    this.currentWaypoint = this.getRandomWaypoint();
  }

  update(delta, playerPos, isPlayerAlive = true) {
    if (this.isDead) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    const now = performance.now() * 0.001;

    // 熄滅槍火
    if (this.flashMesh.visible && now > this.flashOffTime) {
      this.flashMesh.visible = false;
    }

    // 計算與玩家之距離
    const distToPlayer = this.group.position.distanceTo(playerPos);

    // AI 狀態機轉換 (若玩家在 35m 內且存活，進入戰鬥狀態)
    if (isPlayerAlive && distToPlayer < 35) {
      this.state = 'COMBAT';
    } else {
      this.state = 'PATROL';
    }

    if (this.state === 'COMBAT') {
      this.updateCombat(delta, playerPos, distToPlayer, now);
    } else {
      this.updatePatrol(delta, now);
    }
  }

  updateCombat(delta, playerPos, distToPlayer, now) {
    // 轉向玩家
    const lookTarget = new THREE.Vector3(playerPos.x, this.group.position.y, playerPos.z);
    this.group.lookAt(lookTarget);

    // 行為模式：如果太遠則向前壓進，如果在近距離 (5~15m) 則左右橫移掃射
    if (distToPlayer > 12) {
      const dir = lookTarget.clone().sub(this.group.position).normalize();
      this.group.position.addScaledVector(dir, this.moveSpeed * delta);
      this.animateLegs(delta, this.moveSpeed);
    } else {
      // 左右微幅橫移 (Strafe)
      const strafeDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.group.quaternion);
      const strafeSpeed = Math.sin(now * 2) * 1.8;
      this.group.position.addScaledVector(strafeDir, strafeSpeed * delta);
      this.animateLegs(delta, Math.abs(strafeSpeed));
    }

    // 開火射擊玩家邏輯 (三連發點射)
    if (now >= this.nextBurstTime) {
      if (now >= this.nextFireTime && this.burstCount < this.burstMax) {
        this.shootAtPlayer(playerPos, now);
        this.burstCount++;
        this.nextFireTime = now + this.fireRate;

        if (this.burstCount >= this.burstMax) {
          // 這一輪連發結束，冷卻 1.2~1.8 秒再下一輪
          this.burstCount = 0;
          this.nextBurstTime = now + 1.2 + Math.random() * 0.6;
        }
      }
    }
  }

  shootAtPlayer(playerPos, now) {
    // 點亮槍火
    this.flashMesh.visible = true;
    this.flashOffTime = now + 0.05;

    // 計算槍口在世界空間座標
    const muzzleWorld = new THREE.Vector3();
    this.group.localToWorld(muzzleWorld.copy(this.muzzlePoint));

    // 計算瞄準方向 (加入隨機射擊散佈，避免 Bot 100% 自瞄)
    const aimSpread = 0.07;
    const targetWithSpread = playerPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * aimSpread * 15,
      (Math.random() - 0.5) * aimSpread * 10 + 0.8, // 瞄準胸口高度
      (Math.random() - 0.5) * aimSpread * 15
    ));

    const shootDir = targetWithSpread.clone().sub(muzzleWorld).normalize();

    // 建立曳光線
    if (this.particleSystem) {
      this.particleSystem.createTracer(muzzleWorld, targetWithSpread);
    }

    // 判定是否命中玩家 (射線求交)
    const ray = new THREE.Ray(muzzleWorld, shootDir);
    const dist = muzzleWorld.distanceTo(playerPos);

    // 隨距離與散佈判定命中率 (中近距離命中率約 30%~45%)
    const hitChance = Math.max(0.15, 0.48 - dist * 0.01);
    if (Math.random() < hitChance) {
      if (this.onShootPlayer) {
        const damage = Math.round(12 + Math.random() * 10); // 單發 12~22 傷害
        this.onShootPlayer(this, damage);
      }
    }
  }

  updatePatrol(delta, now) {
    const toWaypoint = this.currentWaypoint.clone().sub(this.group.position);
    toWaypoint.y = 0;
    const dist = toWaypoint.length();

    if (dist < 1.0) {
      // 到達巡邏點，停駐片刻後選下一個
      this.resetLegs();
      this.patrolWaitTimer += delta;
      if (this.patrolWaitTimer > 2.0) {
        this.currentWaypoint = this.getRandomWaypoint();
        this.patrolWaitTimer = 0;
      }
    } else {
      // 走向巡邏點
      toWaypoint.normalize();
      const lookTarget = this.group.position.clone().add(toWaypoint);
      this.group.lookAt(lookTarget);

      this.group.position.addScaledVector(toWaypoint, this.moveSpeed * 0.6 * delta);
      this.animateLegs(delta, this.moveSpeed * 0.6);
    }
  }

  animateLegs(delta, speed) {
    this.walkAnimTimer += delta * speed * 3.5;
    const angle = Math.sin(this.walkAnimTimer) * 0.45;
    this.leftLegPivot.rotation.x = angle;
    this.rightLegPivot.rotation.x = -angle;
  }

  resetLegs() {
    this.leftLegPivot.rotation.x = 0;
    this.rightLegPivot.rotation.x = 0;
  }

  getHitboxes() {
    return this.hitboxes;
  }
}
