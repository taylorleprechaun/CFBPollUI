import type { GamePredictionPublic } from '../../schemas';

interface WinnerActualCaptionProps {
  prediction: GamePredictionPublic;
  showGrades?: boolean;
}

export function WinnerActualCaption({ prediction: p, showGrades = false }: WinnerActualCaptionProps) {
  if (!showGrades || p.winnerGrade !== 'Incorrect' || p.actualWinner === null) return null;

  return <span className="text-xs font-medium text-green-700 dark:text-green-400">Actual: {p.actualWinner}</span>;
}
