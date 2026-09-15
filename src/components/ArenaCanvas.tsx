import React, { useEffect, useRef, useState } from 'react';
import { CombatEntity, FloatingText, ParticleEffect, CombatEvent, MatchResult } from '../types/game';
import { updateCombatEngine, computePostMatchResult } from '../utils/combatEngine';
import { CHAMPIONS } from '../data/champions';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Flame,
  Skull,
  Crosshair,
  Heart,
  Sparkles,
  BarChart3,
  FileText,
  UserCheck,
  Target,
  Sword,
  Activity,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/sound';

interface ArenaCanvasProps {
  initialEntities: CombatEntity[];
  blueTeamName: string;
  redTeamName: string;
  onMatchComplete: (result: MatchResult) => void;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  initialEntities,
  blueTeamName,
  redTeamName,
  onMatchComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [muted, setMuted] = useState(!isSoundEnabled());
  const [matchTime, setMatchTime] = useState(0);
  const [matchOver, setMatchOver] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [spectatorTab, setSpectatorTab] = useState<'logs' | 'meters' | 'inspector'>('meters');

  // Mutable combat state
  const entitiesRef = useRef<CombatEntity[]>(JSON.parse(JSON.stringify(initialEntities)));
  const particlesRef = useRef<ParticleEffect[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const logsRef = useRef<CombatEvent[]>([]);
  const [logs, setLogs] = useState<CombatEvent[]>([]);

  const selectedEntityIdRef = useRef(selectedEntityId);
  selectedEntityIdRef.current = selectedEntityId;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;

  const matchOverRef = useRef(matchOver);
  matchOverRef.current = matchOver;

  const timeRef = useRef(0);

  // Toggle sound
  const handleToggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundEnabled(!next);
  };

  // Canvas click to select hero
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const clicked = entitiesRef.current.find((e) => {
      const dist = Math.hypot(e.x - clickX, e.y - clickY);
      return dist <= e.radius + 12;
    });

