const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Start React development server
const reactProcess = spawn('npm', ['start'], {
  shell: true,
  stdio: 'pipe',
});

reactProcess.stdout.on('data', (data) => {
  console.log(data.toString());
  // When React server is ready, start Electron
  if (data.toString().includes('Compiled successfully')) {
    const electronProcess = spawn(electron, [path.join(__dirname, '..', 'public', 'electron.js')], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
    });

    electronProcess.on('close', () => {
      reactProcess.kill();
      process.exit();
    });

    // Forward signals
    process.on('SIGINT', () => {
      electronProcess.kill();
      reactProcess.kill();
      process.exit();
    });
  }
});

reactProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});