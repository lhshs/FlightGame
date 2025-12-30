import React from 'react';
import { MissionBriefing, Difficulty } from '../types';
import { Plane, Skull, Crosshair, ShieldCheck } from 'lucide-react';
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
  onStart, 
  loading, 
  briefing, 
  lastScore, 
  difficulty, 
  onDifficultyChange 
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-slate-800 border-2 border-blue-500 rounded-xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.3)] text-center relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500" />
        
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 tracking-wider">
          SKY <span className="text-blue-400">ACE</span>
        </h1>
        <p className="text-slate-400 text-sm mb-6 tracking-widest uppercase">Tactical Arcade Shooter</p>

        <div className="space-y-6">
          {loading ? (
             <div className="py-12 flex flex-col items-center animate-pulse">
                <div className="h-4 w-32 bg-slate-600 rounded mb-2"></div>
                <div className="h-10 w-48 bg-slate-700 rounded mb-4"></div>
                <p className="text-blue-300 text-sm font-mono">DECODING TRANSMISSION...</p>
             </div>
          ) : briefing ? (
            <>
              <div className="bg-slate-900/80 p-5 rounded-lg border border-blue-500/30 text-left relative group">
                  <h3 className="text-xs text-blue-400 uppercase font-bold tracking-widest mb-1">Incoming Transmission</h3>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">{briefing.name}</h2>
                  <p className="text-slate-300 leading-relaxed font-sans text-sm italic mb-4">
                      "{briefing.objective}"
                  </p>
                  
                  {/* Difficulty Selection */}
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Select Difficulty Level</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((key) => {
                        const isSelected = difficulty === key;
                        const config = DIFFICULTY_SETTINGS[key];
                        return (
                          <button
                            key={key}
                            onClick={() => onDifficultyChange(key)}
                            className={`
                              px-3 py-2 rounded text-xs font-bold transition-all border
                              ${isSelected 
                                ? 'bg-slate-700 border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                              }
                            `}
                            style={{ color: isSelected ? config.color : undefined }}
                          >
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
              </div>

              <button 
                onClick={onStart}
                className="group relative w-full py-4 px-6 rounded-lg font-bold text-lg tracking-widest uppercase transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                <span className="flex items-center justify-center gap-2">
                    <Crosshair className="group-hover:rotate-90 transition-transform duration-500" />
                    Engage Hostiles
                </span>
              </button>
            </>
          ) : (
            <div className="text-red-400">Failed to load mission data.</div>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-6 text-slate-500 text-[10px] uppercase font-bold tracking-tighter">
            <div className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-green-500" />
                <span>HP: {DIFFICULTY_SETTINGS[difficulty].playerHp}</span>
            </div>
             <div className="flex items-center gap-1">
                <Skull size={12} className="text-red-500" />
                <span>Danger: {difficulty === 'EXTREME' ? 'MAX' : 'High'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
