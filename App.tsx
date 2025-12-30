import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import { generateMissionBriefing } from './services/geminiService';
import { GameState, MissionBriefing, Difficulty } from './types';
import { Volume2, VolumeX } from 'lucide-react';
import { DIFFICULTY_SETTINGS } from './constants';
import { soundService } from './services/soundService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING_MISSION);
  const [score, setScore] = useState(0);
  const [briefing, setBriefing] = useState<MissionBriefing | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('INTERMEDIATE');
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    loadMission();
  }, []);

  const loadMission = async () => {
    setGameState(GameState.LOADING_MISSION);
    const mission = await generateMissionBriefing();
    setBriefing(mission);
    setGameState(GameState.MENU);
  };

  const startGame = () => {
    // Crucial: Call init() on user click to unlock AudioContext
    soundService.init().then(() => {
      setGameState(GameState.PLAYING);
      setScore(0);
      soundService.startBgm();
    });
  };

  const restartGame = () => {
    soundService.stopBgm();
    loadMission();
  };

  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
      soundService.stopBgm();
    }
  }, [gameState]);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    // Direct call within click handler for browser policy
    soundService.setEnabled(nextState);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative font-sans select-none overflow-hidden text-white">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80"></div>
        <div className="absolute w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] top-[-100px] left-[-100px]"></div>
        <div className="absolute w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] bottom-[-100px] right-[-100px]"></div>
      </div>

      {/* Header UI */}
      <div className="z-10 w-full max-w-4xl flex justify-between items-center mb-4 px-4">
        <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-display font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                SKY ACE
            </h1>
            <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              LVL: {DIFFICULTY_SETTINGS[difficulty].label}
            </span>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Score</p>
                <p className="text-2xl font-mono font-bold text-yellow-400">{score.toLocaleString()}</p>
            </div>
            <button 
                onClick={toggleSound}
                className={`p-2 rounded-full transition-all border ${soundEnabled ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative z-0 shadow-2xl w-full max-w-[800px]">
        <GameCanvas 
            gameState={gameState} 
            setGameState={setGameState} 
            setScore={setScore} 
            missionName={briefing?.name || 'Unknown'}
            difficulty={difficulty}
        />

        {/* Menu Overlay */}
        {(gameState === GameState.MENU || gameState === GameState.LOADING_MISSION) && (
            <MainMenu 
                onStart={startGame} 
                loading={gameState === GameState.LOADING_MISSION}
                briefing={briefing}
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
            />
        )}

        {/* Game Over Overlay */}
        {gameState === GameState.GAME_OVER && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                <div className="text-center p-8 border-y-4 border-red-600 bg-black/50 w-full animate-in fade-in zoom-in duration-300">
                    <h2 className="text-5xl md:text-7xl font-display font-bold text-red-500 mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">MISSION FAILED</h2>
                    <p className="text-slate-300 text-lg mb-6">Your aircraft has been destroyed in {DIFFICULTY_SETTINGS[difficulty].label} mode.</p>
                    <div className="mb-8">
                        <span className="text-slate-500 text-sm uppercase block mb-1 tracking-widest">Final Score</span>
                        <span className="text-4xl font-mono text-yellow-400 font-bold">{score.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={restartGame}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded text-lg uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                    >
                        Re-Deploy
                    </button>
                </div>
             </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-slate-600 text-[10px] font-mono z-10 flex gap-4 uppercase tracking-widest">
        <span>AI Wingman Active</span>
        <span>•</span>
        <span>Sector Alpha-9</span>
      </div>
    </div>
  );
};

export default App;