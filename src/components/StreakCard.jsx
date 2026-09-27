export default function StreakCard({
  current = 0,
  longest = 0,
  gems = 0,
  gemProgress = 0,
  canRecover = false,
  recoveryDate = null,
  onRecover,
  t,
}) {
  const daysLeft = 7 - (gemProgress % 7)

  return (
    <aside className="streak-card">
      <div className="streak-header">
        <div className="streak-icon" aria-hidden="true">🔥</div>
        <div>
          <p className="eyebrow">{t.currentStreak}</p>
          <div className="streak-number">
            {current}
            <small>{t.days}</small>
          </div>
        </div>
      </div>

      <div className="streak-meta">
        <span className="streak-pill">
          {t.longestStreak}: <b>{longest} {t.days}</b>
        </span>
        <span className="streak-pill gem-pill">
          {t.gems}: <b>💎 {gems}</b>
        </span>
      </div>

      <div className="gem-progress-card">
        <div className="gem-progress-info">
          <span>{t.gemProgress || 'Tiến độ nhận Gem (7 ngày)'}</span>
          <b>{gemProgress}/7</b>
        </div>
        <div
          className="gem-progress-track"
          role="progressbar"
          aria-valuenow={gemProgress}
          aria-valuemin="0"
          aria-valuemax="7"
          aria-label={t.gemProgress || 'Tiến độ nhận Gem'}
        >
          <div
            className="gem-progress-fill"
            style={{ width: `${Math.min(100, Math.round((gemProgress / 7) * 100))}%` }}
          />
        </div>
        <p className="gem-progress-note">
          {gemProgress === 0 && current > 0
            ? (t.cycleCompleted || 'Đã đạt mốc 7 ngày! +1 Gem')
            : `${daysLeft} ${t.daysToGem || 'ngày nữa để nhận +1 Gem'}`}
        </p>
      </div>

      {recoveryDate && (
        <div className="recover-box">
          <p>{t.recoverHint} ({recoveryDate})</p>
          <button
            className={`recover-button ${!canRecover ? 'disabled' : ''}`}
            type="button"
            disabled={!canRecover}
            onClick={() => canRecover && onRecover && onRecover(recoveryDate)}
            title={gems < 1 ? (t.needMoreGems || 'Cần ít nhất 1 Gem để khôi phục') : ''}
          >
            💎 {t.recover || 'Khôi phục streak (1 Gem)'}
          </button>
        </div>
      )}
    </aside>
  )
}
