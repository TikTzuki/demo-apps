# Firework Component Example - React App

This is a live demo React application for the `@tiktuzki/firework` library, built with Vite.

## 🚀 Quick Start

### React App (Recommended)

```bash
# Navigate to example directory
cd example

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The app will automatically open in your browser at `http://localhost:3000`

### Standalone Demo (No Setup Required)

Simply open `standalone.html` directly in your web browser - no server or dependencies required!

## 📦 Available Scripts

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **@tiktuzki/firework** - Firework library (linked from parent directory)

## 📖 What's Included

This demo showcases:

1. **FireworkCanvas Component**
   - Auto-launching fireworks with toggle
   - Click-to-launch functionality
   - Custom configuration with rainbow colors

2. **FireworkTrigger Component**
   - Multiple plugin themes (Golden, Rainbow, Neon, Pastel, Cosmic)
   - Click buttons to trigger themed fireworks
   - Portal rendering across the entire page

3. **Features Overview**
   - All available plugins
   - Configuration options
   - Component types
   - Code examples

## 🎨 Plugins Demonstrated

- **Default**: Multi-color rainbow effect
- **Golden**: Warm gold and orange tones
- **Rainbow**: Classic rainbow colors
- **Neon**: Bright neon colors
- **Pastel**: Soft pastel shades
- **Cosmic**: Dark cosmic theme with accent colors

## 🛠️ Customization

The app demonstrates how to customize fireworks:

```tsx
import { FireworkCanvas, applyPlugin, goldenPlugin } from '@tiktuzki/firework';

// Basic usage
<FireworkCanvas autoLaunch={true} />

// With custom config
<FireworkCanvas
  config={{
    particleCount: 70,
    colors: ['#ff0000', '#00ff00', '#0000ff'],
  }}
/>

// With plugin
<FireworkTrigger config={applyPlugin(goldenPlugin)}>
  <button>Click me!</button>
</FireworkTrigger>
```

## 📁 Project Structure

```
example/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── package.json         # Dependencies
├── standalone.html      # Standalone demo (no build required)
└── README.md           # This file
```

## 🔧 Development

The example uses the source code from the parent directory (`../src`) via Vite's alias configuration. Any changes to the library source will hot-reload in the example app.

## 🎯 Browser Compatibility

- Modern browsers with ES2020 support
- Chrome, Firefox, Safari, Edge (latest versions)
- React 18 or higher

## 📝 Notes

- The library is linked from the parent directory for development
- Hot module reloading is enabled for fast development
- Production builds are optimized and minified
- The standalone.html can be opened without any build process
