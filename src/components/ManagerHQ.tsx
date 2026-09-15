import React, { useState } from 'react';
import { PlayerManagerProfile, Champion, Item, RivalTeam, GameMode } from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { ITEMS } from '../data/items';
import { RIVAL_TEAMS } from '../data/opponents';
import { Trophy, Coins, Award, Sword, Shield, Zap, ShoppingBag, ArrowUpCircle, Users, Sparkles, ShoppingCart, Save, Upload, RotateCcw } from 'lucide-react';
import { playDraftPickSound } from '../utils/sound';

interface ManagerHQProps {
  profile: PlayerManagerProfile;
  onUpdateProfile: (updated: PlayerManagerProfile) => void;
  onStartMatch: (mode: GameMode) => void;
}

export const ManagerHQ: React.FC<ManagerHQProps> = ({ profile, onUpdateProfile, onStartMatch }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'shop' | 'rivals'>('rivals');

  // Train Champion Level (Mastery)
  const handleUpgradeMastery = (champId: string) => {
    const currentMastery = profile.masteries[champId] || { championId: champId, level: 1, matchesPlayed: 0, wins: 0 };
    if (currentMastery.level >= 5) return;

    const cost = currentMastery.level * 250;
    if (profile.funds < cost) return;

    const updatedProfile = {
      ...profile,
      funds: profile.funds - cost,
      masteries: {
        ...profile.masteries,
        [champId]: {
          ...currentMastery,
          level: currentMastery.level + 1,
        },
      },
    };

    onUpdateProfile(updatedProfile);
    playDraftPickSound();
  };

  // Buy Item in Store
  const handleBuyItem = (item: Item) => {
    if (profile.funds < item.cost) return;
    if (profile.unlockedItems.includes(item.id)) return;

    const updatedProfile = {
      ...profile,
      funds: profile.funds - item.cost,
      unlockedItems: [...profile.unlockedItems, item.id],
    };

    onUpdateProfile(updatedProfile);
    // Save to localStorage
    try {
      localStorage.setItem('ttl_profile', JSON.stringify(updatedProfile));
    } catch {
      // Silently continue
    }
    playDraftPickSound();
  };

  // Save profile to localStorage
  const handleSaveProfile = () => {
    try {
      localStorage.setItem('ttl_profile', JSON.stringify(profile));
    } catch {
      // Silently continue
    }
  };

  // Load profile from localStorage
  const handleLoadProfile = () => {
    try {
      const saved = localStorage.getItem('ttl_profile');
      if (saved) {
        const parsed = JSON.parse(saved) as PlayerManagerProfile;
        onUpdateProfile(parsed);
      }
    } catch {
      // Silently continue
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 my-2">
      {/* MANAGER STATS DASHBOARD HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-2xl shadow-lg border border-sky-400">
            {profile.teamTag}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white font-mono">{profile.teamName}</h2>
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-full text-xs font-mono font-bold">
                DIVISION: {profile.division.toUpperCase()} ({profile.divisionPoints} LP)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">Head Esports Coach & General Manager</p>
          </div>
        </div>

        {/* Currency & Trophies */}
        <div className="flex items-center space-x-6">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Coins className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] font-mono text-slate-500">CLUB FUNDS</p>
              <p className="text-amber-400 font-black font-mono text-base">${profile.funds}</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] font-mono text-slate-500">TROPHIES</p>
              <p className="text-amber-400 font-black font-mono text-base">{profile.trophies}</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl flex items-center gap-2" title="Items owned">
            <ShoppingBag className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 font-black font-mono text-xs">{profile.unlockedItems.length}</span>
          </div>
        </div>
      </div>

      {/* HQ NAVIGATION TABS */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('rivals')}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'rivals'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <Sword className="w-4 h-4" /> LEAGUE RIVALS & MATCH SCHEDULE
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <Users className="w-4 h-4" /> CHAMPION MASTERY & TRAINING
        </button>

        <button
          onClick={() => setActiveTab('shop')}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> EQUIPMENT ARMORY
        </button>
        <button
          onClick={handleSaveProfile}
          className="px-3 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-slate-800 text-emerald-400 hover:bg-slate-750 border border-emerald-800"
          title="Save profile"
        >
          <Save className="w-3 h-3" /> SAVE
        </button>
        <button
          onClick={handleLoadProfile}
          className="px-3 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-slate-800 text-sky-400 hover:bg-slate-750 border border-sky-800"
          title="Load profile"
        >
          <Upload className="w-3 h-3" /> LOAD
        </button>
      </div>

      {/* TAB 1: RIVAL TEAMS MATCH SCHEDULE */}
      {activeTab === 'rivals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RIVAL_TEAMS.map((rival) => (
            <div
              key={rival.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow"
                      style={{ backgroundColor: rival.logoColor }}
                    >
                      {rival.tag}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">{rival.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">Rating: {rival.rating} ELO</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                    {rival.points} PTS
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400 space-y-1 mb-4">
                  <p>
                    Preferred Roles:{' '}
                    <span className="text-sky-300 font-bold">{rival.preferredRoles.join(', ')}</span>
                  </p>
                  <p>
                    Record: <span className="text-emerald-400">{rival.wins}W</span> -{' '}
                    <span className="text-rose-400">{rival.losses}L</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onStartMatch('moba')}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <Sword className="w-4 h-4" /> CHALLENGE TO MATCH
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ROSTER TRAINING */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHAMPIONS.map((champ) => {
            const mastery = profile.masteries[champ.id] || { championId: champ.id, level: 1, matchesPlayed: 0, wins: 0 };
            const upgradeCost = mastery.level * 250;
            const isMax = mastery.level >= 5;

            return (
              <div key={champ.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: champ.avatarColor }}
                    >
                      {champ.name.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{champ.name}</h4>
                      <p className="text-xs text-sky-400 font-mono">
                        Level {mastery.level} Mastery
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-400 space-y-1 mb-4">
                    <p>Role: <span className="text-white">{champ.role}</span></p>
                    <p>Bonus Stats: <span className="text-emerald-400">+{mastery.level * 8}% HP & Damage</span></p>
                  </div>
                </div>

                <button
                  disabled={isMax || profile.funds < upgradeCost}
                  onClick={() => handleUpgradeMastery(champ.id)}
                  className={`w-full py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isMax
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : profile.funds >= upgradeCost
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  {isMax ? 'MAX LEVEL' : `TRAIN (${upgradeCost} GOLD)`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: SHOP */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map((item) => {
            const isUnlocked = profile.unlockedItems.includes(item.id);

            return (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-white text-base">{item.name}</h3>
                    <span className="text-xs font-mono font-bold text-amber-400">${item.cost}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mb-4">{item.description}</p>
                </div>

                <button
                  disabled={isUnlocked || profile.funds < item.cost}
                  onClick={() => handleBuyItem(item)}
                  className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isUnlocked
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : profile.funds >= item.cost
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isUnlocked ? 'OWNED IN LOCKER' : `PURCHASE GEAR ($${item.cost})`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
