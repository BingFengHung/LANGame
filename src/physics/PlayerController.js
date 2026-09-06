import * as THREE from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';

export class PlayerController {
  constructor(camera, domElement, worldCollision) {
    this.camera = camera;
    this.domElement = domElement;
    this.worldCollision = worldCollision;

    // 視角旋轉採用 YXZ 順序 (FPS 標準)
    this.camera.rotation.order = 'YXZ';

    // 膠囊體尺寸規格 (CS 標準：直徑 0.7m，高 1.8m，蹲下高 1.2m)
    this.radius = 0.35;
    this.standHeight = 1.45;
    this.crouchHeight = 0.85;
    this.currentHeight = this.standHeight;

    // 膠囊體起始與終止端點 (以原點為基礎)
    this.capsule = new Capsule(
      new THREE.Vector3(0, this.radius, 0),
      new THREE.Vector3(0, this.standHeight, 0),
      this.radius
    );

    // 物理與運動參數
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this.gravity = -25.0; // 重力加速度 (略重以維持乾脆手感)
    this.jumpSpeed = 9.5; // 跳躍初速
    this.groundAccel = 65.0; // 地面加速度
    this.airAccel = 12.0; // 空中加速度
    this.friction = 8.5; // 摩擦阻尼 (實現急停煞車)

    // 移動速限 (公尺/秒)
    this.speedRun = 7.2; // 跑步
    this.speedWalk = 3.6; // 靜音慢走 (Shift)
    this.speedCrouch = 2.4; // 蹲走 (Ctrl)

    // 輸入狀態
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      walk: false,
      crouch: false
    };

    // 滑鼠與指針鎖定
    this.isLocked = false;
    this.mouseSensitivity = 0.0022;

    // 頭部微晃動 (Head Bobbing)
    this.bobTimer = 0;
    this.bobAmount = 0.04;

    // 生命值與護甲
    this.maxHp = 100;
    this.hp = 100;
    this.maxArmor = 100;
    this.armor = 100;
    this.isDead = false;

