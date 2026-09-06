import * as THREE from 'three';

export class TargetDummy {
  constructor(scene, position, rotationY = 0) {
    this.scene = scene;
    this.spawnPos = position.clone();
    this.rotationY = rotationY;

    this.maxHp = 100;
    this.hp = this.maxHp;
    this.isDead = false;
    this.respawnTimer = 0;

    // 碰撞 Hitbox 群組 (用於射線檢測)
    this.hitboxes = [];

    this.group = new THREE.Group();
    this.group.position.copy(this.spawnPos);
    this.group.rotation.y = this.rotationY;
    this.scene.add(this.group);

    this.buildModel();
  }

  buildModel() {
    // 假人材質 (低多邊形靶人：深藍身體、橙色頭部)
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2b6cb0, // 警匪反恐藍
      roughness: 0.6,
      metalness: 0.2
    });

    this.headMat = new THREE.MeshStandardMaterial({
      color: 0xed8936, // 橘色頭部 (爆頭靶心)
      roughness: 0.5,
      metalness: 0.1
    });

    this.limbMat = new THREE.MeshStandardMaterial({
      color: 0x1a365d,
      roughness: 0.7
    });

    // 1. 軀幹 (Chest / Body) - 高 0.7m, 寬 0.45m, 深 0.25m
    const torsoGeo = new THREE.BoxGeometry(0.45, 0.7, 0.25);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.bodyMat);
    this.torsoMesh.position.set(0, 1.15, 0);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.torsoMesh.userData = { dummy: this, part: 'body' };
    this.group.add(this.torsoMesh);
    this.hitboxes.push(this.torsoMesh);

    // 2. 頭部 (Head) - 0.22m 立方體 (半徑約 0.11m)
    const headGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    this.headMesh = new THREE.Mesh(headGeo, this.headMat);
    this.headMesh.position.set(0, 1.65, 0);
    this.headMesh.castShadow = true;
    this.headMesh.receiveShadow = true;
    this.headMesh.userData = { dummy: this, part: 'head' };
    this.group.add(this.headMesh);
    this.hitboxes.push(this.headMesh);

    // 3. 雙腿 (Legs)
    const legGeo = new THREE.BoxGeometry(0.18, 0.8, 0.2);
    const leftLeg = new THREE.Mesh(legGeo, this.limbMat);
    leftLeg.position.set(-0.12, 0.4, 0);
    leftLeg.castShadow = true;
    leftLeg.userData = { dummy: this, part: 'legs' };
    this.group.add(leftLeg);
    this.hitboxes.push(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, this.limbMat);
    rightLeg.position.set(0.12, 0.4, 0);
    rightLeg.castShadow = true;
    rightLeg.userData = { dummy: this, part: 'legs' };
    this.group.add(rightLeg);
    this.hitboxes.push(rightLeg);

    // 4. 雙臂 (Arms)
    const armGeo = new THREE.BoxGeometry(0.12, 0.65, 0.15);
    const leftArm = new THREE.Mesh(armGeo, this.limbMat);
    leftArm.position.set(-0.31, 1.12, 0);
    leftArm.castShadow = true;
    leftArm.userData = { dummy: this, part: 'body' };
    this.group.add(leftArm);
    this.hitboxes.push(leftArm);

    const rightArm = new THREE.Mesh(armGeo, this.limbMat);
    rightArm.position.set(0.31, 1.12, 0);
    rightArm.castShadow = true;
    rightArm.userData = { dummy: this, part: 'body' };
    this.group.add(rightArm);
    this.hitboxes.push(rightArm);

    // 5. 頭頂血條 (Billboard Sprite)
    this.createHpBar();
  }

  createHpBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 16;
    this.hpCanvas = canvas;
    this.hpCtx = canvas.getContext('2d');

    this.hpTexture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.hpTexture,
      transparent: true,
      depthTest: false
    });

    this.hpSprite = new THREE.Sprite(spriteMat);
    this.hpSprite.scale.set(0.8, 0.1, 1);
    this.hpSprite.position.set(0, 1.95, 0);
    this.group.add(this.hpSprite);

    this.renderHpBar();
  }

  renderHpBar() {
    const ctx = this.hpCtx;
    ctx.clearRect(0, 0, 128, 16);

    // 黑色底框
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 128, 16);

    // 血量長條
    const pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = pct > 0.5 ? '#48bb78' : pct > 0.25 ? '#ecc94b' : '#f56565';
    ctx.fillRect(2, 2, Math.floor(124 * pct), 12);

    this.hpTexture.needsUpdate = true;
  }

  takeDamage(baseDamage, part = 'body') {
    if (this.isDead) return null;

    let multiplier = 1.0;
    let isHeadshot = false;

    if (part === 'head') {
      multiplier = 4.0; // 爆頭 4 倍傷害
      isHeadshot = true;
    } else if (part === 'legs') {
      multiplier = 0.75;
    }

    const actualDamage = Math.round(baseDamage * multiplier);
    this.hp = Math.max(0, this.hp - actualDamage);
    this.renderHpBar();

    // 受擊泛紅反饋
    this.flashRed();

    // 死亡判定
    if (this.hp <= 0) {
      this.die();
    }

    return {
      damage: actualDamage,
      isHeadshot: isHeadshot,
      isDead: this.hp <= 0,
      hitPoint: this.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
    };
  }

  flashRed() {
    const originalColor = this.bodyMat.color.getHex();
    this.bodyMat.color.setHex(0xff3333);
    this.headMat.color.setHex(0xff0000);

    setTimeout(() => {
      this.bodyMat.color.setHex(originalColor);
      this.headMat.color.setHex(0xed8936);
    }, 100);
  }

  die() {
    this.isDead = true;
    this.respawnTimer = 2.5; // 2.5 秒後自動滿血重生

    // 倒下動畫或隱藏
    this.group.rotation.x = -Math.PI / 2;
    this.group.position.y = this.spawnPos.y - 0.7;
    this.hpSprite.visible = false;
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.group.position.copy(this.spawnPos);
    this.group.rotation.set(0, this.rotationY, 0);
    this.hpSprite.visible = true;
    this.renderHpBar();
  }

  update(delta) {
    if (this.isDead) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
    }
  }

  getHitboxes() {
    return this.hitboxes;
  }
}
