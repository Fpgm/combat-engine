import React, { useState } from 'react';
import { Champion, TeamMember, Item, Role } from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { ITEMS, TRAIT_SYNERGIES, ROLE_SYNERGIES } from '../data/items';
import { playDraftPickSound } from '../utils/sound';
import { TacticalGrid } from './TacticalGrid';
import { Shield, Zap, Skull, Flame, Crosshair, Sword, Info, Check, Plus, AlertCircle, ArrowRight, Sparkles, Grid } from 'lucide-react';

interface DraftPhaseProps {
  blueTeamName: string;
  redTeamName: string;
  opponentPool?: string[];
  teamSize?: number;
  onDraftComplete: (blueRoster: TeamMember[], redRoster: TeamMember[]) => void;
}

export const DraftPhase: React.FC<DraftPhaseProps> = ({
  blueTeamName,
  redTeamName,
  opponentPool,
  teamSize = 4,
  onDraftComplete,
}) => {
  const [bannedIds, setBannedIds] = useState<string[]>([]);
  const [bluePicks, setBluePicks] = useState<TeamMember[]>([]);
  const [redPicks, setRedPicks] = useState<TeamMember[]>([]);
  const [activeStep, setActiveStep] = useState<'ban' | 'pick' | 'tactics' | 'items'>('ban');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<Role | 'All'>('All');
  const [hoveredChampion, setHoveredChampion] = useState<Champion | null>(null);

  // Available Champions (not banned, not picked)
  const isAvailable = (champId: string) => {
    return (
      !bannedIds.includes(champId) &&
      !bluePicks.some((p) => p.championId === champId) &&
      !redPicks.some((p) => p.championId === champId)
    );
  };

  // Handle Ban click
  const handleBanChampion = (champ: Champion) => {
    if (bannedIds.length >= 2) return;
    const nextBanned = [...bannedIds, champ.id];
    setBannedIds(nextBanned);
    playDraftPickSound();

    // AI Ban 1 choice
    if (nextBanned.length < 2) {
      const remainingChamps = CHAMPIONS.filter((c) => !nextBanned.includes(c.id));
      const aiBan = remainingChamps[Math.floor(Math.random() * remainingChamps.length)];
      if (aiBan) {
        setBannedIds([...nextBanned, aiBan.id]);
      }
    }
    setActiveStep('pick');
  };

  // Handle Pick click
  const handlePickChampion = (champ: Champion) => {
    if (bluePicks.length >= teamSize) return;
    if (!isAvailable(champ.id)) return;

    const newBlue = [...bluePicks, { championId: champ.id }];
    setBluePicks(newBlue);
    playDraftPickSound();

    // AI Pick logic
    if (newBlue.length < teamSize) {
      setTimeout(() => {
        const available = CHAMPIONS.filter((c) => isAvailable(c.id) && c.id !== champ.id);
        if (available.length > 0) {
          // Prefer opponent's favorite pool if available
          let aiPick = available.find((c) => opponentPool?.includes(c.id));
          if (!aiPick) {
            aiPick = available[Math.floor(Math.random() * available.length)];
          }
          if (aiPick) {
            setRedPicks((prev) => [...prev, { championId: aiPick!.id }]);
          }
        }
      }, 300);
    } else {
      // Complete AI picks if missing
      const neededRed = teamSize - redPicks.length;
      const available = CHAMPIONS.filter((c) => isAvailable(c.id) && c.id !== champ.id);
      const aiAdditions: TeamMember[] = [];
      for (let i = 0; i < neededRed; i++) {
        if (available[i]) {
          aiAdditions.push({ championId: available[i].id });
        }
      }
      setRedPicks((prev) => [...prev, ...aiAdditions]);
      setActiveStep('tactics');
    }
  };

  // Item assignment handler
  const handleAssignItem = (championId: string, itemId: string) => {
    const champ = CHAMPIONS.find((c) => c.id === championId);
    const item = ITEMS.find((i) => i.id === itemId);
    if (!champ || !item) return;
    setBluePicks((prev) =>
      prev.map((p) => (p.championId === championId ? { ...p, itemId: p.itemId === itemId ? undefined : itemId } : p))
    );
  };

  // Auto-assign random items to AI team
  const handleStartMatch = () => {
    const updatedRed = redPicks.map((p) => {
      const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      return { ...p, itemId: randomItem.id };
    });
    onDraftComplete(bluePicks, updatedRed);
  };

  const filteredChampions = CHAMPIONS.filter((c) =>
    selectedRoleFilter === 'All' ? true : c.role === selectedRoleFilter
  );

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-2">
      {/* HEADER STAGE */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Sword className="w-6 h-6 text-amber-400" /> ESPORTS DRAFT STAGE
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            Phase: <span className="text-amber-400 font-bold uppercase">{activeStep}</span> | Format: {teamSize}v{teamSize} Match
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0 font-mono text-xs overflow-x-auto">
          <div
            className={`px-3 py-1.5 rounded-lg border ${
              activeStep === 'ban'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            1. BAN HEROES
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <div
            className={`px-3 py-1.5 rounded-lg border ${
              activeStep === 'pick'
                ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            2. PICK ROSTER
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <div
            className={`px-3 py-1.5 rounded-lg border ${
              activeStep === 'tactics'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            3. FORMATION GRID
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <div
            className={`px-3 py-1.5 rounded-lg border ${
              activeStep === 'items'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            4. EQUIP GEAR
          </div>
        </div>
      </div>

      {/* MATCHUP ROSTER HEADERS (BLUE VS RED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Blue Team Picks */}
        <div className="bg-slate-950 border border-sky-900/50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sky-400 text-sm tracking-wider uppercase font-mono">{blueTeamName} (YOU)</span>
            <span className="text-xs font-mono text-sky-300">
              {bluePicks.length}/{teamSize} Picked
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: teamSize }).map((_, idx) => {
              const pick = bluePicks[idx];
              const champ = pick ? CHAMPIONS.find((c) => c.id === pick.championId) : null;
              const item = pick?.itemId ? ITEMS.find((i) => i.id === pick.itemId) : null;

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-center h-24 rounded-lg border transition-all ${
                    champ
                      ? 'bg-slate-900 border-sky-500/80 shadow-md shadow-sky-950'
                      : 'bg-slate-900/40 border-slate-800 border-dashed'
                  }`}
                >
                  {champ ? (
                    <>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-base">{champ.avatarIcon}</span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-inner"
                          style={{ backgroundColor: champ.avatarColor }}
                        >
                          {champ.name.substring(0, 3)}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[70px]">{champ.name}</span>
                      <span className="text-[10px] text-sky-400 font-mono">{champ.role}</span>
                      {item && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 rounded-full shadow">
                          {item.name.substring(0, 3)}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-600 font-mono">SLOT {idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Red Team Picks */}
        <div className="bg-slate-950 border border-rose-900/50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-rose-400 text-sm tracking-wider uppercase font-mono">{redTeamName} (OPPONENT)</span>
            <span className="text-xs font-mono text-rose-300">
              {redPicks.length}/{teamSize} Picked
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: teamSize }).map((_, idx) => {
              const pick = redPicks[idx];
              const champ = pick ? CHAMPIONS.find((c) => c.id === pick.championId) : null;

              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center h-24 rounded-lg border transition-all ${
                    champ
                      ? 'bg-slate-900 border-rose-500/80 shadow-md shadow-rose-950'
                      : 'bg-slate-900/40 border-slate-800 border-dashed'
                  }`}
                >
                  {champ ? (
                    <>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-base">{champ.avatarIcon}</span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                          style={{ backgroundColor: champ.avatarColor }}
                        >
                          {champ.name.substring(0, 3)}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[70px]">{champ.name}</span>
                      <span className="text-[10px] text-rose-400 font-mono">{champ.role}</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-600 font-mono">SLOT {idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN DRAFT ACTION SECTION */}
      {activeStep === 'tactics' ? (
        <TacticalGrid
          teamName={blueTeamName}
          roster={bluePicks}
          onUpdateRoster={(updated) => setBluePicks(updated)}
          onProceedToBattle={() => setActiveStep('items')}
        />
      ) : activeStep === 'items' ? (
        /* ITEM EQUIPPING PHASE */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-amber-400 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> EQUIP ITEM GEAR BEFORE MATCH
          </h3>
          <p className="text-slate-400 text-xs mb-6">Equip items onto your drafted champions to maximize synergy stats.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {bluePicks.map((pick) => {
              const champ = CHAMPIONS.find((c) => c.id === pick.championId);
              if (!champ) return null;

              return (
                <div key={champ.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: champ.avatarColor }}
                    >
                      {champ.name.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{champ.name}</h4>
                      <p className="text-xs text-sky-400 font-mono">
                        {champ.role} • {champ.trait}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-mono text-slate-400 mb-2">Select 1 Item Gear:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ITEMS.map((item) => {
                      const isSelected = pick.itemId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleAssignItem(champ.id, item.id)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <p className="text-[11px] font-bold truncate">{item.name}</p>
                          <p className="text-[9px] font-mono text-slate-400 truncate">{item.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleStartMatch}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <Sword className="w-5 h-5" /> ENTER ARENA BATTLE!
            </button>
          </div>
        </div>
      ) : (
        /* BAN / PICK GRID SELECTION */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">ROLE FILTER:</span>
              {(['All', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                    selectedRoleFilter === role
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Banned list badges */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-500">BANNED HEROES:</span>
              {bannedIds.map((id) => {
                const c = CHAMPIONS.find((champ) => champ.id === id);
                return (
                  <span key={id} className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold">
                    {c?.name}
                  </span>
                );
              })}
              {bannedIds.length === 0 && <span className="text-slate-600 italic">None yet</span>}
            </div>
          </div>

          {/* Champion Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-6">
            {filteredChampions.map((champ) => {
              const available = isAvailable(champ.id);
              const isBanned = bannedIds.includes(champ.id);

              return (
                <button
                  key={champ.id}
                  disabled={!available}
                  onClick={() => {
                    if (activeStep === 'ban') handleBanChampion(champ);
                    else handlePickChampion(champ);
                  }}
                  onMouseEnter={() => setHoveredChampion(champ)}
                  className={`relative flex flex-col items-center p-3 rounded-xl border transition-all text-center group cursor-pointer ${
                    !available
                      ? 'bg-slate-900/30 border-slate-900 opacity-40 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-800 hover:border-sky-500 hover:bg-slate-850 hover:scale-105'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm mb-2 shadow"
                    style={{ backgroundColor: champ.avatarColor }}
                  >
                    {champ.name.substring(0, 3)}
                  </div>
                  <span className="text-xs font-bold text-white truncate w-full">{champ.name}</span>
                  <span className="text-[10px] text-sky-400 font-mono mt-0.5">{champ.role}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{champ.trait}</span>

                  {isBanned && (
                    <div className="absolute inset-0 bg-rose-950/80 rounded-xl flex items-center justify-center text-rose-400 font-bold text-xs font-mono">
                      BANNED
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* HOVERED CHAMPION STATS PREVIEW CARD */}
          {hoveredChampion && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg"
                  style={{ backgroundColor: hoveredChampion.avatarColor }}
                >
                  {hoveredChampion.name.substring(0, 3)}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    {hoveredChampion.name} <span className="text-xs font-normal text-slate-400">"{hoveredChampion.title}"</span>
                  </h4>
                  <p className="text-xs text-sky-400 font-mono">
                    Role: <span className="text-white font-bold">{hoveredChampion.role}</span> | Faction:{' '}
                    <span className="text-white font-bold">{hoveredChampion.trait}</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-1">{hoveredChampion.lore}</p>
                </div>
              </div>

              {/* Stats & Active Skill */}
              <div className="flex items-center space-x-6 text-xs font-mono text-slate-300 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0">
                <div>
                  <p className="text-slate-500">STATS:</p>
                  <p>HP: <span className="text-emerald-400 font-bold">{hoveredChampion.baseStats.hp}</span></p>
                  <p>ATK: <span className="text-amber-400 font-bold">{hoveredChampion.baseStats.attackPower}</span></p>
                  <p>ARM: <span className="text-sky-400 font-bold">{hoveredChampion.baseStats.defense}</span></p>
                </div>
                <div>
                  <p className="text-slate-500">ACTIVE SKILL:</p>
                  <p className="text-sky-300 font-bold">{hoveredChampion.skill.name}</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">{hoveredChampion.skill.description}</p>
                </div>
                <div>
                  <p className="text-slate-500">PASSIVE:</p>
                  <p className="text-emerald-300 font-bold">{hoveredChampion.passive.name}</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">{hoveredChampion.passive.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
