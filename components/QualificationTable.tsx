
import React from 'react';
import { Archer, TargetDistance } from '../types';

interface Props {
  archers: Archer[];
  distance: TargetDistance;
  onClose: () => void;
}

const QualificationTable: React.FC<Props> = ({ archers, distance, onClose }) => {
  const arrowCount = distance === '18m' ? 60 : 72;
  
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Qualification Results</h2>
            <p className="text-sm text-slate-500 font-medium">Rankings based on {arrowCount}-arrow simulation</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-slate-200 rounded-full transition">
            <i className="fas fa-times text-xl text-slate-400"></i>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">
                <th className="pb-4 pl-4">Rank</th>
                <th className="pb-4">Archer</th>
                <th className="pb-4 text-right pr-4">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {archers.map((a) => (
                <tr key={a.id} className={`group transition-all ${a.isUser ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                  <td className="py-4 pl-6 rounded-l-2xl font-black text-sm">
                    {a.seed}
                  </td>
                  <td className="py-4 font-bold text-sm">
                    {a.name}
                    {a.isUser && <span className="ml-2 text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded">You</span>}
                  </td>
                  <td className="py-4 pr-6 text-right rounded-r-2xl font-mono font-bold">
                    {a.qualificationScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-50 border-t text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Standard {arrowCount}-Arrow {distance} Round Format
            </p>
        </div>
      </div>
    </div>
  );
};

export default QualificationTable;
