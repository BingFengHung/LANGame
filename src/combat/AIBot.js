import * as THREE from 'three';

// ============================================================================
// 頂級 CS 特勤/恐怖份子 (Phoenix Connexion / Spec-Ops) 程序化戰術貼圖工廠
// 零網路依賴、啟動秒開、提供超高解析度迷彩、MOLLE織帶、針織頭套與槍械材質
// ============================================================================
class BotTextureFactory {
  static textures = null;

  static getTextures() {
    if (this.textures) return this.textures;

    this.textures = {
      balaclava: this.createBalaclavaTexture(),
      goggles: this.createGoggleTexture(),
      vest: this.createVestTexture(),
      camoPants: this.createCamoTexture('pants'),
      camoShirt: this.createCamoTexture('shirt'),
      wood: this.createWoodTexture(),
      gunMetal: this.createGunMetalTexture(),
      helmet: this.createHelmetTexture(),
      boot: this.createBootTexture(),
      glove: this.createGloveTexture(),
      shemagh: this.createShemaghTexture()
    };
    return this.textures;
  }

  static createBalaclavaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. 特警/恐怖份子頭套針織羅紋布料 (Balaclava Knit Texture)
    ctx.fillStyle = '#161922';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#202633';
    ctx.lineWidth = 2;
    for (let x = 0; x < 512; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // 額頭戰術縫合線 (Center Seam)
    ctx.strokeStyle = '#0e1117';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 130);
    ctx.stroke();

