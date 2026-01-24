import React, { useRef, useEffect, useCallback } from 'react';
import { FireworkCanvasProps, DEFAULT_CONFIG } from '../types';
import { useFirework } from '../hooks';

export function FireworkCanvas({
  config,
  autoLaunch = false,
  launchInterval = 1000,
  width,
  height,
  className,
  style,
}: FireworkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { particles, launch, config: mergedConfig } = useFirework(config);

  const getSize = useCallback(() => {
    if (containerRef.current) {
      return {
        width: width ?? containerRef.current.clientWidth,
        height: height ?? containerRef.current.clientHeight,
      };
    }
    return { width: width ?? 800, height: height ?? 600 };
  }, [width, height]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    launch(x, y);
  }, [launch]);

  useEffect(() => {
    if (!autoLaunch) return;

    const interval = setInterval(() => {
      const { width: w, height: h } = getSize();
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

    const { width: w, height: h } = getSize();
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, [particles, getSize]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: width ?? '100%',
        height: height ?? '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
