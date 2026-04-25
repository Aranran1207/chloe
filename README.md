# Chloe - Live2D 桌面宠物

<div align="center">

一个基于 Electron、Vue3 和 TypeScript 的 Live2D 桌面宠物应用，集成 AI 对话与记忆系统。

[![Electron](https://img.shields.io/badge/Electron-33.0.0-blue)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## ✨ 功能特性

### 🎭 Live2D 核心功能

- **模型渲染** - 支持 Live2D Cubism 3.0+ 格式模型
- **模型切换** - 动态切换不同的 Live2D 模型（右键菜单子菜单）
- **注视鼠标** - 模型眼睛跟随鼠标移动
- **鼠标穿透** - 开启后鼠标可穿透窗口点击底层应用
- **点击交互** - 点击头部触发表情，点击身体触发动作
- **动作触发** - AI 回复中可自动触发 Live2D 动作

### 💬 AI 对话系统

- **多模型支持** - 本地 Ollama 与云端 OpenAI API 无缝切换
- **流式输出** - AI 回复实时显示，无需等待
- **记忆系统** - 自动记录用户喜好，智能检索相关记忆
- **主动提问** - 发现信息缺口时主动询问用户，问题风格自然可爱
- **间接表达理解** - AI 可从"我天天听XX"等间接表达中提取记忆
- **自定义角色** - 可自定义名字、性格、说话风格

### 🎨 气泡对话系统

- **毛玻璃效果** - 气泡采用毛玻璃背景，颜色可自定义
- **Markdown 渲染** - 支持粗体、斜体、代码、删除线
- **流畅动画** - 向上飘入、向上淡出效果
- **智能消失** - 根据文字长度自动计算显示时间

### ⚙️ 设置与系统

- **独立设置窗口** - 设置面板在屏幕中央独立弹出，不受主窗口限制
- **原生右键菜单** - 使用系统原生菜单，不受窗口大小限制
- **窗口调整** - 支持 300×500 ~ 800×1200 尺寸范围
- **系统托盘** - 最小化到托盘，支持托盘菜单控制
- **配置持久化** - 自动保存用户设置
- **记忆管理** - 查看、编辑、删除记忆
- **快速启动** - 提供一键切换 Node 版本并启动的 bat 脚本

---

## 🖼️ 截图预览

> 待添加

---

## 🚀 快速开始

### 环境要求

- Node.js 18+（推荐 22+，使用 nvm 管理版本）
- npm 或 yarn
- （可选）Ollama 本地运行环境

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/chloe.git
cd chloe

# 2. 安装依赖
cd chloe
npm install

# 3. 添加 Live2D 模型到 public/resources/ 目录

# 4. 开发模式运行
npm run electron:dev
```

### 快速启动（Windows）

项目根目录提供了 `start.bat`，自动切换 Node 版本并启动：

```bash
# 双击运行或在终端执行
start.bat
```

### 配置 Ollama（可选）

```bash
# 安装 Ollama
# 访问 https://ollama.ai 下载

# 拉取推荐模型
ollama pull qwen3.5:9b
ollama pull nomic-embed-text-v2-moe:latest

# 启动服务（通常自动启动）
ollama serve
```

### 模型目录结构

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

---

## 🏗️ 项目结构

```
chloe/
├── electron/                  # Electron 主进程
│   ├── main.js               # 主进程入口（窗口管理、IPC、托盘、原生菜单）
│   └── preload.js            # 预加载脚本（IPC 桥接）
├── public/                    # 公共资源
│   ├── core/                 # Live2D Core SDK
│   └── resources/            # Live2D 模型
├── src/
│   ├── components/           # Vue 组件
│   │   ├── Live2DView.vue    # 主视图（Live2D渲染、对话、交互）
│   │   ├── SettingsWindow.vue # 独立设置窗口
│   │   ├── SettingsPanel.vue  # 旧设置面板（已弃用）
│   │   ├── ChatBubble.vue    # 对话气泡
│   │   ├── ChatInput.vue     # 输入框
│   │   ├── MemoryPanel.vue   # 记忆管理
│   │   ├── ThinkingBubble.vue # 思考动画
│   │   └── LoadingSpinner.vue # 加载动画
│   ├── lib/                  # 核心库
│   │   ├── ai/               # AI Provider 架构
│   │   │   ├── types.ts      # 接口定义
│   │   │   ├── OllamaProvider.ts
│   │   │   └── OpenAIProvider.ts
│   │   ├── memory/           # 记忆系统
│   │   │   ├── memoryTypes.ts    # 类型定义
│   │   │   ├── memoryClient.ts   # 记忆客户端（IPC通信）
│   │   │   ├── memoryExtractor.ts # 智能记忆提取（间接表达理解）
│   │   │   ├── memoryIntegrator.ts # 记忆去重与合并
│   │   │   ├── embeddingService.ts # 向量嵌入服务
│   │   │   └── proactiveEngine.ts  # 主动提问引擎
│   │   ├── chatService.ts    # 对话服务
│   │   ├── chloe.ts          # Live2D 控制器
│   │   └── motionManager.ts  # 动作管理器
│   ├── framework/            # Live2D SDK
│   ├── App.vue
│   └── main.ts
├── start.bat                 # Windows 快速启动脚本
├── package.json
└── vite.config.ts
```

---

## 🔧 技术栈

| 技术 | 说明 |
|------|------|
| Electron | 桌面应用框架 |
| Vue 3 | 前端框架（Composition API） |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Live2D Cubism SDK | Live2D 渲染引擎 |
| better-sqlite3 | SQLite 数据库（记忆存储） |
| Ollama | 本地大模型推理 |

---

## 🤖 AI Provider 架构

系统采用统一的 AI Provider 接口，支持灵活切换模型服务：

```
┌─────────────────────────────────────────────┐
│              ChatService                    │
│         （对话服务，统一的调用入口）           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           AI Provider 接口                   │
│  （统一的抽象接口，兼容所有模型服务）          │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐    ┌───────────────┐
│ OllamaProvider│    │ OpenAIProvider│
│  （本地推理）  │    │  （云端 API） │
└───────────────┘    └───────────────┘
```

| 服务商 | 状态 | 说明 |
|--------|------|------|
| Ollama | ✅ 已支持 | 本地推理，低延迟，低显存占用 |
| OpenAI | ✅ 已支持 | 云端 API，效果更好 |
| Azure OpenAI | 🟡 规划中 | 企业级部署 |
| Claude | 🟡 规划中 | Anthropic 模型兼容 |

---

## 🧠 记忆系统架构

```
用户对话 → ChatService → AI 回复
    │                        │
    ▼                        ▼
MemoryExtractor        MemoryIntegrator
    │                        ▲
    ▼                        │
MemoryClient (SQLite + 向量索引)
    │
    ▼
EmbeddingService (nomic-embed-text / text-embedding)
```

**核心功能：**
- **被动记忆** - 对话中自动记录用户喜好、个人信息
- **间接表达理解** - 可从"我天天听XX"、"周末就打游戏呗"等间接表达中提取记忆
- **智能检索** - 根据对话上下文检索相关记忆
- **主动提问** - 发现信息缺口时主动询问用户，问题风格自然可爱
- **记忆去重** - 向量相似度 + 文本相似度双重检测
- **记忆管理** - 可视化管理面板，支持编辑、删除、清空

### 主动提问流程

```
ProactiveEngine 定时检查
        │
        ▼
  分析记忆缺口（缺少哪些类别的记忆）
        │
        ▼
  生成问题 → 改写为自然可爱的语气
        │
        ▼
  气泡显示问题 → 用户回答
        │
        ▼
  MemoryExtractor 提取记忆 → 保存到数据库
```

---

## 📋 开发路线图

### ✅ 已完成

| 阶段 | 功能 | 状态 |
|------|------|------|
| Phase 1 | 基础记忆存储 | ✅ |
| Phase 2 | 智能记忆提取 | ✅ |
| Phase 3 | 主动提问引擎 | ✅ |
| Phase 4 | 记忆管理界面 | ✅ |
| Phase 5 | 云端模型支持 | ✅ |
| Phase 6 | 桌面交互增强 | ✅ |

### 🚧 规划中

| 阶段 | 功能 | 状态 |
|------|------|------|
| Phase 7 | 日常功能（闹钟/天气/日程） | 🟡 |
| Phase 8 | 语音交互（TTS/ASR） | 🟡 |

---

## ⚙️ 配置说明

配置文件位于 `../chloe-config.json`（项目根目录上一级）：

```json
{
  "modelPath": "./resources/",
  "currentModel": null,
  "modelScale": 1.0,
  "modelOffsetX": 0.0,
  "modelOffsetY": -0.3,
  "bubbleColor": "#8b5cf6",
  "eyeTracking": true,
  "ignoreMouseEvents": false,
  "systemPrompt": "",
  "girlfriendName": "",
  "windowWidth": 500,
  "windowHeight": 800,
  "aiProvider": {
    "type": "ollama",
    "apiUrl": "http://localhost:11434",
    "apiKey": "",
    "chatModel": "qwen3.5:9b",
    "embeddingModel": "nomic-embed-text-v2-moe:latest"
  }
}
```

---

## 📝 开发命令

```bash
# 前端开发
npm run dev

# 构建前端
npm run build

# Electron 开发模式
npm run electron:dev

# 构建生产版本
npm run electron:build
```

---

## 📜 更新日志

### 2026-04-22 - Phase 6 桌面交互增强

- ✅ 鼠标穿透功能 - 右键菜单、托盘菜单均可开启/关闭
- ✅ 原生右键菜单 - 使用 Electron 原生弹出菜单，不受窗口限制
- ✅ 独立设置窗口 - 设置面板在屏幕中央独立弹出
- ✅ 记忆提取增强 - 支持间接表达理解（如"我天天听XX"→喜好记忆）
- ✅ 主动提问优化 - 问题风格更自然可爱，开放式提问
- ✅ shouldExtract 优化 - 正则匹配扩展，支持更多口语表达
- ✅ 快速启动脚本 - start.bat 自动切换 Node 版本
- ✅ 状态同步 - 右键菜单、托盘菜单、设置窗口状态实时同步
- ✅ 调试工具挂载 - proactiveEngine、memoryExtractor、memoryClient 挂载到 window

### 2026-04-22 - Phase 5 云端模型支持

- ✅ AI Provider 架构 - 统一接口支持多种模型服务
- ✅ OpenAI API 支持 - 兼容 OpenAI 格式的云端模型
- ✅ 设置面板集成 - 可视化配置本地/云端模型
- ✅ 向量嵌入统一 - embeddingService 支持云端模型

### 2026-04-21 - 窗口调整 & 系统托盘

- ✅ 窗口大小可调整（300×500 ~ 800×1200）
- ✅ 系统托盘功能
- ✅ 事件冒泡修复

### 2026-04-13 - Phase 4 记忆管理界面

- ✅ 记忆管理面板
- ✅ 主动提问引擎
- ✅ 向量去重功能（相似度 1.000）

### 2026-04-12 - Phase 1-3 记忆系统

- ✅ 记忆存储与检索
- ✅ 智能记忆提取
- ✅ 记忆去重与合并

### 2026-04-11 - 初始版本

- ✅ Ollama 集成与流式响应
- ✅ 气泡对话系统
- ✅ 自定义角色设定

---

## ⚠️ 注意事项

1. **Node.js 版本** - 需要 Node.js 18+，推荐使用 nvm 管理版本
2. **Live2D SDK 许可** - 请遵守 Live2D Cubism SDK 的许可协议
3. **模型格式** - 仅支持 Live2D Cubism 3.0+ 格式（.moc3）
4. **资源路径** - 模型资源需放在 `public/resources/` 目录
5. **模型文件** - 请勿修改 `*.model3.json`、`*.motion3.json` 等模型资源文件
6. **显存要求** - 9b 模型约需 6-7 GB 显存，可选择更小模型

---

## 📄 许可证

[MIT License](LICENSE)

---

<div align="center">

如果这个项目对你有帮助，欢迎 ⭐ Star 支持一下！

</div>
