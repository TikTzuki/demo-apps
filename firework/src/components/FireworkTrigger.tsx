import React, { useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FireworkTriggerProps } from '../types';
import { useFirework } from '../hooks/useFirework';
import { preloadSounds } from '../utils/sound';

export interface FireworkTriggerPropsWithSound extends FireworkTriggerProps {
  sound?: boolean;
}

export function FireworkTrigger({
  config,
  children,
  className,
  style,
  sound = true,
}: FireworkTriggerPropsWithSound) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const mergedConfig = { ...config, sound };
  const { particles, launch } = useFirework(mergedConfig);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (sound) {
      preloadSounds();
    }
  }, [sound]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      let container = document.getElementById('firework-portal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'firework-portal';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
        document.body.appendChild(container);
      }
      setPortalContainer(container);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    launch(x, y);
  }, [launch]);

  const renderParticles = () => {
    if (!portalContainer || particles.length === 0) return null;

    return createPortal(
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {particles.map(p => {
          const alpha = p.life / p.maxLife;

          if (p.shape === 'line' && p.length !== undefined && p.angle !== undefined) {
            const endX = p.x - Math.cos(p.angle) * p.length;
            const endY = p.y - Math.sin(p.angle) * p.length;

            return (
              <line
                key={p.id}
                x1={p.x}
                y1={p.y}
                x2={endX}
                y2={endY}
                stroke={p.color}
                strokeWidth={p.size}
                strokeLinecap="round"
                opacity={alpha}
              />
            );
          }

          return (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={p.color}
              opacity={alpha}
            />
          );
        })}
      </svg>,
      portalContainer
    );
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleClick}
        className={className}
        style={{
          cursor: 'pointer',
          display: 'inline-block',
          ...style,
        }}
      >
        {children}
      </div>
      {renderParticles()}
    </>
  );
}