    // 2. 眼部開口輪廓 (Eye Cutout with Reinforced Hem)
    ctx.fillStyle = '#0d0f14';
    ctx.beginPath();
    ctx.ellipse(256, 210, 160, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // 肉色臉部皮膚 (Tanned Tactical Operator Skin)
    ctx.fillStyle = '#cf9872';
    ctx.beginPath();
    ctx.ellipse(256, 210, 148, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眉骨陰影與立體眼窩
    const browGrad = ctx.createLinearGradient(0, 150, 0, 225);
    browGrad.addColorStop(0, 'rgba(85, 45, 25, 0.75)');
    browGrad.addColorStop(1, 'rgba(207, 152, 114, 0)');
    ctx.fillStyle = browGrad;
    ctx.fillRect(100, 150, 312, 75);

    // 銳利剛毅的特戰雙眼 (Piercing Aiming Combat Eyes)
    for (const eyeX of [194, 318]) {
      // 眼白
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(eyeX, 212, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // 虹膜 (戰術鋼青/琥珀色)
      ctx.fillStyle = '#3a6b7c';
      ctx.beginPath();
      ctx.arc(eyeX, 212, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1a3742';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 瞳孔
      ctx.fillStyle = '#080a0d';
      ctx.beginPath();
      ctx.arc(eyeX, 212, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // 靈動眼神高光 (Catchlight)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX - 4, 208, 3, 0, Math.PI * 2);
      ctx.fill();

      // 上眼瞼睫毛線
      ctx.strokeStyle = '#22150f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(eyeX, 212, 28, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // 殺氣下壓戰鬥眉毛 (Angry/Focused Eyebrows)
      ctx.strokeStyle = '#18110b';
      ctx.lineWidth = 7;
      ctx.beginPath();
      if (eyeX < 256) {
        ctx.moveTo(eyeX - 32, 192);
        ctx.lineTo(eyeX + 28, 184);
      } else {
        ctx.moveTo(eyeX - 28, 184);
        ctx.lineTo(eyeX + 32, 192);
      }
      ctx.stroke();
    }

    // 鼻樑鼻翼立體陰影
    ctx.fillStyle = 'rgba(75, 40, 22, 0.45)';
    ctx.beginPath();
    ctx.moveTo(256, 210);
    ctx.lineTo(246, 252);
    ctx.lineTo(266, 252);
    ctx.closePath();
    ctx.fill();

    // 下巴口鼻通氣微孔矩陣 (Ventilation Holes)
    ctx.fillStyle = '#0d0f14';
    for (let r = 0; r < 5; r++) {
      const count = 5 - Math.abs(r - 2);
      for (let c = 0; c < count; c++) {
        const hx = 256 + (c - (count - 1) / 2) * 12;
        const hy = 345 + r * 11;
        ctx.beginPath();
        ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createGoggleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 偏光彩虹銥金鍍膜 (Polarized Iridium Lens Gradient)
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0.0, '#e64a19'); // 深橘紅
    grad.addColorStop(0.25, '#ff9800'); // 琥珀橙
    grad.addColorStop(0.5, '#ffd600'); // 亮金黃
    grad.addColorStop(0.75, '#00b0ff'); // 戰術藍寶石
    grad.addColorStop(1.0, '#2979ff'); // 湛藍
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // 45度高反光斜向玻璃高光條 (Specular Reflection Streaks)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(140, 0);
    ctx.lineTo(230, 0);
    ctx.lineTo(150, 256);
    ctx.lineTo(60, 256);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(270, 0);
    ctx.lineTo(315, 0);
    ctx.lineTo(235, 256);
    ctx.lineTo(190, 256);
    ctx.closePath();
    ctx.fill();

    // 風鏡橡膠邊框厚邊
    ctx.strokeStyle = '#0d1015';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, 512, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createVestTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1000D 考杜拉戰術尼龍主布 (Cordura Tactical Black)
    ctx.fillStyle = '#141820';
    ctx.fillRect(0, 0, 512, 512);

    // 交叉編織微細紋理
    ctx.fillStyle = '#1a1f29';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 2);
    }

    // 5 排 MOLLE 戰術織帶 (MOLLE Webbing Straps)
    for (let r = 0; r < 5; r++) {
      const sy = 175 + r * 62;
      ctx.fillStyle = '#222936';
      ctx.fillRect(35, sy, 442, 38);

      // 軍用卡其/土黃色加強套結車縫線 (Bar-tack Stitches)
      ctx.fillStyle = '#c89d4b';
      for (let c = 35; c <= 477; c += 55) {
        ctx.fillRect(c - 2, sy + 3, 4, 32);
      }
    }

    // 胸前魔鬼氈識別黏貼區 (Velcro Loop Field)
    ctx.fillStyle = '#1c212a';
    ctx.fillRect(150, 40, 212, 100);
    ctx.strokeStyle = '#2f3745';
    ctx.lineWidth = 4;
    ctx.strokeRect(150, 40, 212, 100);

    // CS Phoenix 鳳凰紅骷髏戰術作戰徽章 (Phoenix Connexion Insignia)
    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.arc(256, 82, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(242, 98, 28, 20);

    // 徽章骷髏眼眶與戰術細節
    ctx.fillStyle = '#1c212a';
    ctx.beginPath();
    ctx.arc(246, 80, 7, 0, Math.PI * 2);
    ctx.arc(266, 80, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(251, 104, 3, 10);
    ctx.fillRect(257, 104, 3, 10);

    // 重型拉鍊 (Center Heavy Zipper)
    ctx.strokeStyle = '#384050';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(256, 145);
    ctx.lineTo(256, 512);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createCamoTexture(type = 'pants') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 底色：深海軍藍 / 戰術深灰 (Phoenix Urban Camo)
    const baseCol = type === 'pants' ? '#252b36' : '#5c2d1b';
    const c1 = type === 'pants' ? '#374151' : '#3d1c10';
    const c2 = type === 'pants' ? '#181d25' : '#7a3920';
    const c3 = type === 'pants' ? '#4b5563' : '#1f0d07';

    ctx.fillStyle = baseCol;
    ctx.fillRect(0, 0, 512, 512);

    // 數碼迷彩像素方塊斑塊 (Digital Camo Blocks)
    const colors = [c1, c2, c3];
    for (let i = 0; i < 280; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const bx = Math.floor(Math.random() * 32) * 16;
      const by = Math.floor(Math.random() * 32) * 16;
      const bw = (Math.floor(Math.random() * 3) + 1) * 16;
      const bh = (Math.floor(Math.random() * 3) + 1) * 16;
      ctx.fillRect(bx, by, bw, bh);
    }

    // 防撕裂格子暗紋 (Ripstop Grid Pattern)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  }

  static createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 經典俄羅斯紅棕胡桃木底色 (Russian Red/Walnut Wood)
    ctx.fillStyle = '#7a3818';
    ctx.fillRect(0, 0, 512, 512);

    // 木紋層理 (Laminated Grain Layers)
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#4d200b' : '#994a20';
      ctx.lineWidth = 4 + Math.random() * 6;
      ctx.beginPath();
      const startY = i * 14;
      ctx.moveTo(0, startY);
      ctx.bezierCurveTo(
        160, startY + (Math.random() - 0.5) * 50,
        340, startY + (Math.random() - 0.5) * 50,
        512, startY + (Math.random() - 0.5) * 20
      );
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createGunMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 黑色磷化軍用鋼材 (Phosphate Gunmetal Steel)
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(0, 0, 512, 512);

    // 衝壓鉚釘與機匣細節 (Rivets & Receiver Markings)
    ctx.fillStyle = '#2f3645';
    // 側邊加強凸起筋 (Stamping Ribs)
    ctx.fillRect(50, 180, 412, 35);
    ctx.fillRect(80, 250, 350, 25);

    // 鉚釘
    ctx.fillStyle = '#0a0c10';
    for (const rx of [70, 130, 200, 310, 420]) {
      ctx.beginPath();
      ctx.arc(rx, 140, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a5366';
      ctx.beginPath();
      ctx.arc(rx - 2, 138, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0c10';
    }

    // 俄文快慢機刻字 ("АВ" 連發 / "ОД" 單發)
    ctx.fillStyle = '#c5cdd8';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('АВ', 360, 340);
    ctx.fillText('ОД', 360, 390);

    // 金屬邊緣磨損高光 (Edge Wear)
    ctx.strokeStyle = '#4e596d';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 508);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createHelmetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 戰術消光軍綠 (Matte OD Green / Slate)
    ctx.fillStyle = '#263028';
    ctx.fillRect(0, 0, 512, 512);

    // 頂部魔鬼氈貼片與血型戰術章 (Morale Patch "O POS")
    ctx.fillStyle = '#1c241e';
    ctx.fillRect(160, 160, 192, 120);
    ctx.strokeStyle = '#38483c';
    ctx.lineWidth = 3;
    ctx.strokeRect(160, 160, 192, 120);

    ctx.fillStyle = '#819c88';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('O POS', 256, 235);

    // 戰術消光磨損痕跡
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createBootTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111317';
    ctx.fillRect(0, 0, 256, 256);

    // 鞋帶穿孔與交叉鞋帶 (Cross Laces & Eyelets)
    ctx.strokeStyle = '#2b303c';
    ctx.lineWidth = 3;
    for (let y = 30; y < 220; y += 30) {
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.arc(80, y, 4, 0, Math.PI * 2);
      ctx.arc(176, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(176, y + 30);
      ctx.moveTo(176, y);
      ctx.lineTo(80, y + 30);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createGloveTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#13161c';
    ctx.fillRect(0, 0, 256, 256);

    // 碳纖維拳眼防護硬塊 (Carbon Fiber Knuckle Guard)
    ctx.fillStyle = '#222733';
    ctx.beginPath();
    ctx.roundRect(40, 50, 176, 75, 16);
    ctx.fill();

    ctx.strokeStyle = '#323a4b';
    ctx.lineWidth = 2;
    for (let d = -100; d < 300; d += 8) {
      ctx.beginPath();
      ctx.moveTo(d, 50);
      ctx.lineTo(d + 100, 125);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  static createShemaghTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 戰術圍巾沙色/灰綠底 (Coyote Sand / Olive)
    ctx.fillStyle = '#8a7d68';
    ctx.fillRect(0, 0, 256, 256);

    // 千鳥格幾何方塊紋理 (Houndstooth / Lattice)
    ctx.fillStyle = '#26221c';
    for (let x = 0; x < 256; x += 32) {
      for (let y = 0; y < 256; y += 32) {
        if ((x + y) % 64 === 0) {
          ctx.fillRect(x + 4, y + 4, 12, 12);
          ctx.fillRect(x + 16, y + 16, 12, 12);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }
}

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
    this.baseTorsoY = 1.10;
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
    // 取得快取程序化高解析戰術貼圖
    const texs = BotTextureFactory.getTextures();

    this.jacketMat = new THREE.MeshStandardMaterial({ map: texs.camoShirt, roughness: 0.72, metalness: 0.05 });
    this.vestMat = new THREE.MeshStandardMaterial({ map: texs.vest, roughness: 0.65, metalness: 0.2 });
    this.pouchMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.85 });
    this.beltMat = new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.9 });
    this.pantsMat = new THREE.MeshStandardMaterial({ map: texs.camoPants, roughness: 0.78, metalness: 0.05 });
    this.skinMat = new THREE.MeshStandardMaterial({ map: texs.balaclava, roughness: 0.72, metalness: 0.05 });
    this.helmetMat = new THREE.MeshStandardMaterial({ map: texs.helmet, roughness: 0.48, metalness: 0.35 });
    this.scarfMat = new THREE.MeshStandardMaterial({ map: texs.shemagh, roughness: 0.85 });
    this.goggleMat = new THREE.MeshStandardMaterial({ map: texs.goggles, roughness: 0.05, metalness: 0.98 });
    this.goggleFrameMat = new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.7 });
    this.gunMat = new THREE.MeshStandardMaterial({ map: texs.gunMetal, roughness: 0.32, metalness: 0.88 });
    this.woodMat = new THREE.MeshStandardMaterial({ map: texs.wood, roughness: 0.42, metalness: 0.05 });
    this.bootMat = new THREE.MeshStandardMaterial({ map: texs.boot, roughness: 0.72, metalness: 0.1 });
    this.padMat = new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.32, metalness: 0.35 });
    this.gloveMat = new THREE.MeshStandardMaterial({ map: texs.glove, roughness: 0.62 });
    this.filterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.65 });
    this.headsetMat = new THREE.MeshStandardMaterial({ color: 0x222a22, roughness: 0.45, metalness: 0.4 });
    this.knifeMat = new THREE.MeshStandardMaterial({ color: 0x13171e, roughness: 0.25, metalness: 0.92 });
    this.chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.15, metalness: 0.95 });

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
    const legSpacing = 0.096; // 雙腿自然緊湊間距
    const thighGeo = new THREE.CylinderGeometry(0.092, 0.080, 0.36, 12);
    const calfGeo = new THREE.CylinderGeometry(0.076, 0.065, 0.36, 12);
    const cargoPocketGeo = new THREE.BoxGeometry(0.045, 0.16, 0.13);
    const kneepadGeo = new THREE.BoxGeometry(0.14, 0.12, 0.06);
    const bootFootGeo = new THREE.BoxGeometry(0.14, 0.13, 0.25);
    const bootSoleGeo = new THREE.BoxGeometry(0.145, 0.035, 0.26);

    // --- 左腿 (Left Leg - 自然戰術微前伸前導腿) ---
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-legSpacing, 0.74, 0.03);
    this.leftLegPivot.rotation.set(0.04, -0.06, 0);

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
    this.leftKneePivot.rotation.x = 0.08;
    this.leftLegPivot.add(this.leftKneePivot);

    // 左膝 X 型硬殼防護護膝 (Kneepad)
    const leftKneepad = new THREE.Mesh(kneepadGeo, this.padMat);
    leftKneepad.position.set(0, 0, 0.065);
    this.leftKneePivot.add(leftKneepad);

    // 護膝腿後固定彈性帶
    const leftKneeStrap = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, 0.02), this.padMat);
    leftKneeStrap.position.set(0, 0, -0.05);
    this.leftKneePivot.add(leftKneeStrap);

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

    // --- 右腿 (Right Leg - 戰術後支撐腿) ---
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(legSpacing, 0.74, -0.03);
    this.rightLegPivot.rotation.set(0.04, 0.14, 0);

    // 右大腿
    this.rightLegMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    this.rightLegMesh.position.set(0, -0.18, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegMesh.userData = { bot: this, part: 'legs' };
    this.rightLegPivot.add(this.rightLegMesh);
    this.hitboxes.push(this.rightLegMesh);

    // 右大腿外側腿掛快拔手槍槍套 (Drop-Leg Tactical Holster)
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.20, 0.10), this.padMat);
    holster.position.set(0.08, -0.16, 0.01);
    this.rightLegPivot.add(holster);

    // 槍套內插備用副武器 (Glock / P250 副手槍把手)
    const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.075, 0.045), this.knifeMat);
    pistolGrip.position.set(0.08, -0.05, 0.02);
    pistolGrip.rotation.x = -0.3;
    this.rightLegPivot.add(pistolGrip);

    // 右膝關節樞軸 (Right Knee Pivot)
    this.rightKneePivot = new THREE.Group();
    this.rightKneePivot.position.set(0, -0.36, 0);
    this.rightKneePivot.rotation.x = 0.08;
    this.rightLegPivot.add(this.rightKneePivot);

    // 右膝硬殼護膝
    const rightKneepad = new THREE.Mesh(kneepadGeo, this.padMat);
    rightKneepad.position.set(0, 0, 0.065);
    this.rightKneePivot.add(rightKneepad);

    const rightKneeStrap = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, 0.02), this.padMat);
    rightKneeStrap.position.set(0, 0, -0.05);
    this.rightKneePivot.add(rightKneeStrap);

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
    this.upperBody.rotation.x = 0.06; // 經典 CS 特警往前微傾瞄準攻擊身段
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

    // 胸前左側斜插戰術格鬥刀 (Combat Tanto Knife in Kydex Sheath)
    const knifeSheath = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.025), this.padMat);
    knifeSheath.position.set(-0.14, 0.08, 0.17);
    knifeSheath.rotation.z = 0.35;
    this.upperBody.add(knifeSheath);

    const knifeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.09, 0.02), this.knifeMat);
    knifeHandle.position.set(-0.17, 0.18, 0.175);
    knifeHandle.rotation.z = 0.35;
    this.upperBody.add(knifeHandle);

    // 胸前右側掛載雙聯戰術手榴彈/閃光彈 (Flashbangs on MOLLE Webbing)
    for (const gx of [0.11, 0.17]) {
      const grenade = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 8), this.headsetMat);
      grenade.position.set(gx, 0.08, 0.17);
      this.upperBody.add(grenade);

      const grenadePin = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.025), this.chromeMat);
      grenadePin.position.set(gx, 0.13, 0.17);
      this.upperBody.add(grenadePin);
    }

    // 胸前戰術通訊手咪與對講機 (Radio & Long Range Antenna)
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.045), this.pouchMat);
    radio.position.set(-0.16, 0.13, 0.16);
    this.upperBody.add(radio);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16, 4), this.gunMat);
    antenna.position.set(-0.16, 0.26, 0.16);
    this.upperBody.add(antenna);

    // 戰術勤務腰帶 (Duty Belt - 位於背心下沿與臀部連接處)
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 14), this.beltMat);
    belt.scale.set(1.0, 1.0, 0.74);
    belt.position.set(0, -0.32, 0);
    this.upperBody.add(belt);

    // 腰後 IFAK 特警急救包
    const ifak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.06), this.pouchMat);
    ifak.position.set(0.12, -0.32, -0.15);
    this.upperBody.add(ifak);

    // 脖子周圍厚實戰術圍巾領 (Tactical Shemagh Collar)
    const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.045, 8, 16), this.scarfMat);
    scarfCollar.rotation.x = Math.PI / 2;
    scarfCollar.position.set(0, 0.25, 0.02);
    this.upperBody.add(scarfCollar);

    // 胸前自然垂下的三角折疊圍巾下擺 (Shemagh Triangular Chest Drape)
    const scarfDrape = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 4), this.scarfMat);
    scarfDrape.rotation.set(Math.PI, 0, Math.PI / 4);
    scarfDrape.position.set(0, 0.14, 0.16);
    this.upperBody.add(scarfDrape);

    // ==========================================================
    // 3. 特戰 FAST 戰術頭盔、面罩、通訊耳機與風鏡 (Head Rig)
    // ==========================================================
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.44, 0);
    this.upperBody.add(headGroup);

    // 面罩頭部本體 (Head with High-Res Balaclava Texture)
    const headGeo = new THREE.SphereGeometry(0.135, 18, 16);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.scale.set(0.92, 1.15, 1.05);
    this.headMesh.castShadow = true;
    this.headMesh.userData = { bot: this, part: 'head' };
    headGroup.add(this.headMesh);
    this.hitboxes.push(this.headMesh);

    // FAST 戰術防彈頭盔 (Tactical High-Cut Helmet)
    const helmetGeo = new THREE.SphereGeometry(0.148, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const helmet = new THREE.Mesh(helmetGeo, this.helmetMat);
    helmet.scale.set(0.96, 1.06, 1.08);
    helmet.position.set(0, 0.03, -0.01);
    helmet.castShadow = true;
    headGroup.add(helmet);

    // 頭盔前額夜視儀墨魚干基座 (NVG Shroud)
    const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), this.padMat);
    nvgMount.position.set(0, 0.08, 0.145);
    headGroup.add(nvgMount);

    // 頭盔兩側戰術導軌 (ARC Rails)
    for (const rx of [-0.138, 0.138]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.11), this.padMat);
      rail.position.set(rx, 0.04, 0.01);
      headGroup.add(rail);
    }

    // 戰術降噪通訊耳機 (Peltor ComTac Headset with Flexible Boom Mic)
    for (const ex of [-0.146, 0.146]) {
      const earcup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.032, 12), this.headsetMat);
      earcup.rotation.z = Math.PI / 2;
      earcup.position.set(ex, 0.01, 0.0);
      headGroup.add(earcup);
    }

    // 喉震麥克風延伸懸臂 (Boom Microphone)
    const micArm = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.13, 6), this.gunMat);
    micArm.rotation.set(0.3, 0.4, 0.6);
    micArm.position.set(-0.11, -0.04, 0.09);
    headGroup.add(micArm);

    const micHead = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.024, 8), this.padMat);
    micHead.position.set(-0.06, -0.07, 0.14);
    headGroup.add(micHead);

    // 大號特種戰術防爆風鏡 (Tactical Goggles with Iridium Polarized Lens)
    const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.068, 0.04), this.goggleFrameMat);
    goggleFrame.position.set(0, 0.03, 0.125);
    headGroup.add(goggleFrame);

    const goggleLens = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.012), this.goggleMat);
    goggleLens.position.set(0, 0.03, 0.146);
    headGroup.add(goggleLens);

    // 風鏡彈性束帶 (圍繞頭部兩側)
    for (const bx of [-0.135, 0.135]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.18), this.goggleFrameMat);
      band.position.set(bx, 0.03, 0);
      headGroup.add(band);
    }

    // ==========================================================
    // 4. CS 經典突擊步槍作戰架槍身段 (AK-47 Tactical Rifle Stance)
    // 槍托緊貼右肩窩、右手扣扳機握把、左手向前完全舒展托護木！
    // 絕不橫跨抱胸，長槍管與香蕉彈匣極致突出！
    // ==========================================================
    this.armsPivot = new THREE.Group();
    this.armsPivot.position.set(0, 0.16, 0.04);
    this.upperBody.add(this.armsPivot);

    const upperArmGeo = new THREE.CylinderGeometry(0.054, 0.048, 0.25, 10);
    const forearmGeo = new THREE.CylinderGeometry(0.048, 0.040, 0.25, 10);
    const elbowPadGeo = new THREE.BoxGeometry(0.085, 0.085, 0.055);

    // --- AK-47 步槍本體 (位於右胸前方，槍口筆直瞄準射擊方向) ---
    this.weaponGroup = new THREE.Group();
    this.weaponGroup.position.set(0.14, 0.0, 0.24);
    this.weaponGroup.rotation.set(-0.02, 0.04, 0);

    // 鋼製衝壓機匣 (Stamped Receiver)
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.086, 0.38), this.gunMat);
    this.weaponGroup.add(gunBody);

    // 拋殼窗與鍍鉻槍機 (Bolt Carrier)
    const boltCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.026, 0.14), this.chromeMat);
    boltCarrier.position.set(0.027, 0.02, -0.02);
    this.weaponGroup.add(boltCarrier);

    // 機匣蓋加強頂蓋
    const topCover = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.03, 0.36), this.gunMat);
    topCover.position.set(0, 0.048, -0.01);
    this.weaponGroup.add(topCover);

    // 俄式紅棕木質經典下斜槍托 (抵在右肩前窩)
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.098, 0.28), this.woodMat);
    stock.position.set(0, -0.02, -0.30);
    stock.rotation.x = -0.10;
    this.weaponGroup.add(stock);

    // 防滑手槍握把 (Pistol Grip)
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.12, 0.055), this.padMat);
    grip.position.set(0, -0.09, -0.08);
    grip.rotation.x = -0.40;
    this.weaponGroup.add(grip);

    // 30 發經典鋼製弧形香蕉彈匣 (Banana Mag - 垂直懸掛超醒目特徵)
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.20, 0.09), this.gunMat);
    mag.position.set(0, -0.13, 0.07);
    mag.rotation.x = 0.32;
    this.weaponGroup.add(mag);

    // 俄式胡桃木上下護木 (Wood Handguard)
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.078, 0.24), this.woodMat);
    handguard.position.set(0, 0.012, 0.28);
    this.weaponGroup.add(handguard);

    // 瓦斯導氣管
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.26, 8), this.gunMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.044, 0.29);
    this.weaponGroup.add(gasTube);

    // 金屬長槍管
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.42, 8), this.gunMat);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0.018, 0.46);
    this.weaponGroup.add(gunBarrel);

    // 前罩準星座 (Front Sight Tower)
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.025), this.gunMat);
    frontSight.position.set(0, 0.046, 0.60);
    this.weaponGroup.add(frontSight);

    // 45 度斜切經典槍口制退器 (AK Slant Muzzle Compensator)
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.055, 8), this.gunMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.018, 0.68);
    this.weaponGroup.add(muzzle);

    this.armsPivot.add(this.weaponGroup);

    // --- 右手臂 (扣扳機主手 - 貼合右身側，絕不抱胸) ---
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.24, 0.02, -0.04);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, this.jacketMat);
    rightUpperArm.position.set(0, -0.09, 0.04);
    rightUpperArm.rotation.set(-0.45, 0.12, -0.10);
    this.rightArmGroup.add(rightUpperArm);

    const rightForearm = new THREE.Mesh(forearmGeo, this.jacketMat);
    rightForearm.position.set(-0.06, -0.13, 0.16);
    rightForearm.rotation.set(-1.15, 0.22, -0.25);
    this.rightArmGroup.add(rightForearm);

    const rightElbow = new THREE.Mesh(elbowPadGeo, this.padMat);
    rightElbow.position.set(-0.01, -0.16, 0.08);
    this.rightArmGroup.add(rightElbow);

    // 右手戰術手套 (緊握握把扣動扳機)
    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.09), this.gloveMat);
    rightGlove.position.set(-0.10, -0.15, 0.23);
    rightGlove.rotation.set(-0.4, 0.2, 0);
    this.rightArmGroup.add(rightGlove);

    this.armsPivot.add(this.rightArmGroup);

    // --- 左手臂 (副手向前延伸托穩護木 - 專業 C-Clamp / Support Grip) ---
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.24, 0.02, 0.02);

    const leftUpperArm = new THREE.Mesh(upperArmGeo, this.jacketMat);
    leftUpperArm.position.set(0.08, -0.08, 0.09);
    leftUpperArm.rotation.set(-0.80, -0.32, 0.38);
    this.leftArmGroup.add(leftUpperArm);

    const leftForearm = new THREE.Mesh(forearmGeo, this.jacketMat);
    leftForearm.position.set(0.24, -0.10, 0.27);
    leftForearm.rotation.set(-1.10, -0.45, 0.70);
    this.leftArmGroup.add(leftForearm);

    const leftElbow = new THREE.Mesh(elbowPadGeo, this.padMat);
    leftElbow.position.set(0.12, -0.12, 0.16);
    this.leftArmGroup.add(leftElbow);

    // 左手戰術手套 (從下方牢牢托住木質護木)
    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.09), this.gloveMat);
    leftGlove.position.set(0.38, -0.06, 0.44);
    leftGlove.rotation.set(-0.3, -0.4, 0.4);
    this.leftArmGroup.add(leftGlove);

    this.armsPivot.add(this.leftArmGroup);

    // 槍火光 (星形十字 - 位於斜切槍口頂端)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true });
    this.flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), flashMat);
    this.flashMesh.position.set(0.14, 1.28, 1.05);
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
    if (this.jacketMat) this.jacketMat.color.setHex(0xff3333);
    if (this.skinMat) this.skinMat.color.setHex(0xff3333);
    setTimeout(() => {
      if (this.jacketMat) this.jacketMat.color.setHex(0xffffff);
      if (this.skinMat) this.skinMat.color.setHex(0xffffff);
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
      const fwd = new THREE.Vector3(0, 0, 0.70).applyQuaternion(this.group.quaternion);
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
    const leftKneeBend = Math.max(0.08, Math.max(0, -thighAngle) * 0.85);
    const rightKneeBend = Math.max(0.08, Math.max(0, thighAngle) * 0.85);
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
   * 平滑恢復站立或蹲姿 (Smooth Transition to Natural Combat Ready Idle)
   */
  resetLegs(delta = 0.016) {
    const smooth = Math.min(delta * 12, 1);
    this.leftLegPivot.rotation.x += (0.04 - this.leftLegPivot.rotation.x) * smooth;
    this.rightLegPivot.rotation.x += (0.04 - this.rightLegPivot.rotation.x) * smooth;
    if (this.leftKneePivot) this.leftKneePivot.rotation.x += (0.08 - this.leftKneePivot.rotation.x) * smooth;
    if (this.rightKneePivot) this.rightKneePivot.rotation.x += (0.08 - this.rightKneePivot.rotation.x) * smooth;
    if (this.upperBody) {
      this.upperBody.rotation.z += (0 - this.upperBody.rotation.z) * smooth;
      this.upperBody.rotation.y += (0 - this.upperBody.rotation.y) * smooth;
    }
    if (this.armsPivot) {
      this.armsPivot.position.set(0, 0.16, 0.04);
    }
    this.group.rotation.z += (0 - this.group.rotation.z) * smooth;
  }

  getHitboxes() {
    return this.hitboxes;
  }
}
