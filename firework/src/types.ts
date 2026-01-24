import {CSSProperties, ReactNode} from 'react';

export type ParticleShape = 'dot' | 'line';

export interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
    shape: ParticleShape;
    length?: number;
    angle?: number;
}

export interface FireworkConfig {
    particleCount?: number;
    minSize?: number;
    maxSize?: number;
    colors?: string[][];
    gravity?: number;
    friction?: number;
    fadeRate?: number;
    spread?: number;
    initialVelocity?: number;
    shapes?: ParticleShape[];
    lineLength?: number;
    sound?: boolean;
}

export interface FireworkProps {
    config?: FireworkConfig;
    autoLaunch?: boolean;
    launchInterval?: number;
    className?: string;
    style?: CSSProperties;
    sound?: boolean;
}

export interface FireworkCanvasProps extends FireworkProps {
    width?: number;
    height?: number;
    children?: ReactNode;
}

export interface FireworkTriggerProps {
    config?: FireworkConfig;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export interface ParticleRendererProps {
    particle: Particle;
    render?: (particle: Particle) => ReactNode;
}

export type FireworkPlugin = {
    name: string;
    colors?: string[][];
    particleCount?: number;
    sizeRange?: [number, number];
    spread?: number;
    initialVelocity?: number;
};

export const DEFAULT_COLORS = [[
    '#ff0000', '#ff7f00', '#ffff00', '#00ff00',
    '#0000ff', '#4b0082', '#9400d3', '#ff1493',
    '#00ffff', '#ffd700', '#ff69b4', '#00ff7f',
]];

export const DEFAULT_CONFIG: Required<FireworkConfig> = {
    particleCount: 50,
    minSize: 2,
    maxSize: 6,
    colors: DEFAULT_COLORS,
    gravity: 0.1,
    friction: 0.99,
    fadeRate: 0.02,
    spread: Math.PI * 2,
    initialVelocity: 8,
    shapes: ['dot', 'line'],
    lineLength: 15,
    sound: true,
};
