# Arena Assist 🏆

A powerful desktop companion app for League of Legends' Arena game mode, built with Electron + React + Tailwind CSS.

![Arena Assist Preview](https://via.placeholder.com/800x400/0F1419/C89B3C?text=Arena+Assist+Preview)

## ✨ Features

### 🆓 Free Features
- **🔍 Augment Detection**: OCR-based screen capture to identify augments with pick-rate analysis
- **📊 Match Summary**: Post-game Arena stats tracking with champion, augments, and placement history
- **🤝 Synergy Meter**: Real-time duo compatibility analysis with strategic recommendations
- **👁️ Always-on-Top Overlay**: Non-intrusive in-game overlay showing augment recommendations
- **🎤 Voice Chat**: WebRTC-based voice communication with Arena teammates
- **⌨️ Global Hotkeys**: Quick access to features with customizable keyboard shortcuts

### 💎 Premium Features (Requires OpenAI API)
- **🤖 AI Augment Coach**: GPT-4 powered recommendations based on champion and game state
- **📈 AI Duo Analysis**: Intelligent teammate suggestions for optimal synergy
- **🎯 Round-by-Round Coaching**: Real-time feedback and strategic advice

## 🔑 Setup & API Keys

**Important:** Arena Assist requires API keys to function. For security, these are now stored as environment variables.

📖 **[Complete API Key Setup Guide →](./API_KEYS_SETUP.md)**

**Quick Start:**
1. Copy `.env.example` to `.env.local`
2. Get a Riot Games API key from [developer.riotgames.com](https://developer.riotgames.com/)
3. Add your key to `.env.local`
4. Restart the app

## 🛠️ Technology Stack

- **Frontend**: Electron + React 18 + TypeScript
- **Styling**: Tailwind CSS with League of Legends inspired design
- **OCR**: Tesseract.js for text recognition
- **APIs**: Riot Games API + League Client API (LCU)
- **Voice**: WebRTC with Supabase signaling
- **AI**: OpenAI GPT-4o integration
- **Storage**: Electron Store for persistent data

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **League of Legends** client installed
- **Riot API Key** (free from [Riot Developer Portal](https://developer.riotgames.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/arena-assist.git
   cd arena-assist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### First-Time Setup

1. **Launch Arena Assist** and navigate to Settings
2. **Add your Riot API Key** from the [Developer Portal](https://developer.riotgames.com/)
3. **Configure hotkeys** (default: Ctrl+Shift+A for augment detection)
4. **Test the overlay** with Ctrl+Shift+O
5. **Start an Arena match** and press Ctrl+Shift+A to detect augments!

## 🎮 Usage Guide

### Augment Detection
1. Start an Arena match
2. When presented with augment choices, press **Ctrl+Shift+A**
3. Arena Assist will capture your screen and analyze the augments
4. View pick rates, win rates, and recommendations in the overlay
5. Choose the highlighted "BEST" option or review all data

### Voice Chat
1. Enable voice chat in Settings
2. Start an Arena match with a duo partner who also has Arena Assist
3. Voice chat automatically connects when both players are in-game
4. Use the Voice page to adjust microphone and speaker settings

### Match History
1. Your recent 10 Arena matches are automatically tracked
2. View detailed statistics including champions, augments, and placements
3. Analyze your performance trends on the Home dashboard

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Trigger augment detection |
| `Ctrl+Shift+O` | Toggle overlay visibility |
| `Ctrl+Shift+M` | Focus main window |

## 🔧 Configuration

### API Keys

#### Riot Games API (Required)
1. Visit [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Create a new app and generate an API key
4. Add the key in Arena Assist Settings → API Keys

#### OpenAI API (Optional - Premium Features)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an API key
3. Add to Arena Assist Settings for AI coaching features

#### Supabase (Optional - Voice Chat)
1. Create a project at [Supabase](https://supabase.com)
2. Get your project URL and anon key
3. Configure in Settings for enhanced voice chat features

### Overlay Settings
- **Position**: Adjust X/Y coordinates for overlay placement
- **Click-through**: Enable to allow clicks to pass through overlay
- **Visibility**: Toggle overlay on/off globally

## 🏗️ Development

### Project Structure
```
arena-assist/
├── electron/              # Electron main process
│   ├── main.ts            # Main process entry point
│   └── preload.ts         # Preload script for secure IPC
├── src/                   # React application
│   ├── components/        # Reusable React components
│   ├── context/          # React context providers
│   ├── data/             # Static data and configurations
│   ├── pages/            # Main application pages
│   └── services/         # API and service integrations
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run build:vite   # Build renderer only
npm run build:electron # Build electron app
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📊 Features Roadmap

### Version 1.1 (Coming Soon)
- [ ] Custom hotkey configuration
- [ ] Multiple language support for OCR
- [ ] Enhanced match history with filtering
- [ ] Export match data functionality

### Version 1.2 (Planned)
- [ ] Arena tier tracking system
- [ ] Augment tier list browser
- [ ] Match history sync with cloud storage
- [ ] Auto-updater integration

### Version 2.0 (Future)
- [ ] Support for 4-player Arena parties
- [ ] Advanced AI coaching with game analysis
- [ ] Integration with streaming platforms
- [ ] Mobile companion app

## ⚖️ Legal & Compliance

Arena Assist is designed to comply with Riot Games' Terms of Service:

- ✅ **No memory reading** or game file modification
- ✅ **No automation** of game actions
- ✅ **OCR-based analysis** of publicly visible information only
- ✅ **Uses official Riot API** for match data

Arena Assist **does not**:
- Modify game files or memory
- Automate any in-game actions
- Provide unfair advantages beyond publicly available information
- Violate Riot Games Terms of Service

> **Disclaimer**: Arena Assist is not affiliated with Riot Games. League of Legends is a trademark of Riot Games, Inc.

## 🐛 Troubleshooting

### Common Issues

**Augment detection not working**
- Ensure League is running in windowed or borderless mode
- Check that screen capture permissions are granted
- Verify OCR language matches your client language

**Voice chat connection failed**
- Check firewall settings for WebRTC connections
- Ensure both players have Arena Assist running
- Verify Supabase configuration in Settings

**LCU API not connecting**
- Make sure League client is running
- Restart Arena Assist after launching League
- Check Windows firewall isn't blocking localhost connections

**Build errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Update Node.js to version 18 or higher
- Check for TypeScript errors: `npm run type-check`

### Performance Tips
- Close unused applications for better OCR performance
- Use SSD storage for faster app loading
- Ensure stable internet for voice chat quality

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/arena-assist/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/arena-assist/discussions)
- **Discord**: [Arena Assist Community](https://discord.gg/arena-assist)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Riot Games** for League of Legends and the Arena game mode
- **Tesseract.js** for OCR capabilities
- **Electron** and **React** communities for excellent frameworks
- **League of Legends** community for feedback and testing

---

**Made with ❤️ for the League of Legends Arena community**

*Happy climbing in the Arena! 🏆* 