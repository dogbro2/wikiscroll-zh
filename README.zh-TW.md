# WikiScroll 正體中文版（wikiscroll-zh）

[English](README.md) · **正體中文**

> **本專案是 [WikiScroll](https://github.com/Golps/WikiScroll)（MIT）的非官方正體中文分支。**
> 介面與中文條文以正體中文（台灣用語）呈現。與原作者、上游部署站台及維基媒體基金會均無隸屬關係。

把漫無目的的滑動，換成一次值得的發現。WikiScroll 是一次顯示一則的閱讀器：一張照片、一個標題、一段只保留完整句子的導言。讀它、存它、開啟原始條目，或直接換下一則。

## 這個分支改了什麼

| 項目 | 上游 WikiScroll | 本分支 |
| --- | --- | --- |
| 介面語言 | 15 種，中文為簡體 | 中文介面全面改為正體中文（台灣用語：設定、儲存、載入、連結、隱私權政策、歷史紀錄） |
| 中文條文 | 由 Wikipedia 原文決定字形，通常為簡體 | 所有中文請求加上 `variant=zh-tw`，條文一律正體；標題另以 `inprop=varianttitles` 轉換 |
| 介面語言判斷 | 預設英文 | `?lang=` → 已存設定 → 瀏覽器語言 → 英文 |
| 網域與聯絡資訊 | 寫死在原始碼中 | 改由設定提供（見下方「設定」），未設定時功能降級而不是連到別的站台 |
| User-Agent | 上游站台與信箱 | `WikiScroll-zh/2.1` 加上你自己的網域與信箱 |
| 專案名稱 | `wikiscroll` | `wikiscroll-zh`，版本 `2.1.0-zhhant.1` |

中介資料（canonical、Open Graph、結構化資料）、分享連結、收藏頁、預設預覽圖、頁面 CSP 的 `connect-src`、以及送給 Wikimedia 的 User-Agent，全部讀同一組設定。

## 功能

- **一次一則的閱讀**：照片、標題、只保留完整句子的導言；可存、可分享、可開啟原始條目。
- **收藏不會影響推薦**：儲存只是加入你的收藏庫，不會改變下一則內容，也不會隨請求送出。
- **你自己決定篩選**：主題、深度、語言與旅遊篩選；除此之外沒有其他排序邏輯。
- **沒有連續天數、目標或帳號**：每日次數與每週圖表只呈現閱讀狀況，資料全部留在瀏覽器。
- **旅遊指南**：Wikivoyage 目的地、互動地圖、地點座標。
- **分享收藏**：把收藏打包成連結，收到的人可以整份存回自己的收藏庫。
- **離線閱讀**：Service Worker 快取讀過的文章。
- ** ambient 閱讀模式**：長按或空白鍵進入，緩慢自動捲動。
- **15 種語言**：英文、西班牙文、法文、德文、義大利文、葡萄牙文、俄文、日文、中文、阿拉伯文、印地文、韓文、希伯來文、荷蘭文、波蘭文。

## 快速開始

需要 Node.js 22 以上與 pnpm。

```bash
pnpm install
pnpm dev       # 本機開發（127.0.0.1:4321，/api 代理到 8787）
pnpm build     # 產生 dist/ 靜態檔
pnpm test      # 407 項回歸測試
```

要在本機執行 Worker：

```bash
npx wrangler dev
```

## 設定

原始碼中不含任何其他站台的網域。三個值在建置與執行時讀取；留空時需要它的功能會降級，而不是去呼叫上游部署。

| 值 | 建置（Astro） | Worker（`wrangler.jsonc` → `vars`） | 作用 |
| --- | --- | --- | --- |
| 站台網域 | `PUBLIC_SITE_ORIGIN=https://example.org` | `SITE_ORIGIN` | canonical、Open Graph、分享連結、收藏頁、Wikimedia User-Agent |
| 卡片庫 | `PUBLIC_CARDS_ORIGIN=https://cards.example.org` | `CARDS_ORIGIN` | 選用的預製卡片分片；留空則走即時 API，CSP 也不再放行該網域 |
| 聯絡信箱 | `PUBLIC_CONTACT_EMAIL=you@example.org` | `CONTACT_EMAIL` | 設定、關於、隱私權政策顯示；也是辨識此部署的聯絡方式 |

```bash
PUBLIC_SITE_ORIGIN=https://example.org \
PUBLIC_CARDS_ORIGIN= \
PUBLIC_CONTACT_EMAIL=you@example.org \
pnpm build
```

選用：`PUBLIC_REPO_URL` 會在設定頁與關於頁加上原始碼連結。

以下四個靜態檔吃不到建置變數，發佈前請手動修改：

- `public/sitemap.xml`
- `public/robots.txt`（`Sitemap:` 那一行）
- `public/llms.txt`
- `public/_headers` 的 `Content-Security-Policy`（自行架設卡片庫時，把該網域加回 `connect-src`）

Worker 送出的 User-Agent 是 `WikiScroll-zh/2.1` 加上站台與信箱。Wikimedia 的政策要求每個客户端標明營運者，正式上線前請把兩者都設好。

## 部署

**Cloudflare Workers**：完整功能，包含主題與旅遊篩選、Help Wikipedia、「歷史上的今天」、收藏分享頁與連結預覽。

```bash
npx wrangler deploy
```

部署前請在 `wrangler.jsonc` 的 `vars` 填入 `SITE_ORIGIN`、`CARDS_ORIGIN`、`CONTACT_EMAIL`，並確認 `name` 是你自己的 Worker 名稱（目前為 `wikiscroll-zh`，會建立新的 Worker 與 workers.dev 子網域）。

**靜態託管（GitHub Pages 等）**：執行 `pnpm build`，把 `dist/` 當純檔案提供。瀏覽器會直接向 Wikipedia 與 Wikivoyage 取得內容，核心閱讀功能可用：隨機探索、深度、語言、收藏、ambient 模式、地圖與離線閱讀；只有 Worker 專屬功能（篩選、Help Wikipedia、歷史上的今天、分享預覽）不會運作。

## 已知限制

- **資料只在瀏覽器**：收藏、收藏庫與歷史紀錄沒有帳號同步，清除網站資料就會消失；Safari 可能在大約七天未造訪後清除。
- **分享出去的收藏無法撤回**：連結本身包含快照，本機刪除收藏不會讓已分享的連結失效。
- **語言覆蓋不一**：Help Wikipedia 支援 4 種語言；卡片上的分類標籤只有英文；Wikivoyage 有 12 個語言版本。
- **預設未設定部署值**：請先設定 `SITE_ORIGIN` 等三個值再公開部署。
- **測試**：407 項回歸測試，涵蓋 Worker、閱讀器、介面與建置輸出。

## 授權與致謝

本專案為 MIT 授權，原始碼來自 [WikiScroll](https://github.com/Golps/WikiScroll)，著作權為原作者所有；本分支的修改與新增部分同樣以 MIT 釋出，詳見 [LICENSE](LICENSE)。

條文內容來自 Wikipedia 與 Wikivoyage，依 CC BY-SA 授權；照片來自 Wikimedia Commons。WikiScroll 不是維基媒體基金會的官方產品。其他第三方元件的授權見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

上游專案的設計與絕大部分程式碼由 WikiScroll 作者完成；本分支只加上正體中文介面、字形轉換與部署設定化。