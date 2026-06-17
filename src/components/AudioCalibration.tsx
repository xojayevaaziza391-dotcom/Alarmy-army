import React, { useState, useEffect } from 'react';
import { Headphones, CheckCircle2, Circle, Play, HelpCircle, ShieldAlert, Check } from 'lucide-react';
import { earphoneAudio } from '../audioEngine';
import { CalibrationState } from '../types';

interface AudioCalibrationProps {
  calibration: CalibrationState;
  setCalibration: React.Dispatch<React.SetStateAction<CalibrationState>>;
  roommateModeActive: boolean;
  setRoommateModeActive: (val: boolean) => void;
}

export default function AudioCalibration({
  calibration,
  setCalibration,
  roommateModeActive,
  setRoommateModeActive,
}: AudioCalibrationProps) {
  const [testingSide, setTestingSide] = useState<'left' | 'right' | null>(null);
  const [showTesterGuide, setShowTesterGuide] = useState(false);

  // Auto-clear visual indicator when test ends
  useEffect(() => {
    if (testingSide) {
      const timer = setTimeout(() => {
        setTestingSide(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [testingSide]);

  const runTest = (side: 'left' | 'right') => {
    setTestingSide(side);
    earphoneAudio.playCalibrationSound(side);
    
    setCalibration(prev => {
      const updated = {
        ...prev,
        hasLeftTested: side === 'left' ? true : prev.hasLeftTested,
        hasRightTested: side === 'right' ? true : prev.hasRightTested,
        lastTestTimestamp: Date.now(),
      };
      
      // Auto-secure if all checks are answered
      return updated;
    });
  };

  const toggleCheck = (key: 'hasConfirmedIsolation' | 'hasConfirmedVolume') => {
    setCalibration(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      };
      return updated;
    });
  };

  const isFullyCalibrated =
    calibration.hasLeftTested &&
    calibration.hasRightTested &&
    calibration.hasConfirmedIsolation &&
    calibration.hasConfirmedVolume;

  return (
    <div className="flex flex-col gap-5 p-5 bg-purple-950/10 border border-purple-800/20 rounded-3xl backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.05)]">
      <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/15 rounded-xl text-purple-300">
            <Headphones className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Earphone Calibration</span>
              <span className="text-pink-400">✨</span>
            </h2>
            <p className="text-xs text-purple-300/60 font-mono">Ensures alarm stays strictly inside ears</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`px-2.5 py-0.5 text-3xs font-mono font-extrabold tracking-wider rounded-full border ${
          isFullyCalibrated
            ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
            : 'bg-pink-950/20 border-pink-500/30 text-pink-300 animate-pulse'
        }`}>
          {isFullyCalibrated ? 'CALIBRATION SECURED 💜' : 'SAFETY CHECK REQUIRED'}
        </div>
      </div>

      {/* Disconnection Roommate Shield Toggle */}
      <div className="flex items-start justify-between gap-4 p-3 bg-purple-950/30 border border-purple-850/40 rounded-xl">
        <div className="flex flex-col gap-1 text-left max-w-[85%]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
            <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>Roommate Protection Auto-Mute</span>
          </div>
          <p className="text-[11px] text-purple-300/60 leading-relaxed font-mono">
            Automatically silences sound immediately if your earphones are unplugged or Bluetooth disconnects while sleeping.
          </p>
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={() => setRoommateModeActive(!roommateModeActive)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            roommateModeActive ? 'bg-pink-500' : 'bg-purple-950/60 border-purple-800'
          }`}
          role="switch"
          aria-checked={roommateModeActive}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              roommateModeActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Calibration Channels Visualizer Test */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs font-mono text-purple-300/80">
          <span>1. Test Panning Balance</span>
          <button
            onClick={() => setShowTesterGuide(!showTesterGuide)}
            className="text-2xs text-pink-400 hover:underline cursor-pointer flex items-center gap-0.5 font-bold"
          >
            <HelpCircle className="w-3 h-3" />
            <span>How it works</span>
          </button>
        </div>

        {showTesterGuide && (
          <div className="p-3 bg-purple-950/45 border border-purple-800/30 rounded-xl text-3xs text-purple-300/70 leading-relaxed font-mono text-left">
            Click Left or Right to generate a soft, frequency-tuned chime strictly inside that headphone ear channel. This verifies that your earbuds are not swapped, and that sounds will not leak out through speakers.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Left Channel Button */}
          <button
            onClick={() => runTest('left')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition cursor-pointer select-none ${
              testingSide === 'left'
                ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'bg-purple-950/40 hover:bg-purple-900/40 border-purple-800/40 text-purple-300'
            }`}
          >
            <Play className={`w-4 h-4 mb-1.5 ${testingSide === 'left' ? 'scale-110 text-pink-400' : 'text-purple-400'}`} />
            <span className="text-xs font-semibold">Test Left Channel</span>
            <span className="text-3xs font-mono text-purple-400 mt-1 font-bold">
              {calibration.hasLeftTested ? '✓ Done' : 'Not tested'}
            </span>
          </button>

          {/* Right Channel Button */}
          <button
            onClick={() => runTest('right')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition cursor-pointer select-none ${
              testingSide === 'right'
                ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'bg-purple-950/40 hover:bg-purple-900/40 border-purple-800/40 text-purple-300'
            }`}
          >
            <Play className={`w-4 h-4 mb-1.5 ${testingSide === 'right' ? 'scale-110 text-pink-400' : 'text-purple-400'}`} />
            <span className="text-xs font-semibold">Test Right Channel</span>
            <span className="text-3xs font-mono text-purple-400 mt-1 font-bold">
              {calibration.hasRightTested ? '✓ Done' : 'Not tested'}
            </span>
          </button>
        </div>

        {/* Dynamic panning equalizer effect */}
        <div className="h-2 w-full bg-purple-950/60 rounded-full overflow-hidden flex relative border border-purple-900/40">
          <div
            className={`h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-300 rounded-l ${
              testingSide === 'left' ? 'w-1/2 opacity-100' : 'w-0 opacity-0'
            }`}
          />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-purple-800/50 pointer-events-none" />
          <div
            className={`h-full bg-gradient-to-r from-pink-500 to-purple-400 transition-all duration-300 rounded-r absolute right-0 ${
              testingSide === 'right' ? 'w-1/2 opacity-100' : 'w-0 opacity-0'
            }`}
          />
        </div>
      </div>

      {/* Safety checkboxes */}
      <div className="flex flex-col gap-2.5 mt-2">
        <label className="text-xs font-mono text-purple-300/80 text-left">2. Confirm Safety Standards</label>
        
        {/* Checkbox 1: Stereo isolation verified */}
        <button
          onClick={() => toggleCheck('hasConfirmedIsolation')}
          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-900/10 hover:bg-purple-900/20 border border-purple-800/30 text-left transition select-none cursor-pointer"
        >
          <div className="mt-0.5 text-pink-400 shrink-0">
            {calibration.hasConfirmedIsolation ? (
              <CheckCircle2 className="w-4 h-4 fill-pink-500/20 text-pink-400" />
            ) : (
              <Circle className="w-4 h-4 text-purple-700" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-purple-200">Headphone Stereo Isolated</span>
            <p className="text-3xs text-purple-300/50 font-mono leading-relaxed">I confirm Left/Right sounds play isolated in separate ears and do not play on the phone speakers.</p>
          </div>
        </button>

        {/* Checkbox 2: Safe volume levels */}
        <button
          onClick={() => toggleCheck('hasConfirmedVolume')}
          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-900/10 hover:bg-purple-900/20 border border-purple-800/30 text-left transition select-none cursor-pointer"
        >
          <div className="mt-0.5 text-pink-400 shrink-0">
            {calibration.hasConfirmedVolume ? (
              <CheckCircle2 className="w-4 h-4 fill-pink-500/20 text-pink-400" />
            ) : (
              <Circle className="w-4 h-4 text-purple-700" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-purple-200">Earphone Volume Level Okay</span>
            <p className="text-3xs text-purple-300/50 font-mono leading-relaxed">My headphone level is set comfortably, and there is no high bass leak that would escape with standard seal-type earbuds.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
