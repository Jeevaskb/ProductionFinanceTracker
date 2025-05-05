#!/bin/bash

echo "Building Stitching Unit ERP application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Determine platform
PLATFORM=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS platform"
    PLATFORM="--mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux platform"
    PLATFORM="--linux"
else
    echo "Unknown platform, building without platform-specific options"
fi

# Run the build script
node build-electron.js $PLATFORM

if [ $? -eq 0 ]; then
    echo ""
    echo "Build completed successfully!"
    echo "The packaged application can be found in the 'release' directory."
else
    echo ""
    echo "Build failed with error code $?"
fi