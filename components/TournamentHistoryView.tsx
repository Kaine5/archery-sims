
import React from 'react';
import { TournamentHistory } from '../types';

interface Props {
  history: TournamentHistory[];
  onViewBracket: (history: TournamentHistory) => void;
}

const TournamentHistoryView: React.FC<Props> = ({ history, onViewBracket }) => {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 text-center">
        <div className="text-slate-300 text-5xl mb-4">
          <i className="fas fa-history"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-400">No Tournament History Yet</h3>
        <p className="text-slate-400 mt-2">Complete your first bracket to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Tournament Records</h2>
            <p className="text-slate-500 font-medium">Click any record to view the full bracket run.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {history.map((item) => (
          <button 
            key={item.id} 
            onClick={() => onViewBracket(item)}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left transition hover:shadow-lg hover:border-blue-200 group active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full uppercase tracking-widest">
                  {item.bracketSize} Bracket • {item.distance}
                </span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.date}</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition">{item.userName}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter opacity-70">
                Skill: {item.userSkill.toFixed(1)} | Seed: #{item.archers.find(a => a.isUser)?.seed}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border ${
                item.result.includes('Gold') || item.result.includes('Champion') || item.result.includes('Medal')
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {item.result}
              </div>
              <div className="text-[10px] text-slate-400 mt-3 uppercase font-black tracking-widest">
                <i className="fas fa-chevron-right mr-2 group-hover:translate-x-1 transition-transform"></i>
                View Bracket
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TournamentHistoryView;
