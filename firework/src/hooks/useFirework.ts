import {useCallback, useEffect, useRef, useState} from 'react';
import {DEFAULT_CONFIG, FireworkConfig, Particle, ParticleShape} from '../types';
import {playRandomFireworkSound} from '../utils/sound';

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const randomColor = (colors: string[]) => colors[Math.floor(Math.random() * colors.length)];

const randomShape = (shapes: ParticleShape[]) => shapes[Math.floor(Math.random() * shapes.length)];

export function useFirework(config: FireworkConfig = {}) {
    const mergedConfig = {...DEFAULT_CONFIG, ...config};
    const [particles, setParticles] = useState<Particle[]>([]);
    const animationRef = useRef<number | null>(null);
    const particleIdRef = useRef(0);

    const createParticles = useCallback((x: number, y: number): Particle[] => {
        const newParticles: Particle[] = [];
        const {particleCount, minSize, maxSize, colors, spread, initialVelocity, shapes, lineLength} = mergedConfig;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * spread - spread / 2 - Math.PI / 2;
            const velocity = randomInRange(initialVelocity * 0.5, initialVelocity);
            const size = randomInRange(minSize, maxSize);
            const maxLife = randomInRange(60, 120);
            const shape = randomShape(shapes);
            const pickedColorSet = colors[Math.floor(Math.random() * colors.length)];
            newParticles.push({
                id: particleIdRef.current++,
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: randomColor(pickedColorSet),
                size,
                life: maxLife,
                maxLife,
                shape,
                length: shape === 'line' ? randomInRange(lineLength * 0.5, lineLength * 1.5) : undefined,
                angle: shape === 'line' ? angle : undefined,
            });
        }

        return newParticles;
    }, [mergedConfig]);

    const launch = useCallback((x: number, y: number, playSound = true) => {
        const newParticles = createParticles(x, y);
        setParticles(prev => [...prev, ...newParticles]);

        if (playSound && mergedConfig.sound) {
            playRandomFireworkSound();
        }
    }, [createParticles, mergedConfig.sound]);

    const updateParticles = useCallback(() => {
        const {gravity, friction, fadeRate} = mergedConfig;

        setParticles(prev => {
            const updated = prev
                .map(p => {
                    const newVx = p.vx * friction;
                    const newVy = p.vy * friction + gravity;
                    return {
                        ...p,
                        x: p.x + p.vx,
                        y: p.y + p.vy,
                        vx: newVx,
                        vy: newVy,
                        life: p.life - fadeRate * 60,
                        angle: p.shape === 'line' ? Math.atan2(newVy, newVx) : p.angle,
                    };
                })
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
