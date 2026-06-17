import React, { useState, useEffect } from 'react';
import { Clock, Moon, CheckCircle2, ChevronRight, BellRing, Headphones, Sparkles } from 'lucide-react';
import { Alarm } from '../types';

interface ActiveAlarmOverlayProps {
  alarm: Alarm;
  onDismiss: () => void;
  onSnooze: () => void;
}

const soundTypeNames: Record<string, string> = {
  'bts_dynamite': 'BTS — Dynamite 🎵',
  'bts_butter': 'BTS — Butter 🥞',
  'bts_spring': 'BTS — Spring Day 🌸',
  'bts_lgo': 'BTS — Life Goes On 💙',
  'bts_bwl': 'BTS — Boy With Luv 💖',
  'bts_fakelove': 'BTS — Fake Love 💔',
  'bts_dna': 'BTS — DNA 🧬',
  'bts_ptd': 'BTS — Permission to Dance 🕺',
  'bts_piedpiper': 'BTS — Pied Piper 🎶',
  'bts_arirang': 'BTS — Arirang 🌸',
  'bts_comeover': 'BTS — Come Over 🔍',
  'binaural': 'Binaural Focus Pulse 🧠',
  'whisper': 'Whispering Breezes 💨',
  'chime': 'Crystal Chimes 🔔',
  'pulse': 'Shoulder Pulse 🤚',
  'nature': 'Warm Stream 🏞️'
};

const BTS_MEMBERS = [
  { id: 'rm', name: 'RM', emoji: '🐨' },
  { id: 'jin', name: 'Jin', emoji: '🐹' },
  { id: 'suga', name: 'Suga', emoji: '🐱' },
  { id: 'jhope', name: 'J-Hope', emoji: '🐿️' },
  { id: 'jimin', name: 'Jimin', emoji: '🐥' },
  { id: 'v', name: 'V', emoji: '🐯' },
  { id: 'jk', name: 'Jungkook', emoji: '🐰' }
];

