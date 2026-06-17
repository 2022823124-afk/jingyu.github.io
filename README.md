# DOORI

城中村外卖骑手导航系统手机 App 原型。

## 本地运行

```bash
cd prototype
npm install
npm run dev
```

## GitHub Pages 发布

本仓库已配置 GitHub Actions。推送到 `main` 后，会自动构建 `prototype` 并发布 `prototype/dist` 到 GitHub Pages。

在 GitHub 仓库页面进入 `Settings -> Pages`，把 Source 选择为 `GitHub Actions`。

## 高德地图预留配置

项目已预留高德 Web JSAPI 接入，但默认关闭，不会加载高德 SDK，也不会产生调用。

本地启用时，在 `prototype` 目录创建 `.env`：

```bash
VITE_AMAP_ENABLED=true
VITE_AMAP_KEY=你的高德Web端Key
VITE_AMAP_SECURITY_CODE=你的安全密钥
```

当前不要把真实 key 写进仓库。`.env` 已加入 `.gitignore`，只提交 `.env.example`。

GitHub Pages 后续如果要启用高德，需要在仓库 `Settings -> Secrets and variables -> Actions` 中配置对应变量，再调整 workflow 注入这些变量。
