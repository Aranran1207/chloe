# Chloe - Live2D Desktop Pet

一个基于 Electron、Vue3 和 TypeScript 的 Live2D 桌面宠物应用，已接入本地 Ollama 大模型。

## 功能特性

### 核心功能

- **Live2D 模型渲染** - 支持 Live2D Cubism 3.0+ 格式模型
- **模型切换** - 支持动态切换不同的 Live2D 模型
- **配置持久化** - 自动保存用户设置，下次启动自动恢复

### 交互功能

- **窗口拖动** - 可自由拖动窗口位置，拖动时显示炫酷边框效果
- **注视鼠标** - 模型眼睛跟随鼠标移动（全局追踪）
- **点击交互** - 点击模型头部触发表情，点击身体触发动作
- **双击对话** - 双击窗口任意位置弹出/隐藏输入框，与模型进行对话

### AI 对话系统

- **Ollama 集成** - 已接入本地 Ollama API，支持流式响应
- **思考气泡** - 发送消息时显示思考动画（表情符号循环切换）
- **流式输出** - AI 回复实时显示，无需等待完整响应
- **自定义角色** - 可自定义女友名字和角色设定（性格、说话风格等）
- **智能命名** - 名字为空时自动使用模型名称
- **聊天记录** - 控制台输出完整聊天记录和统计信息
- **动作触发** - AI 可以在回复中自动触发 Live2D 动作，让角色更加生动

### 气泡对话系统

- **毛玻璃效果** - 气泡采用毛玻璃背景，颜色追随用户自定义
- **Markdown 渲染** - 支持 **粗体**、*斜体*、`代码`、~~删除线~~ 和换行
- **滚动显示** - 内容过长时自动滚动，顶部旧内容渐变淡出
- **向上飘入** - 气泡从底部向上飘入动画
- **向上淡出** - 气泡消失时向上飘走并淡出
- **自动消失** - 根据文字长度自动计算消失时间

### 设置面板

- **模型路径** - 自定义模型文件夹路径
- **缩放比例** - 调整模型大小（0.5x - 2.0x）
- **位置偏移** - 调整模型水平和垂直位置
- **气泡颜色** - 自定义气泡和发送按钮颜色（毛玻璃效果，15% 不透明度）
- **女友名字** - 给女友起个名字
- **角色设定** - 自定义角色的性格、说话风格等
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
- **Ollama** - 本地大模型推理引擎

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
│   │   ├── ThinkingBubble.vue # 思考气泡
│   │   └── LoadingSpinner.vue # 加载动画
│   ├── framework/       # Live2D Framework SDK
│   ├── lib/             # 自定义封装库
│   │   ├── chloe.ts          # Live2D 控制器
│   │   ├── model.ts          # 模型管理
│   │   ├── chatService.ts    # Ollama 对话服务
│   │   ├── motionManager.ts  # 动作管理器
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

### 2. 安装并启动 Ollama

```bash
# 安装 Ollama（如果未安装）
# 访问 https://ollama.ai 下载

# 拉取模型
ollama pull qwen3.5:9b

# 启动 Ollama 服务（通常自动启动）
ollama serve
```

### 3. 添加 Live2D 模型

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

### 4. 开发模式运行

```bash
npm run electron:dev
```

### 5. 构建生产版本

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
  "eyeTracking": true,
  "systemPrompt": "",
  "girlfriendName": ""
}
```

## Ollama 配置

### 支持的模型

在 `src/lib/chatService.ts` 中修改模型配置：

```typescript
const OLLAMA_MODEL = 'qwen3.5:9b';  // 可改为其他模型
```

推荐模型：

- `qwen3.5:9b` - 约 6-7 GB 显存，效果较好
- `qwen2.5:7b` - 约 4-5 GB 显存，平衡选择
- `qwen2.5:3b` - 约 2-3 GB 显存，低配置首选

### 显存优化

已配置以下参数优化显存使用：

```typescript
const OLLAMA_OPTIONS = {
  num_ctx: 4096,      // 上下文长度
  keep_alive: "1m"    // 对话结束后 1 分钟卸载模型
};
```

### 禁用思考模式

对于 qwen3.5 等支持思考模式的模型，已添加 `think: false` 参数禁用思考模式，大幅提升响应速度。

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

### 调试对话

打开浏览器开发者工具（F12），在 Console 面板中可以看到：

- 请求发送日志
- 首个 Token 延迟
- 完整聊天记录
- 响应统计信息

## 自定义对话服务

对话服务位于 `src/lib/chatService.ts`，可以修改以下函数接入其他 API：

```typescript
// 修改默认 prompt
const buildDefaultPrompt = (name: string, modelName?: string): string => {
  const displayName = name || modelName || 'Chloe';
  return `你是${displayName}，我的女友。请用可爱的语气回复，称呼我为"亲爱的"。`;
};

