import { createPortal } from 'react-dom';
import type { RankedTeam, Record } from '../../types';
import { TeamLogo } from './team-logo';

interface TeamDetailsPopupProps {
  team: RankedTeam;
  position: { x: number; y: number };
}

function formatRecord(record: Record): string {
  return `${record.wins}-${record.losses}`;
}

function RecordRow({ label, record }: { label: string; record: Record }) {
  const hasGames = record.wins > 0 || record.losses > 0;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{hasGames ? formatRecord(record) : '-'}</span>
    </div>
  );
}

export function TeamDetailsPopup({ team, position }: TeamDetailsPopupProps) {
  const details = team.details;

  if (!details) {
    return null;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popupWidth = 280;
  const popupHeight = 320;

  let left = position.x + 10;
  let top = position.y + 10;

  if (left + popupWidth > viewportWidth - 20) {
    left = position.x - popupWidth - 10;
  }

  if (top + popupHeight > viewportHeight - 20) {
    top = viewportHeight - popupHeight - 20;
  }

  if (left < 20) {
    left = 20;
  }

  if (top < 20) {
    top = 20;
  }

  const popup = (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${popupWidth}px`,
      }}
    >
      <div className="mb-3 pb-2 border-b border-gray-200 flex items-start space-x-3">
        <TeamLogo logoURL={team.logoURL} teamName={team.teamName} />
        <div>
          <h3 className="font-semibold text-lg">{team.teamName}</h3>
          <p className="text-sm text-gray-600">
            {team.conference}
            {team.division ? ` - ${team.division}` : ''}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Record by Location</h4>
        <div className="space-y-1">
          <RecordRow label="Home" record={details.home} />
          <RecordRow label="Away" record={details.away} />
          <RecordRow label="Neutral" record={details.neutral} />
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm text-gray-700 mb-2">Record vs Opponent Rank</h4>
        <div className="space-y-1">
          <RecordRow label="vs #1-10" record={details.vsRank1To10} />
          <RecordRow label="vs #11-25" record={details.vsRank11To25} />
          <RecordRow label="vs #26-50" record={details.vsRank26To50} />
          <RecordRow label="vs #51-100" record={details.vsRank51To100} />
          <RecordRow label="vs #101+" record={details.vsRank101Plus} />
        </div>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}
