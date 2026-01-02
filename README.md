# DGUI - Docker Registry Web Client

一个简洁的私有 Docker Registry Web 管理界面。


## 功能特性

- 🔐 **用户认证** - JWT 登录认证，首次启动自动创建管理员账户
- 🗂️ **多仓库管理** - 支持配置多个 Registry，一键切换
- 📦 **镜像浏览** - 分页浏览所有镜像仓库，支持搜索
- 🏷️ **标签管理** - 查看镜像所有标签，支持删除
- 📋 **详细信息** - 展示镜像层、构建历史、环境变量等
- 📝 **Pull 命令** - 一键复制 Docker Pull 命令
- 🌙 **深色模式** - 支持亮色/暗色主题切换
- 🔗 **URL 路由** - 支持页面刷新保持状态

## 部署

### Docker Compose（推荐）

```yaml
services:
  dgui:
    image: dgui:latest
    container_name: dgui
    restart: always
    ports:
      - "5008:5008"
    environment:
      - ADMIN_USER=admin        # 管理员用户名
      - ADMIN_PASS=admin123     # 管理员密码
      - JWT_SECRET=your-secret  # JWT 密钥（生产环境请修改）
    volumes:
      - ./data:/app/data        # 数据持久化
```

```bash
docker-compose up -d
```

### Docker 运行

```bash
docker run -d \
  --name dgui \
  -p 5008:5008 \
  -e ADMIN_USER=admin \
  -e ADMIN_PASS=admin123 \
  -e JWT_SECRET=your-secret \
  -v ./data:/app/data \
  dgui:latest
```

### 手动构建

```bash
# 构建镜像
docker build -t dgui:latest .

# 运行
docker run -d -p 5008:5008 -v ./data:/app/data dgui:latest
```

部署完成后访问 `http://localhost:5008`。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ADMIN_USER` | 管理员用户名 | `admin` |
| `ADMIN_PASS` | 管理员密码 | `admin123` |
| `JWT_SECRET` | JWT 签名密钥 | `dgui-secret-key` |
| `PORT` | 服务端口 | `5008` |

## License

MIT
