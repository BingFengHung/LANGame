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
    // 蔚藍地中海沙漠天空色調 (類似 CS Dust2 晴朗烈日)
    this.scene.background = new THREE.Color(0x8cb8de);
    this.scene.fog = new THREE.FogExp2(0xd6cbb8, 0.0055);

    // 建立天空穹頂 (Sky Dome) 漸層
    const skyGeo = new THREE.SphereGeometry(220, 32, 16);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2b6cb0');   // 天頂深蔚藍
    grad.addColorStop(0.4, '#4299e1'); // 湛藍
    grad.addColorStop(0.75, '#bee3f8');// 地平線淺青藍
    grad.addColorStop(1.0, '#feebc8');  // 地平線暖沙黃
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 512);

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);

    // 半球環境光 (冷藍天光與暖黃地光形成經典冷暖對比)
    const hemiLight = new THREE.HemisphereLight(0xe2f1fc, 0x8a735c, 0.85);
    hemiLight.position.set(0, 70, 0);
    this.scene.add(hemiLight);

    // 烈日直射平行光 (強烈對比投影)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.65);
    sunLight.position.set(55, 95, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 280;

    const d = 75;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;

    this.scene.add(sunLight);
  }

  /**
   * 動態產生經典 CS Dust2 沙漠石磚地表紋理
   */
  generateSandTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 底色沙漠砂黃
    ctx.fillStyle = '#cfbb99';
    ctx.fillRect(0, 0, 512, 512);

    // 砂石雜斑微粒
    for (let i = 0; i < 12000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.random() > 0.5 ? 240 : 160;
      ctx.fillStyle = `rgba(${gray}, ${Math.floor(gray * 0.9)}, ${Math.floor(gray * 0.7)}, 0.22)`;
      ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }

    // 碎裂磨損暗紋與板塊縫隙
    ctx.strokeStyle = 'rgba(120, 95, 65, 0.28)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.strokeRect(i * 128, 0, 128, 512);
      ctx.strokeRect(0, i * 128, 512, 128);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(22, 24);
    return tex;
  }

  /**
   * 動態產生經典 de_dust2 黃色砂岩石磚砌牆紋理
   */
  generateWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b89f80';
    ctx.fillRect(0, 0, 512, 512);

    // 砂岩顆粒
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(70,50,30,0.16)';
      ctx.fillRect(x, y, Math.random() * 4 + 1, Math.random() * 3 + 1);
    }

    // 交錯排列的石磚縫隙
    ctx.strokeStyle = 'rgba(60, 45, 30, 0.45)';
    ctx.lineWidth = 4;
    const rowH = 64;
    for (let r = 0; r <= 8; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH);
      ctx.lineTo(512, r * rowH);
      ctx.stroke();

      const offset = (r % 2) * 64;
      for (let c = 0; c <= 8; c++) {
        ctx.beginPath();
        ctx.moveTo(c * 128 + offset, r * rowH);
        ctx.lineTo(c * 128 + offset, (r + 1) * rowH);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }

  /**
   * 動態產生經典 CS 木質軍用板條箱紋理 (帶有 X 型固定木條與黑漆標籤)
   */
  generateCrateTexture(isDark = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 實木板材底色
    ctx.fillStyle = isDark ? '#7a4f29' : '#aa7742';
    ctx.fillRect(0, 0, 256, 256);

    // 木紋細條
    for (let y = 0; y < 256; y += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, y, 256, 2);
    }

    // 深色木條外框
    ctx.fillStyle = isDark ? '#543417' : '#734c25';
    const border = 24;
    ctx.fillRect(0, 0, 256, border);
    ctx.fillRect(0, 256 - border, 256, border);
    ctx.fillRect(0, 0, border, 256);
    ctx.fillRect(256 - border, 0, border, 256);

    // 經典 CS 木箱 X 型斜角加強木條
    ctx.strokeStyle = isDark ? '#543417' : '#734c25';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(border, border);
    ctx.lineTo(256 - border, 256 - border);
    ctx.moveTo(256 - border, border);
    ctx.lineTo(border, 256 - border);
    ctx.stroke();

    // 外框固定鉚釘
    ctx.fillStyle = '#222222';
    const rivets = [12, 128, 244];
    for (const rx of rivets) {
      for (const ry of [12, 244]) {
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 經典軍用印字/條碼黑標
    ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
    ctx.fillRect(40, 110, 65, 36);
    ctx.fillStyle = 'rgba(230, 230, 230, 0.8)';
    ctx.fillRect(44, 114, 57, 10);
    ctx.fillRect(44, 128, 57, 12);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * 動態產生經典 CS 雙開鐵門紋理 (深墨綠金屬、鐵鏽與鉚釘)
   */
  generateDoorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 深墨綠金屬底
    ctx.fillStyle = '#2d4a3e';
    ctx.fillRect(0, 0, 256, 512);

    // 鐵鏽斑痕
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.6 ? 'rgba(120, 60, 20, 0.25)' : 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x, y, 4, 4);
    }

    // 金屬門框與門縫
    ctx.strokeStyle = '#16221c';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 502);

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 512); // 中門分界縫
    ctx.moveTo(0, 256);
    ctx.lineTo(256, 256); // 橫向金屬加強筋
    ctx.stroke();

    // 門上密集鉚釘
    ctx.fillStyle = '#0f1713';
    for (let y = 30; y < 500; y += 45) {
      for (const x of [25, 115, 140, 230]) {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 金屬門鎖扣與把手
    ctx.fillStyle = '#8a9a86';
    ctx.fillRect(105, 235, 18, 42);
    ctx.fillRect(133, 235, 18, 42);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  buildMap() {
    // 產生高品質程序化紋理
    const sandTex = this.generateSandTexture();
    const wallTex = this.generateWallTexture();
    const crateTex = this.generateCrateTexture(false);
    const crateDarkTex = this.generateCrateTexture(true);
    const doorTex = this.generateDoorTexture();

    // 經典 CS Dust2 風格材質
    const groundMat = new THREE.MeshStandardMaterial({
      map: sandTex,
      roughness: 0.88,
      metalness: 0.05
    });

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.05
    });

    const lowWallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.8,
      metalness: 0.05
    });

    const crateMat = new THREE.MeshStandardMaterial({
      map: crateTex,
      roughness: 0.65,
      metalness: 0.1
    });

    const crateDarkMat = new THREE.MeshStandardMaterial({
      map: crateDarkTex,
      roughness: 0.65,
      metalness: 0.1
    });

    const rampMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.05
    });

    const baseMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0x7c8594, // 基地偏冷色戰術塗裝
      roughness: 0.75,
      metalness: 0.15
    });

    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.45,
      metalness: 0.6
    });

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
    // ========================================================
    this.createBox(48, 5, 1.5, 0, 2.5, 60, baseMat);       // 後方護牆
    this.createBox(1.5, 5, 20, -24, 2.5, 50, baseMat);     // 西側防護翼牆
    this.createBox(1.5, 5, 20, 24, 2.5, 50, baseMat);      // 東側防護翼牆

    // 基地正前方防護掩體
    this.createBox(8, 1.25, 1.0, 0, 0.625, 42, lowWallMat);

    // 左右出擊通道掩護箱
    this.createCrate(2, 2, 2, -12, 1, 36, crateMat);       // 通往 B 區掩護箱
    this.createCrate(2, 2, 2, 12, 1, 36, crateDarkMat);    // 通往 A 區掩護箱
    this.createBox(6, 1.2, 0.8, 0, 0.6, 28, lowWallMat);   // 前進中路的第一道矮牆掩體

    // ========================================================
    // 4. 中路交火區與經典中門 (Mid Courtyard & Mid Double Doors)
    // ========================================================
    // 兩側厚水泥門柱
    this.createBox(10, 5, 1.2, -10, 2.5, 10, wallMat);
    this.createBox(10, 5, 1.2, 10, 2.5, 10, wallMat);
    // 中路門框橫樑
    this.createBox(30, 1.2, 1.2, 0, 5.1, 10, wallMat);

    // 經典雙開金屬鐵門 (Mid Double Doors) - 門扇微開露出狙擊縫隙
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.4, 0.12), doorMat);
    doorL.position.set(-2.8, 2.2, 9.8);
    doorL.rotation.y = 0.25; // 左門微向外開
    doorL.castShadow = true;
    doorL.receiveShadow = true;
    this.addStaticMesh(doorL);

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.4, 0.12), doorMat);
    doorR.position.set(2.8, 2.2, 10.2);
    doorR.rotation.y = -0.3; // 右門微向內開
    doorR.castShadow = true;
    doorR.receiveShadow = true;
    this.addStaticMesh(doorR);

    // 中路掩體低牆與防禦箱
    this.createBox(8, 1.2, 0.6, 0, 0.6, -2, lowWallMat);
    this.createCrate(2, 2, 2, -5, 1, -2, crateMat);
    this.createCrate(2, 2, 2, 5, 1, -2, crateDarkMat);
    this.createCrate(2, 2, 2, 0, 1, -12, crateMat);

    // ========================================================
    // 5. A 區戰場 (Bombsite A，東側 X: 25 ~ 55, Z: -50 ~ -10)
    // ========================================================
    // A 點長通道 (Long A Alley)
    this.createBox(1.5, 5, 45, 22, 2.5, 12, wallMat);

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

    // A 區炸彈安置標誌 (Bombsite A Decal)
    this.createSiteDecal('A', 40, 0.02, -37);

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

    // B 點炸彈安置標誌 (Bombsite B Decal)
    this.createSiteDecal('B', -40, 0.02, -26);

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

  /**
   * 建立經典 CS 紅色包點噴印 (A / B Site Spray Tag)
   */
  createSiteDecal(letter, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 圓形紅色戰術邊框
    ctx.strokeStyle = '#c53030';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 110, 0, Math.PI * 2);
    ctx.stroke();

    // 虛線輔助環
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(128, 128, 92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 醒目字母 A 或 B
    ctx.fillStyle = '#e53e3e';
    ctx.font = 'bold 120px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 128, 128);

    // BOMBSITE 標籤字樣
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#fc8181';
    ctx.fillText('BOMBSITE', 128, 195);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const geo = new THREE.PlaneGeometry(5, 5);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2; // 水平貼在地面上
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
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
