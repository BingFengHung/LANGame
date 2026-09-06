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

    // 人體運動學動畫參數 (Procedural Locomotion Dynamics)
    this.walkAnimTimer = 0;
    this.baseTorsoY = 1.12;
    this.recoilKick = 0;       // 開火射擊後座力微揚
    this.currentYaw = 0;       // 平滑轉向 Yaw
    this.bankTilt = 0;         // 奔跑變向側身傾角
    this.isMoving = false;

    // 關節節點參照
    this.leftKneePivot = null;
    this.rightKneePivot = null;

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
    // 經典 CS 特勤/恐怖分子 (Phoenix Connexion / Elite Crew) 專業戰術材質
    this.jacketMat = new THREE.MeshStandardMaterial({ color: 0x6e2c14, roughness: 0.75 }); // 深棕紅耐磨戰術戰鬥服
    this.vestMat = new THREE.MeshStandardMaterial({ color: 0x1b2028, roughness: 0.65, metalness: 0.3 }); // 重裝防彈背心 (Plate Carrier)
    this.pouchMat = new THREE.MeshStandardMaterial({ color: 0x13171d, roughness: 0.85 }); // 戰術彈匣包
    this.beltMat = new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.9 }); // 勤務腰帶
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b323c, roughness: 0.8 }); // 戰術多袋作戰長褲
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0x18191d, roughness: 0.85 }); // Balaclava 蒙面頭套
    this.helmetMat = new THREE.MeshStandardMaterial({ color: 0x222a24, roughness: 0.5, metalness: 0.4 }); // FAST 戰術防彈頭盔 (軍綠消光)
    this.scarfMat = new THREE.MeshStandardMaterial({ color: 0x786d5c, roughness: 0.85 }); // 戰術防風圍巾 (Shemagh Scarf)
    this.faceSkinMat = new THREE.MeshStandardMaterial({ color: 0xd29d74, roughness: 0.6 }); // 真人面部皮膚肉色
    this.eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.2 }); // 眼白
    this.pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 }); // 瞳孔
    this.goggleMat = new THREE.MeshStandardMaterial({ color: 0x080a0e, roughness: 0.06, metalness: 0.96 }); // 防爆風鏡高反光鏡片
    this.goggleFrameMat = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.7 }); // 風鏡外框
    this.gunMat = new THREE.MeshStandardMaterial({ color: 0x161a22, roughness: 0.3, metalness: 0.9 }); // 步槍金屬
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x6e3819, roughness: 0.5 }); // 俄式胡桃木
    this.bootMat = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.85 }); // 重型軍靴
    this.padMat = new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.35, metalness: 0.3 }); // 硬殼護具
    this.gloveMat = new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.65 }); // 黑色防滑手套
    this.filterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.65 }); // 呼吸閥

    // ==========================================================
    // 1. 骨盆中樞與厚實下半身 (Pelvis, Hips & Tactical Cargo Pants)
    // 徹底消除兩腿之間的空隙與懸空感，打造厚實特勤軍褲
    // ==========================================================
    // 骨盆/臀部襠部 (Hips & Crotch - 倒梯形完整連接腰帶與大腿)
    const hipsGeo = new THREE.BoxGeometry(0.34, 0.20, 0.25);
    const hips = new THREE.Mesh(hipsGeo, this.pantsMat);
    hips.position.set(0, 0.74, 0);
    hips.castShadow = true;
    this.group.add(hips);

    // 襠部前檔三角形加強塊
    const crotchGeo = new THREE.CylinderGeometry(0.09, 0.05, 0.16, 8);
    const crotch = new THREE.Mesh(crotchGeo, this.pantsMat);
    crotch.position.set(0, 0.70, 0.04);
    crotch.castShadow = true;
    this.group.add(crotch);

    // 雙腿參數 (厚實戰術軍褲半徑 0.082~0.095m，緊湊自然間距)
    const legSpacing = 0.098; // 雙腿自然間距，絕不劈叉
    const thighGeo = new THREE.CylinderGeometry(0.092, 0.080, 0.36, 12);
    const calfGeo = new THREE.CylinderGeometry(0.076, 0.065, 0.36, 12);
    const cargoPocketGeo = new THREE.BoxGeometry(0.045, 0.16, 0.13);
    const kneepadGeo = new THREE.BoxGeometry(0.14, 0.12, 0.06);
    const bootFootGeo = new THREE.BoxGeometry(0.14, 0.13, 0.25);
    const bootSoleGeo = new THREE.BoxGeometry(0.145, 0.035, 0.26);

    // --- 左腿 (Left Leg) ---
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-legSpacing, 0.74, 0);

    // 左大腿
    this.leftLegMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    this.leftLegMesh.position.set(0, -0.18, 0);
    this.leftLegMesh.castShadow = true;
    this.leftLegMesh.userData = { bot: this, part: 'legs' };
    this.leftLegPivot.add(this.leftLegMesh);
    this.hitboxes.push(this.leftLegMesh);

    // 左大腿外側戰術大口袋 (Cargo Pocket)
    const leftPocket = new THREE.Mesh(cargoPocketGeo, this.pantsMat);
    leftPocket.position.set(-0.08, -0.16, 0.01);
    this.leftLegPivot.add(leftPocket);

    // 左膝關節樞軸 (Left Knee Pivot)
    this.leftKneePivot = new THREE.Group();
    this.leftKneePivot.position.set(0, -0.36, 0);
    this.leftLegPivot.add(this.leftKneePivot);

    // 左膝 X 型硬殼防護護膝 (Kneepad)
    const leftKneepad = new THREE.Mesh(kneepadGeo, this.padMat);
    leftKneepad.position.set(0, 0, 0.065);
    this.leftKneePivot.add(leftKneepad);

    // 左小腿
    const leftCalf = new THREE.Mesh(calfGeo, this.pantsMat);
    leftCalf.position.set(0, -0.18, 0);
    leftCalf.castShadow = true;
    this.leftKneePivot.add(leftCalf);

    // 左腳高筒突擊軍靴 (鞋身 + 齒輪厚鞋底)
    const leftBootFoot = new THREE.Mesh(bootFootGeo, this.bootMat);
    leftBootFoot.position.set(0, -0.32, 0.03);
    leftBootFoot.castShadow = true;
    this.leftKneePivot.add(leftBootFoot);

    const leftBootSole = new THREE.Mesh(bootSoleGeo, this.padMat);
    leftBootSole.position.set(0, -0.38, 0.035);
    this.leftKneePivot.add(leftBootSole);

    this.group.add(this.leftLegPivot);

    // --- 右腿 (Right Leg) ---
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(legSpacing, 0.74, 0);

    // 右大腿
    this.rightLegMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    this.rightLegMesh.position.set(0, -0.18, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegMesh.userData = { bot: this, part: 'legs' };
    this.rightLegPivot.add(this.rightLegMesh);
    this.hitboxes.push(this.rightLegMesh);

    // 右大腿外側戰術大口袋 (Cargo Pocket)
    const rightPocket = new THREE.Mesh(cargoPocketGeo, this.pantsMat);
    rightPocket.position.set(0.08, -0.16, 0.01);
    this.rightLegPivot.add(rightPocket);

    // 右膝關節樞軸 (Right Knee Pivot)
    this.rightKneePivot = new THREE.Group();
    this.rightKneePivot.position.set(0, -0.36, 0);
    this.rightLegPivot.add(this.rightKneePivot);

    // 右膝硬殼護膝
    const rightKneepad = new THREE.Mesh(kneepadGeo, this.padMat);
    rightKneepad.position.set(0, 0, 0.065);
    this.rightKneePivot.add(rightKneepad);

    // 右小腿
    const rightCalf = new THREE.Mesh(calfGeo, this.pantsMat);
    rightCalf.position.set(0, -0.18, 0);
    rightCalf.castShadow = true;
    this.rightKneePivot.add(rightCalf);

    // 右腳高筒軍靴
    const rightBootFoot = new THREE.Mesh(bootFootGeo, this.bootMat);
    rightBootFoot.position.set(0, -0.32, 0.03);
    rightBootFoot.castShadow = true;
    this.rightKneePivot.add(rightBootFoot);

    const rightBootSole = new THREE.Mesh(bootSoleGeo, this.padMat);
    rightBootSole.position.set(0, -0.38, 0.035);
    this.rightKneePivot.add(rightBootSole);

    this.group.add(this.rightLegPivot);

    // ==========================================================
    // 2. 上半身軀幹與重裝戰術防彈背心 (Torso & Tactical Vest)
    // 徹底蓋滿整個上身直至腰帶，杜絕裸露肚臍，身形魁梧倒三角
    // ==========================================================
    this.upperBody = new THREE.Group();
    this.upperBody.position.set(0, this.baseTorsoY, 0);
    this.group.add(this.upperBody);

    // 魁梧倒三角胸腔 (Chest - 寬 0.48m, 厚 0.28m)
    const chestGeo = new THREE.CylinderGeometry(0.25, 0.21, 0.46, 14);
    this.torsoMesh = new THREE.Mesh(chestGeo, this.jacketMat);
    this.torsoMesh.scale.set(1.0, 1.0, 0.74);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.userData = { bot: this, part: 'body' };
    this.upperBody.add(this.torsoMesh);
    this.hitboxes.push(this.torsoMesh);

    // 重型防彈背心主板 (Plate Carrier - 覆蓋整個胸腹，高 0.48m)
    const vestFront = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.08), this.vestMat);
    vestFront.position.set(0, -0.02, 0.12);
    vestFront.castShadow = true;
    this.upperBody.add(vestFront);

    const vestBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.08), this.vestMat);
    vestBack.position.set(0, -0.02, -0.12);
    vestBack.castShadow = true;
    this.upperBody.add(vestBack);

    // 兩側彈性腰封護腹帶 (Cummerbund)
    for (const sideX of [-0.21, 0.21]) {
      const sideCuff = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.24), this.vestMat);
      sideCuff.position.set(sideX, -0.1, 0);
      this.upperBody.add(sideCuff);
    }

    // 肩部厚實斜方肌與防護肩墊 (Shoulder Armor Pads - 肩寬延伸至 0.52m)
    for (const sx of [-0.21, 0.21]) {
      const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), this.vestMat);
      shoulderPad.position.set(sx, 0.22, 0);
      this.upperBody.add(shoulderPad);
    }

    // 胸前三聯 AK-47 彈匣快拔包 (Triple Mag Pouches)
    for (let p = -1; p <= 1; p++) {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.17, 0.06), this.pouchMat);
      pouch.position.set(p * 0.105, -0.06, 0.17);
      this.upperBody.add(pouch);
    }

    // 胸前戰術通訊手咪與對講機 (Radio & Mic)
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.045), this.pouchMat);
    radio.position.set(-0.16, 0.13, 0.16);
    this.upperBody.add(radio);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.13, 4), this.gunMat);
    antenna.position.set(-0.16, 0.24, 0.16);
    this.upperBody.add(antenna);

    // 戰術勤務腰帶 (Duty Belt - 位於背心下沿與臀部連接處)
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 14), this.beltMat);
    belt.scale.set(1.0, 1.0, 0.74);
    belt.position.set(0, -0.32, 0);
    this.upperBody.add(belt);

    // 側腰快拔手槍槍套 (Sidearm Holster)
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.1), this.beltMat);
    holster.position.set(0.23, -0.34, 0.02);
    this.upperBody.add(holster);

    // 脖子周圍厚實戰術圍巾 (Tactical Shemagh Collar - 徹底消除細棒脖子)
    const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.045, 8, 16), this.scarfMat);
    scarfCollar.rotation.x = Math.PI / 2;
    scarfCollar.position.set(0, 0.25, 0.02);
    this.upperBody.add(scarfCollar);

    // ==========================================================
    // 3. 特戰 FAST 戰術頭盔、面罩與防爆風鏡 (FAST Helmet, Balaclava & Goggles)
    // ==========================================================
    // 頭部中樞 (Head Group)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.44, 0);
    this.upperBody.add(headGroup);

    // 面罩頭部本體 (Head with Balaclava)
    const headGeo = new THREE.SphereGeometry(0.13, 16, 14);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.scale.set(0.92, 1.15, 1.05);
    this.headMesh.castShadow = true;
    this.headMesh.userData = { bot: this, part: 'head' };
    headGroup.add(this.headMesh);
    this.hitboxes.push(this.headMesh);

    // FAST 戰術防彈頭盔 (Tactical High-Cut Helmet)
    const helmetGeo = new THREE.SphereGeometry(0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const helmet = new THREE.Mesh(helmetGeo, this.helmetMat);
    helmet.scale.set(0.96, 1.05, 1.08);
    helmet.position.set(0, 0.03, -0.01);
    helmet.castShadow = true;
    headGroup.add(helmet);

    // 頭盔前額夜視儀墨魚干基座 (NVG Shroud)
    const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), this.padMat);
    nvgMount.position.set(0, 0.08, 0.145);
    headGroup.add(nvgMount);

    // 頭盔兩側戰術導軌 (ARC Rails)
    for (const rx of [-0.135, 0.135]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.11), this.padMat);
      rail.position.set(rx, 0.04, 0.01);
      headGroup.add(rail);
    }

    // 面罩眼部挖空處皮膚 (Skin Opening)
    const faceSkin = new THREE.Mesh(new THREE.PlaneGeometry(0.135, 0.048), this.faceSkinMat);
    faceSkin.position.set(0, 0.015, 0.132);
    headGroup.add(faceSkin);

    // 黑白分明雙眼 (Eyes)
    for (const eyeX of [-0.035, 0.035]) {
      const eyeWhite = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.014), this.eyeWhiteMat);
      eyeWhite.position.set(eyeX, 0.015, 0.133);
      headGroup.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.012), this.pupilMat);
      pupil.position.set(eyeX, 0.015, 0.134);
      headGroup.add(pupil);
    }

    // 大號特種戰術防爆風鏡 (Tactical Goggles with Elastic Strap)
    const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.068, 0.04), this.goggleFrameMat);
    goggleFrame.position.set(0, 0.03, 0.125);
    headGroup.add(goggleFrame);

    const goggleLens = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.01), this.goggleMat);
    goggleLens.position.set(0, 0.03, 0.146);
    headGroup.add(goggleLens);

    // 風鏡彈性束帶 (圍繞頭部兩側)
    for (const bx of [-0.13, 0.13]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.18), this.goggleFrameMat);
      band.position.set(bx, 0.03, 0);
      headGroup.add(band);
    }

    // 立體呼吸過濾閥
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.038, 10), this.filterMat);
    filter.rotation.x = Math.PI / 2;
    filter.position.set(0, -0.06, 0.14);
    headGroup.add(filter);

    // ==========================================================
    // 4. 標準第三人稱步槍架持姿態 (AK-47 Tactical Rifle Stance)
    // 槍托抵於右肩前、雙臂自然向前展開瞄準，絕不縮在懷中
    // ==========================================================
    this.armsPivot = new THREE.Group();
    this.armsPivot.position.set(0, 0.18, 0);
    this.upperBody.add(this.armsPivot);

    const upperArmGeo = new THREE.CylinderGeometry(0.054, 0.048, 0.26, 10);
    const forearmGeo = new THREE.CylinderGeometry(0.048, 0.040, 0.26, 10);
    const elbowPadGeo = new THREE.BoxGeometry(0.085, 0.085, 0.055);

    // --- 右手臂 (主手握把扣扳機) ---
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.25, 0, 0);

    // 右大臂 (從右肩自然外展向前延伸)
    const rightUpperArm = new THREE.Mesh(upperArmGeo, this.jacketMat);
    rightUpperArm.position.set(0, -0.09, 0.08);
    rightUpperArm.rotation.set(-0.85, 0.25, -0.2);
    this.rightArmGroup.add(rightUpperArm);

    // 右前臂 (向前伸出握住握把)
    const rightForearm = new THREE.Mesh(forearmGeo, this.jacketMat);
    rightForearm.position.set(-0.06, -0.16, 0.24);
    rightForearm.rotation.set(-1.25, 0.35, -0.35);
    this.rightArmGroup.add(rightForearm);

    const rightElbow = new THREE.Mesh(elbowPadGeo, this.padMat);
    rightElbow.position.set(0.01, -0.13, 0.14);
    this.rightArmGroup.add(rightElbow);

    // 右手套
    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.085), this.gloveMat);
    rightGlove.position.set(-0.11, -0.21, 0.35);
    this.rightArmGroup.add(rightGlove);

    this.armsPivot.add(this.rightArmGroup);

    // --- 左手臂 (副手托住槍管護木) ---
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.25, 0, 0);

    // 左大臂 (向左前下方展開)
    const leftUpperArm = new THREE.Mesh(upperArmGeo, this.jacketMat);
    leftUpperArm.position.set(0.04, -0.1, 0.09);
    leftUpperArm.rotation.set(-0.7, -0.3, 0.35);
    this.leftArmGroup.add(leftUpperArm);

    // 左前臂 (斜向右上托木質護木)
    const leftForearm = new THREE.Mesh(forearmGeo, this.jacketMat);
    leftForearm.position.set(0.18, -0.15, 0.28);
    leftForearm.rotation.set(-1.35, -0.4, 0.65);
    this.leftArmGroup.add(leftForearm);

    const leftElbow = new THREE.Mesh(elbowPadGeo, this.padMat);
    leftElbow.position.set(0.06, -0.14, 0.15);
    this.leftArmGroup.add(leftElbow);

    // 左手套 (托住槍身下護木)
    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.085), this.gloveMat);
    leftGlove.position.set(0.31, -0.18, 0.44);
    this.leftArmGroup.add(leftGlove);

    this.armsPivot.add(this.leftArmGroup);

    // ==========================================================
    // 5. 步槍本體 (AK-47 完整真實比例 0.82m)
    // 槍托頂於右肩、槍口水平筆直朝前，香蕉彈匣與木質護木一目了然
    // ==========================================================
    this.weaponGroup = new THREE.Group();
    this.weaponGroup.position.set(0.14, -0.05, 0.48); // 槍身向前推出，完全展現在體外
    this.weaponGroup.rotation.set(0, -0.05, 0);

    // 鋼製衝壓機匣
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.088, 0.40), this.gunMat);
    this.weaponGroup.add(gunBody);

    // 金屬長槍管
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.42, 8), this.gunMat);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0.02, 0.38);
    this.weaponGroup.add(gunBarrel);

    // 導氣管
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.26, 8), this.gunMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.042, 0.28);
    this.weaponGroup.add(gasTube);

    // 前準星座
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.046, 0.02), this.gunMat);
    frontSight.position.set(0, 0.044, 0.52);
    this.weaponGroup.add(frontSight);

    // 45 度經典斜口槍口制退器 (Slant Muzzle)
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 8), this.gunMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.02, 0.58);
    this.weaponGroup.add(muzzle);

    // 俄式紅棕木質上下護木
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.078, 0.22), this.woodMat);
    handguard.position.set(0, 0.016, 0.16);
    this.weaponGroup.add(handguard);

    // 30 發弧形香蕉鋼製彈匣 (超醒目 CS AK 特徵)
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.18, 0.08), this.gunMat);
    mag.position.set(0, -0.12, 0.07);
    mag.rotation.x = 0.3;
    this.weaponGroup.add(mag);

    // 木質下斜槍托 (抵在右肩前)
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.096, 0.26), this.woodMat);
    stock.position.set(0, -0.018, -0.30);
    stock.rotation.x = -0.12;
    this.weaponGroup.add(stock);

    this.armsPivot.add(this.weaponGroup);

    // 槍火光 (星形十字)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true });
    this.flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), flashMat);
    this.flashMesh.position.set(0.14, 1.28, 1.15); // 位於槍口前方
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
      if (this.jacketMat) this.jacketMat.color.setHex(0x7c3418);
      if (this.skinMat) this.skinMat.color.setHex(0x1e2025);
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
    this.deathProgress = 0.0; // 啟動真實跪倒後仰摔倒動畫
    this.isFlashed = false;
    this.flashTimer = 0;
    this.isCrouching = false;
    this.flinchAmount = 0;
    this.recoilKick = 0;

    this.uiSprite.visible = false;
    this.flashMesh.visible = false;

    if (this.onKilled) {
      this.onKilled(this, isHeadshot);
    }
  }

  respawn() {
    this.isDead = false;
    this.deathProgress = 1.0;
    this.hp = this.maxHp;
    this.isFlashed = false;
    this.flashTimer = 0;
    this.isCrouching = false;
    this.flinchAmount = 0;
    this.recoilKick = 0;
    this.walkAnimTimer = 0;

    if (this.upperBody) {
      this.upperBody.position.set(0, this.baseTorsoY, 0);
      this.upperBody.rotation.set(0, 0, 0);
    }
    if (this.armsPivot) {
      this.armsPivot.position.set(0, 0.16, 0);
      this.armsPivot.rotation.set(0, 0, 0);
    }
    this.resetLegs(1.0);

    this.group.position.copy(this.spawnPos);
    this.currentYaw = Math.random() * Math.PI * 2;
    this.group.rotation.set(0, this.currentYaw, 0);
    this.uiSprite.visible = true;
    this.renderUI();
    this.currentWaypoint = this.getRandomWaypoint();
  }

  update(delta, playerPos, isPlayerAlive = true, grenadeSystem = null) {
    if (this.isDead) {
      // 陣亡倒地平滑物理動畫 (膝蓋前跪、身軀癱軟後倒)
      if (this.deathProgress < 1.0) {
        this.deathProgress += delta * 3.5;
        const p = Math.min(1.0, this.deathProgress);
        const ease = p * (2 - p); // 平滑曲線

        this.group.rotation.x = -ease * (Math.PI / 2);
        if (this.upperBody) {
          this.upperBody.position.y = this.baseTorsoY * (1.0 - ease * 0.7);
        }
        if (this.leftKneePivot) this.leftKneePivot.rotation.x = ease * 0.9;
        if (this.rightKneePivot) this.rightKneePivot.rotation.x = ease * 1.1;
      }

      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    const now = performance.now() * 0.001;

    // 1. 每幀進行地形與重力貼地檢測 (超堅固防禦)
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
        this.resetLegs(delta);
        this.group.rotation.y += Math.sin(now * 6) * delta * 1.5;
        return;
      }
    }

    // 4. 受傷硬直後仰平滑回彈 (Hit Flinch Smoothing)
    if (this.flinchAmount > 0) {
      this.flinchAmount = Math.max(0, this.flinchAmount - delta * 4.0);
    }

    // 5. 開火後座力微挫阻尼回彈 (Recoil Spring Damping)
    if (this.recoilKick > 0) {
      this.recoilKick += (0 - this.recoilKick) * Math.min(delta * 18, 1);
    }

    // 6. 整合受擊與後座力至上半身
    if (this.upperBody) {
      this.upperBody.rotation.x = -this.flinchAmount + this.recoilKick * 0.22;
    }
    if (this.armsPivot) {
      this.armsPivot.position.z = -this.recoilKick * 0.12;
    }

    // 7. 蹲下壓槍平滑過渡 (Crouch Smoothing)
    const targetUpperY = this.isCrouching ? 0.85 : this.baseTorsoY;
    if (this.upperBody) {
      this.upperBody.position.y += (targetUpperY - this.upperBody.position.y) * Math.min(delta * 12, 1);
    }

    // 8. 計算與玩家之距離與視線遮擋 (含實體掩體與煙霧彈阻隔)
    const distToPlayer = this.group.position.distanceTo(playerPos);
    const canSeePlayer = isPlayerAlive && distToPlayer < 40 && this.hasLineOfSight(playerPos, grenadeSystem);

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
        return false;
      }
    }

    // 2. 檢查實體牆面與掩體
    if (this.worldCollision) {
      const ray = new THREE.Ray(eyePos, dir);
      const hit = this.worldCollision.rayIntersect(ray);
      if (hit && hit.distance < dist - 0.4) {
        return false;
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
            this.group.position.y = Math.max(hitY, this.group.position.y - 20.0 * delta);
          } else {
            this.group.position.y = hitY;
          }
        }
      }
    } catch (err) {
      // 靜默容錯
    }
  }

  /**
   * 戰鬥行為模式：平滑瞄準轉向、雙向急停橫移、下蹲壓槍與開火後座力
   */
  updateCombat(delta, playerPos, distToPlayer, now) {
    // 1. 平滑轉向玩家 (Smooth Look Rotation with Slerp)
    const toPlayer = playerPos.clone().sub(this.group.position);
    toPlayer.y = 0;
    if (toPlayer.lengthSq() > 0.001) {
      const targetYaw = Math.atan2(toPlayer.x, toPlayer.z);
      let diffYaw = targetYaw - this.currentYaw;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;

      this.currentYaw += diffYaw * Math.min(delta * 14, 1);
      this.group.rotation.y = this.currentYaw;

      // 急速轉動時的身體側傾角度 (Bank Lean)
      const targetBank = Math.max(-0.08, Math.min(0.08, -diffYaw * 0.3));
      this.bankTilt += (targetBank - this.bankTilt) * Math.min(delta * 10, 1);
      this.group.rotation.z = this.bankTilt;
    }

    // 2. 移動邏輯
    if (this.isCrouching) {
      this.resetLegs(delta);
    } else if (distToPlayer > 12) {
      // 遠距離：持槍衝刺壓進
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
      this.group.position.addScaledVector(fwd, this.moveSpeed * delta);
      this.animateLocomotion(delta, this.moveSpeed, false);
    } else {
      // 近距離 (5~12m)：左右橫移急停對槍 (Strafe Shooting)
      const strafeDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.group.quaternion);
      const strafeSpeed = Math.sin(now * 2.2) * 1.8;
      this.group.position.addScaledVector(strafeDir, strafeSpeed * delta);
      this.animateLocomotion(delta, Math.abs(strafeSpeed), true);
    }

    // 3. 連發點射與下蹲壓槍
    if (now >= this.nextBurstTime) {
      if (this.burstCount === 0 && Math.random() < 0.55) {
        this.isCrouching = true;
      }

      if (now >= this.nextFireTime && this.burstCount < this.burstMax) {
        this.shootAtPlayer(playerPos, now);
        this.burstCount++;
        this.nextFireTime = now + this.fireRate;

        if (this.burstCount >= this.burstMax) {
          this.burstCount = 0;
          this.isCrouching = false;
          this.nextBurstTime = now + 1.0 + Math.random() * 0.6;
        }
      }
    }
  }

  /**
   * 射擊開火：點亮槍火、施加後座力微衝擊、發射曳光線與傷害判定
   */
  shootAtPlayer(playerPos, now) {
    this.flashMesh.visible = true;
    this.flashOffTime = now + 0.05;

    // 觸發人體開火後座力微揚 (Recoil Impulse)
    this.recoilKick = 0.16;

    // 計算槍口在世界空間座標
    const muzzleWorld = new THREE.Vector3();
    if (this.weaponGroup) {
      this.weaponGroup.getWorldPosition(muzzleWorld);
      const fwd = new THREE.Vector3(0, 0, 0.45).applyQuaternion(this.group.quaternion);
      muzzleWorld.add(fwd);
    } else {
      muzzleWorld.copy(this.group.position).add(new THREE.Vector3(0, 1.25, 0.5));
    }

    const aimSpread = this.isCrouching ? 0.042 : 0.072;
    const targetWithSpread = playerPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * aimSpread * 14,
      (Math.random() - 0.5) * aimSpread * 10 + 0.72,
      (Math.random() - 0.5) * aimSpread * 14
    ));

    const shootDir = targetWithSpread.clone().sub(muzzleWorld).normalize();
    const dist = muzzleWorld.distanceTo(playerPos);

    if (this.worldCollision) {
      const ray = new THREE.Ray(muzzleWorld, shootDir);
      const wallHit = this.worldCollision.rayIntersect(ray);
      if (wallHit && wallHit.distance < dist) {
        if (this.particleSystem) {
          this.particleSystem.createImpactEffect(wallHit.point, wallHit.normal);
          this.particleSystem.createTracer(muzzleWorld, wallHit.point);
        }
        return;
      }
    }

    if (this.particleSystem) {
      this.particleSystem.createTracer(muzzleWorld, targetWithSpread);
    }

    const baseHitRate = this.isCrouching ? 0.44 : 0.34;
    const hitChance = Math.max(0.12, baseHitRate - dist * 0.007);
    if (Math.random() < hitChance) {
      if (this.onShootPlayer) {
        const damage = Math.round(11 + Math.random() * 11);
        this.onShootPlayer(this, damage);
      }
    }
  }

  /**
   * 巡邏模式：平滑移動與自然行走擺臂
   */
  updatePatrol(delta, now) {
    const toWaypoint = this.currentWaypoint.clone().sub(this.group.position);
    toWaypoint.y = 0;
    const dist = toWaypoint.length();

    if (dist < 1.0) {
      this.resetLegs(delta);
      this.patrolWaitTimer += delta;
      if (this.patrolWaitTimer > 2.0) {
        this.currentWaypoint = this.getRandomWaypoint();
        this.patrolWaitTimer = 0;
      }
    } else {
      toWaypoint.normalize();

      // 平滑轉向巡邏目標
      const targetYaw = Math.atan2(toWaypoint.x, toWaypoint.z);
      let diffYaw = targetYaw - this.currentYaw;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
      this.currentYaw += diffYaw * Math.min(delta * 8, 1);
      this.group.rotation.y = this.currentYaw;

      const patrolSpeed = this.moveSpeed * 0.65;
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
      this.group.position.addScaledVector(fwd, patrolSpeed * delta);
      this.animateLocomotion(delta, patrolSpeed, false);
    }
  }

  /**
   * 人體骨骼級動力學步態模擬 (Two-Segment Leg Flexion & Torso Bounce)
   * 徹底告別直挺挺木偶直線擺動，還原真實跑步膝關節折疊與身體起伏
   */
  animateLocomotion(delta, speed, isStrafe = false) {
    this.walkAnimTimer += delta * Math.max(speed, 1.2) * 3.8;

    // 1. 大腿前後擺動 (Thigh Forward/Backward Swing)
    const thighAngle = Math.sin(this.walkAnimTimer) * 0.52;
    this.leftLegPivot.rotation.x = thighAngle;
    this.rightLegPivot.rotation.x = -thighAngle;

    // 2. 雙膝關節反向彎曲折起 (Knee Joint Flexion)
    // 當大腿向後蹬 (thighAngle < 0)，膝蓋向後自然屈起折疊；當大腿前邁 (thighAngle > 0)，小腿在落地前自動伸直！
    const leftKneeBend = Math.max(0, -thighAngle) * 0.85;
    const rightKneeBend = Math.max(0, thighAngle) * 0.85;
    if (this.leftKneePivot) this.leftKneePivot.rotation.x = leftKneeBend;
    if (this.rightKneePivot) this.rightKneePivot.rotation.x = rightKneeBend;

    // 3. 骨盆與上半身垂直起伏彈跳 (Pelvis Bounce / Torso Bobbing)
    // 跑步時重心在雙腳交替時週期性下沉，賦予模型真實人體質量感！
    const bounce = Math.abs(Math.sin(this.walkAnimTimer * 2)) * 0.052;
    const targetY = (this.isCrouching ? 0.85 : this.baseTorsoY) - bounce;
    this.upperBody.position.y += (targetY - this.upperBody.position.y) * Math.min(delta * 16, 1);

    // 4. 重心左右橫擺與脊柱反向扭動 (Pelvis Roll & Spine Counter-Twist)
    const pelvisRoll = Math.sin(this.walkAnimTimer) * 0.035;
    this.upperBody.rotation.z = pelvisRoll;
    this.upperBody.rotation.y = -Math.sin(this.walkAnimTimer) * 0.055;

    // 5. 雙手持槍隨步伐呼吸晃動
    if (this.armsPivot) {
      this.armsPivot.position.y = 0.16 + Math.cos(this.walkAnimTimer * 2) * 0.018;
      this.armsPivot.position.x = Math.sin(this.walkAnimTimer) * 0.012;
    }
  }

  /**
   * 平滑恢復站立或蹲姿 (Smooth Transition to Neutral Idle)
   */
  resetLegs(delta = 0.016) {
    const smooth = Math.min(delta * 12, 1);
    this.leftLegPivot.rotation.x += (0 - this.leftLegPivot.rotation.x) * smooth;
    this.rightLegPivot.rotation.x += (0 - this.rightLegPivot.rotation.x) * smooth;
    if (this.leftKneePivot) this.leftKneePivot.rotation.x += (0 - this.leftKneePivot.rotation.x) * smooth;
    if (this.rightKneePivot) this.rightKneePivot.rotation.x += (0 - this.rightKneePivot.rotation.x) * smooth;
    if (this.upperBody) {
      this.upperBody.rotation.z += (0 - this.upperBody.rotation.z) * smooth;
      this.upperBody.rotation.y += (0 - this.upperBody.rotation.y) * smooth;
    }
    if (this.armsPivot) {
      this.armsPivot.position.set(0, 0.16, 0);
    }
    this.group.rotation.z += (0 - this.group.rotation.z) * smooth;
  }

  getHitboxes() {
    return this.hitboxes;
  }
}
