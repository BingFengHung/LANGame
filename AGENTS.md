# AGENTS.md - 3D 區網對戰射擊遊戲 (CS-like) 開發指引手冊

本文件為專案的唯一核心開發規範與技術依據，供後續所有 Agent 及開發者在進行功能擴展、重構、除錯與維護時遵循。

> 💡 **核心經驗知識庫**：關於程序化人體解剖學建模、骨骼屈膝運動學動力學、3D 瞄準幾何解算與踩坑細節，請參閱深入實戰手冊：[`docs/DEV_EXPERIENCE.md`](docs/DEV_EXPERIENCE.md)。


---

## 1. 專案願景與基本原則

### 1.1 核心定位
本專案為一款基於 **Three.js** 的 3D 第一人稱競技射擊遊戲（類 CS / Counter-Strike 風格），具備以下極致特性：
1. **100% 零伺服器成本（Zero Server Cost）**：完全託管於 **GitHub Pages**，透過 **GitHub Actions** 自動化 CI/CD 建置與發布。
2. **純閉環區域網路 WebRTC（Air-Gapped WebRTC）**：
   - 強制 `iceServers: []`，徹底杜絕外網 STUN/TURN 探測。
   - 採用光學（QR Code）或剪貼簿交換 SDP 信令，無中間 Signaling 伺服器。
   - 資料傳輸僅於 Wi-Fi 路由器內部直轉，延遲維持於極限的 **1 ~ 3 ms**。
3. **主客星狀權威拓撲（Authoritative Host-Client Star Topology）**：
   - 房主（Host）身兼遊戲伺服器，負責世界物理推進、射線命中判定、血量計算與勝利條件判定。
   - 客端（Client）發送玩家操作輸入（Input Payload），接收世界狀態快照（World Snapshot）並平滑渲染。
4. **極致手感與效能**：
   - 60~120 FPS 渲染，低多邊形（Low-Poly）復古風格。
   - 採用 Octree + Capsule 碰撞模擬，還原 CS 經典「急停射擊」與走位體驗。

---

## 2. 建議技術棧（Tech Stack）

| 類別 | 技術選型 | 說明 |
| :--- | :--- | :--- |
| **建置工具** | **Vite** | 現代化極速打包工具，提供 HMR 與靜態資源最佳化 |
| **3D 引擎** | **Three.js (r160+)** | WebGL 渲染核心、場景管理、光影與後製處理 |
| **相機與視角** | **PointerLockControls + 雙相機系統** | 視角鎖定、第一人稱持槍（ViewModel）無穿模渲染 |
| **物理與碰撞** | **Three.js Octree + Capsule** | 輕量化、極高精度角色移動碰撞，專為 FPS 量身打造 |
| **區網傳輸** | **WebRTC (RTCDataChannel)** | 雙通道設計（Unreliable UDP 傳位置/按鍵；Reliable 傳勝負/傷害） |
| **信令壓縮與光學** | **pako + qrcode.js + html5-qrcode** | SDP 瘦身與 zlib 壓縮，產出超高辨識率極簡 QR Code |
| **空間音效** | **Web Audio API / Three.js Audio** | HRTF 空間立體音（聽音辨位：腳步聲、槍聲方向感） |
| **CI / CD** | **GitHub Actions** | 推送 `main` 分支自動 build 並部署至 GitHub Pages |

---

## 3. 專案目錄結構規範

未來的專案程式碼必須嚴格依照以下模組劃分，保持高內聚、低耦合：

```
LANGame/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自動部署腳本
├── docs/                       # 專案實戰開發經驗與架構知識庫
│   └── DEV_EXPERIENCE.md       # 人體解剖建模、運動學下蹲、3D 瞄準實戰經驗手冊
├── public/                     # 靜態素材（音效、模型、材質、圖標）
│   ├── audio/                  # 槍聲、腳步聲、換彈、爆頭音效 (.mp3 / .ogg)
│   ├── models/                 # 地圖、角色、槍枝 GLB 檔案
│   └── favicon.ico
├── src/
│   ├── core/                   # 核心遊戲循環與狀態機
│   │   ├── Game.js             # 遊戲主入口與 Tick 管理
│   │   └── StateMachine.js     # 遊戲狀態（LOBBY, PLAYING, ROUND_END）
│   ├── network/                # 區網通訊模組
│   │   ├── Signaling.js        # SDP 瘦身、壓縮、QR Code 產生與相機掃描
│   │   ├── HostPeer.js         # 房主端星狀連線管理器（維護多條客端通道）
│   │   ├── ClientPeer.js       # 客端連線管理器
│   │   └── PacketTypes.js      # 網路封包協議常數定義
│   ├── graphics/               # 渲染與視角模組
│   │   ├── SceneManager.js     # 場景、光照、影子設定
│   │   ├── DualCamera.js       # 雙相機系統 (World + ViewModel)
│   │   ├── ParticleSystem.js   # 槍口火花、打牆火星、彈孔貼圖 (Decals)
│   │   └── PostProcessing.js   # 畫面震動、受傷泛紅後製特效
│   ├── physics/                # 物理與碰撞模組
│   │   ├── WorldCollision.js   # Octree 地圖靜態碰撞網格
│   │   └── PlayerController.js # Capsule 移動、跳躍、重力、摩擦力手感
│   ├── combat/                 # 戰鬥與武器模組
│   │   ├── Weapon.js           # 槍枝基底類別（彈夾、射速、後座力）
│   │   ├── WeaponInventory.js  # 玩家背包（主武、副武、小刀切換）
│   │   └── HitscanSystem.js    # 房主權威 Raycaster 命中與傷害判定
│   ├── audio/                  # 音效管理器
│   │   └── AudioManager.js     # 3D 空間音效與背景音播放器
│   ├── ui/                     # DOM / Canvas HUD 界面
│   │   ├── Crosshair.js        # 動態擴散準星
│   │   ├── HUD.js              # 血量、護甲、彈藥量、小地圖
│   │   ├── Scoreboard.js       # Tab 鍵計分板
│   │   ├── KillFeed.js         # 右上角擊殺訊息推播
│   │   └── LobbyUI.js          # QR Code 掃描與配對介面
│   └── main.js                 # 應用程式啟動入口
├── index.html                  # 首頁 HTML
├── vite.config.js              # Vite 設定檔 (Base URL 設定)
├── package.json                # 套件依賴管理
├── 架構.md                     # 原始區網連線底層架構書
└── AGENTS.md                   # 本開發指引手冊
```

