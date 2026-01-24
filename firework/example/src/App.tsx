import { useState } from 'react';
import {
  FireworkCanvas,
  FireworkTrigger,
  applyPlugin,
  goldenPlugin,
  rainbowPlugin,
  neonPlugin,
  pastelPlugin,
  cosmicPlugin,
} from '@tiktuzki/firework';
import './App.css';

function App() {
  const [autoLaunch, setAutoLaunch] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <h1>🎆 Firework Component Demo 🎆</h1>
        <p className="subtitle">A React library with beautiful firework effects</p>
      </header>

      <div className="container">
        {/* Canvas Demo Section */}
        <section className="demo-section">
          <h2>1. FireworkCanvas Component</h2>
          <p>Click anywhere on the canvas to launch fireworks!</p>
          <div className="canvas-container">
            <FireworkCanvas
              autoLaunch={autoLaunch}
              launchInterval={2000}
              config={{
                particleCount: 70,
                colors: [
                  '#ff0000',
                  '#ff7f00',
                  '#ffff00',
                  '#00ff00',
                  '#0000ff',
                  '#4b0082',
                  '#9400d3',
                  '#ff1493',
                  '#00ffff',
                  '#ffd700',
                ],
              }}
            />
          </div>
          <button
            className="toggle-button"
            onClick={() => setAutoLaunch(!autoLaunch)}
          >
            {autoLaunch ? '⏸ Stop Auto Launch' : '▶️ Start Auto Launch'}
          </button>
        </section>

        {/* Trigger Demo Section */}
        <section className="demo-section">
          <h2>2. FireworkTrigger Component</h2>
          <p>Click buttons to trigger themed fireworks!</p>
          <div className="button-grid">
            <FireworkTrigger>
              <button className="trigger-button btn-default">Default</button>
            </FireworkTrigger>
            <FireworkTrigger config={applyPlugin(goldenPlugin)}>
              <button className="trigger-button btn-golden">Golden</button>
            </FireworkTrigger>
            <FireworkTrigger config={applyPlugin(rainbowPlugin)}>
              <button className="trigger-button btn-rainbow">Rainbow</button>
            </FireworkTrigger>
            <FireworkTrigger config={applyPlugin(neonPlugin)}>
              <button className="trigger-button btn-neon">Neon</button>
            </FireworkTrigger>
            <FireworkTrigger config={applyPlugin(pastelPlugin)}>
              <button className="trigger-button btn-pastel">Pastel</button>
            </FireworkTrigger>
            <FireworkTrigger config={applyPlugin(cosmicPlugin)}>
              <button className="trigger-button btn-cosmic">Cosmic</button>
            </FireworkTrigger>
          </div>
        </section>

        {/* Features Section */}
        <section className="demo-section">
          <h2>3. Features & Customization</h2>
          <div className="features">
            <div className="feature-card">
              <h3>🎨 Plugins</h3>
              <ul>
                <li>Golden</li>
                <li>Rainbow</li>
                <li>Neon</li>
                <li>Pastel</li>
                <li>Cosmic</li>
                <li>Custom plugins</li>
              </ul>
            </div>
            <div className="feature-card">
              <h3>⚙️ Configuration</h3>
              <ul>
                <li>Particle count</li>
                <li>Size range</li>
                <li>Colors array</li>
                <li>Gravity & friction</li>
                <li>Spread angle</li>
                <li>Initial velocity</li>
              </ul>
            </div>
            <div className="feature-card">
              <h3>🚀 Components</h3>
              <ul>
                <li>FireworkCanvas</li>
                <li>FireworkTrigger</li>
                <li>useFirework hook</li>
                <li>Auto-launch mode</li>
                <li>Click-to-launch</li>
                <li>Portal rendering</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="demo-section">
          <h2>4. Usage Example</h2>
          <div className="code-block">
            <pre>{`import { FireworkCanvas, FireworkTrigger, applyPlugin, goldenPlugin } from '@tiktuzki/firework';

// Canvas mode
<FireworkCanvas autoLaunch={true} width={800} height={400} />

// Trigger mode with plugin
<FireworkTrigger config={applyPlugin(goldenPlugin)}>
  <button>Click me! 🎉</button>
</FireworkTrigger>`}</pre>
          </div>
        </section>
      </div>

      <footer className="footer">
        <p>Made with ❤️ and ✨ by tiktuzki</p>
      </footer>
    </div>
  );
}

export default App;
