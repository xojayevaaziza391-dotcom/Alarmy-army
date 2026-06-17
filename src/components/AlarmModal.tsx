import React, { useState, useEffect } from 'react';
import { X, Volume2, Play, Square, Info, Sparkles } from 'lucide-react';
import { Alarm, SoundType } from '../types';
import { earphoneAudio } from '../audioEngine';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alarm: Alarm) => void;
  editingAlarm: Alarm | null;
}

const SOUND_PROFILES: { type: SoundType; name: string; desc: string; reason: string }[] = [
  {
    type: 'bts_dynamite',
    name: 'BTS — Dynamite (Synth)',
    desc: 'Upbeat, modern synthesized melody of BTS\'s hit "Dynamite" designed to wake you up with happy energy.',
    reason: 'Pure triangle-wave tones pan in stereo without heavy room bass, keeping it locked to your headphones.',
  },
  {
    type: 'bts_butter',
    name: 'BTS — Butter (Synth)',
    desc: 'Smooth, rhythmic digital sequence of "Butter" with light transients to tap you awake.',
    reason: 'Controlled register frequency is gentle on your eardrums and will not vibrate outwards.',
  },
  {
    type: 'bts_spring',
    name: 'BTS — Spring Day (Synth)',
    desc: 'Beautiful, emotional and gentle refrain of "Spring Day" suited for soft and cozy mornings.',
    reason: 'Super peaceful chime synthesis that limits wake shock and stays 100% inside your ear canal.',
  },
  {
    type: 'bts_lgo',
    name: 'BTS — Life Goes On (Synth)',
    desc: 'Restorative, soothing warm chords of "Life Goes On" to welcome the day gracefully.',
    reason: 'Rounded low-amplitude tones carry perfectly in stereo but disappear outside standard earbud seals.',
  },
  {
    type: 'bts_bwl',
    name: 'BTS — Boy With Luv (Synth)',
    desc: 'Cheerful, retro-pop style digital synth of "Boy With Luv" to bring a smile to your face.',
    reason: 'Upbeat panning notes create a bubbly wakening sensation within your ears without disturbing others.',
  },
  {
    type: 'bts_fakelove',
    name: 'BTS — Fake Love (Synth)',
    desc: 'Atmospheric, emotive, and dramatic synth tones of "Fake Love" for a deep, resonant awakening.',
    reason: 'Minor-key triangle sweeps are highly distinct to help you awake instantly while remaining silent to your roommate.',
  },
  {
    type: 'bts_dna',
    name: 'BTS — DNA (Synth)',
    desc: 'Bright, energetic whistling synth melody of "DNA" that charges you with high frequency positive vibes.',
    reason: 'Ultra-clear digital whistling registers bypass grogginess and vibrate directly under your earbuds.',
  },
  {
    type: 'bts_ptd',
    name: 'BTS — Permission to Dance (Synth)',
    desc: 'Bouncy, hopeful synthesized chorus chords of "Permission to Dance" to jumpstart an active day.',
    reason: 'Rhythmic, syncopated positive chord strides keep the sound close and focused inside the ears.',
  },
  {
    type: 'bts_piedpiper',
    name: 'BTS — Pied Piper (Synth) 🎶',
    desc: 'Whimsical, flute-like synthesized melody of "Pied Piper" designed as a playful, seductive tune to wake up to.',
    reason: 'Charming, sweet high registers carry cleanly with almost zero ambient rumble leaking from headphones.',
  },
  {
    type: 'bts_arirang',
    name: 'BTS — Arirang (Traditional Synth) 🌸',
    desc: 'Moving, beautiful traditional melody beautifully structured into 3/4 time signature to gently carry you out of deep sleep cycles.',
    reason: 'Highly dynamic major chord transitions that engage cognitive regions quickly inside earbud speakers.',
  },
  {
    type: 'bts_comeover',
    name: 'BTS — Come Over (Hidden Track) 🔍',
    desc: 'Catchy, uplifting, high-spirited synthesiser melody of "Come Over", the rare exclusive hidden find.',
    reason: 'Exclusive, highly melodic phrasing that sparks morning joy and focuses acoustic energy strictly within you.',
  },
  {
    type: 'binaural',
    name: 'Binaural Focus Pulse',
    desc: 'Dual frequency tones (180Hz / 195Hz) that entrain waking Beta states in your brain.',
    reason: 'Completely inaudible if earbuds slide out because the beat can only reconcile inside your skull.',
  },
  {
    type: 'whisper',
    name: 'Whispering Wind Breezes',
    desc: 'High-pass filtered white noise modulated to sound like deep breathing waves.',
    reason: 'Extremely soft high-frequency sweeps that have zero carrying power through bedroom spaces.',
  },
  {
    type: 'chime',
    name: 'Staggered Crystal Chimes',
    desc: 'Short, clean high-freq chime sweeps that pan continuously from left to right ear.',
    reason: 'Zero resonant vibration or room bass depth, making it entirely contained to headphone seals.',
  },
  {
    type: 'pulse',
    name: 'Shoulder-Tap Pulse',
    desc: 'Light, steady rhythmic heartbeat clicks that mimic a physical tap on the shoulder.',
    reason: 'Short transients that provide clean wake-up patterns without lingering acoustic resonance.',
  },
  {
    type: 'nature',
    name: 'Warm Stream & Birds',
    desc: 'Soft warm low-pass wind rumbles synchronized with sparse artificial chirps.',
    reason: 'Low acoustic volume that sounds comfortable, ideal for light sleepers.',
  },
];

