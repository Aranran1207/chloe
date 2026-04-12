# 项目开发规则

## 文件修改限制

**绝对不要修改以下类型的文件：**
- 模型配置文件（`*.model3.json`）
- 动作文件（`*.motion3.json`）
- 表情文件（`*.exp3.json`）
- 物理文件（`*.physics3.json`）
- Pose 文件（`*.pose3.json`）
- 用户数据文件（`*.userdata3.json`）
- 任何 `public/resources/` 目录下的资源文件

这些文件是用户提供的 Live2D 模型资源，不应该被代码助手修改。
