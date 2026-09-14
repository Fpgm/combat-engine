import React, { useState } from 'react';
import { Champion, TeamMember } from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { ITEMS } from '../data/items';
import { Play, RotateCcw, Sword, Settings, Zap } from 'lucide-react';

interface ExhibitionSandboxProps {
  onStartSandboxMatch: (blueRoster: TeamMember[], redRoster: TeamMember[]) => void;
}

export const ExhibitionSandbox: React.FC<ExhibitionSandboxProps> = ({ onStartSandboxMatch }) => {
  const [teamSize, setTeamSize] = useState<number>(4);
  const [blueSelection, setBlueSelection] = useState<string[]>(['aegis', 'kaelen', 'vortek', 'lyra']);
  const [redSelection, setRedSelection] = useState<string[]>(['ragnar', 'vespera', 'frostwing', 'darius']);

  const toggleBlueSelection = (id: string) => {
    if (blueSelection.includes(id)) {
      setBlueSelection(blueSelection.filter((c) => c !== id));
    } else if (blueSelection.length < teamSize) {
      setBlueSelection([...blueSelection, id]);
    }
  };

  const toggleRedSelection = (id: string) => {
    if (redSelection.includes(id)) {
      setRedSelection(redSelection.filter((c) => c !== id));
    } else if (redSelection.length < teamSize) {
      setRedSelection([...redSelection, id]);
    }
  };

  const handleLaunchMatch = () => {
    const blueRoster: TeamMember[] = blueSelection.map((id) => ({ championId: id }));
    const redRoster: TeamMember[] = redSelection.map((id) => ({ championId: id }));
    onStartSandboxMatch(blueRoster, redRoster);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2">
            <Sword className="w-6 h-6 text-amber-400" /> EXHIBITION SANDBOX ARENA
          </h2>
          <p className="text-xs text-slate-400 font-mono">Custom battle laboratory - pick any squad matchup to test mechanics</p>
        </div>

        {/* Team Size */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">TEAM SIZE:</span>
          {[3, 4, 5].map((size) => (
            <button
              key={size}
              onClick={() => {
                setTeamSize(size);
                setBlueSelection(blueSelection.slice(0, size));
                setRedSelection(redSelection.slice(0, size));
              }}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-colors ${
                teamSize === size
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {size}V{size}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Blue Squad Selector */}
        <div className="bg-slate-950 border border-sky-900/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-sky-400 font-mono mb-3">
            BLUE TEAM ({blueSelection.length}/{teamSize})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {CHAMPIONS.map((champ) => {
              const isSelected = blueSelection.includes(champ.id);
              return (
                <button
                  key={champ.id}
                  onClick={() => toggleBlueSelection(champ.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs truncate">{champ.name}</p>
                  <p className="text-[10px] text-sky-400 font-mono">{champ.role}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Red Squad Selector */}
        <div className="bg-slate-950 border border-rose-900/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-rose-400 font-mono mb-3">
            RED TEAM ({redSelection.length}/{teamSize})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {CHAMPIONS.map((champ) => {
              const isSelected = redSelection.includes(champ.id);
              return (
                <button
                  key={champ.id}
                  onClick={() => toggleRedSelection(champ.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs truncate">{champ.name}</p>
                  <p className="text-[10px] text-rose-400 font-mono">{champ.role}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={blueSelection.length < teamSize || redSelection.length < teamSize}
          onClick={handleLaunchMatch}
          className={`px-8 py-3 rounded-xl font-black text-sm shadow-lg transition-transform hover:scale-105 flex items-center gap-2 font-mono cursor-pointer ${
            blueSelection.length === teamSize && redSelection.length === teamSize
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5 fill-current" /> LAUNCH SIMULATION
        </button>
      </div>
    </div>
  );
};