export default function AlarmModal({
  isOpen,
  onClose,
  onSave,
  editingAlarm,
}: AlarmModalProps) {
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [soundType, setSoundType] = useState<SoundType>('bts_dynamite');
  const [snoozeDuration, setSnoozeDuration] = useState(5);
  const [crescendoSeconds, setCrescendoSeconds] = useState(30);
  const [maxVolume, setMaxVolume] = useState(0.5);
  const [heavySleeperMode, setHeavySleeperMode] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const stopSoundPreview = () => {
    earphoneAudio.stopAll();
    setIsPreviewing(false);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const handlePreviewSound = () => {
    if (isPreviewing) {
      stopSoundPreview();
    } else {
      setIsPreviewing(true);
      // Play sound with short crescendo of 2 seconds for active feedback
      earphoneAudio.startAlarm(soundType, maxVolume, 2);
    }
  };

  useEffect(() => {
    if (editingAlarm) {
      setTime(editingAlarm.time);
      setLabel(editingAlarm.label);
      setSelectedDays(editingAlarm.days);
      setSoundType(editingAlarm.soundType);
      setSnoozeDuration(editingAlarm.snoozeDuration);
      setCrescendoSeconds(editingAlarm.crescendoSeconds);
      setHeavySleeperMode(!!editingAlarm.heavySleeperMode);
    } else {
      // Set to comfortable morning default
      setTime('07:00');
      setLabel('Rise & Shine');
      setSelectedDays([1, 2, 3, 4, 5]);
      setSoundType('bts_dynamite');
      setSnoozeDuration(5);
      setCrescendoSeconds(30);
      setHeavySleeperMode(false);
    }
    stopSoundPreview();
  }, [editingAlarm, isOpen]);

  // Clean play on unmount or close
  useEffect(() => {
    return () => {
      stopSoundPreview();
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopSoundPreview();
    
    const alarmData: Alarm = {
      id: editingAlarm?.id || crypto.randomUUID(),
      time,
      days: selectedDays,
      label: label.trim() || 'Wake Up Call',
      isEnabled: true,
      soundType,
      snoozeDuration,
      crescendoSeconds,
      isSnoozed: false,
      snoozedUntil: null,
      heavySleeperMode,
    };
    onSave(alarmData);
    onClose();
  };

  const weekdays = [
    { label: 'S', index: 0, full: 'Sunday' },
    { label: 'M', index: 1, full: 'Monday' },
    { label: 'T', index: 2, full: 'Tuesday' },
    { label: 'W', index: 3, full: 'Wednesday' },
    { label: 'T', index: 4, full: 'Thursday' },
    { label: 'F', index: 5, full: 'Friday' },
    { label: 'S', index: 6, full: 'Saturday' },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#120822] border border-purple-900/50 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col my-8 shadow-[0_0_60px_rgba(168,85,247,0.2)]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-900/40 bg-purple-950/20">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400 animate-spin-slow" />
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{editingAlarm ? 'Edit Earbud Alarm 💜' : 'Schedule New Earbud Alarm 💜'}</span>
          </h3>
          <button
            onClick={() => {
              stopSoundPreview();
              onClose();
            }}
            className="p-1 px-2.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white text-xs transition font-mono cursor-pointer"
          >
            ESC
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          
          {/* Time & Label Fields */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Direct Digital Clock Input */}
            <div className="col-span-1 flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-mono text-purple-300/80">Pick Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="bg-purple-950/60 text-xl font-bold font-mono text-white border border-purple-800/40 rounded-xl px-2.5 py-2.5 focus:border-pink-500 focus:outline-none w-full text-center shrink-0"
              />
            </div>
            
            {/* Custom Label Text */}
            <div className="col-span-2 flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-mono text-purple-300/80">Alarm Label / Message</label>
              <input
                type="text"
                placeholder="Rise and Shine ARMY"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="bg-purple-950/60 text-xs text-purple-100 border border-purple-800/40 rounded-xl px-3.5 py-3.5 focus:border-pink-500 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Days of week selector */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-mono text-purple-300/80">Active Days</label>
            <div className="flex justify-between gap-1.5 bg-purple-950/40 p-2 border border-purple-900/30 rounded-2xl">
              {weekdays.map(day => {
                const isActive = selectedDays.includes(day.index);
                return (
                  <button
                    type="button"
                    key={day.index}
                    onClick={() => toggleDay(day.index)}
                    className={`w-9 h-9 text-xs rounded-xl font-extrabold transition select-none flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-purple-950/60 hover:bg-purple-900/40 text-purple-400'
                    }`}
                    title={day.full}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Sound Selection Profile */}
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-purple-300/80">Choose Low-Leak Wake Sound</label>
              
              {/* Preview button */}
              <button
                type="button"
                onClick={handlePreviewSound}
                className={`py-1 px-2.5 rounded-lg text-2xs font-mono font-bold border transition flex items-center gap-1 cursor-pointer select-none ${
                  isPreviewing
                    ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                    : 'bg-purple-500/20 border-purple-400/40 text-purple-300 hover:bg-purple-500/30'
                }`}
              >
                {isPreviewing ? (
                  <>
                    <Square className="w-3 h-3 fill-red-400 text-red-400" />
                    <span>Stop Probe</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-purple-400 text-purple-400" />
                    <span>Preview Sound</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-1.5 max-h-[180px] overflow-y-auto pr-1 bg-[#090312] p-2 border border-purple-900/35 rounded-2xl scrollbar-thin">
              {SOUND_PROFILES.map(prof => {
                const isSelected = soundType === prof.type;
                return (
                  <button
                    key={prof.type}
                    type="button"
                    onClick={() => {
                      setSoundType(prof.type);
                      if (isPreviewing) {
                        // Restart preview with new sound quickly
                        earphoneAudio.startAlarm(prof.type, maxVolume, 1);
                      }
                    }}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-purple-500/10 border-pink-400/55'
                        : 'bg-transparent border-transparent hover:border-purple-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-pink-400' : 'text-purple-200'}`}>
                        {prof.name}
                      </span>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-[10px] text-purple-300/60 leading-normal">{prof.desc}</p>
                    <div className="flex items-start gap-1 p-1 bg-purple-950/40 rounded border border-purple-900/20 text-[9px] text-purple-400/80 font-mono mt-0.5">
                      <Info className="w-2.5 h-2.5 text-purple-500 shrink-0 mt-0.5" />
                      <span>{prof.reason}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setup Crescendo, Snooze & Max Volume limits */}
          <div className="flex flex-col gap-4 bg-purple-950/40 p-3.5 border border-purple-900/30 rounded-2xl text-left font-mono">
            
            {/* Max Volume Limit */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-purple-300/80">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Max Earbud Volume</span>
                </span>
                <span className="font-bold text-pink-400">{Math.round(maxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={maxVolume}
                onChange={e => setMaxVolume(parseFloat(e.target.value))}
                className="w-full accent-pink-500 bg-purple-950 h-1.5 rounded-lg cursor-pointer"
              />
              <p className="text-[9px] text-purple-300/50 leading-normal">
                Forces a maximum volume threshold. Keeps you safe if earphones have open air grilles.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1.5 border-t border-purple-900/30">
              {/* Crescendo Timer */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-purple-300/80">Sound Crescendo</label>
                <select
                  value={crescendoSeconds}
                  onChange={e => setCrescendoSeconds(parseInt(e.target.value))}
                  className="bg-purple-900/30 border border-purple-800/40 text-2xs text-purple-200 rounded-lg p-1.5 cursor-pointer focus:border-pink-500 focus:outline-none"
                >
                  <option value={10}>10 Seconds (Fast)</option>
                  <option value={30}>30 Seconds (Gently)</option>
                  <option value={60}>1 Minute (Slow)</option>
                  <option value={120}>2 Minutes (Lull)</option>
                </select>
                <span className="text-[8px] text-purple-300/50">Ramps from 0% volume to wake you.</span>
              </div>

              {/* Snooze Timer */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-purple-300/80">Snooze Duration</label>
                <select
                  value={snoozeDuration}
                  onChange={e => setSnoozeDuration(parseInt(e.target.value))}
                  className="bg-purple-900/30 border border-purple-800/40 text-2xs text-purple-200 rounded-lg p-1.5 cursor-pointer focus:border-pink-500 focus:outline-none"
                >
                  <option value={3}>3 Minutes (Short)</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes (Deep)</option>
                  <option value={15}>15 Minutes</option>
                </select>
                <span className="text-[8px] text-purple-300/50">Pushes the trigger back safely.</span>
              </div>
            </div>
          </div>

          {/* Heavy Sleeper Mode Challenge Option */}
          <div className="flex flex-col gap-2.5 bg-[#170529] p-3.5 border border-purple-500/30 rounded-2xl text-left font-mono shadow-[0_0_15px_rgba(244,63,94,0.1)]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-white font-bold">
                <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                <span>Heavy Sleeper Mode 💜</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={heavySleeperMode}
                  onChange={e => setHeavySleeperMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-purple-950/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-purple-300 after:border-purple-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
              </label>
            </div>
            <p className="text-[9px] text-purple-300/70 leading-normal">
              Highly recommended for deep sleepers! Disables the simple, instant dismiss and requires you to tap 7 purple hearts floating on the screen to confirm you are truly awake.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-purple-900/30 mt-2">
            <button
              type="button"
              onClick={() => {
                stopSoundPreview();
                onClose();
              }}
              className="py-2.5 px-4 bg-purple-950/40 hover:bg-purple-900/40 text-purple-250 border border-purple-905/30 rounded-xl text-xs transition font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white rounded-xl text-xs transition font-bold hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
