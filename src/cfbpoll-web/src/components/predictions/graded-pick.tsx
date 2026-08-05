import { gradeClasses } from '../../lib/grade-classes';
import { formatPick } from '../../lib/prediction-format-utils';
import type { GameGrade } from '../../schemas';

interface GradedPickProps {
  actualValue: string | null;
  grade: GameGrade;
  pick: string;
}

export function GradedPick({ actualValue, grade, pick }: GradedPickProps) {
  return (
    <div className={`inline-flex flex-col gap-0.5 px-2 py-1 rounded-lg ${gradeClasses(grade)}`}>
      <span className="font-semibold">{formatPick(pick)}</span>
      {grade === 'Incorrect' && actualValue !== null && (
        <span className="text-xs">Correct: {actualValue}</span>
      )}
    </div>
  );
}
