import React, { useState, useEffect, useRef } from 'react';
import { Moon, Play, Square, Timer, RefreshCw, Volume2 } from 'lucide-react';
import { SoundType } from '../types';
import { earphoneAudio } from '../audioEngine';

const AMBIENT_SOUNDS: { type: SoundType; name: string; desc: string }[] = [
  {
    type: 'binaural',
    name: 'Theta Sleep Drifter 🌌',
    desc: 'Very low 5Hz binaural differential to settle brain activity into a light sleep/REMy cycle.',
  },
  {
    type: 'whisper',
    name: 'Warm Brownian Storm ☁️',
    desc: 'Extremely deep filtered rumble noise that mimics distant heavy rain and safe room conditions.',
  },
  {
    type: 'chime',
    name: 'Lullaby Pentatonic Harps 🎵',
    desc: 'Extremely slow, random soft chimes played inside middle C major scale to ease hyperactive minds.',
  },
];

export default function BedtimeRelaxer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SoundType>('binaural');
  const [sleepMinutes, setSleepMinutes] = useState(15);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [maxVolume, setMaxVolume] = useState(0.35);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // Sync ambient play volume modifications
  useEffect(() => {
    if (isPlaying) {
      earphoneAudio.setVolume(maxVolume);
    }
  }, [maxVolume, isPlaying]);

  const startRelaxer = () => {
    earphoneAudio.stopAll();
    setIsPlaying(true);
    
    // Set timer remaining seconds
    const totalSecs = sleepMinutes * 60;
    setSecondsRemaining(totalSecs);

    // Play synthesis
    earphoneAudio.startAmbient(selectedTrack, maxVolume);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    // Start tick countdown
    timerRef.current = window.setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          stopRelaxer();
          return 0;
        }

        // Fade out volume in the last 15 seconds of play
        if (prev <= 15) {
          const ratio = (prev - 1) / 15;
          earphoneAudio.setVolume(maxVolume * ratio);
        }

        return prev - 1;
      });
    }, 1000);
  };

  const stopRelaxer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    earphoneAudio.stopAll();
    setIsPlaying(false);
    setSecondsRemaining(0);
  };

  const formatTimeRemaining = () => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-purple-950/10 border border-purple-800/20 rounded-3xl backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.05)]">
      <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/15 rounded-xl text-purple-300">
            <Moon className="w-5 h-5 animate-[pulse_3s_infinite] text-purple-400" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Sleep Landscape</span>
              <span className="text-pink-400">🌙</span>
            </h2>
            <p className="text-xs text-purple-300/60 font-mono">Soothing chimes to help you sleep</p>
          </div>
        </div>

        {/* Display Status */}
        {isPlaying && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-pink-500/15 border border-pink-500/30 text-pink-400 font-mono text-[10px] rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
            <span>Fading out {formatTimeRemaining()}</span>
          </div>
        )}
      </div>

      {/* Select Bedtime track */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono text-purple-300/80 text-left">1. Select Sleep Landscape</label>
        <div className="flex flex-col gap-2 bg-purple-950/40 p-2 border border-purple-900/30 rounded-2xl">
          {AMBIENT_SOUNDS.map(track => {
            const isSelected = selectedTrack === track.type;
            return (
              <button
                key={track.type}
                onClick={() => {
                  setSelectedTrack(track.type);
                  if (isPlaying) {
                    // Update live audio immediately on track selection
                    earphoneAudio.startAmbient(track.type, maxVolume);
                  }
                }}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col gap-0.5 ${
                  isSelected
                    ? 'bg-purple-600/20 border-purple-400/40'
                    : 'bg-transparent border-transparent hover:border-purple-900/30'
                }`}
              >
                <span className={`text-xs font-bold ${isSelected ? 'text-pink-400' : 'text-purple-200'}`}>
                  {track.name}
                </span>
                <p className="text-[10px] text-purple-300/60 leading-normal">{track.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Select Timeout Minutes and Max Volume */}
      <div className="grid grid-cols-2 gap-4 items-end">
        {/* Sleep Timeout */}
        <div className="flex flex-col gap-1.5 text-left font-mono">
          <label className="text-[10px] text-purple-300/80 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-purple-400" />
            <span>Auto-Shutoff Timer</span>
          </label>
          <div className="flex items-center gap-1 bg-purple-950/50 px-2 py-1.5 border border-purple-900/30 rounded-xl">
            <select
              value={sleepMinutes}
              onChange={e => setSleepMinutes(parseInt(e.target.value))}
              disabled={isPlaying}
              className="bg-transparent text-xs text-purple-300 focus:outline-none w-full cursor-pointer disabled:opacity-50"
            >
              <option value={5}>5 Minutes TEST</option>
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>1 Hour</option>
            </select>
          </div>
        </div>

        {/* Ambient Max Volume */}
        <div className="flex flex-col gap-1.5 text-left font-mono">
          <label className="text-[10px] text-purple-300/80 flex justify-between">
            <span>Ambient Level</span>
            <span className="text-purple-300 font-bold">{Math.round(maxVolume * 100)}%</span>
          </label>
          <div className="px-1 py-1 bg-purple-950/50 border border-purple-900/30 rounded-xl flex items-center">
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={maxVolume}
              onChange={e => setMaxVolume(parseFloat(e.target.value))}
              className="w-full accent-pink-500 bg-purple-900 h-1 rounded-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Live Play controls */}
      <div className="pt-2">
        {isPlaying ? (
          <button
            onClick={stopSleepTimerSession}
            className="w-full py-3 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 hover:border-red-900/70 text-red-300 rounded-2xl text-xs font-semibold cursor-pointer select-none transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(244,63,94,0.05)]"
          >
            <Square className="w-3.5 h-3.5 fill-red-300" />
            <span>Deactivate Sleep Landscape</span>
          </button>
        ) : (
          <button
            onClick={startRelaxer}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 hover:shadow-[0_0_15px_rgba(168,85,247,0.35)] text-white rounded-2xl text-xs font-bold cursor-pointer select-none transition flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Arm & Start Sleep Landscape</span>
          </button>
        )}
      </div>
    </div>
  );

  function stopSleepTimerSession() {
    stopRelaxer();
  }
}
