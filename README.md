# Chloe - Live2D Desktop Pet

一个基于 Electron、Vue3 和 TypeScript 的 Live2D 桌面宠物应用。

## 功能特性

### 核心功能
- **Live2D 模型渲染** - 支持 Live2D Cubism 3.0+ 格式模型
- **模型切换** - 支持动态切换不同的 Live2D 模型
- **配置持久化** - 自动保存用户设置，下次启动自动恢复

### 交互功能
- **窗口拖动** - 可自由拖动窗口位置，拖动时显示炫酷边框效果
- **注视鼠标** - 模型眼睛跟随鼠标移动（全局追踪）
- **点击交互** - 点击模型头部触发表情，点击身体触发动作
- **双击对话** - 双击窗口底部弹出输入框，与模型进行对话

### 气泡对话系统
- **智能回复** - 模拟大模型对话（可扩展接入真实 API）
- **打字机效果** - 气泡文字逐字显示
- **自定义样式** - 可自定义气泡颜色和透明度
- **自动消失** - 根据文字长度自动计算消失时间

### 设置面板
- **模型路径** - 自定义模型文件夹路径
- **缩放比例** - 调整模型大小（0.5x - 2.0x）
- **位置偏移** - 调整模型水平和垂直位置
- **气泡颜色** - 自定义气泡和发送按钮颜色
- **气泡透明度** - 调整气泡透明度（30% - 100%）
- **注视鼠标** - 开关鼠标追踪功能

### 右键菜单
- **注视鼠标** - 快速开关眼睛追踪
- **切换模型** - 选择不同的 Live2D 模型
- **设置** - 打开设置面板
- **退出** - 关闭应用

### 视觉效果
- **加载动画** - 模型加载时显示优雅的加载动画
- **拖动边框** - 拖动窗口时显示渐变紫色边框闪烁
- **透明设置** - 滑动调整时设置面板变透明，方便预览
- **保存提示** - 保存设置后显示成功提示

## 技术栈

- **Electron** - 桌面应用框架
- **Vue 3** - 前端框架（Composition API）
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 构建工具
- **Live2D Cubism SDK for Web** - Live2D 渲染引擎

## 项目结构

```
chloe/
├── electron/              # Electron 主进程
│   ├── main.js           # 主进程入口
│   └── preload.js        # 预加载脚本（IPC 桥接）
├── public/               # 公共资源
│   ├── core/            # Live2D Core
│   └── resources/       # Live2D 模型资源
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # Vue 组件
│   │   ├── Live2DView.vue    # 主视图组件
│   │   ├── SettingsPanel.vue # 设置面板
│   │   ├── ChatBubble.vue    # 对话气泡
│   │   ├── ChatInput.vue     # 对话输入框
│   │   └── LoadingSpinner.vue # 加载动画
│   ├── framework/       # Live2D Framework SDK
│   ├── lib/             # 自定义封装库
│   │   ├── chloe.ts          # Live2D 控制器
│   │   ├── model.ts          # 模型管理
│   │   ├── chatService.ts    # 对话服务
│   │   └── ...
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── package.json
├── vite.config.ts
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 添加 Live2D 模型

将你的 Live2D 模型文件放到 `public/resources/` 目录下：

```
public/resources/
└── 你的模型名/
    ├── 模型名.2048/           # 纹理文件夹
    │   └── texture_00.png
    ├── expressions/           # 表情文件（可选）
    ├── motions/              # 动作文件（可选）
    ├── 模型名.moc3
    ├── 模型名.model3.json    # 模型配置文件
    └── 模型名.physics3.json   # 物理配置（可选）
```

### 3. 开发模式运行

```bash
npm run electron:dev
```

### 4. 构建生产版本

```bash
npm run electron:build
```

## 配置文件

配置文件保存在项目根目录的上一级：`../chloe-config.json`

```json
{
  "modelPath": "./resources/",
  "currentModel": {
    "name": "模型名",
    "path": "模型文件夹/",
    "file": "模型名.model3.json"
  },
  "modelScale": 1.0,
  "modelOffsetX": 0.0,
  "modelOffsetY": -0.3,
  "bubbleColor": "#8b5cf6",
  "bubbleOpacity": 0.95,
  "eyeTracking": true
}
```

## 开发说明

### 仅开发前端（不启动 Electron）

```bash
npm run dev
```

访问 `http://localhost:5173`

### 构建前端

```bash
npm run build
```

## 扩展对话功能

对话服务位于 `src/lib/chatService.ts`，目前使用模拟回复。可以修改 `sendMessage` 函数接入真实的大模型 API：

```typescript
export async function sendMessage(message: string): Promise<string> {
  // 替换为真实 API 调用
  const response = await fetch('your-api-endpoint', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  return response.json();
}
```

## 注意事项

1. **Live2D SDK 许可** - 本项目使用 Live2D Cubism SDK，请遵守 Live2D 的许可协议
2. **模型格式** - 支持 Live2D Cubism 3.0+ 格式的模型（.moc3）
3. **资源路径** - 模型资源必须放在 `public/resources/` 目录下
4. **窗口尺寸** - 默认 500x800，可在 `electron/main.js` 中修改

## 许可证

MIT
