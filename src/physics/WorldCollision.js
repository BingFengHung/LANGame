import * as THREE from 'three';
import { Octree } from 'three/addons/math/Octree.js';

export class WorldCollision {
  constructor() {
    this.octree = new Octree();
  }

  /**
   * 從靜態場景網格產生八叉樹 (Octree)
   * @param {THREE.Object3D} collisionGroup
   */
  buildFromMeshGroup(collisionGroup) {
    this.octree.fromGraphNode(collisionGroup);
  }

  /**
   * 膠囊體幾何碰撞檢測
   * @param {Capsule} capsule
   * @returns {Object|false} 碰撞結果包含 normal 與 depth
   */
  capsuleIntersect(capsule) {
    return this.octree.capsuleIntersect(capsule);
  }

  /**
   * 射線碰撞檢測 (用於 Hitscan 或環境射線)
   * @param {THREE.Ray} ray
   * @returns {Object|false} 碰撞結果包含 distance, point, position, normal, triangle
   */
  rayIntersect(ray) {
    const res = this.octree.rayIntersect(ray);
    if (!res) return false;
    const normal = res.triangle ? res.triangle.getNormal(new THREE.Vector3()) : new THREE.Vector3(0, 1, 0);
    return {
      distance: res.distance,
      point: res.position,
      position: res.position,
      normal: normal,
      triangle: res.triangle
    };
  }
}