---

## 4. 網路通訊協議與資料結構規範

### 4.1 DataChannel 配置
* **Unreliable 頻道 (`controls`)**：
  * 設定：`{ ordered: false, maxRetransmits: 0 }`
  * 用途：傳送頻率達 60 Hz 的即時位置、視角方向、玩家按鍵，允許輕微掉包，以最新資料為主。
* **Reliable 頻道 (`events`)**：
  * 設定：`{ ordered: true }`（預設可靠傳輸）
  * 用途：傳送開火事件、傷害判定、角色重生、回合重置、計分板更新。

### 4.2 封包格式標準（Packet Schemas）

#### [Client ➔ Host] 按鍵與視角上傳 (Unreliable, 60Hz)
```json
{
  "t": 1,                     // PACKET_TYPE: INPUT
  "seq": 1042,                // 輸入序號
  "mv": [0, 1],               // [X, Z] 軸移動向量 (-1, 0, 1)
  "jp": false,                // 是否跳躍
  "sh": false,                // 是否蹲下/靜音走
  "yaw": 1.57,                // 玩家水平旋轉 (徑度)
  "pitch": -0.12              // 玩家俯仰角度 (徑度)
}
```

#### [Client ➔ Host] 開火請求 (Reliable)
```json
{
  "t": 2,                     // PACKET_TYPE: SHOOT_REQ
  "wId": "ak47",              // 武器類型
  "origin": [12.4, 1.8, -5.2],// 槍口世界座標
  "dir": [0.707, 0, -0.707]   // 射擊方向向量
}
```

#### [Host ➔ All Clients] 世界快照 (Unreliable, 60Hz)
```json
{
  "t": 10,                    // PACKET_TYPE: SNAPSHOT
  "tick": 4500,
  "players": [
    {
      "id": "host",
      "pos": [12.4, 1.8, -5.2],
      "yaw": 1.57,
      "state": 1,             // 0: IDLE, 1: RUNNING, 2: JUMPING
      "hp": 100
    },
    {
      "id": "client_2",
      "pos": [18.2, 0.0, 3.4],
      "yaw": 3.14,
      "state": 0,
      "hp": 78
    }
  ]
}
```

#### [Host ➔ All Clients] 命中與擊殺廣播 (Reliable)
```json
{
  "t": 11,                    // PACKET_TYPE: HIT_EVENT
  "attacker": "client_2",
  "victim": "client_3",
  "damage": 34,
  "headshot": true,
  "victimHp": 0,
  "isDead": true
}
```

---

## 5. 核心機制實作準則

### 5.1 角色控制器與移動標準
* **膠囊體尺寸（Capsule）**：
  * 半徑（Radius）：`0.35m`
  * 高度（Height）：站立時 `1.8m`，蹲下時 `1.2m`。
* **物理常數**：
  * 重力加速度（Gravity）：`-25.0 m/s²`（較標準重力略重，避免漂浮感）。
  * 地面移動加速度：`60.0 m/s²`。
  * 地面摩擦阻力（Friction damping）：`-8.0`（確保鬆開鍵盤時能夠迅速煞車，模擬 CS 急停手感）。
  * 跳躍初速：`10.0 m/s`。

### 5.2 射擊與後座力系統
* **後座力（Recoil Pattern）**：
  * 每把槍皆設定專屬後座力抬升曲線（如 AK-47 連射時，準星先垂直向上抬，隨後水平左右擺動）。
  * 玩家移動或跳躍時，射擊散佈度（Inaccuracy Spread）成倍放大；蹲下與急停時散佈度最小。
