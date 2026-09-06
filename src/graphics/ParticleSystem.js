import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    this.sparks = [];
    this.tracers = [];
    this.decals = [];
    this.maxDecals = 60; // 最多保留 60 個彈孔

    this.initDecalResources();
    this.initSparkResources();
    this.initTracerResources();
  }

  initDecalResources() {
    // 圓形彈孔幾何體與深色彈著材質
    this.decalGeometry = new THREE.CircleGeometry(0.045, 12);
    this.decalMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });
  }

  initSparkResources() {
    this.sparkGeometry = new THREE.BufferGeometry();
    this.sparkMaterial = new THREE.PointsMaterial({
      color: 0xffcc33,
      size: 0.06,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.bloodMaterial = new THREE.PointsMaterial({
      color: 0xcc1111,
      size: 0.08,
      transparent: true
    });
  }

  initTracerResources() {
    this.tracerMaterial = new THREE.LineBasicMaterial({
      color: 0xfff0aa,
      transparent: true,
      opacity: 0.85
    });
  }

  /**
   * 生成擊中人體的血液噴濺特效
   */
  createBloodEffect(point) {
    const bloodCount = 12;
    const positions = new Float32Array(bloodCount * 3);
    const velocities = [];

    for (let i = 0; i < bloodCount; i++) {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        Math.random() * 2.5 + 0.5,
        (Math.random() - 0.5) * 2.0
      );
      velocities.push(v);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMesh = new THREE.Points(geo, this.bloodMaterial.clone());
    this.scene.add(pointsMesh);

    this.sparks.push({
      mesh: pointsMesh,
      velocities: velocities,
      life: 0.35,
      maxLife: 0.35
    });
  }

  /**
   * 生成擊中牆面的火星與碎屑特效
   * @param {THREE.Vector3} point 命中座標
   * @param {THREE.Vector3} normal 表面法向量
   */
  createImpactEffect(point, normal) {
    // 1. 噴濺火星粒子
    const sparkCount = 8;
    const positions = new Float32Array(sparkCount * 3);
    const velocities = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      // 沿著法線方向隨機噴散
      const spread = 0.8;
      const v = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * spread,
        normal.y + (Math.random() - 0.5) * spread + 0.3,
        normal.z + (Math.random() - 0.5) * spread
      ).normalize().multiplyScalar(3.0 + Math.random() * 4.0);

      velocities.push(v);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMesh = new THREE.Points(geo, this.sparkMaterial.clone());
    this.scene.add(pointsMesh);

    this.sparks.push({
      mesh: pointsMesh,
      velocities: velocities,
      life: 0.25, // 存活 0.25 秒
      maxLife: 0.25
    });

    // 2. 建立牆面持久彈孔 (Decal)
    this.createBulletDecal(point, normal);
  }

  createBulletDecal(point, normal) {
    const decal = new THREE.Mesh(this.decalGeometry, this.decalMaterial);

    // 沿著法向量微幅偏移 0.002m 避免 Z-fighting
    decal.position.copy(point).addScaledVector(normal, 0.003);

    // 朝向法線方向
    decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    this.scene.add(decal);
    this.decals.push(decal);

    // 超過上限則回收最舊的彈孔
    if (this.decals.length > this.maxDecals) {
      const oldest = this.decals.shift();
      this.scene.remove(oldest);
    }
  }

  /**
   * 生成子彈飛行曳光軌跡線 (Tracer)
   * @param {THREE.Vector3} start 起點 (槍口)
   * @param {THREE.Vector3} end 終點 (命中點)
   */
  createTracer(start, end) {
    const points = [start.clone(), end.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, this.tracerMaterial.clone());

    this.scene.add(line);
    this.tracers.push({
      mesh: line,
      life: 0.06 // 極快消失 (60ms)
    });
  }

  update(delta) {
    // 1. 更新火星粒子運動
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      spark.life -= delta;

      if (spark.life <= 0) {
        this.scene.remove(spark.mesh);
        spark.mesh.geometry.dispose();
        spark.mesh.material.dispose();
        this.sparks.splice(i, 1);
        continue;
      }

      // 重力與位移更新
      const positions = spark.mesh.geometry.attributes.position.array;
      for (let j = 0; j < spark.velocities.length; j++) {
        spark.velocities[j].y -= 15.0 * delta; // 重力下墜

        positions[j * 3] += spark.velocities[j].x * delta;
        positions[j * 3 + 1] += spark.velocities[j].y * delta;
        positions[j * 3 + 2] += spark.velocities[j].z * delta;
      }
      spark.mesh.geometry.attributes.position.needsUpdate = true;
      spark.mesh.material.opacity = spark.life / spark.maxLife;
    }

    // 2. 更新曳光線壽命
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i];
      tracer.life -= delta;

      if (tracer.life <= 0) {
        this.scene.remove(tracer.mesh);
        tracer.mesh.geometry.dispose();
        tracer.mesh.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }
}
