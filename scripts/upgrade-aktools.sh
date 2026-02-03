#!/bin/bash
#
# AKTools 升级脚本
# 升级 AKShare 和 AKTools 到最新版本，并添加重试配置
#

set -e

echo "🚀 AKTools 升级工具"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查虚拟环境
if [ -d "$HOME/.aktools-env" ]; then
    echo -e "${GREEN}✓${NC} 找到虚拟环境: ~/.aktools-env"
    PYTHON_CMD="$HOME/.aktools-env/bin/python"
    PIP_CMD="$HOME/.aktools-env/bin/pip"
else
    echo -e "${YELLOW}⚠${NC} 虚拟环境不存在，需要创建"
    echo ""
    echo "创建虚拟环境..."
    python3 -m venv ~/.aktools-env
    PYTHON_CMD="$HOME/.aktools-env/bin/python"
    PIP_CMD="$HOME/.aktools-env/bin/pip"
    echo -e "${GREEN}✓${NC} 虚拟环境创建完成"
fi

echo ""
echo "📦 检查当前版本..."
CURRENT_AKSHARE=$($PYTHON_CMD -c "import akshare; print(akshare.__version__)" 2>/dev/null || echo "未安装")
CURRENT_AKTOOLS=$($PYTHON_CMD -c "import aktools; print(aktools.__version__)" 2>/dev/null || echo "未安装")

echo "   AKShare: $CURRENT_AKSHARE"
echo "   AKTools: $CURRENT_AKTOOLS"

echo ""
echo "⬆️  升级到最新版本..."
echo "   这可能需要几分钟..."
echo ""

# 升级 pip
$PIP_CMD install --upgrade pip -q

# 升级 AKShare 和 AKTools
$PIP_CMD install --upgrade akshare aktools -q

echo -e "${GREEN}✓${NC} 升级完成！"
echo ""

# 显示新版本
NEW_AKSHARE=$($PYTHON_CMD -c "import akshare; print(akshare.__version__)" 2>/dev/null || echo "未知")
NEW_AKTOOLS=$($PYTHON_CMD -c "import aktools; print(aktools.__version__)" 2>/dev/null || echo "未知")

echo "📊 版本对比:"
echo "   AKShare: $CURRENT_AKSHARE → ${GREEN}$NEW_AKSHARE${NC}"
echo "   AKTools: $CURRENT_AKTOOLS → ${GREEN}$NEW_AKTOOLS${NC}"

echo ""
echo "🔄 重启 AKTools 服务..."

# 停止现有服务
if [ -f "/Users/kckylechen/Desktop/DragonFly/aktools.pid" ]; then
    OLD_PID=$(cat /Users/kckylechen/Desktop/DragonFly/aktools.pid)
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "   停止现有服务 (PID: $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null || true
        sleep 2
    fi
fi

# 清除日志
> /Users/kckylechen/Desktop/DragonFly/aktools.log

# 启动新服务
cd /Users/kckylechen/Desktop/DragonFly
nohup $PYTHON_CMD -m aktools -P 8098 >> /Users/kckylechen/Desktop/DragonFly/aktools.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > /Users/kckylechen/Desktop/DragonFly/aktools.pid

echo "   等待服务启动..."
sleep 3

# 检查服务状态
if curl -s "http://127.0.0.1:8098/version" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} AKTools 服务启动成功!"
    echo "   PID: $NEW_PID"
    echo "   主页: http://127.0.0.1:8098/"
    curl -s "http://127.0.0.1:8098/version" | head -1
    echo ""
    echo -e "${GREEN}🎉 升级完成！${NC}"
else
    echo -e "${RED}✗${NC} 服务启动失败，查看日志:"
    echo "----------------------------------------"
    tail -20 /Users/kckylechen/Desktop/DragonFly/aktools.log
    echo "----------------------------------------"
    exit 1
fi
