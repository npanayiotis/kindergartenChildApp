#!/bin/bash

echo "🔧 Fixing Android SDK PATH for adb command"
echo "==========================================="

# Find Android SDK location
ANDROID_HOME=""

# Common locations for Android SDK on macOS
if [ -d "$HOME/Library/Android/sdk" ]; then
    ANDROID_HOME="$HOME/Library/Android/sdk"
elif [ -d "/usr/local/share/android-sdk" ]; then
    ANDROID_HOME="/usr/local/share/android-sdk"
elif [ -d "$HOME/Android/Sdk" ]; then
    ANDROID_HOME="$HOME/Android/Sdk"
fi

if [ -z "$ANDROID_HOME" ]; then
    echo "❌ Android SDK not found. Please install Android Studio first."
    echo "   Download from: https://developer.android.com/studio"
    exit 1
fi

echo "✅ Found Android SDK at: $ANDROID_HOME"

# Check if adb exists
if [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
    echo "✅ Found adb at: $ANDROID_HOME/platform-tools/adb"
else
    echo "❌ adb not found. Please install Android SDK Platform Tools"
    exit 1
fi

# Add to shell profile
SHELL_PROFILE=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_PROFILE="$HOME/.bash_profile"
else
    # Default to zsh (macOS default since Catalina)
    SHELL_PROFILE="$HOME/.zshrc"
fi

echo "📝 Adding Android SDK to $SHELL_PROFILE"

# Remove any existing Android SDK entries
if [ -f "$SHELL_PROFILE" ]; then
    # Create backup
    cp "$SHELL_PROFILE" "$SHELL_PROFILE.backup"
    
    # Remove old Android SDK entries
    grep -v "ANDROID_HOME\|android-sdk\|platform-tools" "$SHELL_PROFILE" > "$SHELL_PROFILE.tmp"
    mv "$SHELL_PROFILE.tmp" "$SHELL_PROFILE"
fi

# Add fresh Android SDK configuration
cat >> "$SHELL_PROFILE" << EOF

# Android SDK Configuration
export ANDROID_HOME=$ANDROID_HOME
export PATH=\$PATH:\$ANDROID_HOME/emulator
export PATH=\$PATH:\$ANDROID_HOME/platform-tools
export PATH=\$PATH:\$ANDROID_HOME/tools
export PATH=\$PATH:\$ANDROID_HOME/tools/bin
EOF

echo "✅ Android SDK added to $SHELL_PROFILE"

# Apply changes to current session
export ANDROID_HOME=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

echo ""
echo "🔄 Testing adb command..."
if command -v adb &> /dev/null; then
    echo "✅ adb command is now available!"
    echo "📱 adb version: $(adb version | head -n1)"
    
    echo ""
    echo "📱 Checking connected devices..."
    adb devices
    
    echo ""
    echo "🚀 Your app should now launch properly!"
    echo "   Run: npx react-native run-android"
    
else
    echo "❌ adb still not found. Please restart your terminal and try again."
    echo ""
    echo "🔄 Manual steps:"
    echo "1. Close this terminal"
    echo "2. Open a new terminal"
    echo "3. Run: npx react-native run-android"
fi

echo ""
echo "==========================================="