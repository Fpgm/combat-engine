import React from 'react';
import { TeamMember, Champion, Role } from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { Shield, Zap, Flame, Sword, Check, ArrowUpRight, Info } from 'lucide-react';

interface TacticalGridProps {
  teamName: string;
  roster: TeamMember[];
  onUpdateRoster: (updated: TeamMember[]) => void;
  onProceedToBattle?: () => void;
}

export const TacticalGrid: React.FC<TacticalGridProps> = ({
  teamName,
  roster,
  onUpdateRoster,
  onProceedToBattle,
}) => {
  const [selectedChampId, setSelectedChampId] = React.useState<string | null>(null);

  // Compute default grid positions if missing
  const activeRoster = React.useMemo(() => {
    return roster.map((m, idx) => {
      const champ = CHAMPIONS.find((c) => c.id === m.championId);
      let row = m.gridRow;
      let col = m.gridCol;

      if (row === undefined || col === undefined) {
        if (champ?.role === 'Tank' || champ?.role === 'Fighter') {
          row = 0; // Frontline
        } else if (champ?.role === 'Assassin') {
          row = 1; // Midline
        } else {
          row = 2; // Backline
        }
        col = idx % 3;
      }

      return {
        ...m,
        gridRow: row,
        gridCol: col,
      };
    });
  }, [roster]);

  // Get champion at grid cell (row, col)
  const getMemberAt = (r: number, c: number) => {
    return activeRoster.find((m) => m.gridRow === r && m.gridCol === c);
  };

  // Place or swap selected champion to cell (targetRow, targetCol)
  const handleCellClick = (targetRow: number, targetCol: number) => {
    if (!selectedChampId) return;

    const existingAtTarget = getMemberAt(targetRow, targetCol);
    const movingMember = activeRoster.find((m) => m.championId === selectedChampId);

    if (!movingMember) return;

    const updated = activeRoster.map((m) => {
      if (m.championId === selectedChampId) {
        return {
          ...m,
          gridRow: targetRow,
          gridCol: targetCol,
        };
      }
      if (existingAtTarget && m.championId === existingAtTarget.championId) {
        // Swap positions
        return {
          ...m,
          gridRow: movingMember.gridRow,
          gridCol: movingMember.gridCol,
        };
      }
      return m;
    });

    onUpdateRoster(updated);
    setSelectedChampId(null);
  };

  const ROW_LABELS = [
    { title: 'FRONTLINE', desc: 'Tanks & Brawlers (+15 Armor)', border: 'border-cyan-500/50 bg-cyan-950/20' },
    { title: 'MIDLINE', desc: 'Assassins & Flex Units (+10% Move Speed)', border: 'border-indigo-500/50 bg-indigo-950/20' },
    { title: 'BACKLINE', desc: 'Mages, Marksmen & Supports (+15% Damage)', border: 'border-purple-500/50 bg-purple-950/20' },
  ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-3">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 className="text-xl font-black tracking-wider text-white uppercase font-mono">
              PRE-BATTLE TACTICAL FORMATION GRID
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Drag or click heroes to assign 3x3 battle grid positions. Tactical row bonuses apply instantly!
          </p>
        </div>
      </div>

      {/* TACTICAL GRID & ROSTER DOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3x3 TACTICAL FORMATION CANVAS */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          {ROW_LABELS.map((rowInfo, rowIndex) => (
            <div key={rowIndex} className={`p-3 rounded-xl border ${rowInfo.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold tracking-wider text-cyan-400 font-mono uppercase">
                  ROW {rowIndex + 1}: {rowInfo.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{rowInfo.desc}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((colIndex) => {
                  const member = getMemberAt(rowIndex, colIndex);
                  const champ = member ? CHAMPIONS.find((c) => c.id === member.championId) : null;
                  const isSelected = selectedChampId && member?.championId === selectedChampId;

                  return (
                    <button
                      key={colIndex}
                      onClick={() => {
                        if (selectedChampId) {
                          handleCellClick(rowIndex, colIndex);
                        } else if (member) {
                          setSelectedChampId(member.championId);
                        }
                      }}
                      className={`h-24 rounded-xl border-2 transition-all flex flex-col items-center justify-center relative cursor-pointer group ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400'
                          : champ
                          ? 'border-cyan-500/60 bg-slate-900 hover:border-cyan-400 hover:scale-102 shadow-md'
                          : selectedChampId
                          ? 'border-dashed border-cyan-400/80 bg-cyan-950/40 hover:bg-cyan-900/40 animate-pulse'
                          : 'border-dashed border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      {champ ? (
                        <>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">{champ.avatarIcon}</span>
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow"
                              style={{ backgroundColor: champ.avatarColor }}
                            >
                              {champ.name.substring(0, 3)}
                            </div>
                          </div>
                          <span className="text-xs font-black text-white truncate max-w-[90px]">{champ.name}</span>
                          <span className="text-[10px] text-cyan-300 font-mono">{champ.role}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                          {selectedChampId ? '+ PLACE HERE' : 'EMPTY CELL'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* SELECTOR DOCK & INSTRUCTIONS */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 font-mono mb-3 flex items-center gap-2">
              <Sword className="w-4 h-4 text-amber-400" /> SELECT HERO TO REPOSITION
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Click a champion below, then click any grid cell to place or swap positions.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {activeRoster.map((m) => {
                const champ = CHAMPIONS.find((c) => c.id === m.championId);
                if (!champ) return null;
                const isSelected = selectedChampId === champ.id;

                return (
                  <button
                    key={champ.id}
                    onClick={() => setSelectedChampId(isSelected ? null : champ.id)}
                    className={`p-2.5 rounded-xl border transition-all text-left flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-950'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg">{champ.avatarIcon}</span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{champ.name}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">
                        R{m.gridRow! + 1}: {ROW_LABELS[m.gridRow!].title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {onProceedToBattle && (
            <button
              onClick={onProceedToBattle}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              CONFIRM TACTICS & START COMBAT <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
