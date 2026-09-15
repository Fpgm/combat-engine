import React, { useState, useEffect } from 'react';
import {
  PlayerManagerProfile,
  RivalTeam,
  TeamMember,
  CombatEntity,
  MatchResult,
} from './types/game';
import { Navbar } from './components/Navbar';
import { ManagerHQ } from './components/ManagerHQ';
import { DraftPhase } from './components/DraftPhase';
import { ArenaCanvas } from './components/ArenaCanvas';
import { PostMatchModal } from './components/PostMatchModal';
import { ChampionCodex } from './components/ChampionCodex';
import { ExhibitionSandbox } from './components/ExhibitionSandbox';
import { initializeCombatEntities } from './utils/combatEngine';

export default function App() {
  const [activeView, setActiveView] = useState<'hq' | 'codex' | 'sandbox' | 'draft' | 'arena'>('hq');

  // Player Manager Profile state
  const [profile, setProfile] = useState<PlayerManagerProfile>({
    teamName: 'TITAN LEGENDS',
    teamTag: 'TTL',
    funds: 1200,
    trophies: 3,
    division: 'Gold',
    divisionPoints: 45,
    unlockedItems: ['infinity_edge', 'warmog_heart', 'rabadon_crown'],
    masteries: {
      aegis: { championId: 'aegis', level: 2, matchesPlayed: 5, wins: 4 },
      kaelen: { championId: 'kaelen', level: 2, matchesPlayed: 5, wins: 3 },
      vortek: { championId: 'vortek', level: 1, matchesPlayed: 3, wins: 2 },
      lyra: { championId: 'lyra', level: 1, matchesPlayed: 2, wins: 2 },
    },
  });

  // Current match configuration
  const [selectedRival, setSelectedRival] = useState<RivalTeam | null>(null);
  const [matchBlueName, setMatchBlueName] = useState<string>('TITAN LEGENDS');
  const [matchRedName, setMatchRedName] = useState<string>('OPPONENT');
  const [blueRoster, setBlueRoster] = useState<TeamMember[]>([]);
  const [redRoster, setRedRoster] = useState<TeamMember[]>([]);
  const [combatEntities, setCombatEntities] = useState<CombatEntity[]>([]);
  const [activeResult, setActiveResult] = useState<MatchResult | null>(null);

  // Start match against a rival
  const handleStartRivalMatch = (rival: RivalTeam) => {
    setSelectedRival(rival);
    setMatchBlueName(profile.teamName);
    setMatchRedName(rival.name);
    setActiveView('draft');
  };

  // Draft Completed -> Setup Battlefield Arena
  const handleDraftComplete = (bRoster: TeamMember[], rRoster: TeamMember[]) => {
    setBlueRoster(bRoster);
    setRedRoster(rRoster);

    const entities = initializeCombatEntities(bRoster, rRoster, 800, 500);
    setCombatEntities(entities);
    setActiveView('arena');
  };

  // Start Sandbox match directly
  const handleStartSandboxMatch = (bRoster: TeamMember[], rRoster: TeamMember[]) => {
    setMatchBlueName('BLUE TEAM');
    setMatchRedName('RED TEAM');
    setBlueRoster(bRoster);
    setRedRoster(rRoster);

    const entities = initializeCombatEntities(bRoster, rRoster, 800, 500);
    setCombatEntities(entities);
    setActiveView('arena');
  };

  // Match finished in Arena
  const handleMatchComplete = (result: MatchResult) => {
    setActiveResult(result);
  };

  // Continue from post-match modal
  const handleClosePostMatchModal = (goldEarned: number, lpEarned: number) => {
    const isWin = activeResult?.winner === 'blue';
    const newPoints = Math.max(0, profile.divisionPoints + lpEarned);

    // Save to localStorage
    try {
      const savedProfile = {
        ...profile,
        funds: profile.funds + goldEarned,
        trophies: isWin ? profile.trophies + 1 : profile.trophies,
        divisionPoints: newPoints,
      };
      localStorage.setItem('ttl_profile', JSON.stringify(savedProfile));
    } catch {
      // localStorage unavailable — silently continue
    }

    setProfile((prev) => ({
      ...prev,
      funds: prev.funds + goldEarned,
      trophies: isWin ? prev.trophies + 1 : prev.trophies,
      divisionPoints: newPoints,
    }));

    setActiveResult(null);
    setActiveView('hq');
  };

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ttl_profile');
      if (saved) {
        const parsed = JSON.parse(saved) as PlayerManagerProfile;
        setProfile((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // localStorage unavailable or corrupted — use defaults
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* HEADER NAVBAR */}
      <Navbar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveResult(null);
          setActiveView(v);
        }}
        profile={profile}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-center">
        {activeView === 'hq' && (
          <ManagerHQ
            profile={profile}
            onUpdateProfile={setProfile}
            onStartMatch={handleStartRivalMatch}
          />
        )}

        {activeView === 'draft' && (
          <DraftPhase
            blueTeamName={matchBlueName}
            redTeamName={matchRedName}
            opponentPool={selectedRival?.championPool}
            teamSize={4}
            onDraftComplete={handleDraftComplete}
          />
        )}

        {activeView === 'arena' && (
          <div className="flex flex-col items-center">
            <ArenaCanvas
              initialEntities={combatEntities}
              blueTeamName={matchBlueName}
              redTeamName={matchRedName}
              onMatchComplete={handleMatchComplete}
            />
          </div>
        )}

        {activeView === 'codex' && <ChampionCodex />}

        {activeView === 'sandbox' && (
          <ExhibitionSandbox onStartSandboxMatch={handleStartSandboxMatch} />
        )}
      </main>

      {/* POST MATCH RESULTS MODAL */}
      {activeResult && (
        <PostMatchModal
          result={activeResult}
          blueTeamName={matchBlueName}
          redTeamName={matchRedName}
          onContinue={handleClosePostMatchModal}
        />
      )}
    </div>
  );
}
