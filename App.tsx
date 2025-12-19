
import React, { useState } from 'react';
import { Archer, Match, BracketSize, TargetDistance, TournamentState, TournamentHistory } from './types';
import { generateArcherList, createInitialBracket, simulateFullMatch } from './utils/archeryLogic';
import TournamentSetup from './components/TournamentSetup';
import MatchSimulator from './components/MatchSimulator';
import TournamentHistoryView from './components/TournamentHistoryView';
import QualificationTable from './components/QualificationTable';
import ResultDialog from './components/ResultDialog';
import BracketView from './components/BracketView';

const App: React.FC = () => {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [history, setHistory] = useState<TournamentHistory[]>([]);
  const [view, setView] = useState<'setup' | 'active' | 'history'>('setup');
  const [showRankings, setShowRankings] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<TournamentHistory | null>(null);

  const startTournament = (size: BracketSize, userName: string, skill: number, distance: TargetDistance, manualScore?: number) => {
    const archers = generateArcherList(size, skill, userName, distance, manualScore);
    const bracket = createInitialBracket(archers, size);
    
    let userMatchId = "";
    bracket[0].forEach(m => {
      if (m.archer1.isUser || m.archer2.isUser) userMatchId = m.id;
    });

    setTournament({
      id: Date.now().toString(),
      archers,
      bracket,
      currentRoundIndex: 0,
      activeMatchId: userMatchId,
      status: 'active',
      distance
    });
    setView('active');
  };

  const handleRetire = () => {
    if (!tournament) return;
    
    const newBracket = [...tournament.bracket];
    const roundIdx = tournament.currentRoundIndex;
    
    // Find the active user match and mark it as a 0-6 loss
    if (tournament.activeMatchId) {
      const matchIdx = newBracket[roundIdx].findIndex(m => m.id === tournament.activeMatchId);
      if (matchIdx !== -1) {
        const m = newBracket[roundIdx][matchIdx];
        const isUser1 = m.archer1.isUser;
        newBracket[roundIdx][matchIdx] = {
          ...m,
          completed: true,
          archer1Sets: isUser1 ? 0 : 6,
          archer2Sets: isUser1 ? 6 : 0,
          winner: isUser1 ? m.archer2 : m.archer1,
          scoreLog: [],
          isShootOff: false
        };
      }
    }

    // Simulate all other unfinished matches in the CURRENT round
    newBracket[roundIdx].forEach((m, idx) => {
      if (!m.completed && m.archer1.id !== 'tbd' && m.archer2.id !== 'tbd') {
        newBracket[roundIdx][idx] = simulateFullMatch(m.archer1, m.archer2);
      }
    });

    const user = tournament.archers.find(a => a.isUser);
    const newHistory: TournamentHistory = {
      id: tournament.id,
      date: new Date().toLocaleDateString(),
      bracketSize: tournament.archers.length,
      userName: user?.name || "User",
      userSkill: user?.averageArrowScore || 0,
      distance: tournament.distance,
      result: "Retired / Forfeited (0-6)",
      matches: newBracket.flat().filter(m => m.completed && (m.archer1.isUser || m.archer2.isUser)),
      fullBracket: newBracket,
      archers: tournament.archers
    };

    setHistory(prev => [newHistory, ...prev]);
    setTournament({ ...tournament, bracket: newBracket, status: 'finished' });
  };

  const concludeTournament = () => {
    setTournament(null);
    setView('setup');
  };

  const completeUserMatch = (match: Match) => {
    if (!tournament) return;

    const newBracket = [...tournament.bracket];
    const roundIdx = tournament.currentRoundIndex;
    const matchIdx = newBracket[roundIdx].findIndex(m => m.id === match.id);
    
    newBracket[roundIdx][matchIdx] = match;

    newBracket[roundIdx].forEach((m, idx) => {
      if (!m.completed && m.archer1.id !== 'tbd' && m.archer2.id !== 'tbd') {
        newBracket[roundIdx][idx] = simulateFullMatch(m.archer1, m.archer2);
      }
    });

    const userLost = match.winner && !match.winner.isUser;
    const isFinalRound = roundIdx === newBracket.length - 1;
    const isSemiFinalRound = roundIdx === newBracket.length - 2;

    if ((userLost && !isSemiFinalRound && !isFinalRound) || isFinalRound) {
      let finalStanding = "Participation";
      if (isFinalRound) {
        if (match.id === 'm-gold') {
          finalStanding = !userLost ? "Gold Medalist" : "Silver Medalist";
        } else {
          finalStanding = !userLost ? "Bronze Medalist" : "4th Place";
        }
      } else {
        finalStanding = `Lost in ${match.roundName}`;
      }

      const user = tournament.archers.find(a => a.isUser);
      const newHistory: TournamentHistory = {
        id: tournament.id,
        date: new Date().toLocaleDateString(),
        bracketSize: tournament.archers.length,
        userName: user?.name || "User",
        userSkill: user?.averageArrowScore || 0,
        distance: tournament.distance,
        result: finalStanding,
        matches: newBracket.flat().filter(m => m.completed && (m.archer1.isUser || m.archer2.isUser)),
        fullBracket: newBracket,
        archers: tournament.archers
      };
      
      setHistory(prev => [newHistory, ...prev]);
      setTournament({ ...tournament, bracket: newBracket, status: 'finished' });
      return;
    }

    const nextRoundIdx = roundIdx + 1;
    const currentRoundMatches = newBracket[roundIdx];

    if (isSemiFinalRound) {
      const m1 = currentRoundMatches[0];
      const m2 = currentRoundMatches[1];
      newBracket[nextRoundIdx][0].archer1 = m1.winner!;
      newBracket[nextRoundIdx][0].archer2 = m2.winner!;
      const l1 = m1.winner?.id === m1.archer1.id ? m1.archer2 : m1.archer1;
      const l2 = m2.winner?.id === m2.archer1.id ? m2.archer2 : m2.archer1;
      newBracket[nextRoundIdx][1].archer1 = l1;
      newBracket[nextRoundIdx][1].archer2 = l2;
    } else {
      const winners = currentRoundMatches.map(m => m.winner!);
      for (let i = 0; i < winners.length; i += 2) {
        const nextMatchIdx = i / 2;
        newBracket[nextRoundIdx][nextMatchIdx].archer1 = winners[i];
        newBracket[nextRoundIdx][nextMatchIdx].archer2 = winners[i+1];
      }
    }

    const nextUserMatch = newBracket[nextRoundIdx].find(m => m.archer1.isUser || m.archer2.isUser);
    setTournament({
      ...tournament,
      bracket: newBracket,
      currentRoundIndex: nextRoundIdx,
      activeMatchId: nextUserMatch?.id || null
    });
  };

  const user = tournament?.archers.find(a => a.isUser);
  const currentHistoryResult = history.find(h => h.id === tournament?.id)?.result || "Tournament Finished";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {showRankings && tournament && (
        <QualificationTable 
          archers={tournament.archers} 
          distance={tournament.distance}
          onClose={() => setShowRankings(false)} 
        />
      )}

      {selectedHistory && (
        <BracketView 
          bracket={selectedHistory.fullBracket}
          distance={selectedHistory.distance}
          archerCount={selectedHistory.archers.length}
          onClose={() => setSelectedHistory(null)}
        />
      )}

      {tournament?.status === 'finished' && user && (
        <ResultDialog 
          result={currentHistoryResult}
          user={user}
          matches={tournament.bracket.flat().filter(m => m.completed && (m.archer1.isUser || m.archer2.isUser))}
          onClose={concludeTournament}
        />
      )}
      
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
              <i className="fas fa-bullseye text-xl"></i>
            </div>
            <div>
                <h1 className="text-xl font-black tracking-tighter uppercase text-slate-800">Archery Pro</h1>
                <div className="text-[10px] font-black text-blue-600 tracking-widest uppercase -mt-1">Simulator</div>
            </div>
          </div>
          <nav className="flex gap-2">
            <button 
              onClick={() => {
                if (tournament?.status === 'active') setView('active');
                else setView('setup');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'setup' || (view === 'active' && tournament?.status === 'active') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Tournament
            </button>
            <button 
              onClick={() => setView('history')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'setup' && <TournamentSetup onStart={startTournament} />}
        {view === 'active' && tournament && (
          <MatchSimulator 
            tournament={tournament} 
            onMatchComplete={completeUserMatch}
            onReset={handleRetire}
            onShowRankings={() => setShowRankings(true)}
          />
        )}
        {view === 'history' && (
            <TournamentHistoryView 
                history={history} 
                onViewBracket={(hist) => setSelectedHistory(hist)} 
            />
        )}
      </main>
    </div>
  );
};

export default App;