* **射線檢測（Raycasting）**：
  * 玩家模型須拆分為 3 個主要 Hitbox 網格：
    1. **Head Box**：爆頭判定，傷害倍率 $\times 4$。
    2. **Chest/Body Box**：身體判定，傷害倍率 $\times 1$。
    3. **Legs Box**：四肢判定，傷害倍率 $\times 0.75$。

### 5.3 雙相機架構（Dual Camera）
```javascript
// 渲染循環核心邏輯
renderer.autoClear = false;
renderer.clear();

// 1. 渲染主世界（地圖、其他玩家、特效）
renderer.render(worldScene, worldCamera);

// 2. 清除深度緩衝區，確保持槍模型永遠置頂
renderer.clearDepth();

// 3. 渲染第一人稱持槍相機
renderer.render(viewmodelScene, viewmodelCamera);
```

---

## 6. GitHub Actions 自動化部署標準

專案必須在 `.github/workflows/deploy.yml` 建立標準部署流程，設定如下：

1. **觸發條件**：推送到 `main` 分支，或手動透過 `workflow_dispatch` 觸發。
2. **建置環境**：`ubuntu-latest`，Node.js 20。
3. **快取策略**：利用 `actions/setup-node` 自動快取 npm 快取，加快建置速度。
4. **輸出目錄**：Vite 預設打包至 `dist`。
5. **部署套件**：使用官方推薦的 `actions/upload-pages-artifact@v3` 與 `actions/deploy-pages@v4`。
6. **環境路徑重要規則**：
   * 在 `vite.config.js` 中必須將 `base` 設為相對路徑 `'./'` 或專案名稱 `'/LANGame/'`，以防止 GitHub Pages 二級路徑素材載入 404。

---

## 7. 開發踩坑指南與注意事項（Troubleshooting）

1. **AP 隔離（Client Isolation）**：
   * 某些公共 Wi-Fi 或飯店網路會開啟 AP 隔離，阻擋內網互通。此時 WebRTC 無法在內網直連。開發測試時建議使用手機熱點或家用路由器。
2. **mDNS 遮蔽真實 IP**：
   * 現代瀏覽器預設不直接揭露 `192.168.x.x`，而是以 `xxxx.local` 表示。若路由器不支援 mDNS 多播，可在連線失敗時提示使用者於 `chrome://flags/#enable-webrtc-hide-local-ips-with-mdns` 將其暫時關閉。
3. **Pointer Lock API 限制**：
   * 瀏覽器安全策略規定，必須由「使用者直接點擊事件（User Gesture）」才能觸發 `requestPointerLock()`，不可在初始化腳本中直接自動呼叫。
4. **音效播放原則**：
   * 瀏覽器 Autoplay 政策限制音訊必須在使用者第一次點擊網頁後才能解鎖 `AudioContext`。

---

## 8. 核心開發實戰經驗知識庫 (Reference to Dev Experience)

所有開發者與 Agent 在進行 **3D 人體模型幾何微調、骨骼動畫擴展、據槍瞄準姿態與物理手感調校** 時，**必須**優先研讀並遵循 [`docs/DEV_EXPERIENCE.md`](docs/DEV_EXPERIENCE.md) 中的工程規範與歷次踩坑總結：

1. **純程序化人體解剖學建模規範**：
   * 7.5~8 頭身黃金比例、倒三角特警身段與標準雙腿緊湊間距（`0.086m`）。
   * 三層頸部自然過渡（頸椎 + 斜方肌 + 圍巾摺痕），徹底消除「頭部漂浮空洞」。
   * 插肩袖（20度斜肩）與肩峰轉折帽，杜絕「外翻脫臼肉球」與「懸空黑木板」。
   * 35度傾斜腳背、微上翹鞋楦與前後落差大底登山作戰靴，杜絕「方塊鞋盒」與「直筒煙囪」。
2. **真人骨骼兩段式屈膝下蹲動力學（Kinematic Crouch）**：
   - 嚴格禁止單純下移上半身之「垂直壓扁縮圖假下蹲」。
   - 採用髖關節前屈（`-0.72 rad`）+ 膝關節跪折（`1.38 rad`）+ 骨盆下沉 22cm + 脊椎壓槍前傾 8 度的真實骨骼聯動。
   - `resetLegs` 守衛機制，確保下蹲動作不被待機回正插值抹平。
3. **全 3D 瞄準與據槍骨骼直連幾何**：
   - 使用點對點向量四元數直連公式（`createLimbBone`），消滅雙手抱胸穿模，右手握把手、左手向前向上托護木（前後縱深相差 26cm）。
   - 全 3D 仰角俯角瞄準計算（$\pm 55^\circ$）與世界旋轉同步取樣（`getWorldQuaternion`）。
4. **程序化帆布材質系統**：
   - 純 2D Canvas 動態生成數位迷彩、千鳥格圍巾、碳纖維防護手套與杜邦 Cordura 防彈背心紋理，保持零外部素材依賴。

