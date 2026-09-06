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

    // 受傷硬直物理震顫 (Hit Flinch)
    this.flinchAmount = 0;

    // 蹲姿壓槍狀態 (CS 經典 Crouch Spray)
    this.isCrouching = false;
    this.crouchProgress = 0;

    // 閃光彈致盲狀態 (Blinded by Flashbang)
    this.isFlashed = false;
    this.flashTimer = 0;

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
    // 經典 CS 恐怖分子外觀材質 (鳳凰戰士 Phoenix Connexion 風格)
    this.jacketMat = new THREE.MeshStandardMaterial({ color: 0x823b1c, roughness: 0.7 }); // 深棕紅戰鬥服
    this.vestMat = new THREE.MeshStandardMaterial({ color: 0x242d38, roughness: 0.8, metalness: 0.25 }); // 重裝戰術防彈背心
    this.pouchMat = new THREE.MeshStandardMaterial({ color: 0x171c24, roughness: 0.9 }); // 彈匣戰術袋
    this.beltMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.95 }); // 戰術勤務腰帶
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x2e3540, roughness: 0.85 }); // 戰術長褲
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0x232529, roughness: 0.9 }); // 深灰色頭套面罩 (Balaclava)
    this.goggleMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.1, metalness: 0.95 }); // 黑色防風護目鏡
    this.gunMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.35, metalness: 0.8 }); // 金屬槍身
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x6e3819, roughness: 0.6 }); // 木質槍托與護木
    this.bootMat = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.9 }); // 重裝軍靴
    this.filterMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.4, metalness: 0.6 }); // 金屬濾氣閥

    // 1. 軀幹與防彈背心 (Torso & Armor Vest)
    this.upperBody = new THREE.Group();
    this.upperBody.position.set(0, 1.15, 0);
    this.group.add(this.upperBody);

    const torsoGeo = new THREE.BoxGeometry(0.46, 0.65, 0.28);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.jacketMat);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.userData = { bot: this, part: 'body' };
    this.upperBody.add(this.torsoMesh);
    this.hitboxes.push(this.torsoMesh);

    // 戰術防彈背心 (包覆在胸背)
    const vestGeo = new THREE.BoxGeometry(0.49, 0.52, 0.32);
    const vest = new THREE.Mesh(vestGeo, this.vestMat);
    vest.position.set(0, 0.04, 0);
    vest.castShadow = true;
    this.upperBody.add(vest);

    // 戰術防護肩墊 (Shoulder Armor Pads)
    const shoulderGeo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
    const leftShoulder = new THREE.Mesh(shoulderGeo, this.vestMat);
    leftShoulder.position.set(-0.25, 0.28, 0);
    this.upperBody.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, this.vestMat);
    rightShoulder.position.set(0.25, 0.28, 0);
    this.upperBody.add(rightShoulder);

    // 胸前三聯彈匣戰術袋 (Ammo Pouches)
    for (let p = -1; p <= 1; p++) {
      const pouchGeo = new THREE.BoxGeometry(0.09, 0.16, 0.06);
      const pouch = new THREE.Mesh(pouchGeo, this.pouchMat);
      pouch.position.set(p * 0.11, -0.06, 0.18);
      this.upperBody.add(pouch);
    }

    // 胸前戰術對講機與天線 (Tactical Radio)
    const radioGeo = new THREE.BoxGeometry(0.06, 0.12, 0.05);
    const radio = new THREE.Mesh(radioGeo, this.pouchMat);
    radio.position.set(-0.16, 0.18, 0.17);
    this.upperBody.add(radio);

    const antennaGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.14, 4);
    const antenna = new THREE.Mesh(antennaGeo, this.gunMat);
    antenna.position.set(-0.16, 0.31, 0.17);
    this.upperBody.add(antenna);

    // 戰術重型勤務腰帶 (Tactical Duty Belt)
    const beltGeo = new THREE.BoxGeometry(0.5, 0.08, 0.3);
    const belt = new THREE.Mesh(beltGeo, this.beltMat);
    belt.position.set(0, -0.3, 0);
    this.upperBody.add(belt);

    // 腰側手槍快拔槍套 (Sidearm Holster)
    const holsterGeo = new THREE.BoxGeometry(0.08, 0.18, 0.1);
    const holster = new THREE.Mesh(holsterGeo, this.beltMat);
    holster.position.set(0.26, -0.32, 0.02);
    this.upperBody.add(holster);

    // 2. 頭部與面罩護目鏡 (Head with Balaclava & Goggles & Filter)
    const headGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.position.set(0, 0.46, 0);
    this.headMesh.castShadow = true;
    this.headMesh.userData = { bot: this, part: 'head' };
    this.upperBody.add(this.headMesh);
    this.hitboxes.push(this.headMesh);

    // 突出立體呼吸閥 (Respirator / Mask Filter)
    const filterGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 8);
    const filterMesh = new THREE.Mesh(filterGeo, this.filterMat);
    filterMesh.rotation.x = Math.PI / 2;
    filterMesh.position.set(0, 0.38, 0.14);
    this.upperBody.add(filterMesh);

    // 戰術反光護目鏡 (Tactical Goggles)
    const goggleGeo = new THREE.BoxGeometry(0.25, 0.08, 0.1);
    const goggle = new THREE.Mesh(goggleGeo, this.goggleMat);
    goggle.position.set(0, 0.48, 0.09);
    this.upperBody.add(goggle);

    // 單耳戰術通訊耳麥 (Tactical Headset)
    const earCupGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8);
    const earCup = new THREE.Mesh(earCupGeo, this.pouchMat);
    earCup.rotation.z = Math.PI / 2;
    earCup.position.set(-0.13, 0.46, 0);
    this.upperBody.add(earCup);

    // 3. 雙腿與戰術靴、護膝 (Legs with Kneepads & Boots)
    const legGeo = new THREE.BoxGeometry(0.18, 0.74, 0.2);
    
    // 左腿
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.14, 0.78, 0);
    this.leftLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    this.leftLegMesh.position.set(0, -0.37, 0);
    this.leftLegMesh.castShadow = true;
    this.leftLegMesh.userData = { bot: this, part: 'legs' };
    this.leftLegPivot.add(this.leftLegMesh);

    // 左膝護膝 (Kneepad)
    const kneepadGeo = new THREE.BoxGeometry(0.15, 0.13, 0.07);
    const leftKneepad = new THREE.Mesh(kneepadGeo, this.vestMat);
    leftKneepad.position.set(0, -0.36, 0.11);
    this.leftLegPivot.add(leftKneepad);

    // 左腳戰術軍靴 (Combat Boot)
    const bootGeo = new THREE.BoxGeometry(0.185, 0.18, 0.26);
    const leftBoot = new THREE.Mesh(bootGeo, this.bootMat);
    leftBoot.position.set(0, -0.68, 0.02);
    this.leftLegPivot.add(leftBoot);

    this.group.add(this.leftLegPivot);
    this.hitboxes.push(this.leftLegMesh);

    // 右腿
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.14, 0.78, 0);
    this.rightLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    this.rightLegMesh.position.set(0, -0.37, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegMesh.userData = { bot: this, part: 'legs' };
    this.rightLegPivot.add(this.rightLegMesh);

    // 右膝護膝
    const rightKneepad = new THREE.Mesh(kneepadGeo, this.vestMat);
    rightKneepad.position.set(0, -0.36, 0.11);
    this.rightLegPivot.add(rightKneepad);

    // 右腳戰術軍靴
    const rightBoot = new THREE.Mesh(bootGeo, this.bootMat);
    rightBoot.position.set(0, -0.68, 0.02);
    this.rightLegPivot.add(rightBoot);

    this.group.add(this.rightLegPivot);
    this.hitboxes.push(this.rightLegMesh);

    // 4. 雙手真實持槍姿勢 (Two-handed Rifle Holding)
    this.armsPivot = new THREE.Group();
    this.armsPivot.position.set(0, 0.2, 0);
    this.upperBody.add(this.armsPivot);

    // 右手臂 (後方握把扣扳機)
    const armGeo = new THREE.BoxGeometry(0.11, 0.44, 0.12);
    this.rightArm = new THREE.Mesh(armGeo, this.jacketMat);
    this.rightArm.position.set(0.25, -0.06, 0.1);
    this.rightArm.rotation.set(-1.1, 0.25, -0.3);
    this.armsPivot.add(this.rightArm);

    // 左手臂 (前方斜出托槍護木)
    this.leftArm = new THREE.Mesh(armGeo, this.jacketMat);
    this.leftArm.position.set(-0.16, -0.1, 0.2);
    this.leftArm.rotation.set(-1.3, -0.4, 0.65);
    this.armsPivot.add(this.leftArm);

    // 5. 步槍模型 (擬真 AK-47 標誌剪影)
    this.weaponGroup = new THREE.Group();
    this.weaponGroup.position.set(0.16, -0.05, 0.42);
    this.weaponGroup.rotation.set(0, -0.08, 0);

    // 鋼製衝壓機匣
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.085, 0.36), this.gunMat);
    this.weaponGroup.add(gunBody);

    // 金屬槍管
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 8), this.gunMat);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0.018, 0.32);
    this.weaponGroup.add(gunBarrel);

    // 導氣管 (Gas Tube)
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 8), this.gunMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.038, 0.24);
    this.weaponGroup.add(gasTube);

    // 前準星座 (Front Sight Post)
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.042, 0.02), this.gunMat);
    frontSight.position.set(0, 0.04, 0.46);
    this.weaponGroup.add(frontSight);

    // 經典斜口槍口制退器 (Slant Muzzle)
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 8), this.gunMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.018, 0.51);
    this.weaponGroup.add(muzzle);

    // 俄式紅棕木質上下護木
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.075, 0.18), this.woodMat);
    handguard.position.set(0, 0.015, 0.14);
    this.weaponGroup.add(handguard);

    // 經典香蕉弧度鋼製彈匣 (帶加強筋)
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.17, 0.075), this.gunMat);
    mag.position.set(0, -0.11, 0.06);
    mag.rotation.x = 0.28;
    this.weaponGroup.add(mag);

    // 木質下斜槍托
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.095, 0.22), this.woodMat);
    stock.position.set(0, -0.015, -0.25);
    stock.rotation.x = -0.12;
    this.weaponGroup.add(stock);

    this.armsPivot.add(this.weaponGroup);

    // 槍口射擊座標 (世界相對起點)
    this.muzzleLocal = new THREE.Vector3(0.16, 1.32, 0.96);

    // 槍火光 (星形平面)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true });
    this.flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), flashMat);
    this.flashMesh.position.set(0.16, 1.32, 0.9);
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
    // 在出生點半徑 10m 內隨機巡邏點 (高度隨地面自適應)
    const angle = Math.random() * Math.PI * 2;
    const dist = 3.0 + Math.random() * 8.0;
    return new THREE.Vector3(
      this.spawnPos.x + Math.cos(angle) * dist,
      0,
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

    // 受傷泛紅與物理硬直後仰震顫 (Flinch)
    this.flashRed();
    this.flinchAmount = Math.min(0.35, this.flinchAmount + 0.2);

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
    if (this.jacketMat) this.jacketMat.color.setHex(0xff2222);
    if (this.skinMat) this.skinMat.color.setHex(0xff0000);
    setTimeout(() => {
      if (this.jacketMat) this.jacketMat.color.setHex(0x823b1c);
      if (this.skinMat) this.skinMat.color.setHex(0x232529);
    }, 120);
  }

  /**
   * 遭受閃光彈致盲 (延長至 5.5 秒，高度還原 CS 逼真致盲體驗)
   */
  applyFlash(duration = 5.5) {
    if (this.isDead) return;
    this.isFlashed = true;
    this.flashTimer = Math.max(this.flashTimer, duration);

    // 雙手高舉遮眼恐慌姿勢 (Cover eyes panic pose)
    if (this.armsPivot) {
      this.armsPivot.rotation.x = 1.0;
      this.armsPivot.rotation.z = -0.5;
    }
  }

  die(isHeadshot = false) {
    this.isDead = true;
    this.respawnTimer = 4.0; // 4 秒後重生
    this.isFlashed = false;
    this.flashTimer = 0;
    this.isCrouching = false;
    this.flinchAmount = 0;

    // 倒地姿勢 (自然向後倒臥於地面)
    this.group.rotation.x = -Math.PI / 2;
    if (this.upperBody) {
      this.upperBody.position.y = 0.25;
      this.upperBody.rotation.x = 0;
    }
    this.uiSprite.visible = false;
    this.flashMesh.visible = false;
    this.resetLegs();

    if (this.onKilled) {
      this.onKilled(this, isHeadshot);
    }
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.isFlashed = false;
    this.flashTimer = 0;
    this.isCrouching = false;
    this.flinchAmount = 0;
    if (this.upperBody) {
      this.upperBody.position.y = 1.15;
      this.upperBody.rotation.x = 0;
    }
    if (this.armsPivot) {
      this.armsPivot.rotation.set(0, 0, 0);
    }
    this.group.position.copy(this.spawnPos);
    this.group.rotation.set(0, Math.random() * Math.PI * 2, 0);
    this.uiSprite.visible = true;
    this.renderUI();
    this.currentWaypoint = this.getRandomWaypoint();
  }

  update(delta, playerPos, isPlayerAlive = true, grenadeSystem = null) {
    if (this.isDead) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    const now = performance.now() * 0.001;

    // 1. 每幀進行地形與重力貼地檢測 (超堅固防禦，杜絕浮空與 undefined 崩潰)
    this.snapToGround(delta);

    // 2. 熄滅槍火
    if (this.flashMesh.visible && now > this.flashOffTime) {
      this.flashMesh.visible = false;
    }

    // 3. 處理閃光彈致盲倒數
    if (this.isFlashed) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.isFlashed = false;
        this.flashTimer = 0;
        if (this.armsPivot) {
          this.armsPivot.rotation.set(0, 0, 0);
        }
      } else {
        // 致盲慌亂狀態：手臂擋光、原地無助盲晃、不追蹤玩家
        this.resetLegs();
        this.group.rotation.y += Math.sin(now * 6) * delta * 1.5;
        return;
      }
    }

    // 4. 受傷硬直後仰平滑回彈 (Hit Flinch Smoothing)
    if (this.flinchAmount > 0) {
      this.flinchAmount = Math.max(0, this.flinchAmount - delta * 3.5);
    }
    if (this.upperBody) {
      this.upperBody.rotation.x = -this.flinchAmount;
    }

    // 5. 蹲下壓槍平滑過渡 (Crouch Smoothing)
    const targetUpperY = this.isCrouching ? 0.85 : 1.15;
    if (this.upperBody) {
      this.upperBody.position.y += (targetUpperY - this.upperBody.position.y) * Math.min(delta * 12, 1);
    }

    // 6. 計算與玩家之距離與視線遮擋 (含實體掩體與煙霧彈阻隔)
    const distToPlayer = this.group.position.distanceTo(playerPos);
    const canSeePlayer = isPlayerAlive && distToPlayer < 40 && this.hasLineOfSight(playerPos, grenadeSystem);

    // AI 狀態機轉換 (必須存活、距離 40m 內且視線無障礙物/無煙霧遮擋才進入 COMBAT)
    if (canSeePlayer) {
      this.state = 'COMBAT';
    } else {
      this.state = 'PATROL';
    }

    if (this.state === 'COMBAT') {
      this.updateCombat(delta, playerPos, distToPlayer, now);
    } else {
      this.isCrouching = false;
      this.updatePatrol(delta, now);
    }
  }

  /**
   * 檢查 Bot 是否能直接看見玩家 (避免穿牆偵測與穿透煙霧彈)
   */
  hasLineOfSight(playerPos, grenadeSystem = null) {
    const eyePos = this.group.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const targetPos = playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));
    const dir = targetPos.clone().sub(eyePos);
    const dist = dir.length();
    if (dist < 0.2) return true;
    dir.normalize();

    // 1. 檢查煙霧彈阻隔 (Smoke Block)
    if (grenadeSystem && typeof grenadeSystem.isLineBlockedBySmoke === 'function') {
      if (grenadeSystem.isLineBlockedBySmoke(eyePos, targetPos)) {
        return false; // 視線被濃密煙霧彈阻隔！
      }
    }

    // 2. 檢查實體牆面與掩體
    if (this.worldCollision) {
      const ray = new THREE.Ray(eyePos, dir);
      const hit = this.worldCollision.rayIntersect(ray);
      if (hit && hit.distance < dist - 0.4) {
        return false; // 被掩體或牆壁遮擋
      }
    }

    return true;
  }

  /**
   * 透過八叉樹 (Octree) 進行垂直地面求交，確保 Bot 雙腳永遠緊貼地面、斜坡與平台
   */
  snapToGround(delta) {
    if (!this.worldCollision || !this.group || !this.group.position) return;

    try {
      // 從 Bot 當前 XZ 上方 30m 垂直向下發射射線
      const downRay = new THREE.Ray(
        new THREE.Vector3(this.group.position.x, 30, this.group.position.z),
        new THREE.Vector3(0, -1, 0)
      );
      const hit = this.worldCollision.rayIntersect(downRay);

      if (hit) {
        let hitY = null;
        if (hit.point && typeof hit.point.y === 'number') {
          hitY = hit.point.y;
        } else if (hit.position && typeof hit.position.y === 'number') {
          hitY = hit.position.y;
        } else if (typeof hit.distance === 'number') {
          hitY = 30 - hit.distance;
        }

        if (typeof hitY === 'number' && !isNaN(hitY)) {
          if (this.group.position.y > hitY) {
            // 重力下墜 (每秒 20m 墜地)
            this.group.position.y = Math.max(hitY, this.group.position.y - 20.0 * delta);
          } else {
            // 上階梯或上坡立即抬升
            this.group.position.y = hitY;
          }
        }
      }
    } catch (err) {
      // 靜默容錯，杜絕 Uncaught TypeError 崩潰
    }
  }

  updateCombat(delta, playerPos, distToPlayer, now) {
    // 轉向玩家 (僅圍繞 Y 軸旋轉，不抬頭仰角避免模型傾斜)
    const lookTarget = new THREE.Vector3(playerPos.x, this.group.position.y, playerPos.z);
    this.group.lookAt(lookTarget);

    // 行為模式：如果在連射開火，則急停並進行蹲姿壓槍 (Crouch Spray)
    if (this.isCrouching) {
      this.resetLegs();
    } else if (distToPlayer > 12) {
      // 距離較遠：向前壓進
      const dir = lookTarget.clone().sub(this.group.position).normalize();
      this.group.position.addScaledVector(dir, this.moveSpeed * delta);
      this.animateLegs(delta, this.moveSpeed);
    } else {
      // 近距離 (5~12m)：左右橫移急停對槍
      const strafeDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.group.quaternion);
      const strafeSpeed = Math.sin(now * 2.2) * 1.7;
      this.group.position.addScaledVector(strafeDir, strafeSpeed * delta);
      this.animateLegs(delta, Math.abs(strafeSpeed));
    }

    // 開火射擊玩家邏輯 (三連發點射 + 蹲下壓槍)
    if (now >= this.nextBurstTime) {
      // 開火前夕：50% 機率急停蹲下壓槍
      if (this.burstCount === 0 && Math.random() < 0.6) {
        this.isCrouching = true;
      }

      if (now >= this.nextFireTime && this.burstCount < this.burstMax) {
        this.shootAtPlayer(playerPos, now);
        this.burstCount++;
        this.nextFireTime = now + this.fireRate;

        if (this.burstCount >= this.burstMax) {
          // 這一輪連發結束，起立並冷卻 1.2~1.8 秒
          this.burstCount = 0;
          this.isCrouching = false;
          this.nextBurstTime = now + 1.1 + Math.random() * 0.7;
        }
      }
    }
  }

  shootAtPlayer(playerPos, now) {
    // 點亮槍火
    this.flashMesh.visible = true;
    this.flashOffTime = now + 0.05;

    // 計算槍口在世界空間座標 (從武器前沿投射)
    const muzzleWorld = new THREE.Vector3();
    if (this.weaponGroup) {
      this.weaponGroup.getWorldPosition(muzzleWorld);
      const fwd = new THREE.Vector3(0, 0, 0.45).applyQuaternion(this.group.quaternion);
      muzzleWorld.add(fwd);
    } else {
      muzzleWorld.copy(this.group.position).add(new THREE.Vector3(0, 1.25, 0.5));
    }

    // 計算瞄準方向 (蹲下時散佈更緊湊)
    const aimSpread = this.isCrouching ? 0.045 : 0.075;
    const targetWithSpread = playerPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * aimSpread * 14,
      (Math.random() - 0.5) * aimSpread * 10 + 0.75, // 瞄準胸腹高度
      (Math.random() - 0.5) * aimSpread * 14
    ));

    const shootDir = targetWithSpread.clone().sub(muzzleWorld).normalize();

    // 檢查子彈是否被掩體或牆面阻擋 (杜絕隔牆射擊)
    const dist = muzzleWorld.distanceTo(playerPos);
    if (this.worldCollision) {
      const ray = new THREE.Ray(muzzleWorld, shootDir);
      const wallHit = this.worldCollision.rayIntersect(ray);
      if (wallHit && wallHit.distance < dist) {
        if (this.particleSystem) {
          this.particleSystem.createImpactEffect(wallHit.point, wallHit.normal);
          this.particleSystem.createTracer(muzzleWorld, wallHit.point);
        }
        return; // 被牆壁或掩體擋住，不對玩家造成傷害
      }
    }

    // 未被阻擋：發射曳光線至目標
    if (this.particleSystem) {
      this.particleSystem.createTracer(muzzleWorld, targetWithSpread);
    }

    // 隨距離與散佈判定命中率 (蹲下時命中率略高)
    const baseHitRate = this.isCrouching ? 0.42 : 0.32;
    const hitChance = Math.max(0.12, baseHitRate - dist * 0.007);
    if (Math.random() < hitChance) {
      if (this.onShootPlayer) {
        const damage = Math.round(11 + Math.random() * 11); // 單發 11~22 傷害
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
