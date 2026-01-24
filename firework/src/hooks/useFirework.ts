import { useState, useCallback, useRef, useEffect } from 'react';
import { Particle, FireworkConfig, DEFAULT_CONFIG } from '../types';

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const randomColor = (colors: string[]) => colors[Math.floor(Math.random() * colors.length)];

export function useFirework(config: FireworkConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const particleIdRef = useRef(0);

  const createParticles = useCallback((x: number, y: number): Particle[] => {
    const newParticles: Particle[] = [];
    const { particleCount, minSize, maxSize, colors, spread, initialVelocity } = mergedConfig;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * spread - spread / 2 - Math.PI / 2;
      const velocity = randomInRange(initialVelocity * 0.5, initialVelocity);
      const size = randomInRange(minSize, maxSize);
      const maxLife = randomInRange(60, 120);

      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: randomColor(colors),
        size,
        life: maxLife,
        maxLife,
      });
    }

    return newParticles;
  }, [mergedConfig]);

  const launch = useCallback((x: number, y: number) => {
    const newParticles = createParticles(x, y);
    setParticles(prev => [...prev, ...newParticles]);
  }, [createParticles]);

  const updateParticles = useCallback(() => {
    const { gravity, friction, fadeRate } = mergedConfig;

    setParticles(prev => {
      const updated = prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vx: p.vx * friction,
          vy: p.vy * friction + gravity,
          life: p.life - fadeRate * 60,
        }))
        .filter(p => p.life > 0);

      return updated;
    });
  }, [mergedConfig]);

  useEffect(() => {
    const animate = () => {
      updateParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    if (particles.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length > 0, updateParticles]);

  const clear = useCallback(() => {
    setParticles([]);
  }, []);

  return {
    particles,
    launch,
    clear,
    config: mergedConfig,
  };
}
