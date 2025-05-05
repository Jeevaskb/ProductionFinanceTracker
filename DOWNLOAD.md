# Downloading and Installing the Stitching Unit ERP

This document provides simple instructions for downloading and installing the Stitching Unit ERP application on your computer.

## System Requirements

- Windows 10/11, macOS 10.13+, or Linux (Ubuntu 18.04+ recommended)
- At least 4GB RAM
- At least 500MB free disk space

## Installation Instructions

### Windows Users

1. **Download the installer**:
   - Locate the `Stitching-Unit-ERP-Setup-x.x.x.exe` file in the `release` folder
   - Copy this file to your computer

2. **Install the application**:
   - Double-click the installer file
   - Follow the on-screen instructions
   - Select your preferred installation location when prompted
   - Wait for the installation to complete

3. **Launch the application**:
   - Use the desktop shortcut or find the application in the Start menu
   - The application will open in a new window

### macOS Users

1. **Download the disk image**:
   - Locate the `Stitching-Unit-ERP-x.x.x.dmg` file in the `release` folder
   - Copy this file to your computer

2. **Install the application**:
   - Double-click the .dmg file to open it
   - Drag the application icon to the Applications folder
   - Eject the disk image

3. **Launch the application**:
   - Open the Applications folder
   - Double-click on Stitching Unit ERP
   - If prompted about security, go to System Preferences > Security & Privacy and allow the app

### Linux Users

1. **Download the AppImage or Deb package**:
   - Locate either `Stitching-Unit-ERP-x.x.x.AppImage` or `stitching-unit-erp_x.x.x_amd64.deb` in the `release` folder
   - Copy this file to your computer

2. **Install using AppImage**:
   - Make the AppImage executable:
     ```
     chmod +x Stitching-Unit-ERP-x.x.x.AppImage
     ```
   - Run the AppImage:
     ```
     ./Stitching-Unit-ERP-x.x.x.AppImage
     ```

3. **Install using Deb package**:
   - Open a terminal and navigate to the folder containing the .deb file
   - Run:
     ```
     sudo dpkg -i stitching-unit-erp_x.x.x_amd64.deb
     ```
   - Launch from your applications menu or run `stitching-unit-erp` in the terminal

## First-Time Setup

1. When you first open the application, it will create a new database in the user data folder
2. No additional configuration is needed - the application is ready to use
3. Your data files will be stored locally on your computer

## Troubleshooting

If you encounter issues:

- **Windows**: Try running the application as administrator
- **macOS**: Check if your macOS version is compatible
- **Linux**: Ensure you have the required dependencies installed

For further assistance, contact technical support.