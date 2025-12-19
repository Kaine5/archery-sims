
import { Archer, Match, SetResult, ArrowPoint, TargetDistance } from '../types';
import { NAME_SAMPLES, ARROWS_PER_SET, SET_POINTS_WIN, SET_POINTS_DRAW, MATCH_WIN_POINTS } from '../constants';

function gaussianRandom(mean: number, stdev: number) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num * stdev + mean;
  return Math.max(0, Math.min(10, num));
}

export const getRandomPointForScore = (score: number): { x: number, y: number } => {
  if (score === 0) {
    const angle = Math.random() * Math.PI * 2;
    const r = 45 + Math.random() * 5;
    return { x: 50 + Math.cos(angle) * r, y: 50 + Math.sin(angle) * r };
  }
  
  const ringWidth = 4;
  const outerR = (11 - score) * ringWidth;
  const innerR = (10 - score) * ringWidth;
  
  const r = innerR + Math.random() * (outerR - innerR);
  const angle = Math.random() * Math.PI * 2;
  
  return {
    x: 50 + Math.cos(angle) * r,
    y: 50 + Math.sin(angle) * r
  };
};

export const generateArcherList = (
  size: number, 
  userAverage: number, 
  userName: string, 
  distance: TargetDistance,
  manualUserScore?: number
): Archer[] => {
  const tempArchers: any[] = [];
  const spread = 1.2;
  const qualArrows = distance === '18m' ? 60 : 72;

  // Generate Opponents
  for (let i = 0; i < size - 1; i++) {
    const skill = userAverage + (Math.random() - 0.5) * spread;
    let qScore = 0;
    for (let j = 0; j < qualArrows; j++) {
      qScore += Math.round(gaussianRandom(skill, 0.7));
    }

    tempArchers.push({
      id: `archer-${i}`,
      name: NAME_SAMPLES[Math.floor(Math.random() * NAME_SAMPLES.length)] + ` ${String.fromCharCode(65 + (i % 26))}`,
      averageArrowScore: skill,
      qualificationScore: qScore,
      isUser: false
    });
  }

  // Calculate User Qualification Score
  let userQScore = manualUserScore;
  if (userQScore === undefined || isNaN(userQScore)) {
    userQScore = 0;
    for (let j = 0; j < qualArrows; j++) {
      userQScore += Math.round(gaussianRandom(userAverage, 0.7));
    }
  }

  // Add User
  tempArchers.push({
    id: 'user-archer',
    name: userName || "Player",
    averageArrowScore: userAverage,
    qualificationScore: userQScore,
    isUser: true
  });

  // Sort by qualification score to determine seeds
  tempArchers.sort((a, b) => b.qualificationScore - a.qualificationScore);
  
  const finalArchers: Archer[] = tempArchers.map((a, idx) => ({
    ...a,
    seed: idx + 1
  }));

  return finalArchers;
};

/**
 * Generates seeds in the correct pairing order for World Archery brackets.
 * For N=8, returns [1, 8, 5, 4, 3, 6, 7, 2].
 * This ensures that seeds 1 and 2 only meet in the final, 1 and 4 in the semi, etc.
 */
const getBracketSeeds = (n: number): number[] => {
  let seeds = [1, 2];
  while (seeds.length < n) {
    let nextSeeds = [];
    const currentSum = seeds.length * 2 + 1;
    for (let i = 0; i < seeds.length; i += 2) {
      const a = seeds[i];
      const b = seeds[i+1];
      // Rule: Each pair (a, b) expands to (a, sum-a) and (sum-b, b)
      nextSeeds.push(a, currentSum - a);
      nextSeeds.push(currentSum - b, b);
    }
    seeds = nextSeeds;
  }
  return seeds;
};

