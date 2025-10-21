#!/bin/bash

# Fiction Creator 简化部署脚本
# 用于在DigitalOcean服务器上部署项目

set -e

SERVER_IP="137.184.249.178"
SERVER_USER="root"
PROJECT_NAME="fiction-creator"
REMOTE_PATH="/opt/fiction-creator"

echo "🚀 开始部署 Fiction Creator 到 DigitalOcean 服务器..."

# 检查本地是否有必要的文件
echo "📋 检查本地文件..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ 错误: 找不到 Dockerfile"
    exit 1
fi

if [ ! -f "docker-compose.simple.yml" ]; then
    echo "❌ 错误: 找不到 docker-compose.simple.yml"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 错误: 找不到 package.json"
    exit 1
fi

echo "✅ 本地文件检查完成"

# 创建部署包
echo "📦 创建部署包..."
tar -czf ${PROJECT_NAME}.tar.gz \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    --exclude=*.log \
    --exclude=.env.local \
    --exclude=.env \
    --exclude=.env.production \
    .

echo "✅ 部署包创建完成: ${PROJECT_NAME}.tar.gz"

echo ""
echo "📋 接下来的步骤："
echo "1. 将 ${PROJECT_NAME}.tar.gz 上传到服务器"
echo "2. 在服务器上解压并运行以下命令："
echo ""
echo "   # 上传文件到服务器"
echo "   scp ${PROJECT_NAME}.tar.gz root@${SERVER_IP}:/tmp/"
echo ""
echo "   # 连接到服务器"
echo "   ssh root@${SERVER_IP}"
echo ""
echo "   # 在服务器上执行以下命令："
echo "   cd /opt"
echo "   mkdir -p ${PROJECT_NAME}"
echo "   cd ${PROJECT_NAME}"
echo "   tar -xzf /tmp/${PROJECT_NAME}.tar.gz"
echo ""
echo "   # 安装Docker (如果未安装)"
echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
echo "   sh get-docker.sh"
echo ""
echo "   # 安装Docker Compose"
echo "   curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
echo "   chmod +x /usr/local/bin/docker-compose"
echo ""
echo "   # 设置环境变量"
echo "   echo 'MONGO_ROOT_PASSWORD=FictionCreator2024!' > .env"
echo "   echo 'NODE_ENV=production' >> .env"
echo "   echo 'NEXT_PUBLIC_APP_URL=http://${SERVER_IP}:3000' >> .env"
echo ""
echo "   # 启动服务"
echo "   docker-compose -f docker-compose.simple.yml up -d"
echo ""
echo "   # 检查服务状态"
echo "   docker-compose ps"
echo ""
echo "🌐 部署完成后访问: http://${SERVER_IP}:3000"
echo ""
echo "📊 查看日志: docker-compose logs -f"
echo "🛠️  管理服务: docker-compose [start|stop|restart]"
