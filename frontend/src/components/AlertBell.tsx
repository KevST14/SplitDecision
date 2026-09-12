import { usePulseOnIncrease } from "../hooks";

export function AlertBell({ unreadCount, onClick }: { unreadCount: number; onClick: () => void }) {
  const ringing = usePulseOnIncrease(unreadCount);

  return (
    <button className={`alert-bell ${ringing ? "alert-bell-ring" : ""}`} onClick={onClick} aria-label="View alerts">
      <span className="alert-bell-icon">⚡</span>
      {unreadCount > 0 && <span className="alert-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>
  );
}
