export class Weapon {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type; // 'primary' | 'secondary' | 'melee'
    this.damage = config.damage;
    this.headshotMultiplier = config.headshotMultiplier || 4.0;
    this.fireRate = config.fireRate; // 兩發之間的最小間隔秒數
    this.automatic = config.automatic || false;
    this.clipSize = config.clipSize;
    this.maxReserve = config.maxReserve;
    this.currentClip = this.clipSize;
    this.currentReserve = this.maxReserve;
    this.reloadTime = config.reloadTime || 2.0;

    // 散佈與後座力係數
    this.baseSpread = config.baseSpread || 0.002;
    this.moveSpreadMultiplier = config.moveSpreadMultiplier || 3.5;
    this.airSpreadMultiplier = config.airSpreadMultiplier || 6.0;
    this.recoilVertical = config.recoilVertical || 0.015;
    this.recoilHorizontal = config.recoilHorizontal || 0.008;

    // 狀態追蹤
    this.lastFireTime = 0;
    this.isReloading = false;
    this.reloadStartTime = 0;
    this.continuousShots = 0;
  }

  canShoot(now) {
    if (this.isReloading) return false;
    if (this.type === 'grenade') {
      return this.currentClip > 0 && (now - this.lastFireTime) >= this.fireRate;
    }
    if (this.type !== 'melee' && this.currentClip <= 0) return false;
    return (now - this.lastFireTime) >= this.fireRate;
  }

  canHeavyStab(now) {
    if (this.type !== 'melee') return false;
    const heavyRate = this.heavyFireRate || 0.8;
    return (now - this.lastFireTime) >= heavyRate;
  }

  shoot(now) {
    this.lastFireTime = now;
    if (this.type === 'grenade') {
      this.currentClip = Math.max(0, this.currentClip - 1);
    } else if (this.type !== 'melee') {
      this.currentClip = Math.max(0, this.currentClip - 1);
    }
    this.continuousShots++;
  }

  canReload() {
    if (this.type === 'melee' || this.type === 'grenade') return false;
    if (this.isReloading) return false;
    if (this.currentClip >= this.clipSize) return false;
    return this.currentReserve > 0;
  }

  startReload(now) {
    if (!this.canReload()) return false;
    this.isReloading = true;
    this.reloadStartTime = now;
    return true;
  }

  update(now) {
    if (this.isReloading) {
      if (now - this.reloadStartTime >= this.reloadTime) {
        // 換彈完成
        const needed = this.clipSize - this.currentClip;
        const take = Math.min(needed, this.currentReserve);
        this.currentClip += take;
        this.currentReserve -= take;
        this.isReloading = false;
        this.continuousShots = 0;
      }
    }

    // 連續開火衰減 (停止射擊 0.25 秒後後座力重置)
    if (now - this.lastFireTime > 0.25) {
      this.continuousShots = Math.max(0, this.continuousShots - 1);
    }
  }

  /**
   * 計算當前射擊散佈度 (結合人物移動狀態)
   */
  calculateSpread(playerSpeed, onGround) {
    let spread = this.baseSpread;

    if (!onGround) {
      spread *= this.airSpreadMultiplier;
    } else if (playerSpeed > 1.0) {
      spread *= this.moveSpreadMultiplier * (playerSpeed / 7.2);
    }

    // 連射後座力擴散
    spread += Math.min(this.continuousShots * 0.004, 0.035);
    return spread;
  }
}

/**
 * 預設 CS 經典武器配置 (含步槍、手槍、戰術小刀、手榴彈與閃光彈)
 */
export const WEAPON_CONFIGS = {
  AK47: {
    id: 'ak47',
    name: 'AK-47',
    type: 'primary',
    damage: 36,
    headshotMultiplier: 4.0, // 爆頭 144 (一槍斃命)
    fireRate: 0.1, // 600 RPM
    automatic: true,
    clipSize: 30,
    maxReserve: 90,
    reloadTime: 2.4,
    baseSpread: 0.003,
    moveSpreadMultiplier: 4.0,
    airSpreadMultiplier: 7.0,
    recoilVertical: 0.022,
    recoilHorizontal: 0.012
  },
  DEAGLE: {
    id: 'deagle',
    name: 'Desert Eagle',
    type: 'secondary',
    damage: 53,
    headshotMultiplier: 4.0, // 爆頭 212
    fireRate: 0.25, // 240 RPM
    automatic: false,
    clipSize: 7,
    maxReserve: 35,
    reloadTime: 2.0,
    baseSpread: 0.002,
    moveSpreadMultiplier: 3.2,
    airSpreadMultiplier: 6.5,
    recoilVertical: 0.038,
    recoilHorizontal: 0.005
  },
  KNIFE: {
    id: 'knife',
    name: 'Tactical Knife',
    type: 'melee',
    range: 2.3, // 近戰攻擊距離 (公尺)
    damage: 35, // 輕揮揮砍 (左鍵)
    heavyDamage: 65, // 重刀強刺 (右鍵，背刺致命 100+ 一擊殺)
    headshotMultiplier: 1.5,
    fireRate: 0.38, // 輕刀間隔
    heavyFireRate: 0.8, // 重刀間隔
    automatic: false,
    clipSize: 0,
    maxReserve: 0,
    reloadTime: 0,
    baseSpread: 0,
    moveSpreadMultiplier: 1.0,
    airSpreadMultiplier: 1.0,
    recoilVertical: 0,
    recoilHorizontal: 0
  },
  HE_GRENADE: {
    id: 'he_grenade',
    name: 'HE Grenade',
    type: 'grenade',
    fireRate: 0.8,
    automatic: false,
    clipSize: 1, // 可攜帶 1 顆高爆手榴彈
    maxReserve: 0,
    reloadTime: 0,
    baseSpread: 0,
    moveSpreadMultiplier: 1.0,
    airSpreadMultiplier: 1.0,
    recoilVertical: 0,
    recoilHorizontal: 0
  },
  FLASHBANG: {
    id: 'flashbang',
    name: 'Flashbang',
    type: 'grenade',
    fireRate: 0.8,
    automatic: false,
    clipSize: 2, // 可攜帶 2 顆閃光彈
    maxReserve: 0,
    reloadTime: 0,
    baseSpread: 0,
    moveSpreadMultiplier: 1.0,
    airSpreadMultiplier: 1.0,
    recoilVertical: 0,
    recoilHorizontal: 0
  },
  SMOKE_GRENADE: {
    id: 'smoke_grenade',
    name: 'Smoke Grenade',
    type: 'grenade',
    fireRate: 0.8,
    automatic: false,
    clipSize: 1, // 可攜帶 1 顆煙霧彈
    maxReserve: 0,
    reloadTime: 0,
    baseSpread: 0,
    moveSpreadMultiplier: 1.0,
    airSpreadMultiplier: 1.0,
    recoilVertical: 0,
    recoilHorizontal: 0
  }
};
