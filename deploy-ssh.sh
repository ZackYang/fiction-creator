#!/bin/bash

# Fiction Creator SSH Git部署脚本
# 使用SSH方式从GitHub仓库部署

set -e

SERVER_IP="137.184.249.178"
SERVER_USER="root"
PROJECT_NAME="fiction-creator"
REMOTE_PATH="/opt/fiction-creator"
GIT_REPO="git@github.com:ZackYang/fiction-creator.git"

echo "🚀 开始使用SSH方式部署 Fiction Creator..."

echo "📋 检查SSH连接..."
ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo 'SSH连接正常'"

echo "🔧 在服务器上执行部署..."
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    set -e
    
    echo "📁 备份现有项目..."
    if [ -d "${REMOTE_PATH}" ]; then
        mv ${REMOTE_PATH} ${REMOTE_PATH}.backup.\$(date +%Y%m%d_%H%M%S)
    fi
    
    echo "📁 创建新项目目录..."
    mkdir -p ${REMOTE_PATH}
    cd ${REMOTE_PATH}
    
    echo "🔧 确保必要工具已安装..."
    # 安装Git (如果未安装)
    if ! command -v git &> /dev/null; then
        apt-get update && apt-get install -y git
    fi
    
    # 安装Docker (如果未安装)
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
    fi
    
    # 安装Docker Compose (如果未安装)
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    echo "📥 使用SSH克隆代码仓库..."
    git clone ${GIT_REPO} .
    
    echo "🔐 设置环境变量..."
    cat > .env << 'ENVEOF'
MONGO_ROOT_PASSWORD=FictionCreator2024!
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://137.184.249.178:3000
ENVEOF
    
    echo "🐳 停止现有容器..."
    docker-compose -f docker-compose.simple.yml down || true
    
    echo "🐳 构建和启动新容器..."
    docker-compose -f docker-compose.simple.yml up -d --build
    
    echo "⏳ 等待服务启动..."
    sleep 30
    
    echo "🔍 检查服务状态..."
    docker-compose -f docker-compose.simple.yml ps
    
    echo "✅ SSH部署完成!"
    echo "🌐 应用访问地址: http://${SERVER_IP}:3000"
EOF

echo "🎉 SSH部署完成!"
echo "🌐 你的应用现在可以通过 http://${SERVER_IP}:3000 访问"
echo "📊 查看日志: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker-compose -f docker-compose.simple.yml logs -f'"
echo "🛠️  管理服务: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker-compose -f docker-compose.simple.yml [start|stop|restart]'"
echo "🔄 更新代码: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && git pull && docker-compose -f docker-compose.simple.yml up -d --build'"
