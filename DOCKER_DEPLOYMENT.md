# Fiction Creator Docker 部署指南

这个项目已经配置好了Docker部署，可以在DigitalOcean服务器上运行。

## 文件说明

- `Dockerfile` - Next.js应用的Docker镜像构建文件
- `docker-compose.yml` - 完整版本，包含MongoDB、Next.js应用和Nginx反向代理
- `docker-compose.simple.yml` - 简化版本，只包含MongoDB和Next.js应用
- `nginx.conf` - Nginx反向代理配置文件
- `env.example` - 环境变量示例文件
- `deploy.sh` - 自动部署脚本

## 快速部署

### 方法1: 使用自动部署脚本

1. 确保你有服务器的SSH访问权限
2. 运行部署脚本：
   ```bash
   ./deploy.sh
   ```

### 方法2: 手动部署

1. **准备服务器**
   ```bash
   # 连接到你的服务器
   ssh root@137.184.249.178
   
   # 安装Docker和Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # 安装Docker Compose
   curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

2. **上传项目文件**
   ```bash
   # 在本地项目目录
   tar -czf fiction-creator.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .
   scp fiction-creator.tar.gz root@137.184.249.178:/opt/
   ```

3. **在服务器上部署**
   ```bash
   # 在服务器上
   cd /opt
   mkdir -p fiction-creator
   cd fiction-creator
   tar -xzf ../fiction-creator.tar.gz
   
   # 设置环境变量
   cp env.example .env
   # 编辑 .env 文件，设置安全的密码
   nano .env
   
   # 启动服务
   docker-compose -f docker-compose.simple.yml up -d
   ```

## 环境变量配置

复制 `env.example` 到 `.env` 并修改以下变量：

```bash
# MongoDB密码 (重要: 请设置强密码)
MONGO_ROOT_PASSWORD=your_secure_password_here

# 应用URL
NEXT_PUBLIC_APP_URL=http://137.184.249.178:3000
```

## 服务管理

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新服务
docker-compose pull
docker-compose up -d
```

## 访问应用

部署完成后，你可以通过以下地址访问应用：
- 应用: http://137.184.249.178:3000
- MongoDB (如果需要): 137.184.249.178:27017

## 安全建议

1. **更改默认密码**: 确保在 `.env` 文件中设置强密码
2. **防火墙配置**: 只开放必要的端口 (80, 443, 3000)
3. **SSL证书**: 考虑使用Let's Encrypt为域名配置SSL证书
4. **定期备份**: 设置MongoDB数据的定期备份

## 故障排除

### 查看日志
```bash
docker-compose logs app
docker-compose logs mongodb
```

### 检查容器状态
```bash
docker-compose ps
docker stats
```

### 重新构建
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 数据库初始化

如果需要初始化数据库数据，可以：

1. 连接到MongoDB容器：
   ```bash
   docker exec -it fiction-creator-mongodb mongosh
   ```

2. 或者运行种子脚本：
   ```bash
   docker exec -it fiction-creator-app npm run seed
   ```
