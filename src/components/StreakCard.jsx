export default function StreakCard({ current, longest, gems, canRecover, onRecover, t }) {
  return (
    <aside className="streak-card">
      <div className="streak-icon" aria-hidden="true">DM</div>
      <p className="eyebrow">{t.currentStreak}</p>
      <div className="streak-number">{current}<small>{t.days}</small></div>
      <div className="streak-meta">
        <span>{t.longestStreak} <b>{longest}</b></span>
        <span>{t.gems} <b>{gems}</b></span>
      </div>
      {canRecover && (
        <div className="recover-box">
          <p>{t.recoverHint}</p>
          <button className="text-button" type="button" onClick={onRecover}>{t.recover}</button>
        </div>
      )}
    </aside>
  )
}
