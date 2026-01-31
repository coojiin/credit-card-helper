# 部署指南：GitHub Pages 與 Cloudflare Pages

這兩個平台都非常適合「卡利害」這種靜態 PWA 應用。我們已經將程式設定為「靜態輸出模式」，您可以選擇您喜歡的平台。

---

## 選項 A：部署到 Cloudflare Pages (推薦，速度最快)

Cloudflare Pages 是 Cloudflare 專門為網站設計的服務 (底層就是 Worker 技術)，雖然是免費的但速度極快，且支援 HTTPS。

1.  **建立 GitHub Repository (儲存庫)**
    *   登入您的 GitHub 帳號。
    *   建立一個新的 Repository (例如 `ka-li-high`)。
    *   將此專案程式碼上傳到 GitHub。
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin <您的 GitHub 網址>
        git push -u origin main
        ```

2.  **設定 Cloudflare Pages**
    *   登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
    *   進入 **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**。
    *   選擇剛剛建立的 `ka-li-high` repository。
    *   **Build settings (重要)**：
        *   **Framework preset**: 選擇 `Next.js (Static HTML Export)`。
        *   **Build command**: `npm run build`
        *   **Output directory**: `out` (注意：靜態輸出是 `out`，不是 `.next`)
    *   點擊 **Save and Deploy**。

3.  **完成**
    *   Cloudflare 會給您一個 `<project>.pages.dev` 的網址，用 iPhone 瀏覽並加入主畫面即可！

---

## 選項 B：部署到 GitHub Pages (完全免費)

如果您不想註冊 Cloudflare，GitHub Pages 也是很好的選擇。

1.  **修改設定檔 (關鍵)**
    *   打開 `next.config.ts`。
    *   如果您打算使用預設網址 (例如 `username.github.io/ka-li-high`)，請取消註解 `basePath` 並填入儲存庫名稱：
        ```typescript
        basePath: '/ka-li-high',
        ```

2.  **推送程式碼**
    *   將程式碼推送到 GitHub (參考上方 Cloudflare 步驟 1)。

3.  **設定 GitHub Actions (自動部署)**
    *   在 GitHub 網頁上，進入該專案的 **Settings** -> **Pages**。
    *   在 **Source** 選擇 **GitHub Actions**。
    *   GitHub 會自動偵測這是 Next.js 專案並建議設定檔，點擊 **Configure** -> **Commit changes**。
    *   等待 Actions 跑完 (約 2 分鐘)，您的網站就會在 `https://<user>.github.io/ka-li-high` 上線了！

---

## 常見問題

**Q: 為什麼要用「靜態輸出 (Static Export)」？**
A: 因為「卡利害」的所有資料都存在您的手機裡 (IndexedDB)，不需要伺服器運算。靜態輸出可以讓它變成純 HTML/JS 檔案，這樣才能免費部署到 GitHub Pages 或 Cloudflare Pages。

**Q: 我更新程式後，手機上的 App 會更新嗎？**
A: 當您推送新程式碼到 GitHub，雲端會自動重新部署。下次您打開 App 時，重新整理頁面即可看到新功能。
