---
name: browser-testing
description: Use agent-browser CLI for UI testing - screenshots, element interaction, visual verification
---

# Browser Testing with agent-browser

> **何时使用**: 需要测试 UI、截图验证、或进行浏览器自动化操作时

## 安装状态
已全局安装: `npm install -g agent-browser`

## 核心命令

### 打开页面
```bash
agent-browser open http://localhost:6889
```

### 截图
```bash
agent-browser screenshot /tmp/screenshot.png
# 全页面截图
agent-browser screenshot /tmp/full.png --full
```

### 获取可交互元素 (最常用)
```bash
agent-browser snapshot -i
```
输出示例：
```
- button "提交" [ref=e1]
- textbox "用户名" [ref=e2]
- link "登录" [ref=e3]
```

### 使用 ref 操作元素
```bash
# 点击
agent-browser click @e1

# 输入文本
agent-browser fill @e2 "我的内容"

# 双击
agent-browser dblclick @e3
```

### 获取信息
```bash
# 获取文本
agent-browser get text ".selector"

# 获取页面标题
agent-browser get title

# 获取当前 URL
agent-browser get url
```

### 等待
```bash
# 等待元素可见
agent-browser wait ".loading"

# 等待指定时间 (毫秒)
agent-browser wait 2000

# 等待文本出现
agent-browser wait --text "加载完成"
```

### 关闭浏览器
```bash
agent-browser close
```

## 典型工作流

```bash
# 1. 打开页面
agent-browser open http://localhost:6889

# 2. 等待加载
agent-browser wait 2000

# 3. 截图确认状态
agent-browser screenshot /tmp/before.png

# 4. 获取元素列表
agent-browser snapshot -i

# 5. 点击某个按钮
agent-browser click @e5

# 6. 再次截图确认
agent-browser screenshot /tmp/after.png

# 7. 完成后关闭
agent-browser close
```

## 对比 browser_subagent

| 功能 | agent-browser | browser_subagent |
|------|---------------|------------------|
| 速度 | ⚡ 快 (直接 CLI) | 慢 (需要启动子代理) |
| 控制精度 | 高 (逐条命令) | 中 (描述性指令) |
| 截图 | 直接保存到文件 | 需要等待返回 |
| 元素定位 | ref 系统 (@e1) | CSS/像素坐标 |
| 推荐场景 | 精确测试 | 复杂多步骤任务 |

## 注意事项

1. **先确保 dev server 运行**: `pnpm dev`
2. **截图放 /tmp**: 方便用 `view_file` 查看
3. **用 snapshot -i**: 比直接写 CSS 选择器更可靠
4. **记得 close**: 测试完关闭浏览器释放资源
