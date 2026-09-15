import React, { useEffect, useRef, useState } from 'react';
import type { CombatEntity, FloatingText, ParticleEffect, CombatPhase } from '../types/game';
import { updateCombatEngine } from '../utils/combatEngine';

interface TfmArenaProps {
  initialEntities: CombatEntity[];
  blueTeamName: string;
  redTeamName: string;
  onMatchComplete: (result: { winner: 'blue' | 'red'; stats: { blueKills: number; redKills: number; blueDamage: number; redDamage: number } }) => void;
}

export const TfmArena: React.FC<TfmArenaProps> = ({ initialEntities, blueTeamName, redTeamName, onMatchComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [entities, setEntities] = useState<CombatEntity[]>(initialEntities);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [phase, setPhase] = useState<CombatPhase>('prepare');
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);

  // TFM: shorter prepare phase
  useEffect(() => {
    if (phase === 'prepare') {
      const timer = setTimeout(() => setPhase('combat'), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'combat' || isPaused) return;

    animFrameRef.current = requestAnimationFrame(() => {
      const logs: any[] = [];
      const result = updateCombatEngine(entities, particles, floatingTexts, logs, 1 / 60, 800, 500);

      const blueAlive = result.entities ? result.entities.filter((e: CombatEntity) => e.team === 'blue' && e.currentHp > 0) : [];
      const redAlive = result.entities ? result.entities.filter((e: CombatEntity) => e.team === 'red' && e.currentHp > 0) : [];

      if (blueAlive.length === 0 || redAlive.length === 0) {
        const winner = blueAlive.length > 0 ? 'blue' : 'red';
        onMatchComplete({ winner, stats: { blueKills: 0, redKills: 0, blueDamage: 0, redDamage: 0 } });
        return;
      }
    });

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, isPaused, entities, particles, floatingTexts]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'combat' || isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedEntity = entities.find((entity) => {
      const dx = entity.x - x;
      const dy = entity.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20 && entity.currentHp > 0 && entity.team === 'blue';
    });
    if (clickedEntity) {
      clickedEntity.abilityReady = true;
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      setIsPaused(!isPaused);
    }
    if (e.key === '1' && phase === 'combat') {
      const blueHero = entities.find((entity) => entity.team === 'blue' && entity.currentHp > 0);
      if (blueHero && blueHero.abilityReady) {
        blueHero.abilityReady = false;
        setFloatingTexts((prev) => [...prev, {
          text: 'ULTI',
          x: blueHero.x,
          y: blueHero.y - 20,
          color: '#fbbf24',
          lifetime: 1.0,
        }]);
      }
    }
    if (e.key === 'q' && phase === 'combat') {
      const blueHero = entities.find((entity) => entity.team === 'blue' && entity.currentHp > 0);
      if (blueHero) {
        setFloatingTexts((prev) => [...prev, {
          text: 'DASH',
          x: blueHero.x + 30,
          y: blueHero.y,
          color: '#60a5fa',
          lifetime: 0.8,
        }]);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, isPaused, entities]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-between w-full max-w-4xl mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-mono text-sm text-blue-400">{blueTeamName}</span>
        </div>
        <span className="font-mono text-xs text-slate-400">TFM MODE | PHASE: {phase.toUpperCase()}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-red-400">{redTeamName}</span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="border-2 border-emerald-500/50 rounded-xl cursor-crosshair bg-slate-900"
        onClick={handleCanvasClick}
      />
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="px-4 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-colors"
        >
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>
        <span className="font-mono text-xs text-slate-500">SPACE = PAUSE | 1 = ULTI | Q = DASH</span>
      </div>
    </div>
  );
};
