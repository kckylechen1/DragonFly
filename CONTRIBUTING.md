# 贡献指南

感谢您有兴趣为 DragonFly 项目做出贡献！

## 开发流程

### 1. Fork 并克隆

```bash
git clone https://github.com/YOUR_USERNAME/DragonFly.git
cd DragonFly
pnpm install
```

### 2. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 3. 开发与测试

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm check

# 代码格式化
pnpm format
```

### 4. 提交代码

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```bash
git commit -m "feat: add new chart type"
git commit -m "fix: resolve theme switching bug"
git commit -m "docs: update README"
```

### 5. 提交 Pull Request

- 确保所有检查通过
- 描述清楚更改内容
- 关联相关 Issue

## 代码规范

- **TypeScript**: 所有代码必须有类型注解
- **ESLint**: 遵循项目配置的 lint 规则
- **Prettier**: 使用项目配置的格式化规则

## 问题反馈

发现 Bug 或有功能建议？请 [提交 Issue](https://github.com/kckylechen1/DragonFly/issues/new)。

---

再次感谢您的贡献！🙏
