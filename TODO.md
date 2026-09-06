# LANGame - 開發任務進度表 (TODO.md)

本文件用以記錄專案各階段開發進度，每個任務完成後即標註為 `[x]`。

---

## 🛠️ Phase 1: 專案基礎建設與 GitHub Actions CI/CD
- [x] 初始化 `package.json`，安裝相依套件 (`three`, `pako`, `qrcode`, `html5-qrcode`, `vite` 等)。
- [x] 配置 `vite.config.js`（設定 `base: './'` 確保 GitHub Pages 二級路徑正確）。
- [x] 建立 `.github/workflows/deploy.yml`（GitHub Actions 自動化建置與 Pages 部署流程）。
- [x] 建立標準專案目錄架構 (`core`, `network`, `graphics`, `physics`, `combat`, `audio`, `ui`)。
- [x] 建立基礎 `index.html` 與 `main.js`，驗證 Vite 本地開發與打包建置。

---

## 🎮 Phase 2: 3D 場景渲染與單人 FPS 角色控制器
- [x] 搭建 3D 渲染器與場景管理 (`SceneManager.js`)，配置光影、低多邊形風格材質與天空環境。
- [x] 建立測試訓練場地圖（包含平台、防禦箱、掩體矮牆、斜坡、階梯）。
- [x] 實作地圖靜態八叉樹碰撞網格 (`WorldCollision.js` 基於 Three.js Octree)。
- [x] 實作玩家膠囊體控制器 (`PlayerController.js` 基於 Capsule)：
  - [x] 滑鼠鎖定視角 (PointerLockControls，俯仰限制 -85° ~ +85°)。
  - [x] WASD 走位、加速度與地面摩擦阻力 (還原 CS 急停 Counter-Strafing 手感)。
  - [x] 跳躍 (初速 9.5 m/s)、空中重力墜落、下蹲機制 (膠囊體縮小至 1.2m)。
- [x] 實作雙相機渲染系統 (`DualCamera.js`)：World Camera + ViewModel Camera，徹底杜絕貼牆槍模穿模。

---

## 🔫 Phase 3: 武器系統、射擊反饋與打擊特效
- [x] 建立武器基底類別與數值參數 (`Weapon.js`)：主武器 (AK-47)、手槍 (Deagle)、近戰 (Knife)。
- [x] 實作武器背包與切換系統 (`WeaponInventory.js`，支援數字鍵 1/2/3 與滾輪切換)。
- [x] 第一人稱持槍視角模型（槍枝 3D 定位、待機呼吸微幅晃動、行走擺動 Bobbing）。
- [x] 開火機制與視覺回饋：
  - [x] 槍口火花 (Muzzle Flash) 動態光影。
  - [x] 後座力鏡頭抬升與動態擴散準星 (`Crosshair.js`)。
  - [x] AK-47 經典連射後座力彈道曲線 (T 字型抬升與左右擺動)。
- [x] 世界表面命中特效 (`ParticleSystem.js`)：
  - [x] 擊中牆面產生碎屑與火星粒子。
  - [x] 牆面自動生成持久彈孔貼圖 (Bullet Decals)。

---

## 🌐 Phase 4: 純區網 WebRTC 閉環連線與星狀同步 (當前核心開發階段)
- [x] 定義網路通訊協議常數與資料結構 (`PacketTypes.js`，包含 INPUT, SNAPSHOT, SHOOT_REQ, HIT_EVENT 等)。
- [ ] 實作 SDP 瘦身與 zlib 壓縮演算法 (`Signaling.js`，剔除影音行，壓縮為極簡短字串/Base64)。
- [ ] 實作光學配對與房間碼介面 (`LobbyUI.js`，支援 QR Code 產生、相機掃描與一鍵剪貼簿交換)。
- [ ] 實作房主端星狀連線管理器 (`HostPeer.js`，維護至多 3 條客端通道，強制 `iceServers: []`)。
- [ ] 實作客端連線管理器 (`ClientPeer.js`，建立 Unreliable UDP 與 Reliable 雙通道)。
- [ ] 實作 60Hz 網路資料同步循環：
  - [ ] 客端 60Hz 上傳操作按鍵與視角 (`INPUT` 封包)。
  - [ ] 房主權威推進所有人世界物理座標，廣播世界快照 (`SNAPSHOT` 封包)。
  - [ ] 客端平滑內插渲染其他玩家之 3D 模型走動與轉向。

---

## 🎯 Phase 5: 房主權威射線命中判定與傷害系統
- [x] 角色模型劃分 3 大 Hitbox 碰撞盒 (Head 4x 爆頭、Chest 1x 軀幹、Legs 0.75x 四肢)。
- [x] 單人/Bot 權威射線命中判定系統 (Raycasting 求交、距離衰減、掩體阻擋與煙霧彈阻隔)。
- [x] 戰鬥受擊反饋系統：
  - [x] 準星紅叉打擊回饋 (Hitmarker) 與金屬爆頭音效 (Headshot Dink)。
  - [x] 畫面邊緣受傷泛紅 (Damage Vignette) 與角色受擊物理硬直震顫 (Hit Flinch)。
  - [x] 右上角即時擊殺推播 (`KillFeed.js`) 與浮動金錢獎勵 (+$300)。
  - [x] 陣亡視角與回合倒數機制。
- [ ] 整合多人連線射線命中廣播 (`SHOOT_REQ` 與 `HIT_EVENT` Reliable 封包)。

---

## 🔊 Phase 6: 3D 空間音效與戰鬥 HUD 介面
- [x] 實作程序化合成音效管理器 (`AudioManager.js`，零外部 MP3 下載，純 Web Audio API 合成)：
  - [x] AK-47 / Deagle 開火重音爆破與金屬機件聲。
  - [x] 依移動速度觸發之作戰靴腳步聲、換彈退夾上膛聲、爆頭清脆金屬聲。
- [x] 完善戰鬥 HUD 介面 (`HUD.js`)：
  - [x] 生命值 (HP)、護甲值 (Armor)、彈藥數 (Ammo / Reserve)。
  - [x] DE_DUST2 區域雷達導航標籤 (CT SPAWN, BOMBSITE A/B, MID DOORS 等)。
  - [x] 頂部比分板、4 名 Bot 存活頭像狀態與 01:55 電子回合倒數。
  - [x] 閃光彈致盲全白覆蓋特效。
- [ ] 多人對戰 Tab 鍵即時計分板 (`Scoreboard.js`，顯示各玩家擊殺/陣亡數與 Ping 延遲)。
- [ ] 回合狀態機連線同步 (`StateMachine.js`，勝負條件與下一局重置)。

---

## 🚀 Phase 7: PWA 離線快取、效能調校與 GitHub Actions 發布
- [x] 設定 GitHub Actions 自動化 CI/CD 流程 (`.github/workflows/deploy.yml`)，推送即發布。
- [x] 設定 Vite 二級相對路徑 (`base: './'`) 與快取更新破壞機制 (Cache Busting)。
- [ ] 配置 Service Worker (PWA)，支援在無網環境下離線快取遊玩。
- [ ] 效能 Profile 與 Low-Poly 渲染最佳化，確保全平台穩定 60+ FPS。
