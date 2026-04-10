# Chloe 项目开发规则

## Node.js 版本管理

项目使用 **nvm** (Node Version Manager) 管理 Node.js 版本。

### 推荐 Node.js 版本
- 当前使用版本: Node.js v20.x

### nvm 常用命令

```bash
# 列出已安装的 Node.js 版本
nvm list

# 安装指定版本的 Node.js
nvm install 20

# 使用指定版本的 Node.js
nvm use 20

# 设置默认 Node.js 版本
nvm alias default 20
```

## 构建命令

```bash
# 开发模式
npm run dev

# 构建项目（跳过类型检查）
npm run build

# 类型检查
npm run type-check

# 预览构建结果
npm run preview

# Electron 开发模式
npm run electron:dev

# Electron 打包
npm run electron:build
```

## Git 忽略规则

已在 `.gitignore` 中配置以下文件/目录不被追踪：
- `node_modules/` - 依赖包
- `dist/` - 构建输出
- `release/` - Electron 打包输出
- `.idea/` / `.vscode/` - IDE 配置
- `*.log` - 日志文件
- `.env.local` - 本地环境变量

## 注意事项

1. 构建时 `vue-tsc` 可能会出现兼容性问题，已将类型检查分离到单独的 `type-check` 命令中
2. 模型资源位于 `public/resources/` 目录
3. Electron 主进程代码位于 `electron/` 目录
