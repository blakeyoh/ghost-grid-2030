import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

export function VirusAlert() {
  const virusAlertActive = useGameStore((s) => s.virusAlertActive)
  const dismissVirusAlert = useGameStore((s) => s.dismissVirusAlert)

  useEffect(() => {
    if (!virusAlertActive) return
    const timer = setTimeout(dismissVirusAlert, 3000)
    return () => clearTimeout(timer)
  }, [virusAlertActive, dismissVirusAlert])

  if (!virusAlertActive) return null

  return (
    <div className="virus-alert">
      <div className="virus-alert-text">VIRUS DETECTED</div>
    </div>
  )
}
