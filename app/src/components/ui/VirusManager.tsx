import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

const VIRUS_DELAY_SECONDS = 60
const VIRUS_INITIAL_INTERVAL = 5.0
const VIRUS_INTERVAL_DECREMENT = 0.2
const VIRUS_MIN_INTERVAL = 1.0

export function VirusManager() {
  const sector = useGameStore((s) => s.sector)
  const phase = useGameStore((s) => s.phase)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playingSecondsRef = useRef(0)
  const virusStartedRef = useRef(false)
  const virusSecondsRef = useRef(0)
  const virusSpawnCountRef = useRef(0)
  const virusAccumRef = useRef(0.0)

  // Reset all counters when sector changes
  useEffect(() => {
    playingSecondsRef.current = 0
    virusStartedRef.current = false
    virusSecondsRef.current = 0
    virusSpawnCountRef.current = 0
    virusAccumRef.current = 0.0
  }, [sector])

  // Tick once per second; setup/teardown responds to both sector AND phase
  useEffect(() => {
    if (sector < 2) return
    if (phase !== 'playing' && phase !== 'decoding' && phase !== 'paused') return

    tickRef.current = setInterval(() => {
      const state = useGameStore.getState()

      // Only count time when actively playing (not paused, decoding, etc.)
      if (state.phase !== 'playing') return

      // Stop if sector changed mid-interval
      if (state.sector !== sector) {
        if (tickRef.current) clearInterval(tickRef.current)
        return
      }

      playingSecondsRef.current += 1

      // Initial delay before first virus
      if (!virusStartedRef.current) {
        if (playingSecondsRef.current >= VIRUS_DELAY_SECONDS) {
          virusStartedRef.current = true
          virusSecondsRef.current = 0
          useGameStore.setState({ virusAlertActive: true })
          state.spawnVirus()
        }
        return
      }

      // Accelerating spawns after first virus
      const nextInterval = Math.max(VIRUS_MIN_INTERVAL, VIRUS_INITIAL_INTERVAL - virusSpawnCountRef.current * VIRUS_INTERVAL_DECREMENT)
      virusAccumRef.current += 1.0
      if (virusAccumRef.current >= nextInterval) {
        virusAccumRef.current -= nextInterval
        state.spawnVirus()
        virusSpawnCountRef.current++
      }
    }, 1000)

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [sector, phase])

  return null
}
