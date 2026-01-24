# 🎆 @tiktuzki/firework

A React library with pluggable firework components featuring random colors and sizes.

## ✨ Features

- 🎨 **Multiple Themes**: Golden, Rainbow, Neon, Pastel, Cosmic, and more
- 🔌 **Pluggable System**: Easy to create custom firework effects
- 🎯 **Two Components**: Canvas-based and Trigger-based fireworks
- 🪝 **React Hooks**: `useFirework` hook for custom implementations
- ⚙️ **Fully Customizable**: Control particles, colors, physics, and more
- 📦 **TypeScript**: Full TypeScript support with type definitions
- 🎪 **Zero Dependencies**: Only requires React as a peer dependency

## 📦 Installation

```bash
npm install @tiktuzki/firework
```

## 🚀 Quick Start

### FireworkCanvas - Click or Auto-Launch

```jsx
import { FireworkCanvas } from '@tiktuzki/firework';

function App() {
  return (
    <FireworkCanvas
      autoLaunch={true}
      launchInterval={2000}
      width={800}
      height={600}
    />
  );
}
```

### FireworkTrigger - Button-Triggered Fireworks

```jsx
import { FireworkTrigger, applyPlugin, goldenPlugin } from '@tiktuzki/firework';

function App() {
  return (
    <FireworkTrigger config={applyPlugin(goldenPlugin)}>
      <button>Click me! 🎉</button>
    </FireworkTrigger>
  );
}
```

## 🎨 Built-in Plugins

```jsx
import {
  goldenPlugin,
  rainbowPlugin,
  neonPlugin,
  pastelPlugin,
  cosmicPlugin,
  applyPlugin
} from '@tiktuzki/firework';

// Use a plugin
<FireworkCanvas config={applyPlugin(rainbowPlugin)} />
```

### Available Plugins

- **goldenPlugin**: Warm gold and orange tones
- **rainbowPlugin**: Classic rainbow colors
- **neonPlugin**: Bright neon colors
- **pastelPlugin**: Soft pastel shades
- **cosmicPlugin**: Dark cosmic theme

## ⚙️ Configuration

Customize your fireworks with the config object:

```jsx
const customConfig = {
  particleCount: 50,      // Number of particles per firework
  minSize: 2,             // Minimum particle size in pixels
  maxSize: 6,             // Maximum particle size in pixels
  colors: [               // Array of color strings
    '#ff0000', '#00ff00', '#0000ff'
  ],
  gravity: 0.1,           // Gravity force (higher = faster fall)
  friction: 0.99,         // Air resistance (lower = more friction)
  fadeRate: 0.02,         // How fast particles fade (0-1)
  spread: Math.PI * 2,    // Launch angle spread in radians
  initialVelocity: 8      // Initial launch speed
};

<FireworkCanvas config={customConfig} />
```

## 🔌 Create Custom Plugins

```jsx
import { createPlugin, applyPlugin } from '@tiktuzki/firework';

const myCustomPlugin = createPlugin({
  name: 'custom',
  colors: ['#ff1493', '#00ffff', '#ffd700'],
  particleCount: 100,
  sizeRange: [2, 8],
  spread: Math.PI * 2,
  initialVelocity: 10
});

<FireworkCanvas config={applyPlugin(myCustomPlugin)} />
```

## 🪝 Using the Hook

For custom implementations:

```jsx
import { useFirework } from '@tiktuzki/firework';

function CustomFirework() {
  const { particles, launch, clear } = useFirework({
    particleCount: 60,
    colors: ['#ff0000', '#00ff00', '#0000ff']
  });

  return (
    <div onClick={(e) => launch(e.clientX, e.clientY)}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            opacity: p.life / p.maxLife
          }}
        />
      ))}
    </div>
  );
}
```

## 📖 API Reference

### FireworkCanvas Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `FireworkConfig` | `DEFAULT_CONFIG` | Firework configuration |
| `autoLaunch` | `boolean` | `false` | Auto-launch fireworks |
| `launchInterval` | `number` | `1000` | Interval between auto-launches (ms) |
| `width` | `number` | `'100%'` | Canvas width |
| `height` | `number` | `'100%'` | Canvas height |
| `className` | `string` | - | CSS class name |
| `style` | `CSSProperties` | - | Inline styles |

### FireworkTrigger Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `FireworkConfig` | `DEFAULT_CONFIG` | Firework configuration |
| `children` | `ReactNode` | - | Child elements to wrap |
| `className` | `string` | - | CSS class name |
| `style` | `CSSProperties` | - | Inline styles |

### useFirework Hook

```typescript
const { particles, launch, clear, config } = useFirework(config);
```

Returns:
- `particles`: Array of current particle objects
- `launch(x, y)`: Function to launch fireworks at position
- `clear()`: Function to clear all particles
- `config`: Merged configuration object

## 🎯 Live Example

Check out the [example directory](./example) for a complete demo:

```bash
cd example
./start-demo.sh
# Visit http://localhost:8000/example/
```

Or open `example/index.html` directly in your browser.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run dev
```

## 📄 License

MIT

## 👤 Author

tiktuzki

## 🔗 Repository

https://github.com/tiktuzki/firework

---

Made with ❤️ and ✨