    if (clicked) {
      setSelectedEntityId(clicked.id);
      setSpectatorTab('inspector');
    } else {
      setSelectedEntityId(null);
    }
  };

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isPausedRef.current && !matchOverRef.current) {
        const effectiveDt = dt * speedRef.current;
        timeRef.current += effectiveDt;
        setMatchTime(timeRef.current);

        const result = updateCombatEngine(
          entitiesRef.current,
          particlesRef.current,
          floatingTextsRef.current,
          logsRef.current,
          effectiveDt,
          canvas.width,
          canvas.height
        );

        if (logsRef.current.length !== logs.length) {
          setLogs([...logsRef.current]);
        }

        if (result.matchFinished && !matchOverRef.current) {
          matchOverRef.current = true;
          setMatchOver(true);
          const finalResult = computePostMatchResult(
            result.winner || 'blue',
            entitiesRef.current,
            logsRef.current,
            Math.round(timeRef.current)
          );
          setTimeout(() => {
            onMatchComplete(finalResult);
          }, 1200);
        }
      }

      // RENDER CANVAS
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Grid Arena Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center Divider line & Circle
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Blue & Red side glow zones
      const blueGlow = ctx.createLinearGradient(0, 0, 220, 0);
      blueGlow.addColorStop(0, 'rgba(2, 132, 199, 0.15)');
      blueGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = blueGlow;
      ctx.fillRect(0, 0, 220, canvas.height);

      const redGlow = ctx.createLinearGradient(canvas.width, 0, canvas.width - 220, 0);
      redGlow.addColorStop(0, 'rgba(225, 29, 72, 0.15)');
      redGlow.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = redGlow;
      ctx.fillRect(canvas.width - 220, 0, 220, canvas.height);

      // 2. Draw Target Attack Beams/Lines
      entitiesRef.current.forEach((e) => {
        if (e.currentHp <= 0 || !e.targetId) return;
        const target = entitiesRef.current.find((t) => t.id === e.targetId);
        if (target && target.currentHp > 0) {
          const isSelected = selectedEntityIdRef.current === e.id;
          ctx.strokeStyle = isSelected
            ? '#facc15'
            : e.team === 'blue'
            ? 'rgba(56, 189, 248, 0.22)'
            : 'rgba(244, 63, 94, 0.22)';
          ctx.lineWidth = isSelected ? 2.5 : 1.2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      // 3. Draw Particles & Visual Projectiles / Beams
      particlesRef.current.forEach((p) => {
        const alpha = Math.max(0, Math.min(1, p.lifetime / (p.maxLifetime || 1)));

        if (p.shape === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(2, p.radius * (1 - p.lifetime / p.maxLifetime)), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        } else if (p.shape === 'laser' || p.shape === 'beam') {
          const sx = p.startX ?? p.x;
          const sy = p.startY ?? p.y;
          const tx = p.targetX ?? p.x;
          const ty = p.targetY ?? p.y;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;

          // Outer Glow Beam
          ctx.strokeStyle = p.color;
          ctx.lineWidth = (p.radius || 4) * 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Inner Core Beam Line
          ctx.strokeStyle = p.accentColor || '#ffffff';
          ctx.lineWidth = Math.max(1.5, (p.radius || 4) * 0.7);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          ctx.restore();
        } else if (p.shape === 'lightning') {
          const sx = p.startX ?? p.x;
          const sy = p.startY ?? p.y;
          const tx = p.targetX ?? p.x;
          const ty = p.targetY ?? p.y;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 14;
          ctx.lineWidth = p.radius || 3;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          const midX1 = sx + (tx - sx) * 0.35 + (Math.random() - 0.5) * 20;
          const midY1 = sy + (ty - sy) * 0.35 + (Math.random() - 0.5) * 20;
          const midX2 = sx + (tx - sx) * 0.70 + (Math.random() - 0.5) * 20;
          const midY2 = sy + (ty - sy) * 0.70 + (Math.random() - 0.5) * 20;
          ctx.lineTo(midX1, midY1);
          ctx.lineTo(midX2, midY2);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          ctx.restore();
        } else if (p.shape === 'missile' || p.shape === 'heal_beam') {
          ctx.save();
          // Draw trail
          if (p.trail && p.trail.length > 1) {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            for (let t = 0; t < p.trail.length - 1; t++) {
              const pt1 = p.trail[t];
              const pt2 = p.trail[t + 1];
              const trailAlpha = (t / p.trail.length) * alpha;
              ctx.strokeStyle = p.color;
              ctx.lineWidth = Math.max(1, p.radius * (t / p.trail.length));
              ctx.globalAlpha = trailAlpha;
              ctx.beginPath();
              ctx.moveTo(pt1.x, pt1.y);
              ctx.lineTo(pt2.x, pt2.y);
              ctx.stroke();
            }
          }

          // Draw projectile head orb
          ctx.globalAlpha = alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = p.accentColor || '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        } else if (p.shape === 'meteor') {
          ctx.save();
          // Draw fiery tail stream
          if (p.trail && p.trail.length > 1) {
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 15;
            for (let t = 0; t < p.trail.length - 1; t++) {
              const pt1 = p.trail[t];
              const pt2 = p.trail[t + 1];
              const trailAlpha = (t / p.trail.length) * alpha;
              ctx.strokeStyle = t % 2 === 0 ? '#dc2626' : '#f97316';
              ctx.lineWidth = p.radius * (t / p.trail.length) * 1.5;
              ctx.globalAlpha = trailAlpha;
              ctx.beginPath();
              ctx.moveTo(pt1.x, pt1.y);
              ctx.lineTo(pt2.x, pt2.y);
              ctx.stroke();
            }
          }

          // Draw meteor blazing core
          ctx.globalAlpha = alpha;
          ctx.shadowColor = '#fef08a';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.restore();
        } else {
          // Standard particle / star / dot
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 4. Draw Combat Entities (Heroes)
      entitiesRef.current.forEach((e) => {
        if (e.currentHp <= 0) {
          // Dead marker
          ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✖', e.x, e.y + 3);
          return;
        }

        const isSelected = selectedEntityIdRef.current === e.id;

        // Ultimate / Full Mana Pulsing Aura
        if (e.energy >= e.maxEnergy) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 6 + Math.sin(now / 150) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Selection Reticle Ring
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Team Ring Glow
        ctx.shadowColor = e.team === 'blue' ? '#38bdf8' : '#f43f5e';
        ctx.shadowBlur = 12;

        // Base Circle
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border outline
        ctx.strokeStyle = e.team === 'blue' ? '#38bdf8' : '#fb7185';
        ctx.lineWidth = e.isInvulnerable > 0 ? 4 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Role Icon / Avatar emoji & Name label
        const champData = CHAMPIONS.find((c) => c.id === e.championId);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(champData?.avatarIcon || e.name.substring(0, 2), e.x, e.y);

        // Stun / Invulnerable effect ring with orbiting star
        if (e.isStunned > 0) {
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 5, 0, Math.PI * 2);
          ctx.stroke();

          // Orbiting star point
          const angle = now / 200;
          const starX = e.x + Math.cos(angle) * (e.radius + 5);
          const starY = e.y + Math.sin(angle) * (e.radius + 5);
          ctx.fillStyle = '#67e8f9';
          ctx.beginPath();
          ctx.arc(starX, starY, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (e.shield > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // HEALTH BAR & MANA GAUGE OVERLAY ABOVE HEAD
        const barWidth = 46;
        const barHeight = 5;
        const barX = e.x - barWidth / 2;
        const barY = e.y - e.radius - 17;

        // Health Bar BG
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Current HP fill
        const hpPercent = Math.max(0, e.currentHp / e.maxHp);
        ctx.fillStyle = e.team === 'blue' ? '#0284c7' : '#e11d48';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Shield Overlay
        if (e.shield > 0) {
          const shieldPercent = Math.min(1, e.shield / e.maxHp);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(barX + barWidth * hpPercent, barY, barWidth * shieldPercent, barHeight);
        }

        // Health Bar Border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Energy / Mana Bar (Gold/Cyan)
        const energyY = barY + barHeight + 1;
        const energyHeight = 3.5;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX, energyY, barWidth, energyHeight);

        const energyPercent = Math.min(1, e.energy / e.maxEnergy);
        ctx.fillStyle = energyPercent >= 1 ? '#eab308' : '#38bdf8';
        ctx.fillRect(barX, energyY, barWidth * energyPercent, energyHeight);
      });

      // 5. Draw Floating Texts
      floatingTextsRef.current.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const blueKills = entitiesRef.current.filter((e) => e.team === 'blue').reduce((a, b) => a + b.kills, 0);
  const redKills = entitiesRef.current.filter((e) => e.team === 'red').reduce((a, b) => a + b.kills, 0);

  const selectedEntity = entitiesRef.current.find((e) => e.id === selectedEntityId);
  const selectedChampData = selectedEntity ? CHAMPIONS.find((c) => c.id === selectedEntity.championId) : null;

  // Compute max damage dealt for relative meter scaling
  const maxDmgDealt = Math.max(1, ...entitiesRef.current.map((e) => e.totalDamageDealt));

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-2">
      {/* ESPORTS BROADCAST HUD HEADER */}
      <div className="w-full bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
        {/* Blue Team Score */}
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></div>
          <div>
            <h3 className="font-extrabold text-sky-400 text-base uppercase tracking-wider">{blueTeamName}</h3>
            <p className="text-xs text-slate-400 font-mono">BLUE CORNER</p>
          </div>
          <span className="text-3xl font-black text-sky-400 font-mono ml-3">{blueKills}</span>
        </div>

        {/* Live Match Timer & Controls */}
        <div className="flex flex-col items-center space-y-1">
          <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono text-amber-400 font-bold text-lg shadow-inner">
            {Math.floor(matchTime / 60)}:{Math.floor(matchTime % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors cursor-pointer"
              title={isPaused ? 'Resume Battle' : 'Pause Battle'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                const speeds = [1, 2, 4];
                const next = speeds[(speeds.indexOf(speedMultiplier) + 1) % speeds.length];
                setSpeedMultiplier(next);
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-amber-400 rounded transition-colors cursor-pointer"
              title="Game Speed"
            >
              {speedMultiplier}X SPEED
            </button>
            <button
              onClick={handleToggleSound}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors cursor-pointer"
              title="Toggle Audio"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Red Team Score */}
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-black text-rose-500 font-mono mr-3">{redKills}</span>
          <div className="text-right">
            <h3 className="font-extrabold text-rose-400 text-base uppercase tracking-wider">{redTeamName}</h3>
            <p className="text-xs text-slate-400 font-mono">RED CORNER</p>
          </div>
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
        </div>
      </div>

      {/* 2D CANVAS BATTLEFIELD */}
      <div className="relative w-full flex justify-center bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onClick={handleCanvasClick}
          className="w-full max-w-[800px] h-auto object-contain cursor-crosshair border-x border-slate-800 shadow-inner"
        />

        {/* Click Instruction Badge */}
        <div className="absolute top-3 left-4 bg-slate-900/80 border border-slate-700/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <Target className="w-3 h-3 text-cyan-400 animate-pulse" /> Click hero on canvas to inspect live stats
        </div>

        {/* Match Over Overlay */}
        {matchOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
            <div className="text-3xl font-black tracking-widest text-amber-400 font-mono mb-2">MATCH COMPLETED</div>
            <p className="text-slate-300 text-sm">Calculating combat stats & rewards...</p>
          </div>
        )}
      </div>

      {/* SPECTATOR DASHBOARD CONTROL TABS */}
      <div className="w-full bg-slate-950 border-t border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSpectatorTab('meters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              spectatorTab === 'meters'
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> LIVE DAMAGE METERS
          </button>
          <button
            onClick={() => setSpectatorTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              spectatorTab === 'logs'
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> COMBAT LOGS ({logs.length})
          </button>
          <button
            onClick={() => setSpectatorTab('inspector')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              spectatorTab === 'inspector'
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> HERO INSPECTOR {selectedEntity && `(${selectedEntity.name})`}
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
          SPECTATOR ENGINE v2.4 • REALTIME 2D CANVAS
        </span>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="w-full bg-slate-950 px-4 py-3 border-t border-slate-800 text-xs font-mono">
        {spectatorTab === 'meters' && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              {/* Blue Team Damage Meters */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                  {blueTeamName} DAMAGE OUTPUT
                </p>
                {entitiesRef.current
                  .filter((e) => e.team === 'blue')
                  .map((e) => {
                    const pct = (e.totalDamageDealt / maxDmgDealt) * 100;
                    return (
                      <div key={e.id} className="bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="font-bold text-white flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }}></span>
                            {e.name} ({e.role})
                          </span>
                          <span className="text-sky-300 font-bold">{Math.round(e.totalDamageDealt)} DMG</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Red Team Damage Meters */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                  {redTeamName} DAMAGE OUTPUT
                </p>
                {entitiesRef.current
                  .filter((e) => e.team === 'red')
                  .map((e) => {
                    const pct = (e.totalDamageDealt / maxDmgDealt) * 100;
                    return (
                      <div key={e.id} className="bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="font-bold text-white flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }}></span>
                            {e.name} ({e.role})
                          </span>
                          <span className="text-rose-300 font-bold">{Math.round(e.totalDamageDealt)} DMG</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {spectatorTab === 'logs' && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {logs.slice(-12).reverse().map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border flex items-center justify-between text-[11px] ${
                  log.type === 'kill'
                    ? 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                    : log.type === 'skill'
                    ? 'bg-sky-950/30 border-sky-800/50 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span>{log.text}</span>
                <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}

        {spectatorTab === 'inspector' && (
          <div>
            {selectedEntity ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{selectedChampData?.avatarIcon}</span>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{selectedEntity.name}</h4>
                      <p className="text-[10px] text-cyan-400">
                        {selectedEntity.role}
                      </p>
                    </div>
                  </div>

                  {/* HP & Energy Gauges */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>HEALTH</span>
                      <span>
                        {Math.round(selectedEntity.currentHp)} / {selectedEntity.maxHp} HP
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{
                          width: `${Math.max(0, (selectedEntity.currentHp / selectedEntity.maxEntityHp || selectedEntity.maxHp) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>MANA / ENERGY</span>
                      <span>
                        {Math.round(selectedEntity.energy)} / {selectedEntity.maxEnergy} MP
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded overflow-hidden">
                      <div
                        className="bg-amber-400 h-full transition-all"
                        style={{ width: `${(selectedEntity.energy / selectedEntity.maxEnergy) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Combat Stats Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px]">
                  <div>
                    <span className="text-slate-500">ATTACK POWER:</span>
                    <p className="text-white font-bold">{Math.round(selectedEntity.attackPower)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">DEFENSE:</span>
                    <p className="text-white font-bold">{Math.round(selectedEntity.defense)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ATTACK SPEED:</span>
                    <p className="text-white font-bold">{selectedEntity.attackSpeed.toFixed(2)}/s</p>
                  </div>
                  <div>
                    <span className="text-slate-500">CRIT RATE:</span>
                    <p className="text-white font-bold">{(selectedEntity.critRate * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">TOTAL DMG DEALT:</span>
                    <p className="text-sky-400 font-bold">{Math.round(selectedEntity.totalDamageDealt)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">TOTAL HEALING:</span>
                    <p className="text-emerald-400 font-bold">{Math.round(selectedEntity.totalHealingDone)}</p>
                  </div>
                </div>

                {/* Skill & Equipment Card */}
                <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px]">
                  <div>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> ULTIMATE: {selectedEntity.skill.name}
                    </span>
                    <p className="text-slate-400 text-[9.5px] line-clamp-2">{selectedEntity.skill.description}</p>
                  </div>
                  {selectedEntity.item && (
                    <div className="pt-1 border-t border-slate-800">
                      <span className="text-cyan-400 font-bold">EQUIPPED: {selectedEntity.item.name}</span>
                      <p className="text-slate-400 text-[9.5px]">{selectedEntity.item.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 italic">
                Click on any combat unit in the 2D arena above to inspect real-time combat stats and ultimate skill status!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

