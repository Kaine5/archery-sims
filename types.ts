
export type BracketSize = 8 | 16 | 32 | 64 | 128;
export type TargetDistance = '30m' | '50m' | '70m' | '18m';

export interface Archer {
  id: string;
  name: string;
  seed: number;
  averageArrowScore: number;
  isUser: boolean;
  qualificationScore: number;
}

export interface ArrowPoint {
  score: number;
  x: number;
  y: number;
  targetIndex?: number; // For three-spot targets
}

export interface SetResult {
  archerScore: number[];
  opponentScore: number[];
  archerPoints: ArrowPoint[];
  opponentPoints: ArrowPoint[];
  archerSetPoints: number;
  opponentSetPoints: number;
  setShootOffs?: { archer1: ArrowPoint; archer2: ArrowPoint }[];
}

export interface Match {
  id: string;
  roundName: string;
  archer1: Archer;
  archer2: Archer;
  archer1Sets: number;
  archer2Sets: number;
  completed: boolean;
  winner?: Archer;
  scoreLog: SetResult[];
  isShootOff: boolean;
  shootOffScores?: { archer1: number; archer2: number };
}

export interface TournamentHistory {
  id: string;
  date: string;
  bracketSize: number;
  userName: string;
  userSkill: number;
  distance: TargetDistance;
  result: string;
  matches: Match[]; // Matches involving the user
  fullBracket: Match[][]; // The complete tournament tree
  archers: Archer[];
}

export interface TournamentState {
  id: string;
  archers: Archer[];
  bracket: Match[][];
  currentRoundIndex: number;
  activeMatchId: string | null;
  status: 'setup' | 'active' | 'finished';
  distance: TargetDistance;
}
