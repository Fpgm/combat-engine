import React from 'react';
import { PlayerManagerProfile } from '../types/game';
import { Trophy, Coins, Sword, BookOpen, Users, FlaskConical, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/sound';

interface NavbarProps {
  activeView: 'hq' | 'codex' | 'sandbox' | 'draft' | 'arena';
  setActiveView: (view: 'hq' | 'codex' | 'sandbox') => void;
  profile: PlayerManagerProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView, profile }) => {
  const [muted, setMuted] = React.useState(!isSoundEnabled());

  const handleToggleAudio = () => {
    const next = !muted;
    setMuted(next);
    setSoundEnabled(!next);
  };

  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* LOGO */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg border border-amber-300">
            TM
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white font-mono flex items-center gap-1.5">
              TEAMFIGHT MANAGER <span className="text-xs text-amber-400 font-bold">AUTO BATTLER</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Esports League & Champion Tactics Simulator</p>
          </div>
        </div>

        {/* MAIN NAVIGATION BUTTONS */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveView('hq')}
            className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'hq' || activeView === 'draft' || activeView === 'arena'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> MANAGER HQ
          </button>

          <button
            onClick={() => setActiveView('codex')}
            className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'codex'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> HERO CODEX
          </button>

          <button
            onClick={() => setActiveView('sandbox')}
            className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'sandbox'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> SANDBOX ARENA
          </button>
        </div>

        {/* PROFILE & SOUND */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Coins className="w-4 h-4" /> ${profile.funds}
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Trophy className="w-4 h-4" /> {profile.division.toUpperCase()} ({profile.divisionPoints} LP)
            </div>
          </div>

          <button
            onClick={handleToggleAudio}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors"
            title="Toggle Sound Effects"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