export const createInitialBracket = (archers: Archer[], size: number): Match[][] => {
  const rounds: Match[][] = [];
  
  // Create preliminary rounds
  let currentSize = size;
  while (currentSize > 2) {
    const round: Match[] = [];
    const seedOrder = getBracketSeeds(currentSize);
    const roundCount = currentSize / 2;
    
    for (let i = 0; i < roundCount; i++) {
      const isFirstRound = rounds.length === 0;
      let a1: Archer = { id: 'tbd', name: 'TBD', seed: 0, averageArrowScore: 0, isUser: false, qualificationScore: 0 };
      let a2: Archer = { id: 'tbd', name: 'TBD', seed: 0, averageArrowScore: 0, isUser: false, qualificationScore: 0 };

      if (isFirstRound) {
        const s1 = seedOrder[i * 2];
        const s2 = seedOrder[i * 2 + 1];
        a1 = archers.find(a => a.seed === s1)!;
        a2 = archers.find(a => a.seed === s2)!;
      }

      const rName = currentSize === 128 ? "Round of 128" : 
                    currentSize === 64 ? "Round of 64" : 
                    currentSize === 32 ? "Round of 32" : 
                    currentSize === 16 ? "Round of 16" : 
                    currentSize === 8 ? "Quarterfinals" : 
                    currentSize === 4 ? "Semifinals" : `Round of ${currentSize}`;

      round.push({
        id: `r-${currentSize}-m${i}`,
        roundName: rName,
        archer1: a1,
        archer2: a2,
        archer1Sets: 0,
        archer2Sets: 0,
        completed: false,
        scoreLog: [],
        isShootOff: false
      });
    }
    rounds.push(round);
    currentSize /= 2;
  }

  // Final Round
  const finalsRound: Match[] = [
    {
      id: `m-gold`,
      roundName: "Gold Medal Match",
      archer1: { id: 'tbd', name: 'TBD', seed: 0, averageArrowScore: 0, isUser: false, qualificationScore: 0 },
      archer2: { id: 'tbd', name: 'TBD', seed: 0, averageArrowScore: 0, isUser: false, qualificationScore: 0 },
      archer1Sets: 0,
      archer2Sets: 0,
      completed: false,
      scoreLog: [],
      isShootOff: false
    },
    {
      id: `m-bronze`,
      roundName: "Bronze Medal Match",
      archer1: { id: 'tbd', name: 'TBD', seed: 0, averageArrowScore: 0, isUser: false, qualificationScore: 0 },
      archer2: { id: 'tbd', name: 'TBD', seed: 0, averageArrowScore: 0, isUser: false, qualificationScore: 0 },
      archer1Sets: 0,
      archer2Sets: 0,
      completed: false,
      scoreLog: [],
      isShootOff: false
    }
  ];
  rounds.push(finalsRound);

  return rounds;
};

export const simulateSet = (archer1Skill: number, archer2Skill: number): SetResult => {
  const scores1 = Array.from({ length: ARROWS_PER_SET }, () => Math.round(gaussianRandom(archer1Skill, 0.8)));
  const scores2 = Array.from({ length: ARROWS_PER_SET }, () => Math.round(gaussianRandom(archer2Skill, 0.8)));
  
  const points1: ArrowPoint[] = scores1.map(s => ({ score: s, ...getRandomPointForScore(s) }));
  const points2: ArrowPoint[] = scores2.map(s => ({ score: s, ...getRandomPointForScore(s) }));

  const sum1 = scores1.reduce((a, b) => a + b, 0);
  const sum2 = scores2.reduce((a, b) => a + b, 0);

  let pts1 = 0, pts2 = 0;

  if (sum1 > sum2) {
    pts1 = SET_POINTS_WIN;
  } else if (sum2 > sum1) {
    pts2 = SET_POINTS_WIN;
  } else {
    pts1 = SET_POINTS_DRAW;
    pts2 = SET_POINTS_DRAW;
  }

  return {
    archerScore: scores1,
    opponentScore: scores2,
    archerPoints: points1,
    opponentPoints: points2,
    archerSetPoints: pts1,
    opponentSetPoints: pts2
  };
};

export const simulateFullMatch = (a1: Archer, a2: Archer): Match => {
  let pts1 = 0, pts2 = 0, sets = 0;
  const logs: SetResult[] = [];

  while (pts1 < MATCH_WIN_POINTS && pts2 < MATCH_WIN_POINTS && sets < 5) {
    const res = simulateSet(a1.averageArrowScore, a2.averageArrowScore);
    pts1 += res.archerSetPoints;
    pts2 += res.opponentSetPoints;
    logs.push(res);
    sets++;
  }

  let shootOffResult: { archer1: number; archer2: number } | undefined = undefined;
  let winner: Archer;

  if (pts1 === 5 && pts2 === 5) {
    let s1 = -1, s2 = -1;
    while (s1 === s2) {
      s1 = Math.round(gaussianRandom(a1.averageArrowScore, 0.8));
      s2 = Math.round(gaussianRandom(a2.averageArrowScore, 0.8));
      if (s1 === s2) {
        if (Math.random() > 0.5) s1 += 0.1; else s2 += 0.1;
      }
    }
    shootOffResult = { archer1: Math.floor(s1), archer2: Math.floor(s2) };
    if (s1 > s2) {
      pts1 = 6;
      winner = a1;
    } else {
      pts2 = 6;
      winner = a2;
    }
  } else {
    winner = pts1 > pts2 ? a1 : a2;
  }

  return {
    id: `m-sim-${Math.random().toString(36).substr(2, 9)}`,
    roundName: "Simulated Match",
    archer1: a1,
    archer2: a2,
    archer1Sets: pts1,
    archer2Sets: pts2,
    completed: true,
    winner,
    scoreLog: logs,
    isShootOff: shootOffResult !== undefined,
    shootOffScores: shootOffResult
  };
};
