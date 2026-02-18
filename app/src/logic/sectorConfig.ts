import type { SectorConfig } from '../store/types'

export const SECTOR_CONFIGS: readonly SectorConfig[] = [
  {
    sector: 1,
    gridSize: 10,
    iceCount: 15,
    name: 'TRAINING GRID',
    bloomIntensity: 1.5,
    fogNear: 10,
    fogFar: 50,
    accentColor: '#00ffff',
    ambientIntensity: 0.15,
  },
  {
    sector: 2,
    gridSize: 10,
    iceCount: 20,
    name: 'CONTESTED ZONE',
    bloomIntensity: 1.8,
    fogNear: 8,
    fogFar: 40,
    accentColor: '#00ccff',
    ambientIntensity: 0.12,
  },
  {
    sector: 3,
    gridSize: 12,
    iceCount: 25,
    name: 'DEEP GRID',
    bloomIntensity: 2.0,
    fogNear: 6,
    fogFar: 35,
    accentColor: '#ff6600',
    ambientIntensity: 0.1,
  },
] as const

export const TOTAL_SECTORS = SECTOR_CONFIGS.length

export function getSectorConfig(sector: number): SectorConfig {
  const index = Math.max(0, Math.min(sector - 1, SECTOR_CONFIGS.length - 1))
  return SECTOR_CONFIGS[index]
}
