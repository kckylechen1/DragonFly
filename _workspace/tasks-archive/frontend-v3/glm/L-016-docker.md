# L-016: Docker 配置

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 目标
- [ ] 创建 `Dockerfile`
- [ ] 创建 `docker-compose.yml`
- [ ] 实现多阶段构建生产环境镜像

---

## 步骤

### Step 1: 创建 Dockerfile

```dockerfile
# /Users/kckylechen/Desktop/DragonFly/Dockerfile

# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 拷贝依赖定义
COPY package.json pnpm-lock.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 拷贝源代码
COPY . .

# 构建前端 (Next.js)
RUN cd client && pnpm build

# 构建后端 (如果需要编译)
# RUN cd server && pnpm build

# --- Runtime Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 拷贝运行时需要的文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/package.json ./client/package.json
COPY --from=builder /app/server ./server

# 运行时依赖
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

EXPOSE 3000 5000

CMD ["pnpm", "start"]
```

### Step 2: 创建 docker-compose.yml

```yaml
# /Users/kckylechen/Desktop/DragonFly/docker-compose.yml

version: '3.8'

services:
  dragonfly-app:
    build: .
    ports:
      - "3000:3000"
      - "5000:5000"
    environment:
      - DATABASE_URL=mysql://root:password@mysql:3306/dragonfly
      - JWT_SECRET=your-secret-key
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=dragonfly
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

---

## 验收标准

- [ ] `Dockerfile` 已创建，使用多阶段构建
- [ ] `docker-compose.yml` 包含应用和数据库服务
- [ ] `pnpm build` 在本地运行成功（作为构建前提）

---

## 产出文件

- `Dockerfile`
- `docker-compose.yml`
