import * as THREE from 'three';

export class WeaponView {
  constructor(viewmodelScene) {
    this.viewmodelScene = viewmodelScene;
    this.gunPivot = new THREE.Group();
    this.viewmodelScene.add(this.gunPivot);

    // 武器在第一人稱視角下的預設位置與旋轉
    this.defaultPos = new THREE.Vector3(0.18, -0.16, -0.35);
    this.defaultRot = new THREE.Euler(0, 0, 0);

    this.gunPivot.position.copy(this.defaultPos);

    this.buildProceduralRifle();
  }

  /**
   * 建立俐落的 Low-Poly 第一人稱突擊步槍模型 (類 AK/M4 輪廓)
   */
  buildProceduralRifle() {
    const gunGroup = new THREE.Group();

    const metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1f242b,
      roughness: 0.35,
      metalness: 0.8
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8a4b27,
      roughness: 0.7,
      metalness: 0.1
    });

    // 1. 槍身主機匣 (Receiver)
    const bodyGeo = new THREE.BoxGeometry(0.045, 0.07, 0.32);
    const body = new THREE.Mesh(bodyGeo, metalDarkMat);
    gunGroup.add(body);

    // 2. 槍管 (Barrel)
    const barrelGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8);
    const barrel = new THREE.Mesh(barrelGeo, metalDarkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.25);
    gunGroup.add(barrel);

    // 3. 槍口消焰器 (Muzzle)
    const muzzleGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.04, 8);
    const muzzle = new THREE.Mesh(muzzleGeo, metalDarkMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.02, -0.4);
    gunGroup.add(muzzle);
    this.muzzlePoint = new THREE.Vector3(0, 0.02, -0.42);

    // 4. 木質護木 (Handguard)
    const handguardGeo = new THREE.BoxGeometry(0.048, 0.055, 0.16);
    const handguard = new THREE.Mesh(handguardGeo, woodMat);
    handguard.position.set(0, 0.015, -0.15);
    gunGroup.add(handguard);

    // 5. 弧形彈匣 (Curved Magazine)
    const magGeo = new THREE.BoxGeometry(0.035, 0.13, 0.065);
    const mag = new THREE.Mesh(magGeo, metalDarkMat);
    mag.position.set(0, -0.07, -0.05);
    mag.rotation.x = -0.25;
    gunGroup.add(mag);

    // 6. 木質槍托 (Stock)
    const stockGeo = new THREE.BoxGeometry(0.04, 0.09, 0.18);
    const stock = new THREE.Mesh(stockGeo, woodMat);
    stock.position.set(0, -0.01, 0.22);
    gunGroup.add(stock);

    // 7. 握把 (Grip)
    const gripGeo = new THREE.BoxGeometry(0.035, 0.09, 0.045);
    const grip = new THREE.Mesh(gripGeo, woodMat);
    grip.position.set(0, -0.07, 0.08);
    grip.rotation.x = 0.35;
    gunGroup.add(grip);

    // 8. 照門與準星 (Iron Sights)
    const sightGeo = new THREE.BoxGeometry(0.008, 0.018, 0.015);
    const rearSight = new THREE.Mesh(sightGeo, metalDarkMat);
    rearSight.position.set(0, 0.045, 0.06);
    gunGroup.add(rearSight);

    const frontSight = new THREE.Mesh(sightGeo, metalDarkMat);
    frontSight.position.set(0, 0.042, -0.22);
    gunGroup.add(frontSight);

    this.gunGroup = gunGroup;
    this.gunPivot.add(gunGroup);
  }

  /**
   * 根據玩家移動與視角轉動產生武器微晃動 (Weapon Sway & Bobbing)
   */
  update(delta, currentSpeed, isMoving) {
    // 待機時微弱呼吸晃動
    const time = performance.now() * 0.002;
    let swayX = Math.sin(time) * 0.0015;
    let swayY = Math.cos(time * 1.5) * 0.0015;

    // 行走時武器持槍擺動
    if (isMoving && currentSpeed > 0.5) {
      swayX += Math.cos(time * 4) * 0.006 * Math.min(currentSpeed / 5, 1.2);
      swayY += Math.sin(time * 8) * 0.005 * Math.min(currentSpeed / 5, 1.2);
    }

    this.gunPivot.position.x = this.defaultPos.x + swayX;
    this.gunPivot.position.y = this.defaultPos.y + swayY;
  }
}
