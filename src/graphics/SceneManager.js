import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.collisionMeshes = new THREE.Group();
    this.scene.add(this.collisionMeshes);

    this.initEnvironment();
    this.buildMap();
  }

  initEnvironment() {
    // 天空背景與淡霧 (復古沙漠色調，類似 CS Dust2)
    this.scene.background = new THREE.Color(0xdce7f0);
    this.scene.fog = new THREE.FogExp2(0xdce7f0, 0.012);

    // 半球環境光 (天空偏藍，地面偏暖沙色)
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x8d7a65, 0.7);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // 陽光平行光 (投射柔和陰影)
    const sunLight = new THREE.DirectionalLight(0xfff4d6, 1.4);
    sunLight.position.set(35, 60, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;

    const d = 45;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;

    this.scene.add(sunLight);
  }

  buildMap() {
    // 材質快取
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xc8b293, // 沙地
      roughness: 0.9,
      metalness: 0.1
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x8a7f73, // 水泥/磚牆
      roughness: 0.85,
      metalness: 0.05
    });

    const lowWallMat = new THREE.MeshStandardMaterial({
      color: 0x766d63, // 矮掩體牆
      roughness: 0.8
    });

    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xa06d42, // 木箱
      roughness: 0.7
    });

    const crateDarkMat = new THREE.MeshStandardMaterial({
      color: 0x7a5231, // 深色木箱
      roughness: 0.7
    });

    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x9b9084, // 斜坡材質
      roughness: 0.85
    });

    // 1. 主地面 (80m x 80m)
    const groundGeo = new THREE.BoxGeometry(80, 2, 80);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1; // 表面剛好在 y=0
    ground.receiveShadow = true;
    this.addStaticMesh(ground);

    // 2. 外圍圍牆 (高 6m)
    this.createBox(80, 6, 1, 0, 3, -40, wallMat);
    this.createBox(80, 6, 1, 0, 3, 40, wallMat);
    this.createBox(1, 6, 80, -40, 3, 0, wallMat);
    this.createBox(1, 6, 80, 40, 3, 0, wallMat);

    // 3. 中央交火區 - 掩體與矮牆
    // 中路掩體 (高 1.2m，適合蹲伏射擊)
    this.createBox(8, 1.2, 0.6, 0, 0.6, 0, lowWallMat);
    this.createBox(0.6, 1.2, 8, -6, 0.6, -4, lowWallMat);
    this.createBox(0.6, 1.2, 8, 6, 0.6, 4, lowWallMat);

    // 4. 堆疊木箱區 (測試跳躍、爬箱與高低差射擊)
    // 基地 A 區木箱堆
    this.createCrate(2, 2, 2, -12, 1, -10, crateMat);
    this.createCrate(2, 2, 2, -10, 1, -10, crateMat);
    this.createCrate(2, 2, 2, -11, 3, -10, crateDarkMat); // 疊在第二層 (高 4m)

    this.createCrate(1.5, 1.5, 1.5, -15, 0.75, -8, crateDarkMat);
    this.createCrate(1.5, 1.5, 1.5, -13.5, 0.75, -8, crateMat);

    // 基地 B 區木箱堆
    this.createCrate(2, 2, 2, 14, 1, 12, crateMat);
    this.createCrate(2, 2, 2, 16, 1, 12, crateDarkMat);
    this.createCrate(2, 2, 2, 15, 3, 12, crateMat);

    // 5. 高台狙擊平台與上斜坡
    // 高台平台 (長 16m x 寬 10m x 高 3m)
    this.createBox(16, 3, 10, 15, 1.5, -20, wallMat);

    // 高台防護矮牆
    this.createBox(16, 1, 0.4, 15, 3.5, -15.2, lowWallMat);
    this.createBox(0.4, 1, 10, 22.8, 3.5, -20, lowWallMat);

    // 斜坡 (通往高台)
    const rampGeo = new THREE.BoxGeometry(4, 0.4, 10);
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    // 斜坡長度與高度計算
    ramp.position.set(5, 1.5, -20);
    ramp.rotation.z = Math.atan2(3, 8); // 升至 3m
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    this.addStaticMesh(ramp);

    // 6. 階梯區域 (多段梯級)
    const stepCount = 6;
    const stepHeight = 0.4;
    const stepDepth = 0.8;
    const stepWidth = 4;
    for (let i = 0; i < stepCount; i++) {
      this.createBox(
        stepWidth,
        (i + 1) * stepHeight,
        stepDepth,
        -18,
        ((i + 1) * stepHeight) / 2,
        15 + i * stepDepth,
        wallMat
      );
    }
    // 階梯連接的小平臺
    this.createBox(6, stepCount * stepHeight, 6, -18, (stepCount * stepHeight) / 2, 15 + stepCount * stepDepth + 2.5, wallMat);

    // 7. 長廊通道 (類似 CS 經典 A 門 / B 洞)
    this.createBox(1.5, 4, 25, -28, 2, 0, wallMat);
    this.createBox(1.5, 4, 25, -22, 2, 0, wallMat);
    // 通道屋頂
    this.createBox(7.5, 0.5, 25, -25, 4.25, 0, wallMat);
  }

  createBox(w, h, d, x, y, z, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.addStaticMesh(mesh);
    return mesh;
  }

  createCrate(w, h, d, x, y, z, mat) {
    const mesh = this.createBox(w, h, d, x, y, z, mat);
    // 可在邊角加上線框強調 Low-Poly 質感
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x3d2817, linewidth: 1 })
    );
    mesh.add(line);
    return mesh;
  }

  addStaticMesh(mesh) {
    this.collisionMeshes.add(mesh);
  }

  getCollisionGroup() {
    return this.collisionMeshes;
  }
}
