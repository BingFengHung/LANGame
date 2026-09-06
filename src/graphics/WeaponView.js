import * as THREE from 'three';

export class WeaponView {
  constructor(viewmodelScene) {
    this.viewmodelScene = viewmodelScene;
    this.gunPivot = new THREE.Group();
    this.viewmodelScene.add(this.gunPivot);

    // 武器定位
    this.defaultPos = new THREE.Vector3(0.18, -0.16, -0.35);
    this.gunPivot.position.copy(this.defaultPos);

    // 後座力位移與回彈
    this.kickOffset = new THREE.Vector3();
    this.kickRotation = new THREE.Euler();

    // 換槍切換動畫
    this.switchProgress = 1.0;
    this.isSwitching = false;

    // 武器模型容器
    this.weaponModels = {};
    this.currentWeaponId = null;

    // 小刀與投擲物專屬動畫計時器
    this.knifeAnimType = null; // 'slash' | 'stab'
    this.knifeAnimProgress = 1.0;
    this.throwAnimProgress = 1.0;

    // 槍口火花
    this.muzzleFlash = null;
    this.flashTimer = 0;

    // 特警第一人稱戰術手臂與手套材質 (SWAT Tactical Combat Sleeves & Carbon Knuckle Gloves)
    this.armMats = {
      sleeve: new THREE.MeshStandardMaterial({ color: 0x222631, roughness: 0.88, metalness: 0.08 }), // 深灰海軍藍特警服
      cuff: new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.8, metalness: 0.2 }),     // 手腕魔鬼氈袖口
      glove: new THREE.MeshStandardMaterial({ color: 0x18191e, roughness: 0.68, metalness: 0.12 }),  // 黑色防滑山羊皮
      knuckle: new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.32, metalness: 0.45 }),// 碳纖維防護硬殼
      skin: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.8 })                        // 戰術手套內襯深色
    };

    this.initModels();
    this.initMuzzleFlash();
    this.setWeapon('ak47');
  }

  /**
   * 建立特警第一人稱戰術手臂與手套模型 (手臂、手腕袖口、手掌、碳纖維指節護板與手指關節)
   */
  createArmModel(isLeft = false, pose = 'rifle') {
    const armGroup = new THREE.Group();

    // 1. 小臂與特警防撕裂戰鬥服袖子 (Forearm & Sleeve)
    const forearmGeo = new THREE.CylinderGeometry(0.042, 0.052, 0.32, 12);
    const forearm = new THREE.Mesh(forearmGeo, this.armMats.sleeve);
    forearm.castShadow = true;
    forearm.receiveShadow = true;
    armGroup.add(forearm);

    // 袖口皺褶與手腕魔鬼氈收束帶 (Wrist Cuff Strap)
    const cuffGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.032, 12);
    const cuff = new THREE.Mesh(cuffGeo, this.armMats.cuff);
    cuff.position.set(0, 0.15, 0);
    armGroup.add(cuff);

    // 魔鬼氈調節扣 (Buckle)
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.018, 0.006), this.armMats.knuckle);
    buckle.position.set(isLeft ? -0.045 : 0.045, 0.15, 0);
    armGroup.add(buckle);

    // 2. 手掌主體 (Tactical Glove Palm)
    const handGroup = new THREE.Group();
    handGroup.position.set(0, 0.19, 0);

    const palmGeo = new THREE.BoxGeometry(0.052, 0.04, 0.056);
    const palm = new THREE.Mesh(palmGeo, this.armMats.glove);
    palm.castShadow = true;
    handGroup.add(palm);

    // 碳纖維指節硬殼防護板 (Carbon Knuckle Armor Protector)
    const knuckleArmor = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.014, 0.026),
      this.armMats.knuckle
    );
    knuckleArmor.position.set(0, 0.018, 0.016);
    knuckleArmor.rotation.x = -0.15;
    handGroup.add(knuckleArmor);

    // 4 個碳纖維小散熱孔凸點
    for (let i = -1.5; i <= 1.5; i += 1) {
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.005, 6), this.armMats.cuff);
      vent.position.set(i * 0.012, 0.024, 0.018);
      handGroup.add(vent);
    }

    // 3. 手指幾何體 (Fingers)
    // 拇指 (Thumb)
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.018, 0.038), this.armMats.glove);
    thumb.position.set(isLeft ? 0.028 : -0.028, 0.005, 0.015);
    thumb.rotation.y = isLeft ? 0.4 : -0.4;
    thumb.rotation.x = -0.2;
    handGroup.add(thumb);

    // 食指 (Trigger / Pointer Finger)
    const indexFinger = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.015, 0.044), this.armMats.glove);
    indexFinger.position.set(isLeft ? 0.016 : -0.016, 0.01, 0.036);
    handGroup.add(indexFinger);

    // 其餘三指 (中指、無名指、小指)
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.032, 0.038), this.armMats.glove);
    fingers.position.set(isLeft ? -0.01 : 0.01, -0.005, 0.035);
    fingers.rotation.x = 0.25; // 彎曲握拳感
    handGroup.add(fingers);

    armGroup.add(handGroup);
    armGroup.userData.handGroup = handGroup;
    return armGroup;
  }

  initModels() {
    this.weaponModels['ak47'] = this.buildAK47();
    this.weaponModels['deagle'] = this.buildDeagle();
    this.weaponModels['knife'] = this.buildKnife();
    this.weaponModels['he_grenade'] = this.buildHEGrenade();
    this.weaponModels['flashbang'] = this.buildFlashbang();
    this.weaponModels['smoke_grenade'] = this.buildSmokeGrenade();

    // 先全部隱藏
    for (const key in this.weaponModels) {
      this.weaponModels[key].visible = false;
      this.gunPivot.add(this.weaponModels[key]);
    }
  }

  buildAK47() {
    const group = new THREE.Group();
    // 工業級槍械材質
    const receiverMat = new THREE.MeshStandardMaterial({ color: 0x1c2127, roughness: 0.38, metalness: 0.85 }); // 衝壓冷鋼機匣
    const barrelSteelMat = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.28, metalness: 0.9 }); // 槍管高碳鋼
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c3a1e, roughness: 0.45, metalness: 0.05 }); // 俄羅斯紅棕胡桃層壓木
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x12151a, roughness: 0.5, metalness: 0.75 }); // 黑色小零件

    // 1. 衝壓機匣 (Receiver)
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.068, 0.31), receiverMat);
    group.add(receiver);

    // 機匣頂部圓弧防塵蓋 (Dust Cover with Ribs)
    const dustCover = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.28, 12, 1, false, 0, Math.PI), receiverMat);
    dustCover.rotation.z = Math.PI / 2;
    dustCover.rotation.y = Math.PI / 2;
    dustCover.position.set(0, 0.034, -0.01);
    group.add(dustCover);

    // 防塵蓋衝壓加強筋 (Ribs)
    for (let r = -2; r <= 2; r++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.0245, 0.002, 6, 12, Math.PI), receiverMat);
      rib.rotation.y = Math.PI / 2;
      rib.position.set(0, 0.034, r * 0.045);
      group.add(rib);
    }

    // 右側外露金屬拉機柄 (Charging Handle)
    const boltHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.028, 8), barrelSteelMat);
    boltHandle.rotation.z = Math.PI / 2;
    boltHandle.position.set(0.035, 0.018, -0.04);
    group.add(boltHandle);

    // 快慢機保險撥片 (Fire Selector)
    const selector = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.016, 0.11), darkMetalMat);
    selector.position.set(0.024, -0.005, 0.04);
    selector.rotation.z = 0.15;
    group.add(selector);

    // 2. 槍管總成與導氣系統 (Barrel & Gas System)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.32, 10), barrelSteelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.012, -0.31);
    group.add(barrel);

    // 導氣管 (Gas Tube)
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), barrelSteelMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.034, -0.22);
    group.add(gasTube);

    // 導氣箍 (Gas Block)
    const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.048, 0.032), darkMetalMat);
    gasBlock.position.set(0, 0.024, -0.32);
    group.add(gasBlock);

    // 經典 AK 45度斜口槍口制退器 (Slant Muzzle Brake)
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 10), barrelSteelMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.012, -0.48);
    // 斜切前端
    const slantCut = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), barrelSteelMat);
    slantCut.position.set(0, 0.022, -0.495);
    slantCut.rotation.x = 0.5;
    group.add(muzzle);

    // 前準星座與保護環 (Front Sight Block & Hood)
    const frontSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.045, 0.025), darkMetalMat);
    frontSightBase.position.set(0, 0.032, -0.44);
    group.add(frontSightBase);

    const sightHood = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0025, 6, 12, Math.PI * 1.5), darkMetalMat);
    sightHood.rotation.y = Math.PI / 2;
    sightHood.rotation.x = Math.PI / 4;
    sightHood.position.set(0, 0.055, -0.44);
    group.add(sightHood);

    const sightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.014, 6), darkMetalMat);
    sightPost.position.set(0, 0.052, -0.44);
    group.add(sightPost);

    // 槍管下方通條 (Cleaning Rod)
    const cleaningRod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.28, 6), darkMetalMat);
    cleaningRod.rotation.x = Math.PI / 2;
    cleaningRod.position.set(0, -0.004, -0.31);
    group.add(cleaningRod);

    // 後照門表尺座 (Rear Tangent Leaf Sight)
    const rearSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.022, 0.065), darkMetalMat);
    rearSightBase.position.set(0, 0.046, -0.13);
    group.add(rearSightBase);

    const rearSightLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.008, 0.05), darkMetalMat);
    rearSightLeaf.position.set(0, 0.055, -0.13);
    rearSightLeaf.rotation.x = -0.08;
    group.add(rearSightLeaf);

    // 3. 上下木質護木 (Laminated Wood Handguards)
    // 上護木
    const upperHandguard = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.155, 10, 1, false, 0, Math.PI), woodMat);
    upperHandguard.rotation.z = Math.PI / 2;
    upperHandguard.rotation.y = Math.PI / 2;
    upperHandguard.position.set(0, 0.035, -0.22);
    group.add(upperHandguard);

    // 下護木 (帶有雙側抓握指槽凹線)
    const lowerHandguard = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.046, 0.165), woodMat);
    lowerHandguard.position.set(0, 0.004, -0.22);
    group.add(lowerHandguard);

    // 4. 經典 30 發弧形香蕉鋼製彈匣 (Banana Magazine)
    const magGroup = new THREE.Group();
    magGroup.position.set(0, -0.03, -0.05);

    // 由 3 段微彎幾何拼接成真實香蕉弧度
    for (let s = 0; s < 3; s++) {
      const magSegment = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.07, 0.065), receiverMat);
      magSegment.position.set(0, -s * 0.055, -s * 0.018);
      magSegment.rotation.x = -0.24 - s * 0.08;
      magGroup.add(magSegment);

      // 彈匣外壁加強凸筋 (Ribs)
      const magRib = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.006, 0.06), darkMetalMat);
      magRib.position.copy(magSegment.position);
      magRib.rotation.copy(magSegment.rotation);
      magGroup.add(magRib);
    }
    group.add(magGroup);

    // 彈匣釋放卡榫 (Magazine Catch)
    const magCatch = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.022, 0.012), darkMetalMat);
    magCatch.position.set(0, -0.038, -0.008);
    magCatch.rotation.x = -0.3;
    group.add(magCatch);

    // 5. 彎曲扳機與護圈 (Trigger & Guard)
    const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 6, 12, Math.PI), darkMetalMat);
    triggerGuard.rotation.y = Math.PI / 2;
    triggerGuard.position.set(0, -0.046, 0.035);
    group.add(triggerGuard);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.018, 0.008), barrelSteelMat);
    trigger.position.set(0, -0.042, 0.032);
    trigger.rotation.x = 0.35;
    group.add(trigger);

    // 6. 木質下斜槍托 (Wooden Buttstock with Buttplate)
    const stockGroup = new THREE.Group();
    stockGroup.position.set(0, -0.01, 0.15);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.095, 0.2), woodMat);
    stock.position.set(0, -0.02, 0.09);
    stock.rotation.x = -0.14; // 經典下斜角度
    stockGroup.add(stock);

    // 金屬托底板 (Buttplate)
    const buttplate = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.105, 0.014), darkMetalMat);
    buttplate.position.set(0, -0.034, 0.19);
    buttplate.rotation.x = -0.14;
    stockGroup.add(buttplate);
    group.add(stockGroup);

    // 7. 電木/木質手槍形握把 (Pistol Grip)
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.11, 0.046), woodMat);
    grip.position.set(0, -0.082, 0.088);
    grip.rotation.x = 0.38;
    group.add(grip);

    // 8. 經典 CS 第一人稱特警雙臂持槍 (Tactical Dual Arms)
    // 右手臂 (握持握把、食指搭扳機)
    const rightArm = this.createArmModel(false, 'rifle_right');
    rightArm.position.set(0.045, -0.24, 0.16);
    rightArm.rotation.set(-0.75, 0.15, -0.2);
    group.add(rightArm);

    // 左手臂 (從左下方伸出托住下護木)
    const leftArm = this.createArmModel(true, 'rifle_left');
    leftArm.position.set(-0.08, -0.22, -0.12);
    leftArm.rotation.set(-0.65, -0.35, 0.4);
    group.add(leftArm);

    // 槍口發光定位點
    group.userData.muzzleOffset = new THREE.Vector3(0, 0.012, -0.52);
    return group;
  }

  buildDeagle() {
    const group = new THREE.Group();
    // 沙漠之鷹經典拉絲銀鉻與黑色軍規部件材質
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.94
    }); // 拋光不鏽鋼滑套
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.4,
      metalness: 0.8
    }); // 下機匣鍛造鋼
    const gripRubberMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.9
    }); // 握把防滑硬橡膠
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd69e2e,
      roughness: 0.3,
      metalness: 0.9
    }); // 槍膛與握把金色老鷹圓章

    // 1. 經典三角形/階梯截面重型滑套 (Slide & Heavy Barrel Housing)
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.052, 0.24), chromeMat);
    slide.position.set(0, 0.034, -0.06);
    group.add(slide);

    // 滑套頂部導軌階梯凸筋 (Top Step Rib)
    const topRib = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.23), chromeMat);
    topRib.position.set(0, 0.062, -0.06);
    group.add(topRib);

    // 滑套前部經典斜切角 (Front Chamfered Muzzle)
    const muzzleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.03, 8), chromeMat);
    muzzleCap.rotation.x = Math.PI / 2;
    muzzleCap.position.set(0, 0.034, -0.19);
    group.add(muzzleCap);

    // 巨大的 .50 Action Express 口徑空心槍膛 (Muzzle Bore)
    const boreOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.04, 12), darkSteelMat);
    boreOuter.rotation.x = Math.PI / 2;
    boreOuter.position.set(0, 0.034, -0.195);
    group.add(boreOuter);

    const boreHole = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.042, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    boreHole.rotation.x = Math.PI / 2;
    boreHole.position.set(0, 0.034, -0.196);
    group.add(boreHole);

    // 右側立體深陷拋殼窗 (Ejection Port)
    const portCut = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.028, 0.075), darkSteelMat);
    portCut.position.set(0.016, 0.042, -0.05);
    group.add(portCut);

    // 拋殼窗內部的金屬槍機 (Breech Block / Bolt)
    const boltFace = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 8), goldMat);
    boltFace.rotation.x = Math.PI / 2;
    boltFace.position.set(0.008, 0.038, -0.05);
    group.add(boltFace);

    // 滑套後方傾斜防滑排齒刻槽 (Slide Cocking Serrations)
    for (let s = -2; s <= 2; s++) {
      const serration = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.036, 0.005), darkSteelMat);
      serration.position.set(0, 0.034, 0.025 + s * 0.011);
      group.add(serration);
    }

    // 後方外露立體雙動擊錘 (Skeletonized Hammer)
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.028, 0.02), darkSteelMat);
    hammer.position.set(0, 0.045, 0.062);
    hammer.rotation.x = -0.45; // 待擊發張開角度
    group.add(hammer);

    // 前準星柱 (Front Blade Sight)
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.014, 0.018), darkSteelMat);
    frontSight.position.set(0, 0.074, -0.17);
    group.add(frontSight);

    // 後缺口照門 (Rear Notch Sight)
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.016, 0.018), darkSteelMat);
    rearSight.position.set(0, 0.074, 0.05);
    group.add(rearSight);

    // 2. 下槍身與戰術導軌 (Lower Frame with Picatinny Rail)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.036, 0.2), darkSteelMat);
    frame.position.set(0, -0.004, -0.05);
    group.add(frame);

    // 槍管下方戰術導軌槽 (Accessory Rail Grooves)
    for (let g = 0; g < 3; g++) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.006, 0.008), darkSteelMat);
      groove.position.set(0, -0.019, -0.11 - g * 0.022);
      group.add(groove);
    }

    // 空倉掛機桿 (Slide Stop)
    const slideStop = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.01, 0.035), chromeMat);
    slideStop.position.set(-0.022, 0.012, -0.02);
    group.add(slideStop);

    // 3. 人體工學扳機護弓與金屬扳機 (Trigger Guard & Curved Trigger)
    const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0035, 6, 12, Math.PI * 0.95), darkSteelMat);
    triggerGuard.rotation.y = Math.PI / 2;
    triggerGuard.position.set(0, -0.03, -0.01);
    group.add(triggerGuard);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.022, 0.01), chromeMat);
    trigger.position.set(0, -0.024, -0.01);
    trigger.rotation.x = 0.38;
    group.add(trigger);

    // 4. 重裝握把與防滑護片 (Heavy Grip & Panels)
    const gripGroup = new THREE.Group();
    gripGroup.position.set(0, -0.08, 0.03);
    gripGroup.rotation.x = 0.28; // 經典 18 度握持傾角

    // 握把本體
    const gripFrame = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.125, 0.062), darkSteelMat);
    gripGroup.add(gripFrame);

    // 左右兩側人體工學防滑橡膠護片 (Rubber Grip Panels)
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.11, 0.054), gripRubberMat);
    leftPanel.position.set(-0.02, 0, 0);
    gripGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.11, 0.054), gripRubberMat);
    rightPanel.position.set(0.02, 0, 0);
    gripGroup.add(rightPanel);

    // 握把兩側鑲嵌金色老鷹圓形標誌 (Golden Eagle Medallion)
    const leftLogo = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.002, 12), goldMat);
    leftLogo.rotation.z = Math.PI / 2;
    leftLogo.position.set(-0.024, 0.015, 0);
    gripGroup.add(leftLogo);

    const rightLogo = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.002, 12), goldMat);
    rightLogo.rotation.z = Math.PI / 2;
    rightLogo.position.set(0.024, 0.015, 0);
    gripGroup.add(rightLogo);

    // 彈匣底座 (Magazine Baseplate)
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.012, 0.07), darkSteelMat);
    magBase.position.set(0, -0.065, 0.004);
    gripGroup.add(magBase);

    group.add(gripGroup);

    // 經典 CS 特警雙手持握沙漠之鷹 (Weaver Tactical Grip)
    const rightArm = this.createArmModel(false, 'pistol_right');
    rightArm.position.set(0.04, -0.22, 0.12);
    rightArm.rotation.set(-0.7, 0.12, -0.15);
    group.add(rightArm);

    const leftArm = this.createArmModel(true, 'pistol_left');
    leftArm.position.set(-0.04, -0.23, 0.1);
    leftArm.rotation.set(-0.68, -0.15, 0.2);
    group.add(leftArm);

    group.userData.muzzleOffset = new THREE.Vector3(0, 0.034, -0.22);
    return group;
  }

  buildKnife() {
    const group = new THREE.Group();
    // 現代競技格鬥軍用戰術刺刀材質
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      roughness: 0.14,
      metalness: 0.98
    }); // 雙面手工研磨高碳鋼刀刃
    const coatingMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.5,
      metalness: 0.8
    }); // 黑色軍規抗反光塗層
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x171923,
      roughness: 0.85
    }); // G10 特種防滑格鬥握把
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb7791f,
      roughness: 0.35,
      metalness: 0.9
    }); // 握柄固定鉚釘

    // 1. 刀刃主體 (Blade Body)
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.048, 0.23), bladeMat);
    blade.position.set(0, 0.02, -0.115);
    group.add(blade);

    // 刀刃雙面血槽 (Fuller Groove)
    const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.15), coatingMat);
    fuller.position.set(0, 0.026, -0.105);
    group.add(fuller);

    // 刀背鋸齒脊線 (Sawback Spine)
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.012, 0.19), coatingMat);
    spine.position.set(0, 0.046, -0.095);
    group.add(spine);

    // 鋸齒齒痕 (Serration Teeth)
    for (let t = 0; t < 6; t++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.006, 0.012), coatingMat);
      tooth.position.set(0, 0.052, -0.04 - t * 0.022);
      tooth.rotation.x = -0.4;
      group.add(tooth);
    }

    // 刀尖幾何 (Tanto / Drop Point Tip)
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.065, 4), bladeMat);
    tip.rotation.x = -Math.PI / 2;
    tip.rotation.y = Math.PI / 4;
    tip.position.set(0, 0.02, -0.255);
    group.add(tip);

    // 2. 戰術十字護手盤 (Crossguard)
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.075, 0.016), coatingMat);
    guard.position.set(0, 0.016, -0.004);
    group.add(guard);

    // 3. 人體工學戰術握把 (G10 Ergonomic Grip with Finger Grooves)
    const handleGroup = new THREE.Group();
    handleGroup.position.set(0, -0.004, 0.07);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.042, 0.135), handleMat);
    handleGroup.add(handle);

    // 手指凹槽 (Finger Grooves)
    for (let f = -1; f <= 1; f++) {
      const groove = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8), handleMat);
      groove.rotation.z = Math.PI / 2;
      groove.position.set(0, -0.022, f * 0.036);
      handleGroup.add(groove);

      // 握柄黃銅固定螺栓 (Brass Screws)
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.032, 8), brassMat);
      screw.rotation.z = Math.PI / 2;
      screw.position.set(0, 0.002, f * 0.036);
      handleGroup.add(screw);
    }

    // 握柄尾部金屬擊破錐 (Steel Skull Crusher Pommel)
    const pommel = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.024, 4), coatingMat);
    pommel.rotation.x = Math.PI / 2;
    pommel.position.set(0, 0, 0.075);
    handleGroup.add(pommel);

    group.add(handleGroup);

    // 特警戰術小刀持刀手臂 (右手握刀柄、左手微曲備戰)
    const rightArm = this.createArmModel(false, 'knife_right');
    rightArm.position.set(0.03, -0.22, 0.16);
    rightArm.rotation.set(-0.7, 0.2, -0.1);
    group.add(rightArm);

    const leftArm = this.createArmModel(true, 'knife_left');
    leftArm.position.set(-0.16, -0.26, 0.12);
    leftArm.rotation.set(-0.8, -0.4, 0.5);
    group.add(leftArm);

    // 初始拿刀角度 (反握/微斜朝前)
    group.rotation.set(0.1, -0.2, 0.25);
    group.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -0.28);
    return group;
  }

  buildHEGrenade() {
    const group = new THREE.Group();
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x274323, roughness: 0.65 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xb5903b, roughness: 0.35, metalness: 0.85 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });

    // 手榴彈蛋體 (鳳梨菠蘿紋理切角)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.11, 10), greenMat);
    group.add(body);

    // 黃色戰術標識圈
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.039, 0.012, 10), brassMat);
    ring.position.y = 0.03;
    group.add(ring);

    // 引信保險把柄 (Spoon / Safety Lever)
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.012), brassMat);
    lever.position.set(0.025, 0.02, 0);
    group.add(lever);

    // 保險拉環 (Pull Ring)
    const pullRing = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 6, 12), pinMat);
    pullRing.position.set(-0.022, 0.07, 0);
    pullRing.rotation.y = Math.PI / 2;
    group.add(pullRing);

    // 手榴彈持握雙臂 (右手握彈體、左手拉環)
    const rightArm = this.createArmModel(false, 'grenade_right');
    rightArm.position.set(0.04, -0.22, 0.08);
    rightArm.rotation.set(-0.7, 0.15, -0.15);
    group.add(rightArm);

    const leftArm = this.createArmModel(true, 'grenade_left');
    leftArm.position.set(-0.08, -0.2, 0.04);
    leftArm.rotation.set(-0.65, -0.3, 0.35);
    group.add(leftArm);

    group.rotation.set(-0.2, 0.1, 0.1);
    return group;
  }

  buildFlashbang() {
    const group = new THREE.Group();
    const aluminumMat = new THREE.MeshStandardMaterial({ color: 0xa0aec0, roughness: 0.25, metalness: 0.85 });
    const blueBandMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.4 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xb5903b, roughness: 0.35, metalness: 0.85 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });

    // 鋁合金圓筒本體
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.13, 12), aluminumMat);
    group.add(body);

    // 經典 CS 閃光彈藍色辨識環 (兩道)
    const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0345, 0.0345, 0.018, 12), blueBandMat);
    band1.position.y = 0.025;
    group.add(band1);

    const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0345, 0.0345, 0.018, 12), blueBandMat);
    band2.position.y = -0.025;
    group.add(band2);

    // 保險栓與拉環
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.085, 0.01), brassMat);
    lever.position.set(0.022, 0.03, 0);
    group.add(lever);

    const pullRing = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0025, 6, 12), pinMat);
    pullRing.position.set(-0.02, 0.075, 0);
    pullRing.rotation.y = Math.PI / 2;
    group.add(pullRing);

    // 閃光彈持握雙臂
    const rightArm = this.createArmModel(false, 'grenade_right');
    rightArm.position.set(0.04, -0.22, 0.08);
    rightArm.rotation.set(-0.7, 0.15, -0.15);
    group.add(rightArm);

    const leftArm = this.createArmModel(true, 'grenade_left');
    leftArm.position.set(-0.08, -0.2, 0.04);
    leftArm.rotation.set(-0.65, -0.3, 0.35);
    group.add(leftArm);

    group.rotation.set(-0.2, 0.1, 0.1);
    return group;
  }

  buildSmokeGrenade() {
    const group = new THREE.Group();
    const canMat = new THREE.MeshStandardMaterial({ color: 0x4a5d4e, roughness: 0.5 }); // 經典灰綠色金屬罐身
    const whiteBandMat = new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.3 }); // 標識白環
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xb5903b, roughness: 0.35, metalness: 0.85 });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });

    // 圓筒罐身
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.135, 12), canMat);
    group.add(body);

    // 兩道經典白色識別漆環 (White Bands)
    const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0365, 0.0365, 0.016, 12), whiteBandMat);
    band1.position.y = 0.03;
    group.add(band1);

    const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0365, 0.0365, 0.016, 12), whiteBandMat);
    band2.position.y = -0.03;
    group.add(band2);

    // 保險把柄與拉環
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.085, 0.01), brassMat);
    lever.position.set(0.024, 0.03, 0);
    group.add(lever);

    const pullRing = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0025, 6, 12), pinMat);
    pullRing.position.set(-0.02, 0.075, 0);
    pullRing.rotation.y = Math.PI / 2;
    group.add(pullRing);

    // 煙霧彈持握雙臂
    const rightArm = this.createArmModel(false, 'grenade_right');
    rightArm.position.set(0.04, -0.22, 0.08);
    rightArm.rotation.set(-0.7, 0.15, -0.15);
    group.add(rightArm);

    const leftArm = this.createArmModel(true, 'grenade_left');
    leftArm.position.set(-0.08, -0.2, 0.04);
    leftArm.rotation.set(-0.65, -0.3, 0.35);
    group.add(leftArm);

    group.rotation.set(-0.2, 0.1, 0.1);
    return group;
  }

  initMuzzleFlash() {
    this.flashGroup = new THREE.Group();

    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.95
    });

    // 星形十字槍火幾何體
    const plane1 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), flashMat);
    const plane2 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), flashMat);
    plane2.rotation.z = Math.PI / 4;

    this.flashGroup.add(plane1);
    this.flashGroup.add(plane2);

    // 瞬間點光源照亮周遭
    this.flashLight = new THREE.PointLight(0xffa726, 3.0, 4);
    this.flashGroup.add(this.flashLight);

    this.flashGroup.visible = false;
    this.gunPivot.add(this.flashGroup);
  }

  setWeapon(weaponId) {
    if (this.currentWeaponId === weaponId) return;

    // 隱藏舊武器
    if (this.currentWeaponId && this.weaponModels[this.currentWeaponId]) {
      this.weaponModels[this.currentWeaponId].visible = false;
    }

    this.currentWeaponId = weaponId;
    const currentModel = this.weaponModels[weaponId];
    if (currentModel) {
      currentModel.visible = true;
      // 定位槍火至該武器槍口
      if (currentModel.userData.muzzleOffset) {
        this.flashGroup.position.copy(currentModel.userData.muzzleOffset);
      }
    }

    // 觸發切換掏槍動畫
    this.switchProgress = 0.0;
    this.isSwitching = true;
  }

  /**
   * 觸發開火後座力動畫與槍口火花
   */
  triggerShoot(recoilAmount = 0.03) {
    // 槍枝往後踢並向上抬起
    this.kickOffset.z = 0.045 * (recoilAmount / 0.02);
    this.kickRotation.x = 0.09 * (recoilAmount / 0.02);

    // 顯示槍口火花 (排除小刀與各類投擲物)
    const isGrenadeOrMelee = ['knife', 'he_grenade', 'flashbang', 'smoke_grenade'].includes(this.currentWeaponId);
    if (!isGrenadeOrMelee) {
      this.flashGroup.visible = true;
      this.flashGroup.rotation.z = Math.random() * Math.PI * 2;
      this.flashTimer = 0.045; // 45ms
    }
  }

  /**
   * 觸發小刀輕揮 (橫劃弧線)
   */
  triggerKnifeSlash() {
    this.knifeAnimType = 'slash';
    this.knifeAnimProgress = 0.0;
  }

  /**
   * 觸發小刀強力刺擊 (向前猛刺)
   */
  triggerKnifeStab() {
    this.knifeAnimType = 'stab';
    this.knifeAnimProgress = 0.0;
  }

  /**
   * 觸發手榴彈投擲動作
   */
  triggerThrow() {
    this.throwAnimProgress = 0.0;
  }

  /**
   * 施加滑鼠轉向時的武器慣性微晃動 (Mouse Look Sway)
   */
  applyMouseSway(deltaX, deltaY) {
    this.mouseSwayX = (this.mouseSwayX || 0) - deltaX * 0.00035;
    this.mouseSwayY = (this.mouseSwayY || 0) + deltaY * 0.00035;
    this.mouseSwayX = Math.max(-0.025, Math.min(0.025, this.mouseSwayX));
    this.mouseSwayY = Math.max(-0.02, Math.min(0.02, this.mouseSwayY));
  }

  update(delta, currentSpeed, isMoving) {
    // 1. 槍口火花倒數熄滅
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.flashGroup.visible = false;
      }
    }

    // 2. 切換掏槍動畫 (從下方快速提槍定位)
    if (this.isSwitching) {
      this.switchProgress += delta * 5.0; // 0.2 秒掏槍
      if (this.switchProgress >= 1.0) {
        this.switchProgress = 1.0;
        this.isSwitching = false;
      }
    }
    const drawOffsetY = (1.0 - this.switchProgress) * -0.25;

    // 3. 後座力回彈平滑插值 (Spring Damping)
    this.kickOffset.z += (0 - this.kickOffset.z) * Math.min(delta * 22, 1);
    this.kickRotation.x += (0 - this.kickRotation.x) * Math.min(delta * 22, 1);

    // 4. 小刀揮擊 / 刺擊動畫推進
    let knifeOffsetX = 0, knifeOffsetY = 0, knifeOffsetZ = 0;
    let knifeRotX = 0, knifeRotY = 0, knifeRotZ = 0;

    if (this.knifeAnimProgress < 1.0) {
      if (this.knifeAnimType === 'slash') {
        this.knifeAnimProgress += delta * 4.8;
        const p = Math.min(1.0, this.knifeAnimProgress);
        const arc = Math.sin(p * Math.PI);
        knifeOffsetX = -arc * 0.22;
        knifeOffsetY = arc * 0.08;
        knifeOffsetZ = -arc * 0.16;
        knifeRotZ = -arc * 1.35;
        knifeRotY = arc * 0.85;
      } else if (this.knifeAnimType === 'stab') {
        this.knifeAnimProgress += delta * 3.4;
        const p = Math.min(1.0, this.knifeAnimProgress);
        const plunge = Math.sin(p * Math.PI);
        knifeOffsetZ = -plunge * 0.28;
        knifeOffsetY = plunge * 0.03;
        knifeRotX = plunge * 0.35;
      }
      if (this.knifeAnimProgress >= 1.0) {
        this.knifeAnimType = null;
      }
    }

    // 5. 投擲物投出動畫
    let throwOffsetY = 0, throwOffsetZ = 0;
    if (this.throwAnimProgress < 1.0) {
      this.throwAnimProgress += delta * 3.8;
      const p = Math.min(1.0, this.throwAnimProgress);
      const throwCurve = Math.sin(p * Math.PI);
      throwOffsetY = -throwCurve * 0.18;
      throwOffsetZ = -throwCurve * 0.24;
    }

    // 6. 滑鼠轉向慣性阻尼衰減 (快速回彈至中立)
    this.mouseSwayX = (this.mouseSwayX || 0) * Math.max(0, 1 - delta * 18);
    this.mouseSwayY = (this.mouseSwayY || 0) * Math.max(0, 1 - delta * 18);

    // 7. 待機呼吸晃動與行走擺動
    const time = performance.now() * 0.002;
    let swayX = Math.sin(time) * 0.0015;
    let swayY = Math.cos(time * 1.5) * 0.0015;

    if (isMoving && currentSpeed > 0.5) {
      swayX += Math.cos(time * 4) * 0.006 * Math.min(currentSpeed / 5, 1.2);
      swayY += Math.sin(time * 8) * 0.005 * Math.min(currentSpeed / 5, 1.2);
    }

    this.gunPivot.position.x = this.defaultPos.x + swayX + this.mouseSwayX + knifeOffsetX;
    this.gunPivot.position.y = this.defaultPos.y + swayY + drawOffsetY + this.mouseSwayY + knifeOffsetY + throwOffsetY;
    this.gunPivot.position.z = this.defaultPos.z + this.kickOffset.z + knifeOffsetZ + throwOffsetZ;

    this.gunPivot.rotation.x = this.kickRotation.x + this.mouseSwayY * 1.5 + knifeRotX;
    this.gunPivot.rotation.y = this.mouseSwayX * 1.8 + knifeRotY;
    this.gunPivot.rotation.z = knifeRotZ;
  }
}
