import React, { useState } from 'react';
import { CHAMPIONS } from '../data/champions';
import { Champion } from '../types/game';
import { BookOpen, Shield, Zap, Heart, Flame, Crosshair, Skull, Sparkles, Wand2 } from 'lucide-react';

export const ChampionCodex: React.FC = () => {
  const [selectedChamp, setSelectedChamp] = useState<Champion>(CHAMPIONS[0]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-2">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4 mb-6">
        <BookOpen className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-2xl font-black text-white font-mono">CHAMPION ARCHIVE & CODEX</h2>
          <p className="text-xs text-slate-400 font-mono">Inspect hero abilities, passive traits, and combat stat scaling</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Champion Roster Selector List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {CHAMPIONS.map((champ) => {
            const isSelected = selectedChamp.id === champ.id;
            return (
              <button
                key={champ.id}
                onClick={() => setSelectedChamp(champ)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{champ.avatarIcon}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                    style={{ backgroundColor: champ.avatarColor }}
                  >
                    {champ.name.substring(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{champ.name}</h4>
                    <p className="text-[11px] text-sky-400 font-mono">
                      {champ.role} • {champ.trait}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Champion Detail Card */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{selectedChamp.avatarIcon}</span>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl"
                style={{ backgroundColor: selectedChamp.avatarColor }}
              >
                {selectedChamp.name.substring(0, 3)}
              </div>
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                {selectedChamp.trait} {selectedChamp.role}
              </span>
              <h3 className="text-2xl font-black text-white">{selectedChamp.name}</h3>
              <p className="text-xs text-slate-400 italic">"{selectedChamp.title}"</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans border-l-2 border-amber-500 pl-3">
            {selectedChamp.lore}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs">
            <div>
              <p className="text-slate-500">MAX HP</p>
              <p className="text-emerald-400 font-black text-sm">{selectedChamp.baseStats.hp}</p>
            </div>
            <div>
              <p className="text-slate-500">ATTACK POWER</p>
              <p className="text-amber-400 font-black text-sm">{selectedChamp.baseStats.attackPower}</p>
            </div>
            <div>
              <p className="text-slate-500">DEFENSE / ARMOR</p>
              <p className="text-sky-400 font-black text-sm">{selectedChamp.baseStats.defense}</p>
            </div>
            <div>
              <p className="text-slate-500">ATTACK SPEED</p>
              <p className="text-amber-300 font-black text-sm">{selectedChamp.baseStats.attackSpeed}/s</p>
            </div>
          </div>

          {/* Active Skill */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase">ACTIVE SKILL (100 ENERGY)</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> {selectedChamp.skill.name}
            </h4>
            <p className="text-xs text-slate-300">{selectedChamp.skill.description}</p>
            <p className="text-[11px] font-mono text-slate-500">
              Cooldown: {selectedChamp.skill.cooldown}s | Base Value: {selectedChamp.skill.baseValue}
            </p>
          </div>

          {/* Passive Ability */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase">PASSIVE TRAIT</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> {selectedChamp.passive.name}
            </h4>
            <p className="text-xs text-slate-300">{selectedChamp.passive.description}</p>
            <p className="text-[11px] font-mono text-slate-500">Trigger: {selectedChamp.passive.trigger}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