export default function ActiveAlarmOverlay({
  alarm,
  onDismiss,
  onSnooze,
}: ActiveAlarmOverlayProps) {
  const [tickerTime, setTickerTime] = useState('');
  const [awakenedMembers, setAwakenedMembers] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  // Local clock ticking within the sleep face
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTickerTime(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const playChimeTone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gainNode).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (err) {}
  };

  const handleTapMember = (memberId: string) => {
    if (awakenedMembers.includes(memberId)) return;
    playChimeTone();
    setAwakenedMembers(prev => [...prev, memberId]);
    setShowWarning(false);
  };

  const isChallengePassed = !alarm.heavySleeperMode || awakenedMembers.length === 7;

  const handleDismissAttempt = () => {
    if (isChallengePassed) {
      onDismiss();
    } else {
      setShowWarning(true);
      // Play brief high-fail sound indicator
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
          osc.connect(gainNode).connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        }
      } catch (err) {}
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col justify-between p-6 select-none animate-[fadeIn_0.3s_ease-out] overflow-y-auto text-center">
      {/* Visual pulse glow mimicking rhythmic breathing wake cycles */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#120822] via-[#040108] to-[#120822] -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-pink-600/5 rounded-full blur-[120px] animate-pulse pointer-events-none -z-10" />

      {/* Top Header Panel */}
      <div className="z-10 flex flex-col items-center gap-1.5 pt-6">
        <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-pink-400 mb-2 animate-bounce">
          <BellRing className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-200 text-xs font-mono font-bold tracking-wider animate-pulse">
          <Headphones className="w-4 h-4 text-purple-300" />
          <span>SOUNDING STRICTLY INSIDE ARMY BUDS 💜</span>
        </div>
      </div>

      {/* Center Alarm Clock Information */}
      <div className="z-10 flex flex-col items-center gap-3">
        {/* Massive digital readout */}
        <span className="text-5xl sm:text-7xl font-sans font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(232,121,249,0.4)]">
          {tickerTime}
        </span>

        {/* Custom Alarm Text */}
        <h1 className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 bg-clip-text text-transparent tracking-tight mt-1">
          {alarm.label}
        </h1>

        <div className="flex items-center gap-1.5 text-xs text-purple-300/80 font-mono mt-0.5 font-semibold">
          <span>Your song trigger:</span>
          <span className="text-pink-400 font-bold underline underline-offset-4">{soundTypeNames[alarm.soundType] || alarm.soundType}</span>
        </div>
      </div>

      {/* Deep Sleeper / Magic Shop Lineup Mini-Game */}
      {alarm.heavySleeperMode && (
        <div className="z-10 w-full max-w-sm mx-auto bg-purple-950/45 border border-purple-500/30 rounded-3xl p-5 my-4 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex flex-col gap-3">
          <h3 className="text-xs font-black text-pink-300 tracking-wider uppercase flex items-center justify-center gap-1.5 animate-pulse">
            <Sparkles className="w-4 h-4 text-pink-400 animate-spin-slow" />
            <span>Magic Shop Wakeup Challenge 💜</span>
          </h3>
          <p className="text-[11px] text-purple-200/90 leading-normal font-medium">
            Let's shake off that heavy sleep! Wake your brain by tapping all 7 sleepy BTS member badges below:
          </p>

          <div className="grid grid-cols-4 gap-2 mt-2">
            {BTS_MEMBERS.map(member => {
              const isTapped = awakenedMembers.includes(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => handleTapMember(member.id)}
                  className={`py-2 px-1 rounded-xl text-center transition duration-200 cursor-pointer select-none flex flex-col items-center gap-1 ${
                    isTapped
                      ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)] scale-100 ring-2 ring-pink-300/40'
                      : 'bg-[#150a22] hover:bg-purple-900/30 text-purple-400 border border-purple-900/40 hover:text-purple-300 scale-95'
                  }`}
                >
                  <span className="text-xl leading-tight">{member.emoji}</span>
                  <span className="font-mono text-[9px] font-bold">{member.name}</span>
                </button>
              );
            })}
          </div>

          <div className="text-2xs text-purple-300 font-bold font-mono mt-1">
            {awakenedMembers.length === 7 ? (
              <span className="text-emerald-400 font-bold animate-bounce block">🎉 All 7 BTS Assembled! Sleep Cleared! 💜</span>
            ) : (
              <span>Assembled: <strong className="text-pink-400">{awakenedMembers.length} / 7</strong> members</span>
            )}
          </div>
        </div>
      )}

      {/* Massive Bottom Interactive Grids for Bedside Utility */}
      <div className="z-10 w-full max-w-md mx-auto flex flex-col gap-3 pb-8">
        
        {showWarning && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 text-xs py-2 px-3.5 rounded-2xl animate-bounce font-mono font-bold leading-normal">
            ⚠️ Sleepyhead Alert! Assemble all 7 BTS members first to unlock! 🐨🐹🐱🐿️🐥🐯🐰
          </div>
        )}

        {/* Giant Snooze Button */}
        <button
          onClick={onSnooze}
          className="w-full py-4.5 sm:py-5 bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/40 active:bg-purple-950/50 text-purple-250 rounded-3xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5 shadow-lg cursor-pointer transform hover:scale-[1.01]"
        >
          <span className="text-base font-black tracking-wider uppercase font-sans text-pink-300">
            Snooze Call ⏱️
          </span>
          <span className="text-2xs font-mono text-purple-300/50">
            Postpones melody for {alarm.snoozeDuration} minutes safely
          </span>
        </button>

        {/* Giant Dismiss Button */}
        <button
          onClick={handleDismissAttempt}
          className={`w-full py-5 sm:py-6 rounded-3xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5 shadow-xl cursor-pointer transform hover:scale-[1.01] ${
            isChallengePassed
              ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:brightness-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] text-white'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-zinc-850 hover:border-zinc-700/80'
          }`}
        >
          <span className="text-lg font-black tracking-widest uppercase font-sans flex items-center gap-1.5">
            Dismiss Alarm 💜
          </span>
          <span className={`text-2xs font-mono ${isChallengePassed ? 'text-white/80' : 'text-zinc-500'}`}>
            {isChallengePassed ? 'Stops chimes completely' : 'Locked until Magic Shop lineup assembled'}
          </span>
        </button>

        <div className="text-[11px] text-purple-300/40 font-mono leading-relaxed pt-1.5">
          Keep your earphones in until dismissing to guarantee roommate silence.
        </div>
      </div>
    </div>
  );
}
