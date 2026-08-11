export const TRACK_RECORD_EXPLAINED_PATH = '/track-record/explained';

export interface TrackRecordStatInfo {
  description: string;
  id: string;
  label: string;
  shortSummary: string;
}

export const TRACK_RECORD_STAT_INFO = {
  marginBias: {
    description:
      'Margin Bias looks at the exact same game-by-game misses as Margin RMSE, but instead of measuring how big the miss was, it keeps track of which direction it went, then averages that out. A positive number means our picks tend to have the winning team win by even more than we expected. A negative number means the winning team usually wins by less than we predicted, or loses outright. So while Margin RMSE tells you how far off we typically are, Margin Bias tells you which way we tend to lean.',
    id: 'margin-bias',
    label: 'Margin Bias',
    shortSummary: 'Do our margin picks lean too confident or too cautious, on average?',
  },
  marginRMSE: {
    description:
      'For every game, we predict a margin - for example, “this team wins by 7.” Margin RMSE looks at how far off that guess turned out to be for every graded game, then boils it all down into one number: a typical miss, in points. Big misses count for more than small ones, so a blowout we didn’t see coming drags this number up more than a handful of close calls would. A lower number means our margins are landing close to reality; a higher number means we’re missing by a lot more often than we’d like.',
    id: 'margin-rmse',
    label: 'Margin RMSE',
    shortSummary: 'On average, how many points off is our margin prediction?',
  },
  overUnder: {
    description:
      'Before each game, we predict a number for the combined score of both teams added together. This stat checks whether we correctly guessed if the actual combined score would land above (“over”) or below (“under”) that number. If the final combined score lands exactly on our number, it’s a push - it doesn’t count as a win or a loss.',
    id: 'over-under',
    label: 'Over/Under',
    shortSummary: 'Did the total combined score go over or under our prediction?',
  },
  spread: {
    description:
      'The spread is the number sportsbooks set to make a game an even bet - the favorite has to win by more than that number, and the underdog just has to lose by less than it (or win outright). This stat checks whether the side we picked actually covered that number. It’s a tougher test than Winner: a team can win the game and we can still miss here if they didn’t win by enough. If the final score lands exactly on the spread, that game is a push and doesn’t count as a win or a loss.',
    id: 'spread',
    label: 'Spread',
    shortSummary: 'Did our pick cover the spread, not just win the game?',
  },
  winner: {
    description:
      'This one’s simple: did we predict the correct winner? It doesn’t matter if it was a nail-biter or a blowout - picking the winner is all that counts here. Every graded game goes in either the win column or the loss column, shown as a record like “12-3” with a win percentage next to it.',
    id: 'winner',
    label: 'Winner',
    shortSummary: 'Did we pick the team that actually won?',
  },
} as const satisfies Record<string, TrackRecordStatInfo>;
