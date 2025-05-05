# Building the Stitching Unit ERP as a Standalone Application

This document explains how to package the Stitching Unit ERP application as a standalone executable for Windows, macOS, or Linux.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (usually installed with Node.js)
- For Windows builds: Windows OS
- For macOS builds: macOS OS
- For Linux builds: Linux OS with required dependencies

## Building the Application

### Windows

1. Double-click on the `build-windows.bat` file or run it from the command prompt.
2. Wait for the build process to complete.
3. The packaged application will be available in the `release` directory.

### macOS & Linux

1. Open a terminal in the project directory.
2. Make the build script executable if it isn't already:
   ```
   chmod +x build-unix.sh
   ```
3. Run the build script:
   ```
   ./build-unix.sh
   ```
4. Wait for the build process to complete.
5. The packaged application will be available in the `release` directory.

## Build Output

After a successful build, you'll find the following in the `release` directory:

- **Windows:** Installer (.exe) and unpacked application (.exe)
- **macOS:** Application bundle (.app) and/or disk image (.dmg)
- **Linux:** AppImage (.AppImage) and/or Debian package (.deb)

## Running the Packaged Application

### Windows
- Run the installer (.exe) to install the application
- Launch from the Start Menu or Desktop shortcut

### macOS
- Mount the disk image (.dmg)
- Drag the application to the Applications folder
- Launch from the Applications folder

### Linux
- For AppImage: Make executable with `chmod +x filename.AppImage` and run
- For Deb: Install with `sudo dpkg -i filename.deb` or using your package manager

## Customization

The packaging process is controlled by:

1. `electron-builder.json` - Configuration for packaging options
2. `electron/main.js` - Electron main process code
3. `build-electron.js` - The build script

You can modify these files to customize the packaging process.

## Troubleshooting

If you encounter issues during the build process:

1. Make sure all dependencies are installed: `npm install`
2. Check that the correct Node.js version is installed
3. On Linux, ensure you have required dependencies for Electron Builder
4. Review error messages in the console output

For Linux systems, you might need additional dependencies:
```
sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
```