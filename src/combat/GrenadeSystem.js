import * as THREE from 'three';

export class GrenadeSystem {
  constructor(scene, worldCollision, particleSystem, audioManager) {
    this.scene = scene;
    this.worldCollision = worldCollision;
    this.particleSystem = particleSystem;
    this.audioManager = audioManager;

    this.activeGrenades = [];
    this.activeSmokes = []; // 存活中的煙霧雲列表
    this.gravity = -20.0;
  }

  /**
   * 投擲手榴彈、閃光彈或煙霧彈
   */
  throwGrenade(type, origin, direction, playerVelocity = new THREE.Vector3()) {
    const isHE = type === 'he_grenade';
    const isFlash = type === 'flashbang';
    const isSmoke = type === 'smoke_grenade';

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
    } else if (isFlash) {
      // 銀藍色閃光彈罐 (Flashbang Canister)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.3, metalness: 0.7 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.13, 8), bodyMat);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.025, 8), bandMat);
      group.add(body);
      group.add(band);
    } else {
      // 經典灰綠色煙霧彈罐 (Smoke Grenade)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a5d4e, roughness: 0.5 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.3 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.135, 8), bodyMat);
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.015, 8), bandMat);
      b1.position.y = 0.03;
      const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.015, 8), bandMat);
      b2.position.y = -0.03;
      group.add(body);
      group.add(b1);
      group.add(b2);
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
      fuseTime: isHE ? 1.75 : (isFlash ? 1.55 : 1.8),
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

    // 2. 更新所有存活中的立體煙霧雲 (Active Smoke Clouds)
    for (let i = this.activeSmokes.length - 1; i >= 0; i--) {
      const s = this.activeSmokes[i];
      s.life -= delta;

      if (s.life <= 0) {
        this.scene.remove(s.group);
        // 釋放幾何與材質
        s.group.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          }
        });
        this.activeSmokes.splice(i, 1);
        continue;
      }

      const elapsed = s.maxLife - s.life;

      // 前 1.5 秒快速膨脹至滿尺寸 (半徑 3.8m，直徑接近 8m)
      if (elapsed < 1.5) {
        const scale = Math.min(1.0, elapsed / 1.5);
        s.group.scale.set(scale, scale, scale);
      } else if (s.life < 3.0) {
        // 最後 3 秒透明度漸變消散
        const fade = s.life / 3.0;
        s.material.opacity = fade * 0.92;
      }

      // 煙霧團緩慢立體旋轉翻滾
      s.group.rotation.y += 0.08 * delta;
      s.group.rotation.x += 0.04 * delta;
    }

    // 3. 檢查玩家是否正身處於任一濃密煙霧雲中
    if (player && !player.isDead && hud) {
      const inSmoke = this.isInsideSmoke(player.camera.position);
      if (typeof hud.setSmokeScreen === 'function') {
        hud.setSmokeScreen(inSmoke);
      }
    }
  }

  detonate(grenade, player, bots, hud) {
    const pos = grenade.position.clone();
    const isHE = grenade.type === 'he_grenade';
    const isFlash = grenade.type === 'flashbang';
    const isSmoke = grenade.type === 'smoke_grenade';

    if (isHE) {
      // ============================================
      // 1. 高爆手榴彈 (HE Grenade) 爆炸
      // ============================================
      if (this.audioManager) {
        this.audioManager.playExplosion();
      }

      if (this.particleSystem) {
        this.particleSystem.createExplosionEffect(pos);
      }

      // 傷害周圍電腦敵人
      for (const bot of bots) {
        if (bot.isDead) continue;
        const botPos = bot.group.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        const dist = pos.distanceTo(botPos);

        if (dist < 8.5) {
          const ray = new THREE.Ray(pos, botPos.clone().sub(pos).normalize());
          const hit = this.worldCollision ? this.worldCollision.rayIntersect(ray) : null;

          if (!hit || hit.distance >= dist - 0.4) {
            const dmg = Math.round(88 * Math.max(0.15, 1.0 - (dist / 8.5)));
            const res = bot.takeDamage(dmg, 'body');

            if (hud && res) {
              hud.showHitmarker(false, res.damage);
            }
          }
        }
      }

      // 傷害玩家自己
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
    } else if (isFlash) {
      // ============================================
      // 2. 閃光彈 (Flashbang) 爆閃致盲 (長達 5.5 秒超有感致盲)
      // ============================================
      if (this.particleSystem) {
        this.particleSystem.createFlashBurstEffect(pos);
      }

      // 玩家致盲
      if (!player.isDead) {
        const eyePos = player.camera.position.clone();
        const dist = pos.distanceTo(eyePos);

        if (dist < 26.0) {
          const toFlash = pos.clone().sub(eyePos);
          const flashDir = toFlash.clone().normalize();
          const ray = new THREE.Ray(eyePos, flashDir);
          const hit = this.worldCollision ? this.worldCollision.rayIntersect(ray) : null;

          if (!hit || hit.distance >= dist - 0.5) {
            const camDir = new THREE.Vector3();
            player.camera.getWorldDirection(camDir);
            const dot = camDir.dot(flashDir);

            let intensity = 1.0;
            if (dot > 0.4) {
              intensity = 1.0; // 正視全白
            } else if (dot > -0.2) {
              intensity = 0.65; // 側視半白
            } else {
              intensity = 0.2; // 完美背閃
            }

            intensity *= Math.max(0.3, 1.0 - (dist / 26.0) * 0.65);

            if (hud) {
              hud.triggerFlashbang(intensity);
            }
            if (this.audioManager) {
              this.audioManager.playFlashbang(intensity);
            }
          }
        }
      }

      // 致盲周圍電腦敵人 (延長至 5.5 秒)
      for (const bot of bots) {
        if (bot.isDead) continue;
        const botEye = bot.group.position.clone().add(new THREE.Vector3(0, 1.6, 0));
        const dist = pos.distanceTo(botEye);

        if (dist < 25.0) {
          const ray = new THREE.Ray(pos, botEye.clone().sub(pos).normalize());
          const hit = this.worldCollision ? this.worldCollision.rayIntersect(ray) : null;

          if (!hit || hit.distance >= dist - 0.4) {
            bot.applyFlash(5.5);
          }
        }
      }
    } else if (isSmoke) {
      // ============================================
      // 3. 煙霧彈 (Smoke Grenade) 釋放持續 15 秒濃密煙霧雲
      // ============================================
      this.detonateSmoke(pos);
    }
  }

  /**
   * 引爆並生成直徑近 8 公尺、持續 15 秒的球狀立體濃密煙霧雲
   */
  detonateSmoke(pos) {
    if (this.audioManager) {
      this.audioManager.playSmokeHiss(15);
    }

    const smokeGroup = new THREE.Group();
    smokeGroup.position.copy(pos);
    smokeGroup.position.y += 1.2; // 煙霧中心略高於地面
    smokeGroup.scale.set(0.1, 0.1, 0.1);

    // 經典 CS 濃霧灰色材質 (半透明雙面渲染)
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      roughness: 0.9,
      transparent: true,
      opacity: 0.93,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // 由 7 個微錯位旋轉的變形球體組成濃密球狀煙霧雲 (Volumetric Smoke)
    const offsets = [
      [0, 0, 0, 3.6],
      [1.4, 0.6, 1.1, 3.0],
      [-1.3, 0.7, -1.0, 3.0],
      [-1.1, 0.8, 1.3, 2.9],
      [1.2, 0.5, -1.2, 2.9],
      [0, 1.5, 0, 2.8],
      [0, -0.6, 0, 3.2]
    ];

    for (const [ox, oy, oz, r] of offsets) {
      const geo = new THREE.DodecahedronGeometry(r, 2);
      const mesh = new THREE.Mesh(geo, smokeMat);
      mesh.position.set(ox, oy, oz);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      smokeGroup.add(mesh);
    }

    this.scene.add(smokeGroup);

    this.activeSmokes.push({
      group: smokeGroup,
      position: smokeGroup.position,
      material: smokeMat,
      radius: 3.8, // 有效遮蔽半徑 3.8m (直徑 7.6m)
      life: 15.0, // 持續 15 秒
      maxLife: 15.0
    });
  }

  /**
   * 判定兩點連線是否穿透濃密煙霧雲 (視線遮蔽演算法)
   */
  isLineBlockedBySmoke(p1, p2) {
    const lineDir = p2.clone().sub(p1);
    const lineLen = lineDir.length();
    if (lineLen < 0.001) return false;
    lineDir.normalize();

    for (const s of this.activeSmokes) {
      // 煙霧未完全散去且已成形
      if (s.life < 1.0) continue;

      // 計算球心至射線段的最短投影距離
      const v = s.position.clone().sub(p1);
      const t = v.dot(lineDir);

      if (t > 0 && t < lineLen) {
        const closestPoint = p1.clone().addScaledVector(lineDir, t);
        const distToCenter = closestPoint.distanceTo(s.position);
        if (distToCenter < s.radius) {
          return true; // 線段穿透煙霧內部，視線被阻斷！
        }
      }
    }

    return false;
  }

  /**
   * 判定指定座標 (例如玩家眼睛) 是否正處於煙霧雲內部
   */
  isInsideSmoke(pos) {
    for (const s of this.activeSmokes) {
      if (s.life > 1.0) {
        if (pos.distanceTo(s.position) < s.radius + 0.3) {
          return true;
        }
      }
    }
    return false;
  }
}
