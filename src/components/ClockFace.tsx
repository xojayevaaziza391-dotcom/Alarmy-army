import React, { useState, useEffect } from 'react';
import { Clock, Eye, Headphones, ShieldAlert, BadgeInfo } from 'lucide-react';

interface ClockFaceProps {
  is24Hour: boolean;
  setIs24Hour: (val: boolean) => void;
  isCalibrated: boolean;
  roommateModeActive: boolean;
}

export default function ClockFace({
  is24Hour,
  setIs24Hour,
  isCalibrated,
  roommateModeActive,
}: ClockFaceProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeString = () => {
    let hours = time.getHours();
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');
    
    if (is24Hour) {
      return {
        hours: String(hours).padStart(2, '0'),
        minutes,
        seconds,
        ampm: '',
      };
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // if hour is 0, make it 12
      return {
        hours: String(hours).padStart(2, '0'),
        minutes,
        seconds,
        ampm,
      };
    }
  };

  const { hours, minutes, seconds, ampm } = formatTimeString();
  const dayName = time.toLocaleDateString(undefined, { weekday: 'long' });
  const dateFormatted = time.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-purple-950/20 border border-purple-800/30 rounded-3xl backdrop-blur-md shadow-[0_0_35px_rgba(168,85,247,0.12)] relative overflow-hidden group">
      {/* Dynamic ambient backdrop glow */}
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-600/30 transition-all duration-700" />
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-fuchsia-600/20 rounded-full blur-3xl group-hover:bg-fuchsia-600/30 transition-all duration-700" />

      {/* Date & Mode Header */}
      <div className="w-full flex items-center justify-between mb-4 z-10">
        <div className="flex flex-col text-left">
          <span className="text-sm font-bold text-purple-300 capitalize flex items-center gap-1.5">
            <span>{dayName}</span>
            <span className="text-pink-400">✨</span>
          </span>
          <span className="text-xs text-purple-400/80 font-mono tracking-wider">{dateFormatted}</span>
        </div>
        
        {/* Toggle 12h/24h */}
        <button
          onClick={() => setIs24Hour(!is24Hour)}
          className="text-xs font-mono px-3.5 py-1.5 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 rounded-full border border-purple-700/40 transition-all cursor-pointer select-none shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:brightness-110"
        >
          {is24Hour ? '24HR' : '12HR'}
        </button>
      </div>

      {/* Massive Clock Digits */}
      <div className="flex items-baseline justify-center select-none z-10 py-5">
        <div className="flex items-center text-7xl sm:text-8xl font-sans tracking-tight text-white font-black tabular-nums drop-shadow-[0_0_20px_rgba(232,121,249,0.35)]">
          <span>{hours}</span>
          <span className="text-pink-500 animate-[pulse_1s_infinite] mx-1">:</span>
          <span>{minutes}</span>
        </div>
        
        {/* Seconds and AM/PM stack */}
        <div className="flex flex-col items-start ml-3">
          {ampm && (
            <span className="text-sm font-extrabold tracking-wider text-pink-400 bg-pink-950/40 border border-pink-800/30 px-1.5 py-0.5 rounded font-sans leading-none mb-1">
              {ampm}
            </span>
          )}
          <span className="text-xl font-mono font-bold text-purple-400/80 leading-none">
            {seconds}
          </span>
        </div>
      </div>

      {/* Sweet BTS I Purple You banner sign */}
      <div className="z-10 py-1 px-3 bg-purple-900/30 border border-purple-500/20 rounded-full text-3xs font-mono font-bold tracking-widest text-[#e9d5ff] flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.08)] mb-2 animate-pulse">
        <span className="text-pink-400">💜</span>
        <span>보라해 • I PURPLE YOU</span>
        <span className="text-pink-400">💜</span>
      </div>

      {/* Earphone Status Strip */}
      <div className="w-full flex flex-col gap-2 mt-2 pt-4 border-t border-purple-900/40 z-10">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          
          {/* Earphone connection status badge */}
          {isCalibrated ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs rounded-full font-medium">
              <Headphones className="w-3.5 h-3.5 text-purple-300" />
              <span>ARMY Buds Calibrated</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-950/35 border border-pink-500/30 text-pink-300 text-xs rounded-full animate-pulse font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
              <span>Uncalibrated (Roommate Risk)</span>
            </div>
          )}

          {/* Disconnection auto-mute shield badge */}
          {roommateModeActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-200 text-xs rounded-full font-medium">
              <Clock className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>Auto-Mute Guard Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-950/50 border border-purple-800 text-purple-400 text-xs rounded-full">
              <span>Auto-Mute Disabled</span>
            </div>
          )}
        </div>

        {/* Warning descriptor helper */}
        {!isCalibrated && (
          <div className="flex items-center justify-center gap-1 text-[11px] text-purple-300/60 pt-1 text-center font-mono">
            <BadgeInfo className="w-3 h-3 text-purple-400 shrink-0" />
            <span>Complete earphone calibration to secure isolation.</span>
          </div>
        )}
      </div>
    </div>
  );
}
