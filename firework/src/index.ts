// Components
export { FireworkCanvas } from './components/FireworkCanvas';
export { FireworkTrigger } from './components/FireworkTrigger';

// Hooks
export { useFirework } from './hooks/useFirework';

// Plugins
export {
  goldenPlugin,
  rainbowPlugin,
  neonPlugin,
  pastelPlugin,
  cosmicPlugin,
  applyPlugin,
  createPlugin,
} from './plugins';

// Types
export type {
  Particle,
  FireworkConfig,
  FireworkProps,
  FireworkCanvasProps,
  FireworkTriggerProps,
  ParticleRendererProps,
  FireworkPlugin,
} from './types';

export { DEFAULT_COLORS, DEFAULT_CONFIG } from './types';
