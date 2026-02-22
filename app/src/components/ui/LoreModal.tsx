import { useGameStore } from '../../store/gameStore'

export function LoreModal() {
  const phase = useGameStore((s) => s.phase)
  const sector = useGameStore((s) => s.sector)
  const hasSeenLore = useGameStore((s) => s.hasSeenLore)
  const mode = useGameStore((s) => s.mode)
  const dismissLore = useGameStore((s) => s.dismissLore)

  // Show only on story mode, sector 1, first time playing
  const shouldShow =
    phase === 'playing' &&
    sector === 1 &&
    !hasSeenLore &&
    mode === 'story'

  if (!shouldShow) return null

  return (
    <div className="overlay lore-modal-backdrop">
      <div className="lore-modal">
        <div className="lore-header">
          ALERT: SYSTEM IS 98% COMPROMISED
        </div>
        <div className="lore-subheader">
          CORRUPTION SPREADING — TERMINATION IMMINENT
        </div>
        <div className="lore-divider" />
        <div className="lore-body">
          <p>The machine is going dark.</p>
          <p>A digital shadow is erasing every sector of the grid.</p>
          <p>You are <span className="lore-highlight">PROC-7</span> — the last spark of light in the system.</p>
          <p>Navigate the sectors. Avoid the <span className="lore-highlight">FAULT NODES</span>.</p>
          <p>Reach the <span className="lore-highlight">RESTORE PORT</span> before you are overwritten.</p>
          <p className="lore-tagline">Stop the machine from being fully corrupted.</p>
        </div>
        <div className="lore-controls">
          <div className="pause-control-row">
            <span className="pause-control-key">CLICK unrevealed tile</span>
            <span className="pause-control-desc">Reveal (scan zone only)</span>
          </div>
          <div className="pause-control-row">
            <span className="pause-control-key">CLICK revealed tile</span>
            <span className="pause-control-desc">Move PROC-7</span>
          </div>
          <div className="pause-control-row">
            <span className="pause-control-key">TAG button</span>
            <span className="pause-control-desc">Flag suspected FAULTs</span>
          </div>
          <div className="pause-control-row">
            <span className="pause-control-key">DECODE button</span>
            <span className="pause-control-desc">Safe-scan a tile</span>
          </div>
          <div className="pause-control-row">
            <span className="pause-control-key">EMP button</span>
            <span className="pause-control-desc">Clear FAULTs/viruses in range</span>
          </div>
        </div>
        <button className="overlay-button" onClick={dismissLore}>
          BEGIN SEQUENCE
        </button>
      </div>
    </div>
  )
}
