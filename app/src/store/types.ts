export type GamePhase =
  | 'start'
  | 'playing'
  | 'decoding'
  | 'transitioning'
  | 'derezzed'
  | 'extracted'

export interface TileState {
  readonly x: number
  readonly y: number
  readonly isICE: boolean
  readonly adjacentICE: number
  readonly isRevealed: boolean
  readonly isDecoded: boolean
  readonly isTagged: boolean
  readonly isIOPort: boolean
}

export interface SectorConfig {
  readonly sector: number
  readonly gridSize: number
  readonly iceCount: number
  readonly name: string
  readonly bloomIntensity: number
  readonly fogNear: number
  readonly fogFar: number
  readonly accentColor: string
  readonly ambientIntensity: number
}

export interface DecodingTarget {
  readonly x: number
  readonly y: number
}
