#!/bin/bash

# Fiction Creator 部署脚本
# 用于在DigitalOcean服务器上部署项目

set -e

SERVER_IP="137.184.249.178"
SERVER_USER="root"  # 根据你的服务器用户调整
PROJECT_NAME="fiction-creator"
REMOTE_PATH="/opt/fiction-creator"

echo "🚀 开始部署 Fiction Creator 到 DigitalOcean 服务器..."

# 检查本地是否有必要的文件
echo "📋 检查本地文件..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ 错误: 找不到 Dockerfile"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: 找不到 docker-compose.yml"
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
    .

echo "✅ 部署包创建完成"

# 上传到服务器
echo "📤 上传文件到服务器..."
scp ${PROJECT_NAME}.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

# 在服务器上执行部署
echo "🔧 在服务器上执行部署..."
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    set -e
    
    echo "📁 创建项目目录..."
    sudo mkdir -p ${REMOTE_PATH}
    cd ${REMOTE_PATH}
    
    echo "📦 解压项目文件..."
    sudo tar -xzf /tmp/${PROJECT_NAME}.tar.gz
    
    echo "🔧 安装Docker和Docker Compose..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker \$USER
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    echo "🔐 设置环境变量..."
    if [ ! -f .env ]; then
        sudo cp env.example .env
        echo "⚠️  请编辑 .env 文件设置正确的密码"
    fi
    
    echo "🐳 构建和启动容器..."
    sudo docker-compose down || true
    sudo docker-compose build --no-cache
    sudo docker-compose up -d
    
    echo "⏳ 等待服务启动..."
    sleep 30
    
    echo "🔍 检查服务状态..."
    sudo docker-compose ps
    
    echo "🧹 清理临时文件..."
    rm -f /tmp/${PROJECT_NAME}.tar.gz
    
    echo "✅ 部署完成!"
    echo "🌐 应用访问地址: http://${SERVER_IP}:3000"
EOF

# 清理本地临时文件
echo "🧹 清理本地临时文件..."
rm -f ${PROJECT_NAME}.tar.gz

echo "🎉 部署完成!"
echo "🌐 你的应用现在可以通过 http://${SERVER_IP}:3000 访问"
echo "📊 查看日志: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && sudo docker-compose logs -f'"
echo "🛠️  管理服务: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && sudo docker-compose [start|stop|restart]'"
