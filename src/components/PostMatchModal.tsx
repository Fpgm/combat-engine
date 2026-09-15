import React, { useEffect } from 'react';
import { MatchResult } from '../types/game';
import { Trophy, Award, Zap, Heart, Shield, Sword, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playVictorySound, playDefeatSound } from '../utils/sound';

interface PostMatchModalProps {
  result: MatchResult;
  blueTeamName: string;
  redTeamName: string;
  onContinue: (goldEarned: number, lpEarned: number) => void;
}

export const PostMatchModal: React.FC<PostMatchModalProps> = ({
  result,
  blueTeamName,
  redTeamName,
  onContinue,
}) => {
  const isBlueWinner = result.winner === 'blue';

  // Dynamic rewards based on match performance
  const calculateRewards = () => {
    const winnerTeam = isBlueWinner ? 'blue' : 'red';
    const loserTeam = winnerTeam === 'blue' ? 'red' : 'blue';
    const winnerEntities = result.entities.filter((e) => e.team === winnerTeam);
    const loserEntities = result.entities.filter((e) => e.team === loserTeam);

    const totalKills = result.entities.reduce((sum, e) => sum + e.kills, 0);
    const totalAssists = result.entities.reduce((sum, e) => sum + e.assists, 0);
    const totalDamage = result.entities.reduce((sum, e) => sum + e.totalDamageDealt, 0);

    let goldEarned: number;
    let lpEarned: number;

    if (isBlueWinner) {
      // Victory: base + performance bonus
      const killGold = totalKills * 50;
      const assistGold = totalAssists * 20;
      const damageGold = Math.floor(totalDamage * 0.1);
      goldEarned = Math.min(1500, Math.floor(150 + killGold + assistGold + damageGold));
      lpEarned = 25 + totalKills * 5 + totalAssists * 2 + Math.floor(totalDamage / 500);
    } else {
      // Defeat: reduced reward but still something
      const killGold = totalKills * 30;
      const assistGold = totalAssists * 10;
      const damageGold = Math.floor(totalDamage * 0.05);
      goldEarned = Math.max(50, Math.floor(150 + killGold + assistGold + damageGold));
      lpEarned = Math.max(-20, -12 + totalKills * 3 + totalAssists + Math.floor(totalDamage / 1000));
    }

    return { goldEarned, lpEarned };
  };

  const { goldEarned, lpEarned } = calculateRewards();

  const mvpEntity = result.entities.find((e) => e.id === result.mvpEntityId) || result.entities[0];

  useEffect(() => {
    if (isBlueWinner) {
      playVictorySound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      playDefeatSound();
    }
  }, [isBlueWinner]);

  // Find max damage for relative bar charts
  const maxDamage = Math.max(...result.entities.map((e) => e.totalDamageDealt), 100);
  const maxDamageTaken = Math.max(...result.entities.map((e) => e.totalDamageTaken), 100);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl p-6 shadow-2xl my-auto animate-scale-up">
        {/* RESULT BANNER */}
        <div className="text-center pb-6 border-b border-slate-800">
          <div
            className={`inline-block px-6 py-2 rounded-full font-black tracking-widest text-sm mb-3 font-mono ${
              isBlueWinner
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
            }`}
          >
            {isBlueWinner ? '🏆 VICTORY' : 'DEFEAT'}
          </div>
          <h2 className="text-3xl font-black text-white font-mono">
            {isBlueWinner ? `${blueTeamName} DEFEATED ${redTeamName}!` : `${redTeamName} DEFEATED ${blueTeamName}`}
          </h2>
          <p className="text-slate-400 text-xs font-mono mt-1">
            Duration: {result.duration}s | Score: {result.blueKills} - {result.redKills}
          </p>

          {/* Rewards */}
          <div className="flex justify-center items-center space-x-6 mt-4">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">REWARD:</span>
              <span className="text-amber-400 font-black text-sm">+{goldEarned} GOLD</span>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">LEAGUE RANK:</span>
              <span className={`font-black text-sm ${lpEarned >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {lpEarned >= 0 ? `+${lpEarned}` : lpEarned} LP
              </span>
            </div>
          </div>
        </div>

        {/* MVP HIGHLIGHT */}
        {mvpEntity && (
          <div className="my-6 bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-lg shadow-lg"
                  style={{ backgroundColor: mvpEntity.color }}
                >
                  {mvpEntity.name.substring(0, 3)}
                </div>
                <Award className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 drop-shadow-md" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase">MATCH MVP</span>
                <h4 className="text-lg font-black text-white">{mvpEntity.name}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {mvpEntity.role} • Team {mvpEntity.team.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs font-mono text-slate-300">
              <div className="text-center">
                <p className="text-slate-500">KILLS</p>
                <p className="text-amber-400 font-black text-base">{mvpEntity.kills}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">DAMAGE</p>
                <p className="text-sky-400 font-black text-base">{Math.round(mvpEntity.totalDamageDealt)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">HEALING</p>
                <p className="text-emerald-400 font-black text-base">{Math.round(mvpEntity.totalHealingDone)}</p>
              </div>
            </div>
          </div>
        )}

        {/* COMBAT DAMAGE CHARTS */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-slate-300 font-mono mb-4 flex items-center gap-2">
            <Sword className="w-4 h-4 text-amber-400" /> COMBAT DAMAGE BREAKDOWN
          </h3>

          <div className="space-y-3">
            {result.entities.map((e) => {
              const dmgWidth = Math.round((e.totalDamageDealt / maxDamage) * 100);

              return (
                <div key={e.id} className="flex items-center space-x-3 text-xs font-mono">
                  <div className="w-28 text-right font-bold truncate text-slate-300 flex items-center justify-end gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${e.team === 'blue' ? 'bg-sky-400' : 'bg-rose-400'}`}></span>
                    {e.name}
                  </div>

                  <div className="flex-1 bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-800 flex items-center px-1">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ${
                        e.team === 'blue' ? 'bg-sky-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(4, dmgWidth)}%` }}
                    ></div>
                  </div>

                  <span className="w-16 font-bold text-slate-400 text-right">{Math.round(e.totalDamageDealt)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="flex justify-end">
          <button
            onClick={() => onContinue(goldEarned, lpEarned)}
            className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer font-mono"
          >
            CONTINUE TO HQ <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
