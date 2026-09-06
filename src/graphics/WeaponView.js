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

    this.initModels();
    this.initMuzzleFlash();
    this.setWeapon('ak47');
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
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f242b, roughness: 0.35, metalness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a4b27, roughness: 0.7, metalness: 0.1 });

    // 機匣
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.32), metalMat);
    group.add(body);

    // 槍管與槍口
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.25);
    group.add(barrel);

    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.04, 8), metalMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.02, -0.4);
    group.add(muzzle);

    // 護木
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.055, 0.16), woodMat);
    handguard.position.set(0, 0.015, -0.15);
    group.add(handguard);

    // 彈匣
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.065), metalMat);
    mag.position.set(0, -0.07, -0.05);
    mag.rotation.x = -0.25;
    group.add(mag);

    // 槍托
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.18), woodMat);
    stock.position.set(0, -0.01, 0.22);
    group.add(stock);

    // 握把
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.045), woodMat);
    grip.position.set(0, -0.07, 0.08);
    grip.rotation.x = 0.35;
    group.add(grip);

    group.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -0.42);
    return group;
  }

  buildDeagle() {
    const group = new THREE.Group();
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd0d5dd, roughness: 0.2, metalness: 0.9 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

    // 滑套 (Slide)
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.22), chromeMat);
    slide.position.set(0, 0.03, -0.05);
    group.add(slide);

    // 下槍身與握把
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.04, 0.18), gripMat);
    frame.position.set(0, 0, -0.04);
    group.add(frame);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.12, 0.055), gripMat);
    grip.position.set(0, -0.07, 0.03);
    grip.rotation.x = 0.25;
    group.add(grip);

    // 槍口
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.04, 8), chromeMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.17);
    group.add(barrel);

    group.userData.muzzleOffset = new THREE.Vector3(0, 0.03, -0.19);
    return group;
  }

  buildKnife() {
    const group = new THREE.Group();
    const bladeSteel = new THREE.MeshStandardMaterial({ color: 0xdce2ec, roughness: 0.18, metalness: 0.95 });
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.5, metalness: 0.8 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.85 });

    // 刀刃主體 (雙面研磨鋒刃)
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.046, 0.22), bladeSteel);
    blade.position.set(0, 0.02, -0.11);
    group.add(blade);

    // 刀背鋸齒脊線
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.012, 0.18), spineMat);
    spine.position.set(0, 0.045, -0.1);
    group.add(spine);

    // 刀尖弧度斜角
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 4), bladeSteel);
    tip.rotation.x = -Math.PI / 2;
    tip.rotation.y = Math.PI / 4;
    tip.position.set(0, 0.02, -0.24);
    group.add(tip);

    // 戰術格鬥握把 (帶有手指凹槽)
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.038, 0.13), handleMat);
    handle.position.set(0, -0.005, 0.065);
    group.add(handle);

    // 護手盤 (Crossguard)
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.065, 0.014), spineMat);
    guard.position.set(0, 0.015, -0.005);
    group.add(guard);

    // 初始拿刀角度 (反握/微斜朝前)
    group.rotation.set(0.1, -0.2, 0.25);
    group.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -0.26);
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
