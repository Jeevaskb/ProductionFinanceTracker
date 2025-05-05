/**
 * Build script for creating a standalone Electron application
 * This script will:
 * 1. Build the frontend and backend
 * 2. Package using electron-builder
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to run a command and return a promise
const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
        return;
      }
      resolve();
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
};

// Build frontend with Vite
const buildFrontend = async () => {
  console.log('Building frontend...');
  await runCommand('npx', ['vite', 'build']);
  console.log('Frontend build complete.');
};

// Build backend with esbuild
const buildBackend = async () => {
  console.log('Building backend...');
  await runCommand('npx', [
    'esbuild', 
    'server/index.ts', 
    '--platform=node', 
    '--packages=external', 
    '--bundle', 
    '--format=esm', 
    '--outdir=dist'
  ]);
  console.log('Backend build complete.');
};

// Package with electron-builder
const packageApp = async (platform = null) => {
  console.log('Packaging application...');
  
  const args = ['electron-builder', 'build', '--publish', 'never'];
  
  if (platform) {
    args.push(`--${platform}`);
  }
  
  await runCommand('npx', args);
  console.log('Application packaging complete.');
};

// Copy excel data files to dist directory
const copyDataFiles = async () => {
  console.log('Copying data files...');
  
  // Create dist/data directory if it doesn't exist
  const destDir = path.join(__dirname, 'dist', 'data');
  await fs.mkdir(destDir, { recursive: true });
  
  // Copy all excel files from data directory
  const dataDir = path.join(__dirname, 'data');
  const files = await fs.readdir(dataDir);
  
  for (const file of files) {
    if (file.endsWith('.xlsx')) {
      const srcPath = path.join(dataDir, file);
      const destPath = path.join(destDir, file);
      await fs.copyFile(srcPath, destPath);
      console.log(`Copied ${file}`);
    }
  }
  
  console.log('Data files copied.');
};

// Main build function
const build = async () => {
  try {
    console.log('Starting build process...');
    
    // Determine platform from command line arguments
    const args = process.argv.slice(2);
    let platform = null;
    
    if (args.includes('--win')) platform = 'win';
    else if (args.includes('--mac')) platform = 'mac';
    else if (args.includes('--linux')) platform = 'linux';
    
    // Run build steps
    await buildFrontend();
    await buildBackend();
    await copyDataFiles();
    await packageApp(platform);
    
    console.log('Build completed successfully!');
    console.log(`The packaged application can be found in the 'release' directory.`);
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

// Execute the build
build();