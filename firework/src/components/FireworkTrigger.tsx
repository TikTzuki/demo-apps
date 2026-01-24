import React, { useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FireworkTriggerProps, Particle, DEFAULT_CONFIG } from '../types';
import { useFirework } from '../hooks/useFirework';

export function FireworkTrigger({
  config,
  children,
  className,
  style,
}: FireworkTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const { particles, launch } = useFirework(config);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

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
      <>
        {particles.map(p => {
          const alpha = p.life / p.maxLife;
          return (
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
                opacity: alpha,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </>,
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
