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
    this.scene.fog = new THREE.FogExp2(0xdce7f0, 0.009);

    // 半球環境光
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x8d7a65, 0.75);
    hemiLight.position.set(0, 60, 0);
    this.scene.add(hemiLight);

    // 陽光平行光
    const sunLight = new THREE.DirectionalLight(0xfff4d6, 1.45);
    sunLight.position.set(45, 80, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 250;

    const d = 70;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;

    this.scene.add(sunLight);
  }

  buildMap() {
    // 材質快取
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xc8b293, roughness: 0.9, metalness: 0.1 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a7f73, roughness: 0.85, metalness: 0.05 });
    const lowWallMat = new THREE.MeshStandardMaterial({ color: 0x766d63, roughness: 0.8 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xa06d42, roughness: 0.7 });
    const crateDarkMat = new THREE.MeshStandardMaterial({ color: 0x7a5231, roughness: 0.7 });
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x9b9084, roughness: 0.85 });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x5a6370, roughness: 0.75 }); // 基地深色強化混凝土

    // 1. 擴大主地面 (120m x 130m)
    const groundGeo = new THREE.BoxGeometry(120, 2, 130);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -1, 0);
    ground.receiveShadow = true;
    this.addStaticMesh(ground);

    // 2. 外圍圍牆 (高 7m，邊界範圍 X: [-60, 60], Z: [-65, 65])
    this.createBox(120, 7, 1.5, 0, 3.5, -65, wallMat); // 北牆
    this.createBox(120, 7, 1.5, 0, 3.5, 65, wallMat);  // 南牆
    this.createBox(1.5, 7, 130, -60, 3.5, 0, wallMat); // 西牆
    this.createBox(1.5, 7, 130, 60, 3.5, 0, wallMat);  // 東牆

    // ========================================================
    // 3. 玩家安全出生基地 (Player Safe Spawn Base / CT Base)
    // 寬敞開放式 CT 出生廣場，提供前方掩體，左右各具備超寬闊出擊通道
    // ========================================================
    // 基地後牆與側翼防護牆
    this.createBox(48, 5, 1.5, 0, 2.5, 60, baseMat);       // 後方護牆
    this.createBox(1.5, 5, 20, -24, 2.5, 50, baseMat);     // 西側防護翼牆
    this.createBox(1.5, 5, 20, 24, 2.5, 50, baseMat);      // 東側防護翼牆

    // 基地正前方防護掩體 (高 1.25m，站立可瞄準中路、蹲下完全阻擋敵人射線)
    this.createBox(8, 1.25, 1.0, 0, 0.625, 42, lowWallMat);

    // 左右兩側寬敞出擊走廊掩體 (留出充足通行空間，絕不卡腳)
    this.createCrate(2, 2, 2, -12, 1, 36, crateMat);       // 通往 B 區掩護箱
    this.createCrate(2, 2, 2, 12, 1, 36, crateDarkMat);    // 通往 A 區掩護箱
    this.createBox(6, 1.2, 0.8, 0, 0.6, 28, lowWallMat);   // 前進中路的第一道矮牆掩體

    // ========================================================
    // 4. 中路交火區 (Mid Courtyard, Z: -5 ~ 25)
    // ========================================================
    // 經典中門 (Mid Doors，兩側厚水泥門柱，中間留有狹窄探頭縫隙)
    this.createBox(12, 5, 1.2, -9, 2.5, 10, wallMat);
    this.createBox(12, 5, 1.2, 9, 2.5, 10, wallMat);
    // 中路門框橫樑
    this.createBox(30, 1.2, 1.2, 0, 5.1, 10, wallMat);

    // 中路掩體低牆與防禦箱
    this.createBox(8, 1.2, 0.6, 0, 0.6, -2, lowWallMat);
    this.createCrate(2, 2, 2, -5, 1, -2, crateMat);
    this.createCrate(2, 2, 2, 5, 1, -2, crateDarkMat);
    this.createCrate(2, 2, 2, 0, 1, -12, crateMat);

    // ========================================================
    // 5. A 區戰場 (Bombsite A，東側 X: 25 ~ 55, Z: -50 ~ -10)
    // ========================================================
    // A 點長通道 (Long A Alley)
    this.createBox(1.5, 5, 45, 22, 2.5, 12, wallMat); // A 長外側隔離牆

    // A 高台狙擊平台 (Catwalk / Balcony，高 3.2m)
    this.createBox(18, 3.2, 14, 40, 1.6, -25, wallMat);
    this.createBox(18, 1.1, 0.5, 40, 3.75, -18, lowWallMat); // 高台防護矮牆
    this.createBox(0.5, 1.1, 14, 31, 3.75, -25, lowWallMat);

    // 上高台斜坡
    const rampGeo = new THREE.BoxGeometry(4.5, 0.4, 12);
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(30, 1.6, -11);
    ramp.rotation.x = Math.atan2(3.2, 12);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    this.addStaticMesh(ramp);

    // A 點堆疊集裝箱與木箱
    this.createCrate(2.5, 2.5, 2.5, 42, 1.25, -40, crateMat);
    this.createCrate(2.5, 2.5, 2.5, 45, 1.25, -40, crateDarkMat);
    this.createCrate(2.5, 2.5, 2.5, 43.5, 3.75, -40, crateMat); // 雙層木箱

    this.createCrate(2, 2, 2, 34, 1, -38, crateMat);
    this.createBox(10, 1.2, 0.6, 40, 0.6, -34, lowWallMat);

    // ========================================================
    // 6. B 區長廊與掩體庫房 (Bombsite B，西側 X: -55 ~ -20, Z: -50 ~ -5)
    // ========================================================
    // B 洞長廊外牆
    this.createBox(1.5, 5, 50, -22, 2.5, 10, wallMat);
    // B 洞通道頂蓋 (走廊感)
    this.createBox(14, 0.4, 35, -30, 4.8, 12, wallMat);

    // B 點防禦矮牆與多處箱子掩體
    this.createBox(12, 1.2, 0.8, -40, 0.6, -15, lowWallMat);
    this.createBox(0.8, 1.2, 14, -34, 0.6, -22, lowWallMat);

    this.createCrate(2.5, 2.5, 2.5, -42, 1.25, -30, crateDarkMat);
    this.createCrate(2.5, 2.5, 2.5, -39, 1.25, -30, crateMat);
    this.createCrate(2, 2, 2, -45, 1, -22, crateMat);
    this.createCrate(2, 2, 2, -45, 3, -22, crateDarkMat);

    // B 區階梯
    const stepCount = 5;
    const stepHeight = 0.4;
    const stepDepth = 0.9;
    const stepWidth = 4;
    for (let i = 0; i < stepCount; i++) {
      this.createBox(
        stepWidth,
        (i + 1) * stepHeight,
        stepDepth,
        -48,
        ((i + 1) * stepHeight) / 2,
        -38 + i * stepDepth,
        wallMat
      );
    }
    this.createBox(6, stepCount * stepHeight, 6, -48, (stepCount * stepHeight) / 2, -38 + stepCount * stepDepth + 2.5, wallMat);
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
