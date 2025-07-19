#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏗️  Setting up Arena Assist development environment...\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

console.log(`📋 Node.js version: ${nodeVersion}`);

if (majorVersion < 18) {
  console.error('❌ Error: Node.js 18 or higher is required');
  console.log('   Please update Node.js: https://nodejs.org/');
  process.exit(1);
}

console.log('✅ Node.js version is compatible\n');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('📁 Created assets directory');
}

// Create basic icon placeholder (you'd replace this with actual icons)
const iconPlaceholder = `
This directory should contain:
- icon.png (256x256 PNG for Linux)
- icon.ico (Windows icon)
- icon.icns (macOS icon)

You can generate these from a single PNG using:
- electron-icon-maker: npm install -g electron-icon-maker
- Or use online tools like: https://iconverticons.com/
`;

const iconReadme = path.join(assetsDir, 'README.md');
if (!fs.existsSync(iconReadme)) {
  fs.writeFileSync(iconReadme, iconPlaceholder.trim());
  console.log('📄 Created assets/README.md');
}

console.log('\n🚀 Development environment setup complete!');
console.log('\n📖 Next steps:');
console.log('1. Run: npm install');
console.log('2. Get a Riot API key: https://developer.riotgames.com/');
console.log('3. Run: npm run dev');
console.log('4. Open Arena Assist and configure your API key in Settings');
console.log('\n🎮 Happy developing!');

// Check if user wants to install dependencies
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n❓ Would you like to install dependencies now? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n📦 Installing dependencies...');
    
    const { spawn } = require('child_process');
    const install = spawn('npm', ['install'], { stdio: 'inherit' });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Dependencies installed successfully!');
        console.log('\n🎉 Ready to start developing! Run: npm run dev');
      } else {
        console.error('\n❌ Failed to install dependencies');
        console.log('Please run: npm install manually');
      }
      rl.close();
    });
  } else {
    console.log('\n⏭️  Skipping dependency installation');
    console.log('Run: npm install when ready');
    rl.close();
  }
}); 