# Chloe - Live2D Desktop Pet

一个基于 Electron、Vue3 和 TypeScript 的 Live2D 桌面宠物应用。

## 技术栈

- **Electron** - 桌面应用框架
- **Vue 3** - 前端框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 构建工具
- **Live2D Cubism SDK for Web** - Live2D 渲染引擎

## 项目结构

```
chloe/
├── electron/              # Electron 主进程
│   ├── main.js           # 主进程入口
│   └── preload.js        # 预加载脚本
├── public/               # 公共资源
│   └── resources/       # Live2D 模型资源
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # Vue 组件
│   │   └── Live2DView.vue  # Live2D 视图组件
│   ├── core/            # Live2D Core SDK
│   ├── framework/       # Live2D Framework SDK
│   ├── lib/             # 自定义 Live2D 封装库
│   ├── App.vue          # 根组件
│   ├── main.ts          # Vue 应用入口
│   └── index.ts         # Live2D 库导出
├── index.html           # HTML 入口
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
└── README.md           # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 添加 Live2D 模型

将你的 Live2D 模型文件放到 `public/resources/` 目录下。例如，使用 Haru 模型：

```
public/resources/
└── Haru/
    ├── Haru.2048/
    │   ├── texture_00.png
    │   └── texture_01.png
    ├── expressions/
    ├── motions/
    ├── Haru.cdi3.json
    ├── Haru.moc3
    ├── Haru.model3.json
    ├── Haru.physics3.json
    ├── Haru.pose3.json
    └── Haru.userdata3.json
```

你可以从 Live2D 官方 SDK Samples 中复制模型资源。

### 3. 开发模式运行

```bash
npm run electron:dev
```

这将同时启动 Vite 开发服务器和 Electron 应用。

### 4. 构建生产版本

```bash
npm run electron:build
```

## 功能特性

- ✅ Live2D 模型渲染
- ✅ 透明无边框窗口
- ✅ 窗口拖拽移动
- ✅ 鼠标点击交互（点击头部随机表情，点击身体随机动作）
- ✅ 右键菜单退出
- ✅ 始终置顶显示

## 配置说明

### 修改模型路径

在 `src/components/Live2DView.vue` 中修改模型加载路径：

```typescript
chloe.loadModel('/resources/你的模型文件夹/', '模型名.model3.json');
```

### 修改窗口大小

在 `electron/main.js` 中修改窗口尺寸：

```javascript
mainWindow = new BrowserWindow({
  width: 400,    // 修改宽度
  height: 500,   // 修改高度
  // ...
});
```

## 开发说明

### 仅开发前端（不启动 Electron）

```bash
npm run dev
```

然后在浏览器中访问 `http://localhost:5173`。

### 构建前端

```bash
npm run build
```

## 注意事项

1. **Live2D SDK 许可**：本项目使用 Live2D Cubism SDK，请遵守 Live2D 的许可协议。
2. **模型格式**：支持 Live2D Cubism 3.0+ 格式的模型。
3. **资源路径**：模型资源必须放在 `public/resources/` 目录下才能正确加载。

## 许可证

MIT
