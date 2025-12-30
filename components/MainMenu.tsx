import React from 'react';
import { MissionBriefing, Difficulty } from '../types';
import { Skull, Crosshair, ShieldCheck } from 'lucide-react';
import { DIFFICULTY_SETTINGS } from '../constants';

interface MainMenuProps {
  onStart: () => void;
  loading: boolean;
  briefing: MissionBriefing | null;
  lastScore?: number;
  difficulty: Difficulty;
  onDifficultyChange: (diff: Difficulty) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onStart, loading, briefing, difficulty, onDifficultyChange 
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-slate-800 border-2 border-blue-500 rounded-xl p-8 text-center shadow-2xl">
        <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-wider">
          SKY <span className="text-blue-400">ACE</span>
        </h1>
        
        {loading ? (
             <div className="py-12 animate-pulse text-blue-300 font-mono">DECODING TRANSMISSION...</div>
          ) : briefing ? (
            <div className="space-y-6">
              <div className="bg-slate-900/80 p-5 rounded-lg border border-blue-500/30 text-left">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">{briefing.name}</h2>
                  <p className="text-slate-300 text-sm italic mb-4">"{briefing.objective}"</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => onDifficultyChange(key)}
                        className={`px-3 py-2 rounded text-xs font-bold border transition-all ${difficulty === key ? 'bg-blue-600 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                      >
                        {DIFFICULTY_SETTINGS[key].label}
                      </button>
                    ))}
                  </div>
              </div>

              <button 
                onClick={onStart}
                className="w-full py-4 px-6 rounded-lg font-bold text-lg uppercase bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center justify-center gap-2"
              >
                <Crosshair size={20} /> Engage Hostiles
              </button>
            </div>
          ) : (
            <div className="text-red-400">Failed to load mission.</div>
          )}
      </div>
    </div>
  );
};

export default MainMenu;