// Components
export {FireworkCanvas} from './components/FireworkCanvas';
export {FireworkTrigger} from './components/FireworkTrigger';

// Hooks
export {useFirework} from './hooks/useFirework';

// Plugins
export {
    goldenPlugin,
    rainbowPlugin,
    neonPlugin,
    pastelPlugin,
    cosmicPlugin,
    randomPlugin,
    applyPlugin,
    createPlugin,
} from './plugins';

// Utils
export {playRandomFireworkSound, preloadSounds} from './utils/sound';

// Types
export type {
    Particle,
    ParticleShape,
    FireworkConfig,
    FireworkProps,
    FireworkCanvasProps,
    FireworkTriggerProps,
    ParticleRendererProps,
    FireworkPlugin,
} from './types';

export {DEFAULT_COLORS, DEFAULT_CONFIG} from './types';
