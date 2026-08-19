import type { GameGrade } from '../../schemas';

import { gradeClasses } from '../../lib/grade-classes';
import { formatPick } from '../../lib/prediction-format-utils';

interface GradedPickProps {
  grade: GameGrade;
  pick: string;
}

export function GradedPick({ grade, pick }: GradedPickProps) {
  return (
    <div className={`inline-flex px-2 py-1 rounded-lg ${gradeClasses(grade)}`}>
      <span className="font-semibold">{formatPick(pick)}</span>
    </div>
  );
}
