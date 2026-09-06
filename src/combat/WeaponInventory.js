import { Weapon, WEAPON_CONFIGS } from './Weapon.js';

export class WeaponInventory {
  constructor(options = {}) {
    this.onShootCallback = options.onShoot || null;
    this.onWeaponChangeCallback = options.onWeaponChange || null;
    this.onAmmoChangeCallback = options.onAmmoChange || null;

    // 建立經典三把武器實例
    this.slots = {
      1: new Weapon(WEAPON_CONFIGS.AK47),
      2: new Weapon(WEAPON_CONFIGS.DEAGLE),
      3: new Weapon(WEAPON_CONFIGS.KNIFE)
    };

    this.currentSlot = 1;
    this.isShooting = false;

    this.initInputListeners();
  }

  getCurrentWeapon() {
    return this.slots[this.currentSlot];
  }

  initInputListeners() {
    // 數字鍵 1, 2, 3 切換武器
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.switchSlot(1);
      if (e.code === 'Digit2') this.switchSlot(2);
      if (e.code === 'Digit3') this.switchSlot(3);
      if (e.code === 'KeyR') this.reload();
    });

    // 滑鼠滾輪切換武器
    window.addEventListener('wheel', (e) => {
      if (!document.pointerLockElement) return;
      if (e.deltaY > 0) {
        // 向下滾動 (下一把)
        let next = this.currentSlot + 1;
        if (next > 3) next = 1;
        this.switchSlot(next);
      } else if (e.deltaY < 0) {
        // 向上滾動 (上一把)
        let prev = this.currentSlot - 1;
        if (prev < 1) prev = 3;
        this.switchSlot(prev);
      }
    });

    // 滑鼠左鍵開火
    window.addEventListener('mousedown', (e) => {
      if (!document.pointerLockElement) return;
      if (e.button === 0) {
        this.isShooting = true;
        this.tryShoot();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isShooting = false;
      }
    });
  }

  switchSlot(slot) {
    if (slot === this.currentSlot || !this.slots[slot]) return;

    // 若正在換彈則打斷
    this.getCurrentWeapon().isReloading = false;
    this.currentSlot = slot;

    const weapon = this.getCurrentWeapon();
    if (this.onWeaponChangeCallback) {
      this.onWeaponChangeCallback(weapon);
    }
    if (this.onAmmoChangeCallback) {
      this.onAmmoChangeCallback(weapon);
    }
  }

  reload() {
    const weapon = this.getCurrentWeapon();
    const now = performance.now() * 0.001;
    if (weapon.startReload(now)) {
      if (this.onAmmoChangeCallback) {
        this.onAmmoChangeCallback(weapon);
      }
    }
  }

  tryShoot() {
    const weapon = this.getCurrentWeapon();
    const now = performance.now() * 0.001;

    if (weapon.canShoot(now)) {
      weapon.shoot(now);

      if (this.onShootCallback) {
        this.onShootCallback(weapon);
      }
      if (this.onAmmoChangeCallback) {
        this.onAmmoChangeCallback(weapon);
      }

      // 若非全自動 (如 Deagle / 刀)，一次點擊只擊發一次
      if (!weapon.automatic) {
        this.isShooting = false;
      }
    } else if (weapon.currentClip === 0 && weapon.canReload()) {
      // 彈匣打空自動換彈
      this.reload();
    }
  }

  update(delta) {
    const weapon = this.getCurrentWeapon();
    const now = performance.now() * 0.001;
    const wasReloading = weapon.isReloading;

    weapon.update(now);

    // 換彈完成通知
    if (wasReloading && !weapon.isReloading) {
      if (this.onAmmoChangeCallback) {
        this.onAmmoChangeCallback(weapon);
      }
    }

    // 全自動連射檢查
    if (this.isShooting && weapon.automatic) {
      this.tryShoot();
    }
  }
}
