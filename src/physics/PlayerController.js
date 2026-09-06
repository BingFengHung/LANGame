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

    this.spawn(new THREE.Vector3(0, 2, 8), 0);
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
    });

    // 滑鼠視角控制
    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      // 水平轉動 (Yaw)
      this.camera.rotation.y -= movementX * this.mouseSensitivity;

      // 垂直俯仰 (Pitch，限制在 -85° ~ +85°)
      this.camera.rotation.x -= movementY * this.mouseSensitivity;
      this.camera.rotation.x = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, this.camera.rotation.x)
      );
    });

    // 鍵盤按下
    window.addEventListener('keydown', (event) => {
      this.onKeyChange(event.code, true);
    });

    // 鍵盤鬆開
    window.addEventListener('keyup', (event) => {
      this.onKeyChange(event.code, false);
    });
  }

  onKeyChange(code, isPressed) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = isPressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = isPressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = isPressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = isPressed;
        break;
      case 'Space':
        this.keys.jump = isPressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.walk = isPressed;
        break;
      case 'KeyC':
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.crouch = isPressed;
        break;
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
    if (this.onGround) {
      // 水平速度分量阻尼衰減 (鬆開鍵盤時急停)
      const damping = Math.max(0, 1 - this.friction * delta);
      this.velocity.x *= damping;
      this.velocity.z *= damping;

      // 地面加速
      if (moveVector.lengthSq() > 0) {
        this.velocity.x += moveVector.x * this.groundAccel * delta;
        this.velocity.z += moveVector.z * this.groundAccel * delta;

        // 限速保護
        const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (horizontalSpeed > targetSpeed) {
          const ratio = targetSpeed / horizontalSpeed;
          this.velocity.x *= ratio;
          this.velocity.z *= ratio;
        }
      }

      // 跳躍判定
      if (this.keys.jump) {
        this.velocity.y = this.jumpSpeed;
        this.onGround = false;
      }
    } else {
      // 空中控制 (微量轉向加速度，重力下墜)
      if (moveVector.lengthSq() > 0) {
        this.velocity.x += moveVector.x * this.airAccel * delta;
        this.velocity.z += moveVector.z * this.airAccel * delta;
      }
      this.velocity.y += this.gravity * delta;
    }

    // 5. 碰撞檢測與物理推進 (Sub-stepping 確保高速移動不穿牆)
    const steps = 3;
    const stepDelta = delta / steps;
    for (let i = 0; i < steps; i++) {
      this.capsule.translate(this.velocity.clone().multiplyScalar(stepDelta));
      this.resolveCollision();
    }

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
    this.onGround = false;

    if (result) {
      // 判定是否踩在地面 (斜率檢測，法向量 y > 0.35 視為可行走斜坡/地面)
      this.onGround = result.normal.y > 0.35;

      // 修正膠囊體位移
      this.capsule.translate(result.normal.clone().multiplyScalar(result.depth));

      if (this.onGround) {
        // 地面消除垂直下墜速度
        if (this.velocity.y < 0) this.velocity.y = 0;
      } else {
        // 撞牆滑動：將垂直於牆面法線的速度消除
        this.velocity.addScaledVector(result.normal, -this.velocity.dot(result.normal));
      }
    }
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
}
