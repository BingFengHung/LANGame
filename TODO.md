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
- [ ] 搭建 3D 渲染器與場景管理 (`SceneManager.js`)，配置光影、低多邊形風格材質與天空環境。
- [ ] 建立測試訓練場地圖（包含平台、防禦箱、掩體矮牆、斜坡、階梯）。
- [ ] 實作地圖靜態八叉樹碰撞網格 (`WorldCollision.js` 基於 Three.js Octree)。
- [ ] 實作玩家膠囊體控制器 (`PlayerController.js` 基於 Capsule)：
  - [ ] 滑鼠鎖定視角 (PointerLockControls，俯仰限制 -85° ~ +85°)。
  - [ ] WASD 走位、加速度與地面摩擦阻力 (還原 CS 急停 Counter-Strafing 手感)。
  - [ ] 跳躍 (初速 10 m/s)、空中重力墜落、下蹲機制 (膠囊體縮小至 1.2m)。
- [ ] 實作雙相機渲染系統 (`DualCamera.js`)：World Camera + ViewModel Camera，徹底杜絕貼牆槍模穿模。

---

## 🔫 Phase 3: 武器系統、射擊反饋與打擊特效
- [ ] 建立武器基底類別與數值參數 (`Weapon.js`)：主武器 (AK-47)、手槍 (Deagle)、近戰 (Knife)。
- [ ] 實作武器背包與切換系統 (`WeaponInventory.js`，支援數字鍵 1/2/3 與滾輪切換)。
- [ ] 第一人稱持槍視角模型（槍枝 3D 定位、待機呼吸微幅晃動、行走擺動 Bobbing）。
- [ ] 開火機制與視覺回饋：
  - [ ] 槍口火花 (Muzzle Flash) 動態光影。
  - [ ] 後座力鏡頭抬升與動態擴散準星 (`Crosshair.js`)。
  - [ ] AK-47 經典連射後座力彈道曲線 (T 字型抬升與左右擺動)。
- [ ] 世界表面命中特效 (`ParticleSystem.js`)：
  - [ ] 擊中牆面產生碎屑與火星粒子。
  - [ ] 牆面自動生成持久彈孔貼圖 (Bullet Decals)。

---

## 🌐 Phase 4: 純區網 WebRTC 閉環連線與星狀同步
- [ ] 實作 SDP 瘦身與 zlib 壓縮演算法 (`Signaling.js`，剔除影音行，壓縮為短字串/Base64)。
- [ ] 實作光學配對 UI (`LobbyUI.js`，支援 QR Code 顯示/鏡頭掃描與一鍵複製房間碼)。
- [ ] 實作房主端星狀連線管理器 (`HostPeer.js`，維護至多 3 條客端通道，強制 `iceServers: []`)。
- [ ] 實作客端連線管理器 (`ClientPeer.js`，建立 Unreliable 與 Reliable 雙通道)。
- [ ] 實作 60Hz 網路資料同步循環：
  - [ ] 客端上傳操作按鍵與視角 (`INPUT` 封包)。
  - [ ] 房主權威推進所有人世界座標，廣播世界快照 (`SNAPSHOT` 封包)。
  - [ ] 客端平滑內插渲染其他玩家之 3D 模型走動與轉向。

---

## 🎯 Phase 5: 房主權威射線命中判定與傷害系統
- [ ] 玩家模型劃分 3 大 Hitbox 碰撞盒 (Head 4x 爆頭、Chest 1x 軀幹、Legs 0.75x 四肢)。
- [ ] 實作射線命中系統 (`HitscanSystem.js`)：
  - [ ] 客端發送開火請求 (`SHOOT_REQ`)。
  - [ ] 房主權威端進行 Raycasting 求交判定，計算距離與命中部位。
  - [ ] 扣除目標血量 (HP 100)，判定陣亡。
- [ ] 廣播戰鬥事件 (`HIT_EVENT`)：
  - [ ] 受擊回饋 (準星紅叉 Hitmarker、畫面邊緣受傷泛紅)。
  - [ ] 右上角擊殺訊息推播 (`KillFeed.js`)。
  - [ ] 陣亡視角切換與重生點倒數機制。

---

## 🔊 Phase 6: 3D 空間音效與戰鬥 HUD 介面
- [ ] 實作 3D 空間音效管理器 (`AudioManager.js`)：
  - [ ] Web Audio API HRTF 空間音場 (聽音辨位)。
  - [ ] 腳步聲 (依移動速度觸發)、槍聲 (距離衰減)、換彈聲、爆頭金屬叮聲 (Headshot Dink)。
- [ ] 完善戰鬥 HUD 介面 (`HUD.js`)：
  - [ ] 生命值 (HP)、彈藥數 (Ammo / Reserve)。
  - [ ] 左上角簡易雷達小地圖 (顯示隊友與敵人槍聲點位)。
  - [ ] Tab 鍵對戰計分板 (`Scoreboard.js`，顯示擊殺/陣亡數與 Ping)。
- [ ] 回合狀態機 (`StateMachine.js`，回合開始、對戰中、回合結束與勝負計分)。

---

## 🚀 Phase 7: PWA 離線快取、效能調校與 GitHub Actions 發布
- [ ] 配置 Service Worker (PWA)，快取所有靜態資源，實現外網中斷下純區網離線對戰。
- [ ] 效能 Profile 與 Low-Poly 渲染最佳化，確保全平台穩定 60+ FPS。
- [ ] 推送程式碼觸發 GitHub Actions，驗證 GitHub Pages 正式發布與線上體驗。
