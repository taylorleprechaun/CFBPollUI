interface IncompleteWeekBannerProps {
  variant: 'predictions' | 'ratings';
}

const MESSAGES: Record<IncompleteWeekBannerProps['variant'], string> = {
  predictions: 'Warning: Last week’s games have not all been played yet, so predictions generated now would be based on incomplete data.',
  ratings: 'Warning: Last week’s games have not all been played yet, so ratings for this week are not ready to calculate.',
};

export function IncompleteWeekBanner({ variant }: IncompleteWeekBannerProps) {
  return (
    <p className="text-amber-600 text-sm">
      {MESSAGES[variant]}
    </p>
  );
}
