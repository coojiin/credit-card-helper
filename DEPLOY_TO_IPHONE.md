# 如何在 iPhone 上使用「卡利害」

為了讓您在戶外也能使用這個 iPhone 應用程式，我們需要將它發布到網路上。
最強烈推薦的方式是使用 **Vercel**，它是 Next.js (本程式使用的框架) 的官方部署平台，**完全免費**且非常簡單。

## 步驟一：部署到 Vercel

請在您的電腦終端機 (Terminal) 執行以下指令：

```bash
npx vercel
```

執行後，終端機可能會請您登入 (Login) 或註冊。
1.  選擇 **Continue with Google** 或 **GitHub** 進行登入。
2.  登入成功後，回到終端機，一路按 **Enter** (使用預設設定) 即可：
    *   Set up and deploy? [Y/n] -> **Y**
    *   Which scope? -> **Enter**
    *   Link to existing project? -> **N**
    *   Project name? -> **Enter** (預設 credit-card-helper)
    *   In which directory? -> **Enter**
    *   Want to modify settings? -> **N**

等待約 1 分鐘，您會看到一個 **Production** 的網址，類似：
`https://credit-card-helper-xxxx.vercel.app`

這就是您的專屬網址！

---

## 步驟二：安裝到 iPhone

1.  拿起您的 iPhone，打開 **Safari** (一定要用 Safari)。
2.  輸入剛剛產生的網址 (`https://credit-card-helper-xxxx.vercel.app`)。
3.  點擊下方的 **分享按鈕 (Share)** 📤。
4.  往下滑，選擇 **「加入主畫面 (Add to Home Screen)」** ➕。
5.  點擊右上角的 **「新增 (Add)」**。

現在，您的桌面上就會出現藍色且漂亮的 **「卡利害」** App 圖示了！
即使在戶外沒有電腦，您也可以隨時拿出手機記帳與查詢回饋。
