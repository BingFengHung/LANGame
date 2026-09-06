import { Weapon, WEAPON_CONFIGS } from './Weapon.js';

export class WeaponInventory {
  constructor(options = {}) {
    this.onShootCallback = options.onShoot || null;
    this.onHeavyStabCallback = options.onHeavyStab || null;
    this.onThrowGrenadeCallback = options.onThrowGrenade || null;
    this.onWeaponChangeCallback = options.onWeaponChange || null;
    this.onAmmoChangeCallback = options.onAmmoChange || null;

    // 建立經典 6 把裝備槽位 (主武、副武、小刀、高爆手榴彈、閃光彈、煙霧彈)
    this.slots = {
      1: new Weapon(WEAPON_CONFIGS.AK47),
      2: new Weapon(WEAPON_CONFIGS.DEAGLE),
      3: new Weapon(WEAPON_CONFIGS.KNIFE),
      4: new Weapon(WEAPON_CONFIGS.HE_GRENADE),
      5: new Weapon(WEAPON_CONFIGS.FLASHBANG),
      6: new Weapon(WEAPON_CONFIGS.SMOKE_GRENADE)
    };

    this.currentSlot = 1;
    this.isShooting = false;

    this.initInputListeners();
  }

  getCurrentWeapon() {
    return this.slots[this.currentSlot];
  }

  initInputListeners() {
    // 數字鍵 1, 2, 3, 4, 5, 6 切換武器與投擲物
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.switchSlot(1);
      if (e.code === 'Digit2') this.switchSlot(2);
      if (e.code === 'Digit3') this.switchSlot(3);
      if (e.code === 'Digit4') this.switchSlot(4);
      if (e.code === 'Digit5') this.switchSlot(5);
      if (e.code === 'Digit6') this.switchSlot(6);
      if (e.code === 'KeyR') this.reload();
    });

    // 阻擋右鍵選單以支援小刀重刺
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 滑鼠滾輪切換武器 (1 ~ 6 槽循環)
    window.addEventListener('wheel', (e) => {
      if (!document.pointerLockElement) return;
      if (e.deltaY > 0) {
        let next = this.currentSlot + 1;
        if (next > 6) next = 1;
        this.switchSlot(next);
      } else if (e.deltaY < 0) {
        let prev = this.currentSlot - 1;
        if (prev < 1) prev = 6;
        this.switchSlot(prev);
      }
    });

    // 滑鼠按鍵操作
    window.addEventListener('mousedown', (e) => {
      if (!document.pointerLockElement) return;
      const current = this.getCurrentWeapon();

      if (e.button === 0) {
        // 左鍵：開火 / 小刀輕揮 / 投擲手榴彈
        if (current.type === 'grenade') {
          this.tryThrowGrenade();
        } else if (current.type === 'melee') {
          this.trySlash();
        } else {
          this.isShooting = true;
          this.tryShoot();
        }
      } else if (e.button === 2) {
        // 右鍵：小刀強力刺擊 (重刀)
        if (current.type === 'melee') {
          this.tryHeavyStab();
        }
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

      // 若非全自動 (如 Deagle)，一次點擊只擊發一次
      if (!weapon.automatic) {
        this.isShooting = false;
      }
    } else if (weapon.currentClip === 0 && weapon.canReload()) {
      // 彈匣打空自動換彈
      this.reload();
    }
  }

  trySlash() {
    const weapon = this.getCurrentWeapon();
    const now = performance.now() * 0.001;
    if (weapon.canShoot(now)) {
      weapon.shoot(now);
      if (this.onShootCallback) {
        this.onShootCallback(weapon, 'slash');
      }
    }
  }

  tryHeavyStab() {
    const weapon = this.getCurrentWeapon();
    const now = performance.now() * 0.001;
    if (weapon.canHeavyStab(now)) {
      weapon.lastFireTime = now;
      if (this.onHeavyStabCallback) {
        this.onHeavyStabCallback(weapon);
      }
    }
  }

  tryThrowGrenade() {
    const weapon = this.getCurrentWeapon();
    const now = performance.now() * 0.001;
    if (weapon.canShoot(now)) {
      weapon.shoot(now);
      if (this.onThrowGrenadeCallback) {
        this.onThrowGrenadeCallback(weapon);
      }
      if (this.onAmmoChangeCallback) {
        this.onAmmoChangeCallback(weapon);
      }
      if (weapon.currentClip <= 0) {
        setTimeout(() => {
          if (this.currentSlot >= 4) {
            this.switchSlot(1);
          }
        }, 800);
      }
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
