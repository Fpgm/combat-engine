import React, { useState, useMemo, useCallback } from 'react';
import type { Champion, TeamMember } from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { playDraftPickSound } from '../utils/sound';
import { ArrowLeft, Sword, Shield, Crosshair } from 'lucide-react';

// State machine phases
type DraftPhase = 'ban' | 'pick' | 'tactics';
type BanTeam = 'blue' | 'red' | null;
type PickTeam = 'blue' | 'red';

interface TfmDraftProps {
  blueTeamName: string;
  redTeamName: string;
  opponentPool?: string[];
  teamSize: number;
  onDraftComplete: (blueRoster: TeamMember[], redRoster: TeamMember[]) => void;
}

export const TfmDraft: React.FC<TfmDraftProps> = ({
  blueTeamName,
  redTeamName,
  opponentPool = [],
  teamSize,
  onDraftComplete,
}) => {
  // State machine — TFM: faster draft, fewer bans
  const [draftPhase, setDraftPhase] = useState<DraftPhase>('ban');
  const [banTeam, setBanTeam] = useState<BanTeam>('blue');
  const [pickTeam, setPickTeam] = useState<PickTeam>('blue');
  const [bannedIds, setBannedIds] = useState<string[]>([]);
  const [pickedChampionIds, setPickedChampionIds] = useState<string[]>([]);
  const [blueBans, setBlueBans] = useState<string[]>([]);
  const [redBans, setRedBans] = useState<string[]>([]);
  const [bluePicks, setBluePicks] = useState<TeamMember[]>([]);
  const [redPicks, setRedPicks] = useState<TeamMember[]>([]);
  const [aiThinking, setAiThinking] = useState(false);

  // TFM: 2 bans total (1 per team) instead of teamSize*2
  const totalBans = 2;
  const availableChampions = useMemo(() => {
    return CHAMPIONS.filter((c) => {
      if (bannedIds.includes(c.id)) return false;
      if (pickedChampionIds.includes(c.id)) return false;
      return true;
    });
  }, [bannedIds, pickedChampionIds]);

  const aiSelectBan = useCallback((currentBans: string[]): string => {
    const remaining = CHAMPIONS.filter((c) => !currentBans.includes(c.id));
    return remaining[Math.floor(Math.random() * remaining.length)].id;
  }, []);

  const aiSelectPick = useCallback((currentPicks: string[], oppPool: string[]): string => {
    const available = CHAMPIONS.filter((c) => !currentPicks.includes(c.id) && !bannedIds.includes(c.id));
    const fromPool = available.find((c) => oppPool.includes(c.id));
    if (fromPool) return fromPool.id;
    return available[Math.floor(Math.random() * available.length)].id;
  }, [bannedIds, oppPool]);

  const handleBanChampion = (champ: Champion) => {
    if (draftPhase !== 'ban') return;
    if (banTeam === null) return;
    if (aiThinking) return;

    playDraftPickSound();

    if (banTeam === 'blue') {
      const newBlueBans = [...blueBans, champ.id];
      setBlueBans(newBlueBans);
      setBannedIds([...bannedIds, champ.id]);
    } else {
      const newRedBans = [...redBans, champ.id];
      setRedBans(newRedBans);
      setBannedIds([...bannedIds, champ.id]);
    }

    const totalBansSoFar = blueBans.length + redBans.length + 1;
    if (totalBansSoFar >= totalBans) {
      setDraftPhase('pick');
      setBanTeam(null);
      setPickTeam('blue');
    } else {
      setBanTeam(banTeam === 'blue' ? 'red' : 'blue');
    }
  };

  const handlePickChampion = (champ: Champion) => {
    if (draftPhase !== 'pick') return;
    if (pickTeam === null) return;
    if (aiThinking) return;
    if (pickedChampionIds.includes(champ.id)) return;
    if (bannedIds.includes(champ.id)) return;

    playDraftPickSound();

    const newPick = {
      championId: champ.id,
      name: champ.name,
      level: 1,
      items: [],
      mastery: { championId: champ.id, level: 1, matchesPlayed: 1, wins: 0 },
    };

    if (pickTeam === 'blue') {
      const newBlue = [...bluePicks, newPick];
      setBluePicks(newBlue);
      const allPickedIds = [...pickedChampionIds, champ.id];
      setPickedChampionIds(allPickedIds);

      if (newBlue.length >= teamSize) {
        setAiThinking(true);
        const neededRed = teamSize - redPicks.length;
        const allRedPicks = [...redPicks];
        const allPickedIds = [...pickedChampionIds, champ.id];

        for (let i = 0; i < neededRed; i++) {
          const aiPickId = aiSelectPick(allPickedIds, opponentPool);
          if (aiPickId && !allPickedIds.includes(aiPickId)) {
            const aiChamp = CHAMPIONS.find((c) => c.id === aiPickId);
            if (aiChamp) {
              allRedPicks.push({
                championId: aiChamp.id,
                name: aiChamp.name,
                level: 1,
                items: [],
                mastery: { championId: aiChamp.id, level: 1, matchesPlayed: 1, wins: 0 },
              });
              allPickedIds.push(aiPickId);
            }
          }
        }

        setTimeout(() => {
          setRedPicks(allRedPicks);
          setPickedChampionIds(allPickedIds);
          setAiThinking(false);
          setDraftPhase('tactics');
          setPickTeam(null);
        }, 300); // TFM: faster than MOBA
      } else {
        setPickTeam('red');
      }
    } else {
      const newRed = [...redPicks, newPick];
      setRedPicks(newRed);
      const allPickedIds = [...pickedChampionIds, champ.id];
      setPickedChampionIds(allPickedIds);
      setPickTeam('blue');
    }
  };

  const handleTacticsConfirm = () => {
    onDraftComplete(bluePicks, redPicks);
  };

  const handleUndoLastBan = () => {
    if (draftPhase !== 'ban') return;
    let removedId: string | null = null;
    if (banTeam === 'blue' && blueBans.length > 0) {
      removedId = blueBans[blueBans.length - 1];
      setBlueBans(blueBans.slice(0, -1));
    } else if (banTeam === 'red' && redBans.length > 0) {
      removedId = redBans[redBans.length - 1];
      setRedBans(redBans.slice(0, -1));
    }
    if (removedId) {
      setBannedIds(bannedIds.filter((id) => id !== removedId));
    }
  };

  const getStatusText = () => {
    if (draftPhase === 'ban') {
      const bansLeft = totalBans - (blueBans.length + redBans.length);
      return `BAN — ${banTeam?.toUpperCase() || 'BLUE'} bans next (${bansLeft} left)`;
    }
    if (draftPhase === 'pick') {
      return `PICK — ${pickTeam?.toUpperCase() || 'BLUE'} (${bluePicks.length}/${teamSize} B, ${redPicks.length}/${teamSize} R)`;
    }
    return `TACTICS — Confirm formations`;
  };

  return (
    <div className="flex flex-col items-center w-full p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-400 hover:text-white font-mono text-sm">
          <ArrowLeft size={16} /> BACK
        </button>
        <h2 className="font-black text-2xl font-mono text-emerald-400">TFM DRAFT — {teamSize}v{teamSize} FAST</h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-emerald-400">{getStatusText()}</span>
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div className="w-full max-w-4xl flex items-center justify-center gap-2 mb-4">
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${draftPhase === 'ban' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          1. BAN ({bannedIds.length}/{totalBans})
        </div>
        <span className="text-slate-600">→</span>
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${draftPhase === 'pick' ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          2. PICK ({bluePicks.length + redPicks.length}/{teamSize * 2})
        </div>
        <span className="text-slate-600">→</span>
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${draftPhase === 'tactics' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          3. FORMATION
        </div>
      </div>

      {/* BAN PHASE */}
      {draftPhase === 'ban' && (
        <div className="w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-xl p-6">
          <h3 className="font-black text-amber-400 font-mono mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" /> BAN PHASE — {banTeam?.toUpperCase() || 'BLUE'} bans next
          </h3>
          {aiThinking && <div className="text-slate-400 font-mono text-sm mb-3 animate-pulse">AI is selecting...</div>}
          <div className="flex flex-wrap gap-2 mb-4">
            {bannedIds.map((id) => {
              const champ = CHAMPIONS.find((c) => c.id === id);
              return (
                <span key={id} className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-xs font-mono text-red-300">
                  🚫 {champ?.name || id}
                </span>
              );
            })}
            {bannedIds.length === 0 && <span className="text-slate-500 font-mono text-xs">No bans yet</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableChampions.slice(0, 12).map((champ) => (
              <button
                key={champ.id}
                onClick={() => handleBanChampion(champ)}
                disabled={aiThinking}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl p-3 text-center cursor-pointer transition-colors disabled:opacity-50"
              >
                <div className="text-xl mb-1">{champ.avatarIcon}</div>
                <div className="font-mono text-xs text-white">{champ.name}</div>
                <div className="font-mono text-xs text-slate-400">{champ.role}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <button onClick={handleUndoLastBan} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-mono text-xs rounded-lg">
              UNDO BAN
            </button>
            <span className="font-mono text-xs text-slate-400">Banned: {bannedIds.length}/{totalBans}</span>
          </div>
        </div>
      )}

      {/* PICK PHASE */}
      {draftPhase === 'pick' && (
        <div className="w-full max-w-4xl bg-slate-900 border border-sky-500/30 rounded-xl p-6">
          <h3 className="font-black text-sky-400 font-mono mb-3 flex items-center gap-2">
            <Sword className="w-5 h-5" /> PICK PHASE — {pickTeam?.toUpperCase() || 'BLUE'} picks
          </h3>
          {aiThinking && <div className="text-slate-400 font-mono text-sm mb-3 animate-pulse">AI is picking...</div>}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="font-mono text-xs text-blue-300">{blueTeamName} ({bluePicks.length}/{teamSize})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-mono text-xs text-red-300">{redTeamName} ({redPicks.length}/{teamSize})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableChampions.slice(0, 12).map((champ) => (
              <button
                key={champ.id}
                onClick={() => handlePickChampion(champ)}
                disabled={aiThinking}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl p-3 text-center cursor-pointer transition-colors disabled:opacity-50"
              >
                <div className="text-xl mb-1">{champ.avatarIcon}</div>
                <div className="font-mono text-xs text-white">{champ.name}</div>
                <div className="font-mono text-xs text-slate-400">{champ.role}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="font-mono text-xs text-slate-400">Picked: {pickedChampionIds.length}/{teamSize * 2}</span>
          </div>
        </div>
      )}

      {/* TACTICS PHASE */}
      {draftPhase === 'tactics' && (
        <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-xl p-6">
          <h3 className="font-black text-cyan-400 font-mono mb-3 flex items-center gap-2">
            <Crosshair className="w-5 h-5" /> FORMATION — Confirm to start combat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="font-mono text-xs text-blue-400 mb-2">{blueTeamName}</h4>
              <div className="flex flex-wrap gap-1">
                {bluePicks.map((p, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-xs font-mono text-blue-200">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="font-mono text-xs text-red-400 mb-2">{redTeamName}</h4>
              <div className="flex flex-wrap gap-1">
                {redPicks.map((p, i) => (
                  <span key={i} className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs font-mono text-red-200">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleTacticsConfirm}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-black font-mono rounded-xl"
          >
            CONFIRM & ENTER COMBAT
          </button>
        </div>
      )}
    </div>
  );
};