// 修改 Ollama API 地址
const OLLAMA_API_URL = 'http://localhost:11434';

// 修改模型
const OLLAMA_MODEL = 'qwen3.5:9b';
```

## 注意事项

1. **Live2D SDK 许可** - 本项目使用 Live2D Cubism SDK，请遵守 Live2D 的许可协议
2. **模型格式** - 支持 Live2D Cubism 3.0+ 格式的模型（.moc3）
3. **资源路径** - 模型资源必须放在 `public/resources/` 目录下
4. **窗口尺寸** - 默认 500x800，可在 `electron/main.js` 中修改
5. **Ollama 服务** - 确保在使用前已启动 Ollama 服务
6. **显存要求** - 9b 模型需要约 6-7 GB 显存，可根据显卡配置选择更小的模型

## 后续开发计划 - AI 记忆系统

### 📋 开发路线图

#### Phase 1: 基础记忆存储 ✅ 已完成

- [x] 安装 better-sqlite3 依赖
- [x] 创建 `src/lib/memory/memoryTypes.ts` - 类型定义
- [x] 创建 `src/lib/memory/embeddingService.ts` - 向量嵌入服务
- [x] 创建 `src/lib/memory/memoryService.ts` - 记忆核心服务（SQLite）
- [x] 创建 `src/lib/memory/memoryIntegrator.ts` - 记忆整合器
- [x] 创建 `src/lib/memory/memoryClient.ts` - 前端记忆客户端
- [x] 修改 `electron/main.js` - 添加记忆数据库 IPC
- [x] 修改 `electron/preload.js` - 暴露记忆 API
- [x] 修改 `src/lib/chatService.ts` - 集成记忆检索
- [x] 测试：记忆存储、检索、相似度搜索

#### Phase 2: 智能记忆提取 ✅ 已完成

- [x] 创建 `src/lib/memory/memoryExtractor.ts` - AI 记忆提取器
- [x] 实现对话后自动提取记忆
- [x] 实现记忆去重和合并（向量相似度 + 文本相似度）
- [x] 实现记忆重要性评估
- [x] 添加清空记忆功能到设置面板
- [x] 测试：自动提取准确性 ✅ 向量相似度 1.000

#### Phase 3: 主动提问引擎 ✅ 已完成

- [x] 创建 `src/lib/memory/proactiveEngine.ts` - 主动提问引擎
- [x] 实现记忆缺口分析
- [x] 实现智能问题生成
- [x] 添加定时触发机制
- [x] 集成到 Live2DView\.vue
- [ ] 测试：主动提问自然度

#### Phase 4: 记忆管理界面 ✅ 已完成

- [x] 创建 `src/components/MemoryPanel.vue` - 记忆管理面板
- [x] 实现记忆列表展示
- [x] 实现记忆编辑/删除
- [x] 实现记忆分类筛选
- [x] 添加记忆统计可视化
- [x] 集成到右键菜单

### 📁 需要创建的文件

```
src/lib/memory/
├── memoryTypes.ts        # 类型定义（Memory, MemoryCategory 等）
├── embeddingService.ts   # 向量嵌入服务（调用 nomic-embed-text）
├── memoryService.ts      # 核心服务（SQLite CRUD + 向量搜索）
├── memoryExtractor.ts    # AI 记忆提取器
├── memoryIntegrator.ts   # 记忆整合到 Prompt
└── proactiveEngine.ts    # 主动提问引擎

