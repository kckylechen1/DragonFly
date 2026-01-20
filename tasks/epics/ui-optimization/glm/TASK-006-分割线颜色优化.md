# TASK-006: 优化分割线颜色

## 负责 Agent: 🔵 GLM

## 任务说明

优化边框和分割线的颜色，使其更柔和、不那么突兀。

## 涉及文件

仅修改 CSS 变量：`client/src/index.css`

## 修改内容

在 `:root` 或暗色主题中，找到边框颜色变量并调整：

```css
/* 当前可能的变量 */
--border: xxx;
--color-border-light: #efefef;
--color-border-base: #e5e5e5;

/* 目标：使边框更柔和 */
/* 浅色模式：使用更浅的灰色 */
/* 暗色模式：使用更深的灰色，避免高对比 */
```

## 具体步骤

1. 打开 `client/src/index.css`
2. 找到边框颜色相关的 CSS 变量
3. 调整颜色值，使其更柔和
4. 验证变更

## 验证

运行 `npm run dev`，检查：
- [ ] 边框线条不那么突兀
- [ ] 浅色/暗色模式都正常

## ⚠️ 限制

- **只修改 index.css 文件**
- **只改 CSS 变量值**
- **不要改任何组件代码**

## 回滚

```bash
git checkout client/src/index.css
```
