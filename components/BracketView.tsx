
import React from 'react';
import { Match, Archer, TargetDistance } from '../types';

interface Props {
  bracket: Match[][];
  distance: TargetDistance;
  archerCount: number;
  onClose: () => void;
}

const BracketView: React.FC<Props> = ({ bracket, distance, archerCount, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[50px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-10 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Tournament Bracket</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                <i className="fas fa-ruler-horizontal mr-2 text-blue-500"></i>
                Distance: {distance} | {archerCount} Archers
            </p>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-white shadow-md border flex items-center justify-center hover:bg-slate-100 rounded-full transition">
            <i className="fas fa-times text-2xl text-slate-400"></i>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-12 bg-slate-50 custom-scrollbar">
          <div className="flex gap-16 min-w-max h-full">
            {bracket.map((round, rIdx) => (
              <div key={rIdx} className="flex flex-col justify-around gap-12 min-w-[280px]">
                <h3 className="text-center font-black text-slate-400 uppercase text-[10px] tracking-[0.3em] sticky top-0 bg-slate-50/80 backdrop-blur py-4 z-10">
                  {round[0].roundName}
                </h3>
                {round.map((match, mIdx) => (
                  <div key={mIdx} className="relative">
                    <div className={`p-5 rounded-3xl border-2 transition-all group ${
                      match.completed ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-100/50 border-dashed border-slate-200'
                    }`}>
                      <div className={`flex justify-between items-center text-xs mb-4 px-1 ${match.winner?.id === match.archer1.id ? 'font-black text-blue-600' : 'text-slate-500'}`}>
                        <span className="truncate max-w-[160px] flex items-center">
                            <span className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-[9px] text-slate-500 mr-2 font-black">#{match.archer1.seed}</span>
                            {match.archer1.name}
                            {match.archer1.isUser && <span className="ml-1 text-[8px] bg-blue-100 text-blue-600 px-1 rounded font-black">YOU</span>}
                        </span>
                        <span className="text-lg font-black flex items-center gap-1">
                          {match.archer1Sets}
                          {match.isShootOff && match.archer1Sets === 6 && <span className="text-[8px] bg-slate-100 px-1 py-0.5 rounded text-slate-400">SO</span>}
                        </span>
                      </div>
                      
                      {match.completed && (
                        <div className="flex flex-wrap gap-1 mb-4 px-1 opacity-60">
                          {match.scoreLog.map((log, sIdx) => (
                            <div key={sIdx} className="flex flex-col items-center bg-slate-50 px-1.5 py-1 rounded border text-[9px] font-mono">
                              <span className={log.archerSetPoints > log.opponentSetPoints ? 'font-bold text-blue-600' : ''}>
                                {log.archerScore.reduce((a,b)=>a+b,0)}
                              </span>
                              <span className={log.opponentSetPoints > log.archerSetPoints ? 'font-bold text-red-600' : ''}>
                                {log.opponentScore.reduce((a,b)=>a+b,0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={`flex justify-between items-center text-xs px-1 ${match.winner?.id === match.archer2.id ? 'font-black text-blue-600' : 'text-slate-500'}`}>
                         <span className="truncate max-w-[160px] flex items-center">
                            <span className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-[9px] text-slate-500 mr-2 font-black">#{match.archer2.seed}</span>
                            {match.archer2.name}
                            {match.archer2.isUser && <span className="ml-1 text-[8px] bg-blue-100 text-blue-600 px-1 rounded font-black">YOU</span>}
                        </span>
                        <span className="text-lg font-black flex items-center gap-1">
                          {match.archer2Sets}
                          {match.isShootOff && match.archer2Sets === 6 && <span className="text-[8px] bg-slate-100 px-1 py-0.5 rounded text-slate-400">SO</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BracketView;