数据存储：
../chloe-memory.db        # SQLite 数据库文件
```

### 🔧 需要修改的文件

| 文件                              | 修改内容                 |
| ------------------------------- | -------------------- |
| `package.json`                  | 添加 better-sqlite3 依赖 |
| `src/lib/chatService.ts`        | 集成记忆检索和提取            |
| `src/components/Live2DView.vue` | 添加主动提问触发             |
| `electron/main.js`              | 添加记忆数据库 IPC 处理       |
| `electron/preload.js`           | 暴露记忆相关 API           |

### 🧠 记忆系统架构

```
用户对话 → ChatService → AI 回复
    │                        │
    ▼                        ▼
MemoryExtractor        MemoryIntegrator
    │                        ▲
    ▼                        │
MemoryService (SQLite + 向量索引)
    │
    ▼
EmbeddingService (nomic-embed-text)
```

### 📊 SQLite 数据库结构

```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  importance INTEGER DEFAULT 5,
  confidence REAL DEFAULT 0.8,
  embedding BLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME,
  access_count INTEGER DEFAULT 0,
  tags TEXT,
  source TEXT
);
```

### ⚙️ 依赖安装

```bash
# 安装 SQLite 依赖
npm install better-sqlite3
npm install @types/better-sqlite3 -D
```

### 🎯 预期效果

1. **被动记忆**：对话中自动记录用户喜好、个人信息
2. **智能检索**：根据对话上下文检索相关记忆
3. **主动提问**：发现信息缺口时主动询问用户
4. **记忆衰减**：长期未访问的记忆自动降低权重

***

## 更新日志

### 2026-04-13 🎉 **Phase 3 完成！主动提问引擎上线！**

- ✅ **创建主动提问引擎** - `proactiveEngine.ts` 核心文件
- ✅ **记忆缺口分析** - 自动检测缺少的关键信息（个人信息、喜好、爱好、目标等）
- ✅ **智能问题生成** - 使用 AI 将问题改写得更加自然可爱
- ✅ **定时触发机制** - 每 30 分钟自动检查是否需要提问
- ✅ **防重复提问** - 记录已问过的问题，避免重复
- ✅ **会话管理** - 每会话最多 3 次主动提问，用户对话后重置计数

### 2026-04-13 🎉 **历史性突破！向量去重功能完美运行！**

- ✅ **修复 Buffer 转换问题** - 解决了 `Float64Array` 读取 Buffer 的关键 bug
  - 问题：`new Float64Array(buffer)` 得到的是字节值 `[0, 0, 0, 192, 247]`
  - 解决：`new Float64Array(buffer.buffer)` 正确获取底层 ArrayBuffer
- ✅ **向量相似度计算成功** - 相似度从 0.000 → 1.000 🚀
- ✅ **记忆去重功能完美运行** - 相同内容自动跳过，不再重复添加
- ✅ **设置面板新增记忆管理** - 显示记忆数量 + 清空记忆按钮
- ✅ **文本相似度算法升级** - 从 Jaccard 升级为编辑距离（Levenshtein Distance）

### 2026-04-12

- ✅ **Phase 1 完成** - 记忆系统基础架构已就绪！
  - ✅ 新增记忆提取功能，自动从对话中提取用户信息
  - ✅ 新增记忆提取器 `memoryExtractor.ts`
  - ✅ 集成记忆检索到 `chatService.ts`
- ✅ **Phase 2 完成** - 记忆自动提取功能已上线！
  - ✅ 新增 `memoryExtractor.ts` - AI 自动从对话中提取记忆
  - ✅ 对话完成后自动调用 Ollama 提取记忆
  - ✅ 记忆去重和合并功能
  - ✅ 记忆重要性评估功能

### 2026-04-11

- ✅ 接入本地 Ollama API，支持流式响应
- ✅ 添加思考气泡组件，显示思考动画
- ✅ 气泡改为从底部向上飘入，消失时向上淡出
- ✅ 气泡采用毛玻璃效果，颜色追随用户自定义
- ✅ 添加女友名字设置，名字为空时使用模型名称
- ✅ 添加角色设定（systemPrompt）自定义功能
- ✅ 气泡支持 Markdown 渲染（粗体、斜体、代码、删除线)
- ✅ 气泡内容过长时自动滚动，顶部渐变淡出
- ✅ 双击窗口任意位置切换输入框显示/隐藏
- ✅ 优化 Ollama 显存使用（减小上下文、设置 keep\_alive)
- ✅ 禁用 qwen3.5 思考模式，大幅提升响应速度
- ✅ 控制台输出完整聊天记录和统计信息

## 许可证

MIT
