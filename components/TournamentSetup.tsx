
import React, { useState } from 'react';
import { BracketSize, TargetDistance } from '../types';

interface Props {
  onStart: (size: BracketSize, userName: string, skill: number, distance: TargetDistance, manualScore?: number) => void;
}

const TournamentSetup: React.FC<Props> = ({ onStart }) => {
  const [size, setSize] = useState<BracketSize>(32);
  const [name, setName] = useState('');
  const [skill, setSkill] = useState(8.5);
  const [distance, setDistance] = useState<TargetDistance>('18m');
  const [manualScore, setManualScore] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = manualScore === '' ? undefined : parseInt(manualScore);
    onStart(size, name || "Arrow Master", skill, distance, scoreVal);
  };

  const distances: TargetDistance[] = ['30m', '50m', '70m', '18m'];
  const maxPossible = distance === '18m' ? 600 : 720;

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border p-10 max-w-xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="inline-block p-5 bg-blue-50 text-blue-600 rounded-[24px] mb-5">
            <i className="fas fa-bullseye text-5xl"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight">Tournament Setup</h2>
        <p className="text-slate-500 mt-2 font-medium">Select your distance and configure your archer.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-3 ml-1">Archer Identity</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Robin Hood"
            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-slate-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
            <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-3 ml-1">Distance</label>
                <select 
                    value={distance} 
                    onChange={(e) => {
                      setDistance(e.target.value as TargetDistance);
                      setManualScore(''); // Reset on distance change
                    }}
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-slate-700 appearance-none cursor-pointer hover:border-slate-200 transition"
                >
                    {distances.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-3 ml-1">Draw Size</label>
                <select 
                    value={size} 
                    onChange={(e) => setSize(parseInt(e.target.value) as BracketSize)}
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-slate-700 appearance-none cursor-pointer hover:border-slate-200 transition"
                >
                    {[128, 64, 32, 16, 8].map(s => <option key={s} value={s}>{s} Archers</option>)}
                </select>
            </div>
        </div>

        <div>
          <label className="flex justify-between text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-3 ml-1">
            <span>Skill Level</span>
            <span className="text-blue-600 font-black">{skill.toFixed(1)} / 10.0</span>
          </label>
          <input
            type="range"
            min="5"
            max="10"
            step="0.1"
            value={skill}
            onChange={(e) => setSkill(parseFloat(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-black mt-3 px-1">
            <span>BEGINNER</span>
            <span>WORLD CLASS</span>
          </div>
        </div>

        <div className="pt-2">
            <label className="block text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-3 ml-1">
                Qual Score (Optional, Max {maxPossible})
            </label>
            <input
                type="number"
                min="0"
                max={maxPossible}
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                placeholder="Auto-generate if empty"
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-black text-slate-700"
            />
            <p className="text-[10px] text-slate-400 mt-2 px-1 font-bold">Leaving this empty will simulate a qualification round for you.</p>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[28px] shadow-2xl shadow-slate-200 transform transition active:scale-[0.97] flex items-center justify-center gap-4 text-xl uppercase tracking-tight"
        >
          Begin Tournament <i className="fas fa-arrow-right"></i>
        </button>
      </form>
    </div>
  );
};

export default TournamentSetup;
