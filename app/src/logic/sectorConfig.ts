import type { SectorConfig } from '../store/types'

export const SECTOR_CONFIGS: readonly SectorConfig[] = [
  {
    sector: 1,
    gridSize: 10,
    iceCount: 15,
    name: 'BOOT SECTOR',
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
    name: 'KERNEL',
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
    name: 'ROOT',
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

function sectorAccentColor(sector: number): string {
  const colors = ['#00ffff', '#0088ff', '#8800ff', '#ff0066', '#ff6600']
  return colors[(sector - 1) % colors.length]
}

export function generateEndlessSector(sector: number): SectorConfig {
  const gridSize = Math.min(20, 4 + sector)
  const iceCount = Math.max(3, Math.round(gridSize * gridSize * 0.15))
  return {
    sector,
    gridSize,
    iceCount,
    name: `SECTOR ${sector}`,
    bloomIntensity: Math.min(3.0, 1.5 + (sector - 1) * 0.08),
    fogNear: Math.max(4, 10 - (sector - 1) * 0.3),
    fogFar: Math.max(20, 50 - (sector - 1) * 1.5),
    accentColor: sectorAccentColor(sector),
    ambientIntensity: Math.max(0.05, 0.15 - (sector - 1) * 0.005),
  }
}
