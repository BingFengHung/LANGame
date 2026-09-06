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
   * @returns {Object|false} 碰撞結果包含 distance, point, normal, triangle
   */
  rayIntersect(ray) {
    return this.octree.rayIntersect(ray);
  }
}
