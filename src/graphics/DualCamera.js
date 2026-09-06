import * as THREE from 'three';

export class DualCamera {
  constructor() {
    const aspect = window.innerWidth / window.innerHeight;

    // 1. 主世界相機 (World Camera)
    this.worldCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);

    // 2. 第一人稱持槍相機 (ViewModel Camera)
    this.viewmodelCamera = new THREE.PerspectiveCamera(65, aspect, 0.05, 10);
    this.viewmodelScene = new THREE.Scene();

    // 持槍相機的環境光與平行光 (照亮第一人稱槍模)
    const vmAmbient = new THREE.AmbientLight(0xffffff, 0.85);
    const vmLight = new THREE.DirectionalLight(0xffffff, 0.8);
    vmLight.position.set(1, 2, 1);
    this.viewmodelScene.add(vmAmbient);
    this.viewmodelScene.add(vmLight);
  }

  onWindowResize(width, height) {
    const aspect = width / height;
    this.worldCamera.aspect = aspect;
    this.worldCamera.updateProjectionMatrix();

    this.viewmodelCamera.aspect = aspect;
    this.viewmodelCamera.updateProjectionMatrix();
  }

  /**
   * 同步持槍相機之旋轉與世界相機一致
   */
  updateViewModel() {
    this.viewmodelCamera.quaternion.copy(this.worldCamera.quaternion);
  }

  /**
   * 執行雙相機雙通道渲染 (避免穿模的核心邏輯)
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Scene} worldScene
   */
  render(renderer, worldScene) {
    renderer.autoClear = false;
    renderer.clear();

    // 1. 渲染主世界
    renderer.render(worldScene, this.worldCamera);

    // 2. 清除深度緩衝區，確保持槍模型永遠在最前方
    renderer.clearDepth();

    // 3. 渲染第一人稱槍枝
    renderer.render(this.viewmodelScene, this.viewmodelCamera);
  }
}
