import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // 啟用靜態輸出 (這是部署到 GitHub Pages 或其他靜態主機的關鍵)
  images: {
    unoptimized: true, // 靜態輸出不支援 Next.js 的圖片優化，必須關閉
  },
  // 如果部署到 GitHub Pages 且不是網域根目錄 (例如 /repo-name)，需要加上 basePath
  // basePath: '/credit-card-helper', 
};

export default nextConfig;
