
import React from 'react';
import { Archer, Match } from '../types';

interface Props {
  result: string;
  user: Archer;
  matches: Match[];
  onClose: () => void;
}

const ResultDialog: React.FC<Props> = ({ result, user, matches, onClose }) => {
  const isWinner = result.includes('Gold') || result.includes('Champion');
  
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-10 text-center animate-in zoom-in slide-in-from-bottom-8 duration-500">
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl shadow-xl ${
          isWinner ? 'bg-yellow-100 text-yellow-600 shadow-yellow-200' : 'bg-blue-100 text-blue-600 shadow-blue-200'
        }`}>
          <i className={`fas ${isWinner ? 'fa-trophy' : 'fa-medal'}`}></i>
        </div>
        
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Tournament Over</h2>
        <div className="inline-block px-6 py-2 bg-slate-100 rounded-full font-black text-slate-600 uppercase tracking-widest text-xs mb-8">
          Final Standing: {result}
        </div>

        <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
            <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Archer</div>
                    <div className="font-bold text-slate-700">{user.name}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Matches</div>
                    <div className="font-bold text-slate-700">{matches.length} Rounds</div>
                </div>
                <div className="text-left">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Q-Rank</div>
                    <div className="font-bold text-slate-700">Seed #{user.seed}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Qual Score</div>
                    <div className="font-bold text-slate-700">{user.qualificationScore}</div>
                </div>
            </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition active:scale-95"
        >
          Return Home <i className="fas fa-home ml-2"></i>
        </button>
      </div>
    </div>
  );
};

export default ResultDialog;
