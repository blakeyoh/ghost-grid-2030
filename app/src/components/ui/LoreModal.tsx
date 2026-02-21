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
          SYSTEM INTEGRITY: CRITICAL
        </div>
        <div className="lore-subheader">
          CORRUPTION SPREADING ACROSS ALL SECTORS
        </div>
        <div className="lore-divider" />
        <div className="lore-body">
          <p>You are <span className="lore-highlight">PROC-7</span></p>
          <p>A maintenance daemon that was never shut down.</p>
          <p>Navigate the grid. Avoid the FAULT NODES.</p>
          <p>Reach the <span className="lore-highlight">RESTORE PORT</span> to purge each sector.</p>
          <p className="lore-tagline">One ghost process. One chance to fix it all.</p>
        </div>
        <button className="overlay-button" onClick={dismissLore}>
          BEGIN SEQUENCE
        </button>
      </div>
    </div>
  )
}
