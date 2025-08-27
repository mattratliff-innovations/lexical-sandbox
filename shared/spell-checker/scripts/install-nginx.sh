#!/bin/bash

# Install nginx for different operating systems

echo "📥 nginx Installation Guide"
echo "==========================="
echo ""

# Detect operating system
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "🖥️  Detected OS: $OS"
echo ""

case $OS in
    "mac")
        echo "🍎 macOS Installation:"
        echo ""
        
        # Check if Homebrew is available
        if command -v brew &> /dev/null; then
            echo "✅ Homebrew detected!"
            echo ""
            echo "🚀 Installing nginx..."
            read -p "Install nginx via Homebrew? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                brew install nginx
                echo ""
                echo "✅ nginx installed!"
                echo "📋 nginx info:"
                echo "   Version: $(nginx -v 2>&1)"
                echo "   Config: /opt/homebrew/etc/nginx/nginx.conf"
                echo "   Logs: /opt/homebrew/var/log/nginx/"
                echo ""
                echo "🚀 You can now run: ./start-nginx.sh"
            fi
        else
            echo "❌ Homebrew not found!"
            echo ""
            echo "Install Homebrew first:"
            echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
            echo ""
            echo "Then install nginx:"
            echo "  brew install nginx"
        fi
        ;;
        
    "linux")
        echo "🐧 Linux Installation:"
        echo ""
        
        # Try to detect Linux distribution
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            echo "🔍 Detected: $NAME"
            echo ""
            
            case $ID in
                ubuntu|debian)
                    echo "📦 Ubuntu/Debian installation:"
                    echo "  sudo apt update"
                    echo "  sudo apt install nginx"
                    echo ""
                    read -p "Install nginx now? (y/n): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        sudo apt update
                        sudo apt install nginx -y
                        echo ""
                        echo "✅ nginx installed!"
                        nginx -v
                        echo ""
                        echo "🚀 You can now run: ./start-nginx.sh"
                    fi
                    ;;
                    
                fedora|centos|rhel)
                    echo "📦 Fedora/CentOS/RHEL installation:"
                    echo "  sudo dnf install nginx"
                    echo ""
                    read -p "Install nginx now? (y/n): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        sudo dnf install nginx -y
                        echo ""
                        echo "✅ nginx installed!"
                        nginx -v
                        echo ""
                        echo "🚀 You can now run: ./start-nginx.sh"
                    fi
                    ;;
                    
                arch|manjaro)
                    echo "📦 Arch Linux installation:"
                    echo "  sudo pacman -S nginx"
                    echo ""
                    read -p "Install nginx now? (y/n): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        sudo pacman -S nginx --noconfirm
                        echo ""
                        echo "✅ nginx installed!"
                        nginx -v
                        echo ""
                        echo "🚀 You can now run: ./start-nginx.sh"
                    fi
                    ;;
                    
                *)
                    echo "❓ Unsupported Linux distribution"
                    echo "Try installing nginx using your package manager:"
                    echo "  sudo apt install nginx      # Debian/Ubuntu"
                    echo "  sudo dnf install nginx      # Fedora/RHEL"
                    echo "  sudo pacman -S nginx        # Arch Linux"
                    echo "  sudo zypper install nginx   # openSUSE"
                    ;;
            esac
        else
            echo "❓ Unknown Linux distribution"
            echo "Try installing nginx using your package manager"
        fi
        ;;
        
    "windows")
        echo "🪟 Windows Installation:"
        echo ""
        echo "Option 1 - Download from nginx.org:"
        echo "  1. Go to: http://nginx.org/en/download.html"
        echo "  2. Download Windows version"
        echo "  3. Extract to C:\\nginx"
        echo "  4. Run from Command Prompt as Administrator"
        echo ""
        echo "Option 2 - Using Chocolatey:"
        echo "  choco install nginx"
        echo ""
        echo "Option 3 - Using Scoop:"
        echo "  scoop install nginx"
        echo ""
        echo "⚠️  Note: Windows setup is more complex."
        echo "Consider using WSL (Windows Subsystem for Linux) for easier setup."
        ;;
        
    *)
        echo "❓ Unknown operating system"
        echo "Please install nginx manually from: http://nginx.org/"
        ;;
esac

echo ""
echo "🔧 After Installation:"
echo "====================="
echo ""
echo "1️⃣  Verify nginx is installed:"
echo "   nginx -v"
echo ""
echo "2️⃣  Create nginx configuration (if not exists):"
echo "   mkdir -p nginx"
echo "   # Copy the nginx.conf file from the project artifacts"
echo ""
echo "3️⃣  Start the nginx proxy:"
echo "   ./start-nginx.sh"
echo ""
echo "4️⃣  Test authentication:"
echo "   ./complete-auth-test.sh"

# Check if nginx was successfully installed
echo ""
if command -v nginx &> /dev/null; then
    echo "✅ nginx is now available!"
    echo "📋 Version: $(nginx -v 2>&1)"
    echo ""
    echo "🚀 Next step: ./start-nginx.sh"
else
    echo "❌ nginx installation may have failed"
    echo "💡 Try installing manually or check error messages above"
fi