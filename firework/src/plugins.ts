import {FireworkConfig, FireworkPlugin} from './types';

export const goldenPlugin: FireworkPlugin = {
    name: 'golden',
    colors: [['#ffd700', '#ffb700', '#ffa500', '#ff8c00', '#fff8dc']],
    particleCount: 60,
    sizeRange: [3, 7],
    spread: Math.PI * 2,
    initialVelocity: 10,
};

export const rainbowPlugin: FireworkPlugin = {
    name: 'rainbow',
    colors: [['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']],
    particleCount: 80,
    sizeRange: [2, 5],
    spread: Math.PI * 2,
    initialVelocity: 8,
};

export const neonPlugin: FireworkPlugin = {
    name: 'neon',
    colors: [['#00ffff', '#ff00ff', '#00ff00', '#ff1493', '#7fff00']],
    particleCount: 70,
    sizeRange: [2, 6],
    spread: Math.PI * 1.5,
    initialVelocity: 9,
};

export const pastelPlugin: FireworkPlugin = {
    name: 'pastel',
    colors: [['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff']],
    particleCount: 55,
    sizeRange: [3, 8],
    spread: Math.PI * 2,
    initialVelocity: 7,
};

export const cosmicPlugin: FireworkPlugin = {
    name: 'cosmic',
    colors: [['#0a0a2e', '#16213e', '#1a1a2e', '#e94560', '#533483']],
    particleCount: 100,
    sizeRange: [1, 4],
    spread: Math.PI * 2,
    initialVelocity: 12,
};

export const randomPlugin: FireworkPlugin = {
    name: 'cosmic',
    colors: [
        ['#0a0a2e', '#16213e', '#1a1a2e', '#e94560', '#533483'],
        ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'],
        ['#ffd700', '#ffb700', '#ffa500', '#ff8c00', '#fff8dc'],
        ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
        ['#00ffff', '#ff00ff', '#00ff00', '#ff1493', '#7fff00']
    ],
    particleCount: 100,
    sizeRange: [1, 4],
    spread: Math.PI * 2,
    initialVelocity: 12,
};

export function applyPlugin(plugin: FireworkPlugin): FireworkConfig {
    return {
        colors: plugin.colors,
        particleCount: plugin.particleCount,
        minSize: plugin.sizeRange?.[0],
        maxSize: plugin.sizeRange?.[1],
        spread: plugin.spread,
        initialVelocity: plugin.initialVelocity,
    };
}

export function createPlugin(options: Partial<FireworkPlugin> & { name: string }): FireworkPlugin {
    return {
        colors: [['#ffffff']],
        particleCount: 50,
        sizeRange: [2, 6],
        spread: Math.PI * 2,
        initialVelocity: 8,
        ...options,
    };
}
