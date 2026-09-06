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
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x3a424e, roughness: 0.25, metalness: 0.9 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.7 });

    // 刀刃
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.22), bladeMat);
    blade.position.set(0, 0.02, -0.12);
    group.add(blade);

    // 刀柄
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 0.14), handleMat);
    handle.position.set(0, -0.01, 0.05);
    group.add(handle);

    // 護手
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.015), handleMat);
    guard.position.set(0, 0.01, -0.02);
    group.add(guard);

    group.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -0.23);
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

    // 顯示槍口火花
    if (this.currentWeaponId !== 'knife') {
      this.flashGroup.visible = true;
      this.flashGroup.rotation.z = Math.random() * Math.PI * 2;
      this.flashTimer = 0.045; // 45ms
    }
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

    // 4. 滑鼠轉向慣性阻尼衰減 (快速回彈至中立)
    this.mouseSwayX = (this.mouseSwayX || 0) * Math.max(0, 1 - delta * 18);
    this.mouseSwayY = (this.mouseSwayY || 0) * Math.max(0, 1 - delta * 18);

    // 5. 待機呼吸晃動與行走擺動
    const time = performance.now() * 0.002;
    let swayX = Math.sin(time) * 0.0015;
    let swayY = Math.cos(time * 1.5) * 0.0015;

    if (isMoving && currentSpeed > 0.5) {
      swayX += Math.cos(time * 4) * 0.006 * Math.min(currentSpeed / 5, 1.2);
      swayY += Math.sin(time * 8) * 0.005 * Math.min(currentSpeed / 5, 1.2);
    }

    this.gunPivot.position.x = this.defaultPos.x + swayX + this.mouseSwayX;
    this.gunPivot.position.y = this.defaultPos.y + swayY + drawOffsetY + this.mouseSwayY;
    this.gunPivot.position.z = this.defaultPos.z + this.kickOffset.z;

    this.gunPivot.rotation.x = this.kickRotation.x + this.mouseSwayY * 1.5;
    this.gunPivot.rotation.y = this.mouseSwayX * 1.8;
  }
}
