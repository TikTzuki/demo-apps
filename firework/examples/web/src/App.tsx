import {useEffect, useRef, useState} from 'react';
import './App.css';
import {HappyNewYear} from './HappyNewYear';
import {applyPlugin, FireworkCanvas, randomPlugin} from '@tiktuzki/firework';

function App() {
  const [started, setStarted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('./public/music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
  }, []);

  const handleStart = () => {
    setFadeOut(true);
    // Play music on user gesture
    console.log('Attempting to play music...');
    audioRef.current?.play().catch(e => {
      console.log(e)
    });
    setTimeout(() => setStarted(true), 600);
  };

  if (!started) {
    return (
        <div className={`splash ${fadeOut ? 'splash--fade' : ''}`} onClick={handleStart}>
          <div className="splash-content">
            <div className="splash-emoji">🎆</div>
            <h1 className="splash-title">Happy New Year</h1>
            <p className="splash-subtitle">Tap anywhere to begin</p>
            <div className="splash-ring"/>
          </div>
        </div>
    );
  }

  return (
      <div className="app">
        <FireworkCanvas
            autoLaunch={true}
            launchInterval={1200}
            config={applyPlugin(randomPlugin)}
        >
          <HappyNewYear/>
        </FireworkCanvas>
      </div>
  );
}

export default App;
