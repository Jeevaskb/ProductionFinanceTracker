/**
 * Script to run the Electron app in development mode
 * This will start the Express server and then launch Electron
 */

import { spawn } from 'child_process';
import waitOn from 'wait-on';

// Start the Express server
const startServer = () => {
  console.log('Starting Express server...');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error(`Failed to start server: ${error}`);
    process.exit(1);
  });
  
  return serverProcess;
};

// Start Electron once the server is ready
const startElectron = async () => {
  console.log('Waiting for Express server to be ready...');
  
  try {
    // Wait for the server to be available
    await waitOn({
      resources: ['http://localhost:5000'],
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('Express server is ready, starting Electron...');
    
    // Start Electron
    const electronProcess = spawn('electron', ['.'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ELECTRON_START_URL: 'http://localhost:5000'
      }
    });
    
    electronProcess.on('error', (error) => {
      console.error(`Failed to start Electron: ${error}`);
    });
    
    electronProcess.on('close', (code) => {
      console.log(`Electron exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
};

// Main function to run development environment
const runDev = async () => {
  const serverProcess = startServer();
  
  // Handle Ctrl+C and other termination signals
  const cleanup = () => {
    console.log('Shutting down...');
    
    if (serverProcess) {
      serverProcess.kill();
    }
    
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  await startElectron();
};

// Run the development environment
runDev();