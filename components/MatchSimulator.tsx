
import React, { useState, useEffect, useRef } from 'react';
import { TournamentState, Match, SetResult, ArrowPoint, Archer } from '../types';
import { ARROWS_PER_SET, MATCH_WIN_POINTS, DISTANCE_CONFIGS, SET_POINTS_WIN, SET_POINTS_DRAW } from '../constants';
import { getRandomPointForScore } from '../utils/archeryLogic';
import TargetFace from './TargetFace';
import BracketView from './BracketView';

// Wake Lock API types
interface WakeLockSentinel {
  release(): Promise<void>;
  readonly type: 'screen' | 'system';
}

interface NavigatorExtended extends Navigator {
  wakeLock?: {
    request(type: 'screen' | 'system'): Promise<WakeLockSentinel>;
  };
}

interface Props {
  tournament: TournamentState;
  onMatchComplete: (match: Match) => void;
  onReset: () => void;
  onShowRankings: () => void;
}

type TimerPhase = 'idle' | 'standby' | 'shooting';

const MatchSimulator: React.FC<Props> = ({ tournament, onMatchComplete, onReset, onShowRankings }) => {
  const activeMatch = tournament.bracket[tournament.currentRoundIndex].find(m => m.id === tournament.activeMatchId);
  
  if (!activeMatch) return null;
  const isUserArcher1 = activeMatch.archer1.isUser;
  const user = isUserArcher1 ? activeMatch.archer1 : activeMatch.archer2;
  const opponent = isUserArcher1 ? activeMatch.archer2 : activeMatch.archer1;
  const config = DISTANCE_CONFIGS[tournament.distance];

  const [userCurrentScores, setUserCurrentScores] = useState<number[]>([]);
  const [oppCurrentArrows, setOppCurrentArrows] = useState<ArrowPoint[]>([]);
  const [matchLogs, setMatchLogs] = useState<SetResult[]>([]);
  const [userPts, setUserPts] = useState(0);
  const [oppPts, setOppPts] = useState(0);
  const [showBracket, setShowBracket] = useState(false);
  
  const [isMatchShootOff, setIsMatchShootOff] = useState(false);
  const [shootOffData, setShootOffData] = useState<{ userArrow: ArrowPoint; oppArrow: ArrowPoint } | null>(null);

  // Timed Mode States
  const [timerPhase, setTimerPhase] = useState<TimerPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [scheduledOppShots, setScheduledOppShots] = useState<number[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const simulatingArrowRef = useRef(false);

  const playBuzzer = async (count: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      
      // Resume context if suspended (required for mobile)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const now = audioCtx.currentTime;
      const spacing = 1; // More spaced out buzzers
      
      for (let i = 0; i < count; i++) {
        const startTime = now + i * spacing;
        
        // Multiple oscillators for a richer, louder stadium sound
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, startTime);
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(405, startTime); // Slight detune for fatness
        
        // Louder volume
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        // "More reverb" effect via longer exponential decay tail
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.75);
        osc2.stop(startTime + 0.75);
      }
    } catch (e) {
      console.warn("Audio Context failed", e);
    }
  };

  const speak = (text: string) => {
    console.log('Playing sound for:', text);
    
    // Map score text to audio file names
    const soundMap: { [key: string]: string } = {
      'Ten': 'ten.mp3',
      '9': 'nine.mp3',
      '8': 'eight.mp3',
      '7': 'seven.mp3',
      '6': 'six.mp3',
      '5': 'five.mp3',
      '4': 'four.mp3',
      '3': 'three.mp3',
      '2': 'two.mp3',
      '1': 'one.mp3',
      'Miss': 'miss.mp3'
    };
    
    const soundFile = soundMap[text];
    if (!soundFile) {
      console.log('No sound file mapping found for:', text, '- skipping audio playback');
      return;
    }
    
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = 0.7; // Set volume to 70%
      
      // Handle audio load errors
      audio.addEventListener('error', (e) => {
        console.warn('Audio file failed to load:', soundFile, e);
      });
      
      // Resume audio context if needed for mobile
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          audio.play().catch(e => console.warn('Audio play failed:', e));
        }).catch(e => console.warn('Audio context resume failed:', e));
      } else {
        audio.play().catch(e => console.warn('Audio play failed:', e));
      }
    } catch (e) {
      console.warn('Audio creation failed:', e);
    }
  };

  const startTimedMode = async () => {
    if (userCurrentScores.length > 0 || oppCurrentArrows.length > 0) {
      if (!confirm("Start new timed set? Current arrow progress for this set will be lost.")) return;
    }
    setUserCurrentScores([]);
    setOppCurrentArrows([]);
    setTimerPhase('standby');
    setTimeLeft(10);
    
    const shots = [
      Math.floor(Math.random() * 10) + 70, 
      Math.floor(Math.random() * 10) + 40, 
      Math.floor(Math.random() * 6) + 10   
    ].sort((a, b) => b - a); 
    setScheduledOppShots(shots);
    await playBuzzer(2); // Two buzzers for standby
  };

  useEffect(() => {
    if (timerPhase === 'idle') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current) {
      console.log('Starting timer interval');
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          const nextValue = prev - 1;

          if (nextValue < 0) {
            if (timerPhase === 'standby') {
              setTimerPhase('shooting');
              playBuzzer(1); // One buzzer for start of shooting
              return 90;
            } else {
              setTimerPhase('idle');
              return 0;
            }
          }

          if (timerPhase === 'shooting') {
            setScheduledOppShots(currentShots => {
              if (currentShots.length > 0 && nextValue <= currentShots[0]) {
                simulateOpponentArrow(true); // Play sound in timed mode
                return currentShots.slice(1);
              }
              return currentShots;
            });
          }

          return nextValue;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerPhase]);

  useEffect(() => {
    const requestWakeLock = async () => {
      const nav = navigator as NavigatorExtended;
      if (nav.wakeLock && timerPhase !== 'idle') {
        try {
          wakeLockRef.current = await nav.wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake lock was released');
            wakeLockRef.current = null;
          });
        } catch (err) {
          console.warn('Wake lock request failed:', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (err) {
          console.warn('Wake lock release failed:', err);
        }
      }
    };

    if (timerPhase !== 'idle') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [timerPhase]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && timerPhase !== 'idle' && !wakeLockRef.current) {
        const nav = navigator as NavigatorExtended;
        if (nav.wakeLock) {
          try {
            wakeLockRef.current = await nav.wakeLock.request('screen');
            wakeLockRef.current.addEventListener('release', () => {
              console.log('Wake lock was released');
              wakeLockRef.current = null;
            });
          } catch (err) {
            console.warn('Wake lock re-request failed:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timerPhase]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const simulateOpponentArrow = (playSound: boolean = false) => {
    console.log('simulateOpponentArrow called, current length:', oppCurrentArrows.length, 'simulating:', simulatingArrowRef.current, 'playSound:', playSound);
    if (simulatingArrowRef.current || oppCurrentArrows.length >= ARROWS_PER_SET) {
      console.log('Already simulating or have enough arrows, returning');
      return;
    }

    simulatingArrowRef.current = true;

    const oppSkill = opponent.averageArrowScore;
    const oScore = Math.round(Math.max(0, Math.min(10, (Math.random() * 2 - 1) * 0.8 + oppSkill)));
    const oArrow = { score: oScore, ...getRandomPointForScore(oScore) };
    
    console.log('Generated opponent score:', oScore);
    setOppCurrentArrows(prev => {
      if (prev.length >= ARROWS_PER_SET) {
        simulatingArrowRef.current = false;
        return prev;
      }
      const updated = [...prev, oArrow];
      if (playSound) {
        speak(oScore === 10 ? "Ten" : oScore === 0 ? "Miss" : oScore.toString());
      }
      simulatingArrowRef.current = false;
      return updated;
    });
  };

  useEffect(() => {
    if (userCurrentScores.length === ARROWS_PER_SET && oppCurrentArrows.length === ARROWS_PER_SET) {
      if (timerPhase !== 'idle') {
        setTimerPhase('idle');
        if (timerRef.current) clearInterval(timerRef.current);
        playBuzzer(3); // Three buzzers for end of set (early finish)
      }
      processSetEnd();
    }
  }, [userCurrentScores, oppCurrentArrows]);

  const processSetEnd = () => {
    const userSum = userCurrentScores.reduce((a, b) => a + b, 0);
    const oppSum = oppCurrentArrows.reduce((a, b) => a + b.score, 0);
    
    let uSetPts = 0;
    let oSetPts = 0;

    if (userSum > oppSum) uSetPts = SET_POINTS_WIN;
    else if (oppSum > userSum) oSetPts = SET_POINTS_WIN;
    else { uSetPts = SET_POINTS_DRAW; oSetPts = SET_POINTS_DRAW; }

    const setLog: SetResult = {
      archerScore: isUserArcher1 ? userCurrentScores : oppCurrentArrows.map(a => a.score),
      opponentScore: isUserArcher1 ? oppCurrentArrows.map(a => a.score) : userCurrentScores,
      archerPoints: isUserArcher1 ? userCurrentScores.map(s => ({ score: s, ...getRandomPointForScore(s) })) : oppCurrentArrows,
      opponentPoints: isUserArcher1 ? oppCurrentArrows : userCurrentScores.map(s => ({ score: s, ...getRandomPointForScore(s) })),
      archerSetPoints: isUserArcher1 ? uSetPts : oSetPts,
      opponentSetPoints: isUserArcher1 ? oSetPts : uSetPts
    };

    const newUserPts = userPts + uSetPts;
    const newOppPts = oppPts + oSetPts;
    const newMatchLogs = [...matchLogs, setLog];

    setMatchLogs(newMatchLogs);
    setUserPts(newUserPts);
    setOppPts(newOppPts);
    setUserCurrentScores([]);
    setOppCurrentArrows([]);

    if (newUserPts === 5 && newOppPts === 5 && newMatchLogs.length >= 5) {
      setIsMatchShootOff(true);
      speak("Match tied. Shoot off.");
    }
  };

  const handleArrowInput = (score: number) => {
    if (isMatchOver && !isMatchShootOff) return;

    if (isMatchShootOff) {
      if (shootOffData) return; 
      const uArrow = { score, ...getRandomPointForScore(score) };
      const oScore = Math.round(Math.max(0, Math.min(10, (Math.random() * 2 - 1) * 0.8 + opponent.averageArrowScore)));
      const oArrow = { score: oScore, ...getRandomPointForScore(oScore) };
      
      setShootOffData({ userArrow: uArrow, oppArrow: oArrow });
      setOppCurrentArrows([oArrow]);
      speak(`You shot ${score}. Opponent shot ${oScore}.`);
      return;
    }

    if (userCurrentScores.length >= ARROWS_PER_SET) return;

    setUserCurrentScores(prev => [...prev, score]);

    if (timerPhase === 'idle' && oppCurrentArrows.length < ARROWS_PER_SET) {
      simulateOpponentArrow();
    }
  };

  const finishMatch = () => {
    if (!activeMatch) return;
    let winner = user;
    let finalUserPts = userPts;
    let finalOppPts = oppPts;

    if (isMatchShootOff && shootOffData) {
      if (shootOffData.userArrow.score === shootOffData.oppArrow.score) {
        winner = Math.random() > 0.5 ? user : opponent;
      } else {
        winner = shootOffData.userArrow.score > shootOffData.oppArrow.score ? user : opponent;
      }
      
      if (winner.id === user.id) {
        finalUserPts = 6;
        finalOppPts = 5;
      } else {
        finalUserPts = 5;
        finalOppPts = 6;
      }
    } else {
      winner = userPts > oppPts ? user : opponent;
    }

    onMatchComplete({
      ...activeMatch,
      archer1Sets: isUserArcher1 ? finalUserPts : finalOppPts,
      archer2Sets: isUserArcher1 ? finalOppPts : finalUserPts,
      completed: true,
      winner,
      scoreLog: matchLogs,
      isShootOff: isMatchShootOff,
      shootOffScores: shootOffData ? {
        archer1: isUserArcher1 ? shootOffData.userArrow.score : shootOffData.oppArrow.score,
        archer2: isUserArcher1 ? shootOffData.oppArrow.score : shootOffData.userArrow.score
      } : undefined
    });

    setUserPts(0);
    setOppPts(0);
    setMatchLogs([]);
    setIsMatchShootOff(false);
    setShootOffData(null);
    setUserCurrentScores([]);
    setOppCurrentArrows([]);
  };

  const isMatchOver = (userPts >= MATCH_WIN_POINTS || oppPts >= MATCH_WIN_POINTS) && !isMatchShootOff;
  const isFinalDecisionPending = isMatchOver || (isMatchShootOff && shootOffData);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {showBracket && (
        <BracketView 
            bracket={tournament.bracket} 
            distance={tournament.distance} 
            archerCount={tournament.archers.length} 
            onClose={() => setShowBracket(false)} 
        />
      )}
      
      {/* Management Bar */}
      <div className="bg-white p-4 md:p-6 rounded-[32px] border shadow-md flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
        <div className="flex flex-row gap-3 md:gap-4 flex-1">
            <button 
                onClick={onShowRankings}
                className="flex-1 py-4 md:py-5 px-6 bg-slate-900 text-white rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
                <i className="fas fa-list-ol text-lg md:text-xl"></i> 
                <span>View Rankings</span>
            </button>
            <button 
                onClick={() => setShowBracket(true)}
                className="flex-1 py-4 md:py-5 px-6 bg-blue-600 text-white rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
                <i className="fas fa-sitemap text-lg md:text-xl"></i> 
                <span>View Bracket</span>
            </button>
        </div>
        
        <div className="hidden lg:block h-12 w-px bg-slate-100 mx-2"></div>

        <button 
            onClick={() => { if(confirm("Are you sure you want to retire? This match will be forfeited 0-6.")) onReset(); }}
            className="py-3 px-6 text-red-500 hover:bg-red-50 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
        >
            <i className="fas fa-flag"></i> Withdraw & Retire
        </button>
      </div>

      {/* Scoreboard */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border shadow-sm gap-4 relative overflow-hidden">
        {/* Timer Overlay */}
        {timerPhase !== 'idle' && (
            <div className={`absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm pointer-events-none transition-all duration-500 ${timerPhase === 'standby' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                <div className="text-center animate-in zoom-in duration-300">
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-slate-500">
                        {timerPhase === 'standby' ? 'Ready - Standby' : 'Set Active'}
                    </div>
                    <div className={`text-6xl font-black tabular-nums drop-shadow-lg ${timerPhase === 'standby' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {timeLeft}
                    </div>
                </div>
            </div>
        )}
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-base md:text-lg shrink-0">
                #{user.seed}
            </div>
            <div className="flex-1">
                <h2 className="font-black text-slate-800 uppercase tracking-tight text-sm md:text-lg truncate">{user.name}</h2>
                <div className="flex gap-1 mt-1">
                    {Array.from({length: userPts}).map((_, i) => <div key={i} className="w-3 md:w-5 h-1.5 md:h-2.5 bg-blue-600 rounded-full"></div>)}
                    {Array.from({length: 6 - userPts}).map((_, i) => <div key={i} className="w-3 md:w-5 h-1.5 md:h-2.5 bg-slate-100 rounded-full"></div>)}
                </div>
            </div>
        </div>
        <div className="text-center px-4 sm:px-8 border-y sm:border-y-0 sm:border-x border-slate-50 w-full sm:w-auto py-2 sm:py-0">
            <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{activeMatch.roundName}</div>
            <div className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter leading-none">{userPts} - {oppPts}</div>
            <div className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{tournament.distance}</div>
        </div>
        <div className="flex items-center gap-3 text-right w-full sm:w-auto justify-end">
            <div className="flex-1">
                <h2 className="font-black text-slate-800 uppercase tracking-tight text-sm md:text-lg truncate">{opponent.name}</h2>
                <div className="flex gap-1 justify-end mt-1">
                    {Array.from({length: oppPts}).map((_, i) => <div key={i} className="w-3 md:w-5 h-1.5 md:h-2.5 bg-red-600 rounded-full"></div>)}
                    {Array.from({length: 6 - oppPts}).map((_, i) => <div key={i} className="w-3 md:w-5 h-1.5 md:h-2.5 bg-slate-100 rounded-full"></div>)}
                </div>
            </div>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-base md:text-lg shrink-0">
                #{opponent.seed}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Input & Target Card */}
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[48px] border shadow-xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-4 left-6 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-bullseye"></i> Live Target
          </div>

          {!isFinalDecisionPending && (
            <div className="absolute top-4 right-6 flex items-center gap-2">
                <button 
                  onClick={startTimedMode}
                  disabled={timerPhase !== 'idle'}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${timerPhase !== 'idle' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 shadow-sm'}`}
                >
                    <i className={`fas ${timerPhase === 'idle' ? 'fa-stopwatch' : 'fa-hourglass-half'}`}></i>
                    {timerPhase === 'idle' ? 'Start Timed Set' : 'Timed Mode Active'}
                </button>
            </div>
          )}

          <div className="mb-6 md:mb-10 w-full max-w-[280px] md:max-w-[340px] mt-6">
            <TargetFace 
                arrows={oppCurrentArrows} 
                type={config.type as any} 
                size={340}
            />
          </div>

          {!isFinalDecisionPending ? (
            <div className="space-y-4 md:space-y-6 w-full">
              <div className="flex justify-center items-center gap-4 md:gap-12 mb-2">
                 <div className="flex gap-1.5 md:gap-3">
                    {userCurrentScores.map((s, i) => (
                        <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-blue-500 bg-white flex items-center justify-center font-black text-blue-600 shadow-sm animate-in zoom-in">
                            {s === 10 ? 'X' : s}
                        </div>
                    ))}
                    {!isMatchShootOff && Array.from({length: 3 - userCurrentScores.length}).map((_, i) => (
                        <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200"></div>
                    ))}
                 </div>
                 
                 <div className="text-slate-200 font-black italic text-sm md:text-xl">VS</div>

                 <div className="flex gap-1.5 md:gap-3">
                    {oppCurrentArrows.map((a, i) => (
                        <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-red-500 bg-white flex items-center justify-center font-black text-red-600 shadow-sm animate-in zoom-in">
                            {a.score === 10 ? 'X' : a.score}
                        </div>
                    ))}
                    {!isMatchShootOff && Array.from({length: 3 - oppCurrentArrows.length}).map((_, i) => (
                        <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200"></div>
                    ))}
                 </div>
              </div>

              {isMatchShootOff && (
                  <div className="text-center py-2 bg-red-600 text-white font-black rounded-xl text-[10px] animate-pulse uppercase tracking-widest shadow-lg">
                    ONE ARROW SHOOT-OFF!
                  </div>
              )}

              <div className="grid grid-cols-3 xs:grid-cols-6 gap-2">
                {[10, 9, 8, 7, 6, 0].map(s => (
                  <button 
                    key={s} 
                    onClick={() => handleArrowInput(s)}
                    disabled={timerPhase === 'standby' || userCurrentScores.length >= ARROWS_PER_SET}
                    className={`py-3 md:py-5 border rounded-xl md:rounded-[24px] font-black transition active:scale-90 text-sm ${timerPhase === 'standby' || userCurrentScores.length >= ARROWS_PER_SET ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50' : 'bg-slate-50 border-slate-100 hover:border-blue-500 text-slate-700'}`}
                  >
                    {s === 0 ? 'MISS' : s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 w-full">
                <div className="text-3xl md:text-5xl mb-4">{isMatchShootOff ? '🎯' : '🏆'}</div>
                <h3 className="text-lg md:text-2xl font-black text-slate-800 mb-2 uppercase">
                  {isMatchShootOff ? 'Shoot-off Over' : 'Match Result'}
                </h3>
                {isMatchShootOff && shootOffData && (
                  <div className="mb-6 flex justify-center items-center gap-4">
                    <div className="text-blue-600 font-black text-xl">YOU: {shootOffData.userArrow.score}</div>
                    <div className="text-slate-200 font-black italic">vs</div>
                    <div className="text-red-600 font-black text-xl">OPP: {shootOffData.oppArrow.score}</div>
                  </div>
                )}
                <button 
                  onClick={finishMatch}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition uppercase tracking-widest text-xs"
                >
                  Confirm Match Result
                </button>
            </div>
          )}
        </div>

        {/* History Log Card */}
        <div className="bg-slate-900 rounded-2xl md:rounded-[48px] p-6 md:p-10 text-white shadow-xl flex flex-col min-h-[300px]">
            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6 shrink-0">Match Log</h3>
            
            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 max-h-[400px]">
                {matchLogs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 py-8">
                        <i className="fas fa-scroll text-3xl mb-4"></i>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Empty Scorecard</p>
                    </div>
                )}
                {matchLogs.map((log, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 md:p-5 border border-white/10">
                        <div className="flex justify-between text-[8px] md:text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">
                            <span>Set {i+1}</span>
                            <span className="text-white">
                                {isUserArcher1 ? log.archerScore.reduce((a,b)=>a+b,0) : log.opponentScore.reduce((a,b)=>a+b,0)} vs {isUserArcher1 ? log.opponentScore.reduce((a,b)=>a+b,0) : log.archerScore.reduce((a,b)=>a+b,0)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="flex-1 flex gap-1 flex-wrap">
                                {(isUserArcher1 ? log.archerScore : log.opponentScore).map((s, idx) => <span key={idx} className="w-6 h-6 bg-blue-600/20 text-blue-300 border border-blue-400/20 rounded flex items-center justify-center font-black text-[10px]">{s}</span>)}
                            </div>
                            <div className="px-3 py-1 bg-white text-slate-900 rounded-lg font-black text-[10px] shrink-0">
                                {isUserArcher1 ? log.archerSetPoints : log.opponentSetPoints}-{isUserArcher1 ? log.opponentSetPoints : log.archerSetPoints}
                            </div>
                            <div className="flex-1 flex gap-1 flex-wrap justify-end">
                                {(isUserArcher1 ? log.opponentScore : log.archerScore).map((s, idx) => <span key={idx} className="w-6 h-6 bg-red-600/20 text-red-300 border border-red-400/20 rounded flex items-center justify-center font-black text-[10px]">{s}</span>)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 shrink-0">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-black uppercase tracking-widest">User Ranking Info</span>
                    <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">Q: {user.qualificationScore}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSimulator;
