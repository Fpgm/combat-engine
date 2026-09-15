import React, { useState } from 'react';
import type { Champion, TeamMember } from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { playDraftPickSound } from '../utils/sound';
import { ArrowLeft } from 'lucide-react';

interface TfmDraftProps {
  blueTeamName: string;
  redTeamName: string;
  opponentPool?: Champion[];
  teamSize: number;
  onDraftComplete: (blueRoster: TeamMember[], redRoster: TeamMember[]) => void;
}

export const TfmDraft: React.FC<TfmDraftProps> = ({ blueTeamName, redTeamName, opponentPool, teamSize, onDraftComplete }) => {
  const [blueRoster, setBlueRoster] = useState<TeamMember[]>([]);
  const [redRoster, setRedRoster] = useState<TeamMember[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [draftPhase, setDraftPhase] = useState<'blue' | 'red'>('blue');
  const [pickedChampions, setPickedChampions] = useState<string[]>([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);

  const currentPool = draftPhase === 'blue'
    ? CHAMPIONS.filter((c) => !pickedChampions.includes(c.id))
    : opponentPool?.filter((c) => !pickedChampions.includes(c.id)) || [];

  const handlePick = (champion: Champion) => {
    playDraftPickSound();
    const newPick = { championId: champion.id, name: champion.name, level: 1, items: [], mastery: { championId: champion.id, level: 1, matchesPlayed: 1, wins: 0 } };

    if (draftPhase === 'blue') {
      setBlueRoster([...blueRoster, newPick]);
    } else {
      setRedRoster([...redRoster, newPick]);
    }
    setPickedChampions([...pickedChampions, champion.id]);
    setSelectedChampion(null);

    const nextIndex = currentPickIndex + 1;
    if (nextIndex >= teamSize * 2) {
      onDraftComplete(blueRoster.concat(newPick), redRoster);
      return;
    }
    setCurrentPickIndex(nextIndex);
    setDraftPhase(nextIndex % 2 === 0 ? 'blue' : 'red');
  };

  const handleRemoveLast = () => {
    if (draftPhase === 'blue' && blueRoster.length > 0) {
      const removed = blueRoster[blueRoster.length - 1];
      setBlueRoster(blueRoster.slice(0, -1));
      setPickedChampions(pickedChampions.filter((id) => id !== removed.championId));
    } else if (draftPhase === 'red' && redRoster.length > 0) {
      const removed = redRoster[redRoster.length - 1];
      setRedRoster(redRoster.slice(0, -1));
      setPickedChampions(pickedChampions.filter((id) => id !== removed.championId));
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-4">
      <div className="flex items-center justify-between w-full max-w-4xl mb-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-400 hover:text-white font-mono text-sm">
          <ArrowLeft size={16} /> BACK
        </button>
        <h2 className="font-black text-2xl font-mono text-emerald-400">TFM DRAFT - FAST TEAMFIGHT</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-mono text-sm text-blue-400">{blueTeamName} ({blueRoster.length}/{teamSize})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-mono text-sm text-red-400">{redTeamName} ({redRoster.length}/{teamSize})</span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col gap-2 bg-slate-900 rounded-xl p-4 border border-slate-700">
          <h3 className="font-black font-mono text-blue-400 text-sm">BLUE ROSTER</h3>
          {blueRoster.map((member, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-blue-300">{member.name}</span>
            </div>
          ))}
          {blueRoster.length === 0 && <p className="text-slate-500 font-mono text-xs">Waiting for picks...</p>}
        </div>
        <div className="col-span-1 flex flex-col gap-2 bg-slate-900 rounded-xl p-4 border border-slate-700">
          <h3 className="font-black font-mono text-slate-300 text-sm">SELECT CHAMPION</h3>
          {selectedChampion ? (
            <button onClick={() => handlePick(selectedChampion)} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg font-mono text-sm">
              CONFIRM {selectedChampion.name}
            </button>
          ) : (
            <p className="text-slate-500 font-mono text-xs">Click a champion below to select</p>
          )}
          <button onClick={handleRemoveLast} className="mt-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-mono text-xs rounded-lg">
            UNDO LAST PICK
          </button>
        </div>
        <div className="col-span-1 flex flex-col gap-2 bg-slate-900 rounded-xl p-4 border border-slate-700">
          <h3 className="font-black font-mono text-red-400 text-sm">RED ROSTER</h3>
          {redRoster.map((member, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-red-300">{member.name}</span>
            </div>
          ))}
          {redRoster.length === 0 && <p className="text-slate-500 font-mono text-xs">Waiting for picks...</p>}
        </div>
      </div>
      <div className="w-full max-w-4xl mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {currentPool.slice(0, 8).map((champion) => (
          <button
            key={champion.id}
            onClick={() => { setSelectedChampion(champion); playDraftPickSound(); }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl p-3 text-center cursor-pointer transition-colors"
          >
            <div className="text-2xl mb-1">{champion.avatarIcon}</div>
            <div className="font-mono text-xs text-white">{champion.name}</div>
            <div className="font-mono text-xs text-slate-400">{champion.role}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
