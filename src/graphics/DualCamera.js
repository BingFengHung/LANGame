import * as THREE from 'three';

export class DualCamera {
  constructor() {
    const aspect = window.innerWidth / window.innerHeight;

    // 1. 主世界相機 (World Camera)
    this.worldCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);

    // 2. 第一人稱持槍相機 (ViewModel Camera)
    // 持槍相機固定於原點看向 -Z，確保持槍視角永遠穩定黏著於玩家螢幕右下角
    this.viewmodelCamera = new THREE.PerspectiveCamera(65, aspect, 0.05, 10);
    this.viewmodelCamera.position.set(0, 0, 0);
    this.viewmodelCamera.rotation.set(0, 0, 0);

    this.viewmodelScene = new THREE.Scene();
    this.viewmodelScene.add(this.viewmodelCamera);

    // 持槍相機專屬光源 (保持武器各角度受光均勻鮮明)
    const vmAmbient = new THREE.AmbientLight(0xffffff, 0.95);
    const vmLight = new THREE.DirectionalLight(0xffffff, 0.85);
    vmLight.position.set(1.5, 2.5, 1.0);
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
   * ViewModel 相機永遠鎖定在原點，不受視角轉動偏移影響
   */
  updateViewModel() {
    this.viewmodelCamera.position.set(0, 0, 0);
    this.viewmodelCamera.rotation.set(0, 0, 0);
  }

  /**
   * 雙通道渲染：先渲染主世界，清除深度緩衝後渲染武器
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Scene} worldScene
   */
  render(renderer, worldScene) {
    renderer.autoClear = false;
    renderer.clear();

    // 1. 渲染主世界
    renderer.render(worldScene, this.worldCamera);

    // 2. 清除深度緩衝區，杜絕貼牆穿模
    renderer.clearDepth();

    // 3. 渲染第一人稱持槍
    renderer.render(this.viewmodelScene, this.viewmodelCamera);
  }
}
