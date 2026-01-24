import React, {useRef, useEffect, useCallback} from 'react';
import {FireworkCanvasProps} from '../types';
import {useFirework} from '../hooks';
import {preloadSounds} from '../utils/sound';

export function FireworkCanvas({
    config,
    autoLaunch = false,
    launchInterval = 1000,
    width,
    height,
    className,
    style,
    sound = true,
    children,
}: FireworkCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mergedConfig = {...config, sound};
    const {particles, launch} = useFirework(mergedConfig);

    useEffect(() => {
        if (sound) {
            preloadSounds();
        }
    }, [sound]);

    const getSize = useCallback(() => {
        if (containerRef.current) {
            return {
                width: width ?? containerRef.current.clientWidth,
                height: height ?? containerRef.current.clientHeight,
            };
        }
        return {width: width ?? 800, height: height ?? 600};
    }, [width, height]);

    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        launch(x, y);
    }, [launch]);

    const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Only trigger firework if clicking on the container itself (not children)
        if (e.target === e.currentTarget || e.target === canvasRef.current) {
            return; // Canvas click is handled separately
        }
        // Allow click to pass through to children, but also launch firework
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        launch(x, y);
    }, [launch]);

    useEffect(() => {
        if (!autoLaunch) return;

        const interval = setInterval(() => {
            const {width: w, height: h} = getSize();
            const x = Math.random() * w;
            const y = Math.random() * (h * 0.5) + h * 0.3;
            launch(x, y);
        }, launchInterval);

        return () => clearInterval(interval);
    }, [autoLaunch, launchInterval, launch, getSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const {width: w, height: h} = getSize();
        canvas.width = w;
        canvas.height = h;

        ctx.clearRect(0, 0, w, h);

        particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;

            if (p.shape === 'line' && p.length !== undefined && p.angle !== undefined) {
                const endX = p.x - Math.cos(p.angle) * p.length;
                const endY = p.y - Math.sin(p.angle) * p.length;

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.lineCap = 'round';
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }

            ctx.globalAlpha = 1;
        });
    }, [particles, getSize]);

    return (
        <div
            ref={containerRef}
            className={className}
            onClick={handleContainerClick}
            style={{
                position: 'relative',
                width: width ?? '100%',
                height: height ?? '100%',
                overflow: 'hidden',
                ...style,
            }}
        >
            {/* Children layer - interactive, below fireworks */}
            {children && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1,
                    }}
                >
                    {children}
                </div>
            )}
            {/* Canvas layer - fireworks, above children, pointer-events none so children are clickable */}
            <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    pointerEvents: children ? 'none' : 'auto',
                    cursor: children ? 'default' : 'pointer',
                }}
            />
        </div>
    );
}
