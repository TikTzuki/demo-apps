import {useEffect, useRef, useState} from 'react';
import './App.css';
import {HappyNewYear} from './HappyNewYear';
import type {FireworksHandlers} from '@fireworks-js/react';
import {Fireworks} from '@fireworks-js/react';

function App() {
  const [started, setStarted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
    const fireworksRef = useRef<FireworksHandlers>(null);

  useEffect(() => {
    audioRef.current = new Audio('./public/music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
  }, []);

  const handleStart = () => {
    setFadeOut(true);
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
          <Fireworks
              ref={fireworksRef}
              options={{
                  rocketsPoint: {min: 0, max: 100},
                  hue: {min: 0, max: 360},
                  delay: {min: 15, max: 30},
                  decay: {min: 0.005, max: 0.015},
                  speed: 1,
                  acceleration: 1.02,
                  friction: 0.97,
                  gravity: 1.2,
                  particles: 120,
                  traceLength: 4,
                  traceSpeed: 8,
                  explosion: 3,
                  intensity: 25,
                  flickering: 30,
                  lineStyle: 'round',
                  lineWidth: {
                      explosion: {min: 1, max: 3},
                      trace: {min: 1, max: 2},
                  },
                  brightness: {min: 50, max: 80},
              }}
              style={{
                  position: 'fixed',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 0,
              }}
          />
          <div className="overlay">
          <HappyNewYear/>
          </div>
      </div>
  );
}

export default App;