    this.spawn(new THREE.Vector3(0, 0, 48), 0);
    this.initEventListeners();
  }

  spawn(position, yaw = 0) {
    this.capsule.start.set(position.x, position.y + this.radius, position.z);
    this.capsule.end.set(position.x, position.y + this.currentHeight, position.z);
    this.velocity.set(0, 0, 0);
    this.camera.rotation.set(0, yaw, 0);
    this.camera.position.copy(this.capsule.end).add(new THREE.Vector3(0, 0.15, 0));
  }

  initEventListeners() {
    // 點擊鎖定指針
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (!this.isLocked) {
        this.resetKeys();
      }
    });

    // 視窗失去焦點時重置所有按鍵，防止放開 W 時事件被吃掉
    window.addEventListener('blur', () => {
      this.resetKeys();
    });

    // 滑鼠視角控制
    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.mouseDeltaX = (this.mouseDeltaX || 0) + movementX;
      this.mouseDeltaY = (this.mouseDeltaY || 0) + movementY;

      // 水平轉動 (Yaw)
      this.camera.rotation.y -= movementX * this.mouseSensitivity;

      // 垂直俯仰 (Pitch，限制在 -85° ~ +85°)
      this.camera.rotation.x -= movementY * this.mouseSensitivity;
      this.camera.rotation.x = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, this.camera.rotation.x)
      );
    });

    // 鍵盤按下與鬆開 (同時比對 code 與 key，避免中文輸入法造成 keyup 遺漏)
    window.addEventListener('keydown', (event) => {
      this.onKeyChange(event, true);
    });

    window.addEventListener('keyup', (event) => {
      this.onKeyChange(event, false);
    });
  }

  resetKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.keys.walk = false;
    this.keys.crouch = false;
    this.velocity.x = 0;
    this.velocity.z = 0;
  }

  onKeyChange(event, isPressed) {
    const code = event.code;
    const key = event.key ? event.key.toLowerCase() : '';

    if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') {
      this.keys.forward = isPressed;
    } else if (code === 'KeyS' || key === 's' || code === 'ArrowDown') {
      this.keys.backward = isPressed;
    } else if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') {
      this.keys.left = isPressed;
    } else if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') {
      this.keys.right = isPressed;
    } else if (code === 'Space' || key === ' ') {
      this.keys.jump = isPressed;
    } else if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
      this.keys.walk = isPressed;
    } else if (code === 'KeyC' || key === 'c' || code === 'ControlLeft' || code === 'ControlRight' || key === 'control') {
      this.keys.crouch = isPressed;
    }
  }

  update(delta) {
    // 限制單幀 delta 防止失步
    delta = Math.min(delta, 0.05);

    // 1. 處理蹲下狀態切換 (平滑改變膠囊高度)
    const targetHeight = this.keys.crouch ? this.crouchHeight : this.standHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * Math.min(delta * 15, 1);
    this.capsule.end.y = this.capsule.start.y + (this.currentHeight - this.radius);

    // 2. 獲取當前移動目標速度
    let targetSpeed = this.speedRun;
    if (this.keys.crouch) {
      targetSpeed = this.speedCrouch;
    } else if (this.keys.walk) {
      targetSpeed = this.speedWalk;
    }

    // 3. 計算水平移動方向向量 (依據相機 Yaw 方向)
    const moveVector = new THREE.Vector3();
    if (this.keys.forward) moveVector.z -= 1;
    if (this.keys.backward) moveVector.z += 1;
    if (this.keys.left) moveVector.x -= 1;
    if (this.keys.right) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);
    }

    // 4. 地面摩擦與急停阻尼 (Friction Damping)
    // 無論地面或空中，皆使用負指數阻尼進行速度衰減
    const dampingFactor = this.onGround ? -12.0 : -2.5;
    const damping = Math.exp(dampingFactor * delta) - 1.0;
    this.velocity.x += this.velocity.x * damping;
    this.velocity.z += this.velocity.z * damping;

    // 當沒有按鍵輸入且速度極小時，強制歸零避免持續向前飄移
    if (moveVector.lengthSq() === 0) {
      if (Math.hypot(this.velocity.x, this.velocity.z) < 0.1) {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    // 地面與空中推力加速度
    if (moveVector.lengthSq() > 0) {
      const accel = this.onGround ? this.groundAccel : this.airAccel;
      this.velocity.x += moveVector.x * accel * delta;
      this.velocity.z += moveVector.z * accel * delta;

      // 限速保護
      const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      if (horizontalSpeed > targetSpeed) {
        const ratio = targetSpeed / horizontalSpeed;
        this.velocity.x *= ratio;
        this.velocity.z *= ratio;
      }
    }

    // 重力與跳躍
    if (this.onGround) {
      if (this.keys.jump) {
        this.velocity.y = this.jumpSpeed;
        this.onGround = false;
      } else {
        // 微量向下吸附，避免在下坡或平地輕微跳幀造成浮空
        this.velocity.y = -1.0;
      }
    } else {
      this.velocity.y += this.gravity * delta;
    }

    // 5. 碰撞檢測與物理推進 (Sub-stepping)
    const steps = 4;
    const stepDelta = delta / steps;
    let collidedGround = false;

    for (let i = 0; i < steps; i++) {
      this.capsule.translate(this.velocity.clone().multiplyScalar(stepDelta));
      const hit = this.resolveCollision();
      if (hit && hit.isGround) {
        collidedGround = true;
      }
    }

    this.onGround = collidedGround;

    // 6. 相機位置同步至膠囊體頭頂 + 頭部微晃動
    const eyeHeight = this.currentHeight + 0.15;
    const targetCameraPos = this.capsule.start.clone();
    targetCameraPos.y = this.capsule.start.y - this.radius + eyeHeight;

    // 頭部行走晃動 (Head Bobbing)
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.onGround && currentSpeed > 0.5) {
      this.bobTimer += delta * currentSpeed * 2.2;
      const bobY = Math.sin(this.bobTimer * 2) * this.bobAmount;
      const bobX = Math.cos(this.bobTimer) * (this.bobAmount * 0.5);
      targetCameraPos.y += bobY;
      targetCameraPos.x += Math.cos(this.camera.rotation.y) * bobX;
      targetCameraPos.z += Math.sin(this.camera.rotation.y) * bobX;
    } else {
      this.bobTimer = 0;
    }

    this.camera.position.copy(targetCameraPos);
  }

  resolveCollision() {
    const result = this.worldCollision.capsuleIntersect(this.capsule);
    if (result) {
      // 判定是否踩在地面 (斜率檢測，法向量 y > 0.35 視為地面/斜坡)
      const isGround = result.normal.y > 0.35;

      // 修正膠囊體位移
      this.capsule.translate(result.normal.clone().multiplyScalar(result.depth));

      if (isGround) {
        // 地面消除垂直下墜速度
        if (this.velocity.y < 0) this.velocity.y = 0;
      } else {
        // 撞牆滑動：將垂直於牆面法線的速度消除
        this.velocity.addScaledVector(result.normal, -this.velocity.dot(result.normal));
      }

      return { isGround };
    }
    return null;
  }

  /**
   * 施加射擊後座力抬升與左右擺動
   */
  applyRecoil(pitchKick, yawKick = 0) {
    this.camera.rotation.x += pitchKick;
    this.camera.rotation.y += yawKick;
    this.camera.rotation.x = Math.max(
      -Math.PI / 2 + 0.05,
      Math.min(Math.PI / 2 - 0.05, this.camera.rotation.x)
    );
  }

  /**
   * 獲取開火射線 (包含依當前速度/後座力計算的隨機散佈)
   */
  getShootRay(spreadAngle = 0) {
    const origin = this.camera.position.clone();
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    if (spreadAngle > 0) {
      // 在視角垂直平面上產生隨機圓形散佈
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * spreadAngle;
      const offsetX = Math.cos(theta) * r;
      const offsetY = Math.sin(theta) * r;

      // 構建相機右向量與上向量
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

      direction.addScaledVector(right, offsetX);
      direction.addScaledVector(up, offsetY);
      direction.normalize();
    }

    return new THREE.Ray(origin, direction);
  }

  getPosition() {
    return this.capsule.start.clone();
  }

  getYaw() {
    return this.camera.rotation.y;
  }

  getPitch() {
    return this.camera.rotation.x;
  }

  getAndClearMouseDelta() {
    const delta = { x: this.mouseDeltaX || 0, y: this.mouseDeltaY || 0 };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  takeDamage(amount) {
    if (this.isDead) return null;

    let dmg = amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, Math.round(dmg * 0.5));
      this.armor -= absorbed;
      dmg -= absorbed;
    }

    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp <= 0) {
      this.isDead = true;
    }

    return {
      hp: this.hp,
      armor: this.armor,
      isDead: this.isDead
    };
  }

  respawn(position = new THREE.Vector3(0, 0, 48), yaw = 0) {
    this.hp = this.maxHp;
    this.armor = this.maxArmor;
    this.isDead = false;
    this.spawn(position, yaw);
  }
}
