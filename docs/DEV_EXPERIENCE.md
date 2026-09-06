# 3D 區網對戰射擊遊戲 (LANGame) 核心開發經驗與技術架構手冊

> **文件定位**：本文件記錄專案開發過程中積累的核心實戰經驗、人體解剖學程序化建模架構、人體運動學骨骼動畫、全 3D 瞄準幾何解算、物理碰撞與手感調校等關鍵技術細節。供後續所有 Agent 及開發者在擴展系統、新增角色模型、最佳化動畫與除錯時作為首要技術指南。
>
> 相關規範：本文件由專案核心規範 [`AGENTS.md`](../AGENTS.md) 索引並具備最高參考價值。

---

## 目錄
1. [專案架構與核心開發哲學](#1-專案架構與核心開發哲學)
2. [純程序化人體解剖學建模實戰 (Procedural Humanoid Modeling)](#2-純程序化人體解剖學建模實戰-procedural-humanoid-modeling)
3. [真人骨骼運動學動畫與下蹲系統 (Kinematic Animation & Crouch)](#3-真人骨骼運動學動畫與下蹲系統-kinematic-animation--crouch)
4. [全 3D 瞄準、據槍姿態與射線檢測 (3D Aiming & Procedural Rigging)](#4-全-3d-瞄準據槍姿態與射線檢測-3d-aiming--procedural-rigging)
5. [程序化帆布材質生成技術 (Procedural Canvas Textures)](#5-程序化帆布材質生成技術-procedural-canvas-textures)
6. [FPS 物理、碰撞與競技手感調校 (Physics & Gameplay Polish)](#6-fps-物理碰撞與競技手感調校-physics--gameplay-polish)
7. [常見踩坑與除錯指南 (Gotchas & Troubleshooting)](#7-常見踩坑與除錯指南-gotchas--troubleshooting)

---

## 1. 專案架構與核心開發哲學

### 1.1 堅持「零外部素材依賴（Zero-Asset Dependency）」的根本原因
* **GitHub Pages 託管極致秒開**：避免載入 20~50MB 的外部 GLB/GLTF 模型或大型音效貼圖，杜絕 404 資源載入失敗與網路延遲。
* **純閉環區網（Air-Gapped LAN）適配**：本遊戲主打「無外網環境下的純區網連線（透過 QR Code 交換 SDP）」。純程序化代碼生成的幾何體與 Canvas 貼圖可保證 100% 本地即開即玩，不需要連外網下載任何資源。
* **低多邊形（Low-Poly）復古與高幀率**：維持 60~120 FPS 穩定流暢渲染，幾何頂點數量可控，大幅降低行動裝置與筆電的 GPU 負擔。

### 1.2 模組劃分職責
* `src/combat/AIBot.js`：敵對 Bot 的程序化人體幾何、骨骼分層層級、戰鬥狀態機、瞄準仰角解算與走跑下蹲動作。
* `src/combat/Weapon.js` & `src/graphics/WeaponView.js`：槍械數值、第一人稱持槍視角（ViewModel）、後座力曲線。
* `src/physics/WorldCollision.js` & `src/physics/PlayerController.js`：八叉樹（Octree）環境碰撞與玩家膠囊體移動。
* `src/graphics/DualCamera.js`：雙相機架構（主世界 + 持槍相機），消滅貼牆武器穿模。

---

## 2. 純程序化人體解剖學建模實戰 (Procedural Humanoid Modeling)

在開發早期，純程式碼拼湊的模型容易出現「Minecraft 式生硬方塊感」或「關節脫臼的外星人感」。經過多次疊代，總結出以下解剖學建模標準：

### 2.1 人體黃金比例與空間維度
* **頭身比**：嚴格維持在 **7.5 ~ 8 頭身**。
  * 角色總高度：`1.75m ~ 1.80m`。
  * 頭部高度：`0.23m`、寬度：`0.17m`、深度：`0.20m`。
  * 軀幹高度：`0.46m`、上胸寬：`0.35m`、腰腹收窄：`0.27m`（倒三角形特警身段）。
  * 骨盆臀部：高度 `0.15m`、寬度 `0.17m`。
* **雙腿間距（Leg Spacing）**：
  * **踩坑**：間距若設為 `0.14m` 以上，雙腿之間會形成巨大的門字方框空洞（生硬 O 型腿）。
  * **標準解**：嚴格設定 `legSpacing = 0.086m`，並在兩腿交會處增加 `crotch` 襠部三角形斜向過渡圓柱（直徑 0.065m 向下收窄至 0.035m），徹底消除跨下漏光斷層。

```
       [ 戰術高切頭盔 (FAST Helmet) ]
                   │
         [ 頸椎 + 斜方肌自然過渡 ]
                   │
      ┌───[ 20° 斜肩插肩袖 + 護肩 ]───┐
      │            │                  │
 [持槍副手]  [倒三角戰術背心 (MOLLE)]  [扣把主手]
      │            │                  │
      │       [戰術腰帶 + 附包]        │
      │            │                  │
      └───[ 緊湊髖關節球窩 (0.086m) ]──┘
                   │
          [大腿 (向內微錐 + 護膝)]
                   │
          [小腿 (反向屈膝關節)]
                   │
         [35° 腳背流線作戰登山靴]
```

### 2.2 頭部、頸部與面罩系統（消滅「頭部漂浮」）
* **問題**：若直接將頭盔/頭部網格加在身體上方，會造成「頭部懸空漂浮在半空中」的恐怖感。
* **解法（三層解剖過渡）**：
  1. **頸椎支柱（Cervical Spine）**：`CylinderGeometry(0.046, 0.052, 0.085, 10)`，向前微傾 6 度。
  2. **斜方肌斜坡（Trapezius）**：`CylinderGeometry(0.050, 0.088, 0.055, 10)`，順著鎖骨向肩膀自然展延。
  3. **戰術高領與圍巾摺痕（Collar & Shemagh）**：環形圓環（TorusGeometry）與戰術防風高領，遮蓋頸身轉折處。
* **特戰高切頭盔（FAST Helmet）細節**：
  * 主殼體：半球幾何體縮放 `(0.97, 1.02, 1.08)`，兩側留出耳廓凹槽（Ear Cutouts）。
  * 戰術配件：額頭夜視儀固定底座（Wilcox NVG Shroud）、左右兩側弧形戰術導軌（ARC Rails）、頂部魔鬼氈貼條、後頸防暴懸掛襯墊。
  * 防彈風鏡：深色反光微弧面鏡片 + 戰術彈性拉帶（貫穿頭盔兩側）。

### 2.3 肩部與手臂解剖學過渡（消滅「外翻脫臼肉球」與「懸空黑木板」）
* **踩坑記錄**：
  - 若在肩膀兩側直接放置圓球或厚方塊，角色持槍或轉動時，肩膀看起來會像外翻脫臼的肉瘤；若防彈肩帶太厚太平，就像肩膀上浮著兩塊黑色木板。
* **標準解決方案**：
  1. **插肩袖（Raglan Sleeve Cylinder）**：順著鎖骨角度向外下方傾斜 20 度（`rotation.z = ±0.35`），長度 0.11m，直徑 0.052m 收窄至 0.048m，自然融入大臂。
  2. **肩峰關節轉折帽（Acromion Cap）**：小尺寸圓潤球體（半徑 0.050m）精確錨定在手臂旋轉中心 `(±0.180, -0.02, -0.005)`，包覆手臂根部。
  3. **服貼型防彈肩帶**：厚度僅 `0.022m`，寬度 `0.052m`，縱深 `0.18m`，順著胸背鎖骨弧度微向外傾斜 8 度緊湊包覆。

### 2.4 軍規特戰作戰登山靴（消滅「方塊鞋盒」與「直筒煙囪」）
* **踩坑記錄**：若鞋子由長方體與垂直圓柱拼接，在跑動與下蹲時視覺上非常僵硬，像穿了鞋盒或煙囪。
* **標準幾何拆解（`createTacticalBoot`）**：
  1. **高筒靴筒（Shaft）**：高度 0.12m 的圓柱，由上至下微寬（直徑 0.042m 到 0.048m），自然吞入褲腳。
  2. **傾斜腳背與鞋舌（Slanted Instep & Tongue）**：圓柱前傾 35 度（`rotation.x = 0.60`），順滑銜接腳踝與鞋尖。
  3. **流線鞋楦（Toe Box）**：橢圓球體扁平微上翹（`scale.set(0.92, 0.55, 1.30)`），重現專業登山靴輪廓。
  4. **前端橡膠防撞包頭（Rubber Bumper）**：深色弧形包邊，提升戰術防護細節。
  5. **Vibram 齒紋大底（Lugged Sole）**：將大底拆為「前掌薄底（厚 1.6cm）」與「後跟加厚腳跟（厚 2.6cm）」，營造經典的足弓落差。

---

## 3. 真人骨骼運動學動畫與下蹲系統 (Kinematic Animation & Crouch)

### 3.1 致命誤區：模型垂直縮放／單純位移（The Compression Trap）
* **使用者回饋**：「*腳色蹲下的時候 我發現你是用有點縮圖的方式這樣很醜耶 有辦法讓他蹲下可以像是真人那樣自然嗎? 而不是用縮放的方式*」
* **根本問題剖析**：
  - 過去的實作僅在下蹲時將 `upperBody.position.y` 降低，但雙腿維持直挺挺伸展。
  - 結果上半身整塊直接插入大腿內部穿模，整個人被「物理壓扁」，完全失去人體骨骼與關節連動邏輯。

### 3.2 解法：兩段式屈膝運動學動力學（Two-Segment Kinematic Crouch）
真人蹲下時，必須是**髖關節折疊、膝關節前頂跪屈、骨盆重心下沉**三者同時聯動：

```javascript
// 核心下蹲插值進度 (0.0: 完全站立, 1.0: 完全蹲下)
const targetProgress = this.isCrouching ? 1.0 : 0.0;
this.crouchProgress += (targetProgress - this.crouchProgress) * Math.min(delta * 10, 1);
const cp = this.crouchProgress;

if (cp > 0.001) {
  // 1. 髖關節前屈 (Hip Flexion) - 大腿向前上方折起
  this.leftLegPivot.rotation.x = -0.72 * cp;
  this.rightLegPivot.rotation.x = -0.76 * cp;

  // 2. 膝關節深度跪折 (Knee Flexion) - 膝蓋向前頂出、小腿向後收折
  if (this.leftKneePivot) this.leftKneePivot.rotation.x = 1.38 * cp;
  if (this.rightKneePivot) this.rightKneePivot.rotation.x = 1.44 * cp;

  // 3. 骨盆重心依幾何三角關係同步下沉 (Pelvis Drop)
  const pelvisDrop = 0.22 * cp;
  this.leftLegPivot.position.y = 0.74 - pelvisDrop;
  this.rightLegPivot.position.y = 0.74 - pelvisDrop;
  if (this.hipsGroup) this.hipsGroup.position.y = 0.74 - pelvisDrop;

  // 4. 上半身重心沉降 + 戰術壓槍微前傾 8 度
  if (this.upperBody) {
    this.upperBody.position.y = this.baseTorsoY - (pelvisDrop + 0.03 * cp);
    this.upperBody.rotation.x += 0.15 * cp;
  }
}
```

### 3.3 動畫狀態守衛（Guard in `resetLegs`）
* **衝突點**：角色在射擊或待機時會呼叫 `resetLegs()`。若未加判斷，`resetLegs()` 每幀會強行將大腿旋轉角拉回站立值（`0.04`），導致下蹲動作與待機回正產生抽搐打架（Tug-of-war）。
* **規範實作**：
  ```javascript
  resetLegs(delta = 0.016) {
    this.isMoving = false;
    const smooth = Math.min(delta * 12, 1);

    // 關鍵守衛：下蹲期間不覆寫雙腿屈膝旋轉！
    if (this.crouchProgress > 0.05) {
      if (this.upperBody) {
        this.upperBody.rotation.z += (0 - this.upperBody.rotation.z) * smooth;
        this.upperBody.rotation.y += (0 - this.upperBody.rotation.y) * smooth;
      }
      return;
    }

    // 站立狀態下的平滑回正
    this.leftLegPivot.rotation.x += (0.04 - this.leftLegPivot.rotation.x) * smooth;
    this.rightLegPivot.rotation.x += (0.04 - this.rightLegPivot.rotation.x) * smooth;
    ...
  }
  ```

### 3.4 行走與奔跑動力學（Locomotion & Torso Bobbing）
* **大腿擺動 + 反向屈膝**：
  * 當大腿向後蹬（`thighAngle < 0`），小腿膝蓋自動向後折起（`bend = Math.max(0, -thighAngle) * 0.85`）。
  * 當大腿向前邁，小腿在落地前自動伸直，徹底消滅木偶直腿擺動。
* **重心垂直起伏（Torso Bobbing）**：
  * 雙腳交替時重心週期性下沉 `Math.abs(Math.sin(timer * 2)) * 0.052`，賦予角色重力感。
* **轉向側傾（Bank Lean）與脊柱反扭（Spine Counter-Twist）**：
  * 急速變向與橫移對槍時，身體產生反向傾斜（Bank Lean），手部持槍維持呼吸微晃。

---

## 4. 全 3D 瞄準、據槍姿態與射線檢測 (3D Aiming & Procedural Rigging)

### 4.1 雙臂向量幾何錨定法 (`createLimbBone`)
* **傳統問題**：使用常規 Euler 旋轉拼接大臂小臂時，不同方向轉動極易發生奇異點（Gimbal Lock），或兩臂在胸前交疊抱胸。
* **標準向量直連公式**：
  給定起點 $P_A$（肩膀）與終點 $P_B$（手肘或手腕），動態生成圓柱並對齊：
  $$\vec{D} = P_B - P_A, \quad L = \|\vec{D}\|$$
  $$Q = \text{Quaternion.setFromUnitVectors}(\vec{Y}_{(0,1,0)}, \hat{D})$$
* **特戰據槍座標標準**：
  * **右臂（握把手）**：肩點 `(0.180, -0.02, -0.005)` $\rightarrow$ 手肘在右肋外側下沉 `(0.22, -0.18, 0.04)` $\rightarrow$ 手腕扣住扳機 `(0.14, -0.11, 0.12)`。
  * **左臂（托護木手）**：肩點 `(-0.180, -0.02, -0.005)` $\rightarrow$ 手肘向前下方外展 `(-0.08, -0.14, 0.18)` $\rightarrow$ 手腕斜向前上方伸展 `(0.14, -0.07, 0.38)`。
  * 左右手在 Z 軸前後縱深相差達 **26 公分**，徹底呈現真實步槍據槍三角形支撐幾何！

### 4.2 全 3D 俯仰角瞄準（Full 3D Pitch Tracking）
* **問題**：若敵人站在高台上或樓梯上方，若只計算水平 Yaw 旋轉，射擊時槍口只會水平射擊，無法瞄準玩家。
* **標準解法**：
  ```javascript
  const toPlayer = playerPos.clone().sub(this.group.position);
  const horizDist = Math.hypot(toPlayer.x, toPlayer.z);
  const targetY = playerPos.y + 1.1; // 玩家胸口高度
  const botMuzzleY = this.group.position.y + (this.isCrouching ? 0.88 : 1.28);
  const deltaY = targetY - botMuzzleY;
  
  // 俯仰角度 (Pitch)：高處打低處為正值，低處打高處為負值
  const rawPitch = Math.atan2(-deltaY, Math.max(0.6, horizDist));
  this.targetPitch = THREE.MathUtils.clamp(rawPitch, -0.95, 0.95); // 限制在 ±55 度
  ```
* **世界旋轉同步取樣**：
  槍口火花與射擊射線（Tracer）不可取本地位移，必須取用 `weaponGroup.getWorldPosition(muzzleWorld)` 與 `weaponGroup.getWorldQuaternion(gunQuat)`，保證槍火位置與射線方向 100% 吻合槍管朝向。

---

## 5. 程序化帆布材質生成技術 (Procedural Canvas Textures)

為達到「零外部圖片下載」，專案採用純 HTML5 2D Canvas 動態生成三維貼圖：

| 紋理名稱 | Canvas 尺寸 | 核心特徵與生成邏輯 | 應用部位 |
| :--- | :--- | :--- | :--- |
| **數位迷彩 (Digital Camo)** | 256x256 | 沙色/暗灰基底，利用雙層隨機方形晶格色塊交錯覆蓋，`RepeatWrapping (3, 3)` | 戰術夾克、作戰長褲 |
| **千鳥格圍巾 (Houndstooth)** | 256x256 | 沙漠戰術 Shemagh 圍巾經典圖騰，利用 `(x+y)%64 === 0` 幾何交錯矩陣生成 | 頸部面罩、圍巾 |
| **碳纖維戰術手套 (Carbon Fiber)** | 256x256 | 暗黑磨砂皮底，拳眼處繪製圓角防護硬塊，45度斜線光澤紋理 | 射擊半指/全指手套 |
| **防彈背心尼龍 (Tactical Vest)** | 256x256 | 沉穩深灰黑底，雙向交叉微細格紋，模擬 1000D 杜邦 Cordura 粗織防彈布料 | 防彈胸板、腰封、彈匣袋 |

---

## 6. FPS 物理、碰撞與競技手感調校 (Physics & Gameplay Polish)

### 6.1 八叉樹地面吸附與斜坡檢測 (`snapToGround`)
* AI Bot 在巡邏時必須透過靜態八叉樹網格（`this.worldCollision`）進行垂直向下射線檢測（Raycasting）：
  - 射線起點：`position.x, 30, position.z`，方向：`(0, -1, 0)`。
  - 吸附判定：當地面高度 $Y$ 改變時，平滑移動或即時貼合地面，避免走上斜坡時懸空或陷入地板。

### 6.2 雙相機渲染架構（Dual Camera Setup）
在第一人稱射擊遊戲中，若將持槍手臂與世界物體放入同一個相機渲染，當玩家貼近牆壁時，長步槍槍管會直接穿透牆面。
* **標準解決方案**：
  ```javascript
  // 1. 關閉自動清除緩衝區
  renderer.autoClear = false;
  renderer.clear();

  // 2. 渲染第一層：主世界相機 (地形、掩體、敵人、粒子)
  renderer.render(worldScene, worldCamera);

  // 3. 核心關鍵：清除深度緩衝區 (Clear Depth)
  renderer.clearDepth();

  // 4. 渲染第二層：第一人稱持槍相機 (ViewModel Camera)
  renderer.render(viewmodelScene, viewmodelCamera);
  ```

### 6.3 CS 競技急停射擊散佈度（Counter-Strafing Spread）
* 射擊散佈度與玩家/Bot 移動狀態緊密聯動：
  - **靜止急停時**：散佈度最小（`0.072`）。
  - **蹲下壓槍時**：散佈度降低約 40%（`0.042`），模擬 CS 的蹲姿連射穩定度。
  - **奔跑移動時**：散佈度放大 2~3 倍，鼓勵玩家在開火瞬間鬆開方向鍵反向「急停」。

---

## 7. 常見踩坑與除錯指南 (Gotchas & Troubleshooting)

### 7.1 GitHub Pages 部署 404 與快取問題
* **二級目錄問題**：在 `vite.config.js` 必須設定 `base: './'`，絕不能寫死成根目錄 `/`。
* **快取問題（Cache Busting）**：GitHub Pages 與行動裝置瀏覽器有極強的快取機制，每次更新腳本時，必須在 `index.html` 中的 script 標籤同步升級版本號（如 `?v=4.6.0`）。

### 7.2 WebRTC 無法連線（AP 隔離與 mDNS）
* **AP 隔離（Client Isolation）**：某些公司或公用 Wi-Fi 啟用了 AP 隔離，導致兩台設備無法直接通訊。此時應提示使用者改用手機個人熱點（Hotspot）。
* **mDNS 隱藏 IP**：部分 Chromium 瀏覽器會以 `.local` 遮蔽區域網路 IPv4。若路由器不支援多播解析，可於 `chrome://flags/#enable-webrtc-hide-local-ips-with-mdns` 關閉此特性。

### 7.3 Pointer Lock 與 Web Audio Autoplay 安全限制
* 瀏覽器不允許在頁面剛開啟未與使用者互動時直接呼叫 `requestPointerLock()` 或播放聲音。必須在玩家點擊「開始遊戲」或「加入房間」的點擊事件（User Gesture）中觸發。

---

*本文件由專案核心開發過程整理，如有新增機制（如手榴彈物理反彈、煙霧彈體積雲、C4 炸彈安裝拆除），請接續增補於對應章節。*
