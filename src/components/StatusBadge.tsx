import {
  SYNC_STATE_LABELS,
  type SyncState,
} from "../domain/lead";

interface StatusBadgeProps {
  state: SyncState;
}

export function StatusBadge({ state }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${state}`}>
      <span aria-hidden="true" className="status-badge__dot" />
      {SYNC_STATE_LABELS[state]}
    </span>
  );
}
