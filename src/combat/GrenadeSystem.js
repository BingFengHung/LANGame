import * as THREE from 'three';

export class GrenadeSystem {
  constructor(scene, worldCollision, particleSystem, audioManager) {
    this.scene = scene;
    this.worldCollision = worldCollision;
    this.particleSystem = particleSystem;
    this.audioManager = audioManager;

    this.activeGrenades = [];
    this.gravity = -20.0;
  }

  /**
   * 投擲一顆手榴彈或閃光彈
   */
  throwGrenade(type, origin, direction, playerVelocity = new THREE.Vector3()) {
    const isHE = type === 'he_grenade';

    // 建立 3D 投擲物模型
    const group = new THREE.Group();
    group.position.copy(origin);

    if (isHE) {
      // 墨綠色鳳梨高爆手榴彈
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2e4a29, roughness: 0.7 });
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xbfa15f, roughness: 0.3, metalness: 0.8 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.11, 8), bodyMat);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.035, 8), pinMat);
      cap.position.y = 0.07;
      group.add(body);
      group.add(cap);
    } else {
      // 銀藍色閃光彈罐 (Flashbang Canister)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.3, metalness: 0.7 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.13, 8), bodyMat);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.025, 8), bandMat);
      group.add(body);
      group.add(band);
    }

    this.scene.add(group);

    // 初始速度 (向前拋射帶有微幅仰角)
    const throwDir = direction.clone().normalize();
    const upVector = new THREE.Vector3(0, 1, 0);
    const launchVelocity = throwDir.clone().multiplyScalar(18.5)
      .addScaledVector(upVector, 3.2)
      .addScaledVector(playerVelocity, 0.4);

    const grenade = {
      type: type,
      group: group,
      position: group.position,
      velocity: launchVelocity,
      angularVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 12
      ),
      fuseTime: isHE ? 1.75 : 1.55,
      alive: true
    };

    this.activeGrenades.push(grenade);
  }

  update(delta, player, bots, hud) {
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuseTime -= delta;

      // 物理推進
      g.velocity.y += this.gravity * delta;
      const step = g.velocity.clone().multiplyScalar(delta);
      const nextPos = g.position.clone().add(step);

      // 地形碰撞與彈跳
      if (this.worldCollision) {
        const moveDist = step.length();
        if (moveDist > 0.001) {
          const ray = new THREE.Ray(g.position, step.clone().normalize());
          const hit = this.worldCollision.rayIntersect(ray);

          if (hit && hit.distance <= moveDist + 0.1) {
            // 反彈
            g.position.copy(hit.point).addScaledVector(hit.normal, 0.05);
            g.velocity.reflect(hit.normal).multiplyScalar(0.52);
            g.angularVelocity.multiplyScalar(0.7);

            // 彈跳聲
            if (this.audioManager && g.velocity.length() > 1.2) {
              this.audioManager.playGrenadeBounce();
            }

            // 摩擦力
            if (hit.normal.y > 0.6) {
              g.velocity.x *= 0.85;
              g.velocity.z *= 0.85;
            }
          } else {
            g.position.copy(nextPos);
          }
        }
      } else {
        g.position.copy(nextPos);
      }

      // 空中旋轉
      g.group.rotation.x += g.angularVelocity.x * delta;
      g.group.rotation.y += g.angularVelocity.y * delta;
      g.group.rotation.z += g.angularVelocity.z * delta;

      // 引信時間到：引爆
      if (g.fuseTime <= 0) {
        this.detonate(g, player, bots, hud);
        this.scene.remove(g.group);
        this.activeGrenades.splice(i, 1);
      }
    }
  }

  detonate(grenade, player, bots, hud) {
    const pos = grenade.position.clone();
    const isHE = grenade.type === 'he_grenade';

    if (isHE) {
      // ============================================
      // 高爆手榴彈 (HE Grenade) 爆炸
      // ============================================
      if (this.audioManager) {
        this.audioManager.playExplosion();
      }

      // 生成巨大火球與煙霧粒子
      if (this.particleSystem) {
        this.particleSystem.createExplosionEffect(pos);
      }

      // 1. 傷害周圍電腦敵人
      for (const bot of bots) {
        if (bot.isDead) continue;
        const botPos = bot.group.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        const dist = pos.distanceTo(botPos);

        if (dist < 8.5) {
          // 檢查是否有實體牆壁完全遮擋
          const ray = new THREE.Ray(pos, botPos.clone().sub(pos).normalize());
          const hit = this.worldCollision ? this.worldCollision.rayIntersect(ray) : null;

          if (!hit || hit.distance >= dist - 0.4) {
            // 距離越近傷害越高 (中心高達 88 點傷害)
            const dmg = Math.round(88 * Math.max(0.15, 1.0 - (dist / 8.5)));
            const res = bot.takeDamage(dmg, 'body');

            if (hud && res) {
              hud.showHitmarker(false, res.damage);
            }
          }
        }
      }

      // 2. 傷害玩家自己 (若在爆炸範圍內)
      if (!player.isDead) {
        const playerPos = player.getPosition().add(new THREE.Vector3(0, 1.0, 0));
        const dist = pos.distanceTo(playerPos);

        if (dist < 8.0) {
          const ray = new THREE.Ray(pos, playerPos.clone().sub(pos).normalize());
          const hit = this.worldCollision ? this.worldCollision.rayIntersect(ray) : null;

          if (!hit || hit.distance >= dist - 0.4) {
            const dmg = Math.round(75 * Math.max(0.1, 1.0 - (dist / 8.0)));
            const res = player.takeDamage(dmg);
            if (res && hud) {
              hud.updateHealth(res.hp, res.armor);
              hud.showDamageFlash();
              if (res.isDead) {
                hud.addKill('HE Grenade', 'You', 'HE Grenade', false);
                hud.showDeathScreen('Explosion');
                setTimeout(() => {
                  player.respawn(new THREE.Vector3(0, 0, 50), 0);
                  hud.updateHealth(player.hp, player.armor);
                  hud.hideDeathScreen();
                }, 2500);
              }
            }
          }
        }
      }
    } else {
      // ============================================
      // 閃光彈 (Flashbang) 爆閃致盲
      // ============================================
      if (this.particleSystem) {
        this.particleSystem.createFlashBurstEffect(pos);
      }

      // 1. 計算玩家致盲 (經典 CS 視角角度判定：背身避閃)
      if (!player.isDead) {
        const eyePos = player.camera.position.clone();
        const dist = pos.distanceTo(eyePos);

        if (dist < 26.0) {
          // 檢查牆壁掩體遮擋
          const toFlash = pos.clone().sub(eyePos);
          const flashDir = toFlash.clone().normalize();
          const ray = new THREE.Ray(eyePos, flashDir);
          const hit = this.worldCollision ? this.worldCollision.rayIntersect(ray) : null;

          if (!hit || hit.distance >= dist - 0.5) {
            // 視角朝向夾角判定
            const camDir = new THREE.Vector3();
            player.camera.getWorldDirection(camDir);
            const dot = camDir.dot(flashDir); // 1.0 = 正視, 0.0 = 側面, -1.0 = 背對

            let intensity = 1.0;
            if (dot > 0.4) {
              intensity = 1.0; // 正面全白
            } else if (dot > -0.2) {
              intensity = 0.55; // 側視半白
            } else {
              intensity = 0.15; // 完美背閃，僅有輕微亮光與短暫微鳴
            }

            // 距離衰減
            intensity *= Math.max(0.25, 1.0 - (dist / 26.0) * 0.7);

            if (hud) {
              hud.triggerFlashbang(intensity);
            }
            if (this.audioManager) {
              this.audioManager.playFlashbang(intensity);
            }
          }
        }
      }

      // 2. 致盲所有在視線內的 Bot
      for (const bot of bots) {
        if (bot.isDead) continue;
        const botEye = bot.group.position.clone().add(new THREE.Vector3(0, 1.6, 0));
        const dist = pos.distanceTo(botEye);

        if (dist < 25.0) {
          const ray = new THREE.Ray(pos, botEye.clone().sub(pos).normalize());
          const hit = this.worldCollision ? this.worldCollision.rayIntersect(ray) : null;

          if (!hit || hit.distance >= dist - 0.4) {
            // 致盲 Bot 3.5 秒
            bot.applyFlash(3.5);
          }
        }
      }
    }
  }
}
