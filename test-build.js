/**
 * Test build script to verify the application can be built
 * This will test the build process without creating the final packages
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
  console.log('Testing frontend build...');
  await runCommand('npx', ['vite', 'build', '--mode', 'development']);
  console.log('Frontend build test complete.');
};

// Build backend with esbuild
const buildBackend = async () => {
  console.log('Testing backend build...');
  await runCommand('npx', [
    'esbuild', 
    'server/index.ts', 
    '--platform=node', 
    '--packages=external', 
    '--bundle', 
    '--format=esm', 
    '--outdir=.temp'
  ]);
  console.log('Backend build test complete.');
  
  // Cleanup temp files
  await fs.rm('.temp', { recursive: true, force: true });
};

// Main test function
const testBuild = async () => {
  try {
    console.log('Starting build test process...');
    
    // Create temp dir if needed
    await fs.mkdir('.temp', { recursive: true });
    
    // Run build steps
    await buildFrontend();
    await buildBackend();
    
    console.log('Build test completed successfully!');
    console.log('The application should be able to be packaged without issues.');
    
  } catch (error) {
    console.error('Build test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await fs.rm('.temp', { recursive: true, force: true });
  }
};

// Execute the test
testBuild();