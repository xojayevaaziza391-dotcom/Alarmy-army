import React, { useState, useEffect, useRef } from 'react';
import {
  BellRing,
  Volume2,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Zap,
  RotateCcw,
  VolumeX,
} from 'lucide-react';

import { Alarm, CalibrationState } from './types';
import { earphoneAudio } from './audioEngine';
import ClockFace from './components/ClockFace';
import AudioCalibration from './components/AudioCalibration';
import AlarmList from './components/AlarmList';
import AlarmModal from './components/AlarmModal';
import BedtimeRelaxer from './components/BedtimeRelaxer';
import ActiveAlarmOverlay from './components/ActiveAlarmOverlay';

export default function App() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [is24Hour, setIs24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ea_24hr') === 'true';
    } catch {
      return false;
    }
  });

  const [calibration, setCalibration] = useState<CalibrationState>(() => {
    try {
      const saved = localStorage.getItem('ea_calibration');
      return saved
        ? JSON.parse(saved)
        : {
            hasLeftTested: false,
            hasRightTested: false,
            hasConfirmedIsolation: false,
            hasConfirmedVolume: false,
            lastTestTimestamp: null,
          };
    } catch {
      return {
        hasLeftTested: false,
        hasRightTested: false,
        hasConfirmedIsolation: false,
        hasConfirmedVolume: false,
        lastTestTimestamp: null,
      };
    }
  });

  const [roommateModeActive, setRoommateModeActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ea_roommate_mode');
      return saved !== 'false'; // default is true
    } catch {
      return true;
    }
  });

  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem('ea_alarms');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'sample-1',
              time: '07:30',
              days: [1, 2, 3, 4, 5], // Monday - Friday
              label: 'BTS — Dynamite Morning 🎉',
              isEnabled: true,
              soundType: 'bts_dynamite',
              snoozeDuration: 5,
              crescendoSeconds: 30,
              isSnoozed: false,
              snoozedUntil: null,
            },
          ];
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeTriggeredAlarm, setActiveTriggeredAlarm] = useState<Alarm | null>(null);
  
  // Safety alert triggered if headphones are physically detached during alarm
  const [isUnpluggedMuteAlert, setIsUnpluggedMuteAlert] = useState(false);

  const lastTriggeredMinuteRef = useRef<string>('');

  // Persists states in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ea_24hr', String(is24Hour));
    } catch (e) {}
  }, [is24Hour]);

  useEffect(() => {
    try {
      localStorage.setItem('ea_calibration', JSON.stringify(calibration));
    } catch (e) {}
  }, [calibration]);

  useEffect(() => {
    try {
      localStorage.setItem('ea_roommate_mode', String(roommateModeActive));
    } catch (e) {}
  }, [roommateModeActive]);

  useEffect(() => {
    try {
      localStorage.setItem('ea_alarms', JSON.stringify(alarms));
    } catch (e) {}
  }, [alarms]);

  // Hook into the Earphone Audio Engine to handle automatic headphone disconnect events
  useEffect(() => {
    earphoneAudio.registerDeviceChangeListener(() => {
      if (roommateModeActive) {
        // If alarm was active, mute it and show a safety banner
        if (activeTriggeredAlarm) {
          setIsUnpluggedMuteAlert(true);
          earphoneAudio.stopAll();
        }
      }
    });
  }, [activeTriggeredAlarm, roommateModeActive]);

  // Lazy enable AudioContext on the first layout click
  const touchResumeAudio = () => {
    if (!hasInteracted) {
      earphoneAudio.init();
      setHasInteracted(true);
    }
  };

  // Main Background Minute Chronometer Checker
  useEffect(() => {
    const watchInterval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentClockTime = `${hours}:${minutes}`;
      const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, etc.

      // Unique hash for minute & day instance
      const minuteDayHash = `${currentClockTime}-${currentDay}`;

      // Skip checking if we have already executed alarm play during this specific minute
      if (lastTriggeredMinuteRef.current === minuteDayHash) {
        return;
      }

      alarms.forEach(alarm => {
        if (!alarm.isEnabled) return;

        // Check if day matches standard schedule
        const isScheduledToday = alarm.days.includes(currentDay);

        // Check matching condition
        const isSnoozeMatch = alarm.isSnoozed && alarm.snoozedUntil === currentClockTime;
        const isRegularMatch = !alarm.isSnoozed && alarm.time === currentClockTime && isScheduledToday;

        if (isRegularMatch || isSnoozeMatch) {
          lastTriggeredMinuteRef.current = minuteDayHash;
          startTriggeringAlarm(alarm);
        }
      });
    }, 1000);

    return () => clearInterval(watchInterval);
  }, [alarms, activeTriggeredAlarm]);

  const startTriggeringAlarm = (alarm: Alarm) => {
    // 1. Double check Audio Context
    earphoneAudio.init();
    
    // 2. Set active state
    setActiveTriggeredAlarm(alarm);
    setIsUnpluggedMuteAlert(false);

    // 3. Initiate programmatic synthesizer sound mapping
    // We target comfortable maximum volume limit (e.g. 0.5) with crescendo timer (e.g. 30 seconds)
    earphoneAudio.startAlarm(alarm.soundType, 0.5, alarm.crescendoSeconds);
  };

  const handleDismissActiveAlarm = () => {
    if (activeTriggeredAlarm) {
      // Safety mute audio
      earphoneAudio.stopAll();

      // Reset snoozing flags on this alarm
      setAlarms(prev =>
        prev.map(a => {
          if (a.id === activeTriggeredAlarm.id) {
            return {
              ...a,
              isSnoozed: false,
              snoozedUntil: null,
            };
          }
          return a;
        })
      );

      setActiveTriggeredAlarm(null);
      setIsUnpluggedMuteAlert(false);
    }
  };

  const handleSnoozeActiveAlarm = () => {
    if (activeTriggeredAlarm) {
      // Safety mute audio
      earphoneAudio.stopAll();

      // Calculate snooze timestamp
      const snoozeMinutes = activeTriggeredAlarm.snoozeDuration;
      const targetTime = new Date();
      targetTime.setMinutes(targetTime.getMinutes() + snoozeMinutes);

      const hourString = String(targetTime.getHours()).padStart(2, '0');
      const minString = String(targetTime.getMinutes()).padStart(2, '0');
      const snoozedUntilTime = `${hourString}:${minString}`;

      // Set alarm state to snoozed
      setAlarms(prev =>
        prev.map(a => {
          if (a.id === activeTriggeredAlarm.id) {
            return {
              ...a,
              isSnoozed: true,
              snoozedUntil: snoozedUntilTime,
            };
          }
          return a;
        })
      );

      setActiveTriggeredAlarm(null);
      setIsUnpluggedMuteAlert(false);
    }
  };

  const handleToggleAlarmState = (id: string) => {
    setAlarms(prev =>
      prev.map(a => {
        if (a.id === id) {
          const updatedState = !a.isEnabled;
          // If turning off, clear snooze flags
          return {
            ...a,
            isEnabled: updatedState,
            isSnoozed: updatedState ? a.isSnoozed : false,
            snoozedUntil: updatedState ? a.snoozedUntil : null,
          };
        }
        return a;
      })
    );
  };

  const handleSaveAlarm = (savedAlarm: Alarm) => {
    setAlarms(prev => {
      // If we were editing, replace existing, else prepend
      const exists = prev.some(a => a.id === savedAlarm.id);
      if (exists) {
        return prev.map(a => (a.id === savedAlarm.id ? savedAlarm : a));
      } else {
        return [savedAlarm, ...prev];
      }
    });
    setEditingAlarm(null);
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const openAddModal = () => {
    setEditingAlarm(null);
    setIsModalOpen(true);
  };

  const openEditModal = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setIsModalOpen(true);
  };

  const isCalibrated =
    calibration.hasLeftTested &&
    calibration.hasRightTested &&
    calibration.hasConfirmedIsolation &&
    calibration.hasConfirmedVolume;

  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 19 || currentHour < 6;

  return (
    <div
      onClick={touchResumeAudio}
      className="min-h-screen w-full bg-gradient-to-br from-[#0c0314] via-[#12071f] to-[#040108] text-zinc-100 flex flex-col justify-start items-center p-4 sm:p-8 select-none transition-colors duration-500 overflow-x-hidden relative"
    >
      {/* BTS Cosmic Purple Galaxy space glow effect */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#4c1d95]/20 via-[#4f46e5]/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-24 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-80 h-80 bg-fuchsia-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Primary content container */}
      <div className="w-full max-w-5xl flex flex-col gap-6 relative z-10">
        
        {/* Top Branding Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-purple-900/40 pb-5 text-left">
          <div className="flex flex-col gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                Borahae Alarm Clock
              </span>
              <span className="text-base animate-bounce duration-1000">💜</span>
            </span>
            <p className="text-xs text-purple-300/80 font-mono flex items-center gap-1.5 leading-relaxed">
              <span>I Purple You! Roommate-safe sweet BTS synthesized melodies for your earbuds.</span>
            </p>
          </div>
          
          {/* Quick calibration feedback */}
          <div className="mt-3 sm:mt-0 flex items-center gap-2 bg-purple-950/40 px-4 py-2 border border-purple-500/20 rounded-2xl shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <div className={`w-2.5 h-2.5 rounded-full ${isCalibrated ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
            <span className="text-2xs font-mono font-semibold tracking-wider text-purple-200">
              {isCalibrated ? 'ARMY EARBUDS SECURED ✨' : 'PENDING ARMY CALIBRATION'}
            </span>
          </div>
        </header>

        {/* Global interactive wakeup overlay */}
        {activeTriggeredAlarm && (
          <ActiveAlarmOverlay
            alarm={activeTriggeredAlarm}
            onDismiss={handleDismissActiveAlarm}
            onSnooze={handleSnoozeActiveAlarm}
          />
        )}

        {/* Roommate Protection Auto-Mute visual notification block */}
        {isUnpluggedMuteAlert && (
          <div className="w-full p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl mt-0.5 shrink-0 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold font-mono">Automatic Protection Triggered</span>
                <p className="text-2xs text-zinc-400 mt-0.5 leading-relaxed font-mono">
                  Earbuds were disconnected! The alarm chime was automatically muted immediately to ensure your roommates sleep undisturbed. Please reconnect earphones to hear the alarm, or click dismiss.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                earphoneAudio.stopAll();
                setIsUnpluggedMuteAlert(false);
                setActiveTriggeredAlarm(null);
              }}
              className="py-1.5 px-4 bg-amber-500 text-black text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-center shrink-0"
            >
              Okay, Dismissed
            </button>
          </div>
        )}

        {/* Bento Grid layout containing panels */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
          
          {/* LEFT COLUMN: Bedside clock face & Headphone calibration */}
          <div className="flex flex-col gap-6">
            
            {/* Clock face module */}
            <ClockFace
              is24Hour={is24Hour}
              setIs24Hour={setIs24Hour}
              isCalibrated={isCalibrated}
              roommateModeActive={roommateModeActive}
            />

            {/* Calibration details */}
            <AudioCalibration
              calibration={calibration}
              setCalibration={setCalibration}
              roommateModeActive={roommateModeActive}
              setRoommateModeActive={setRoommateModeActive}
            />

            {/* Bedtime white noise ambient timer landscape */}
            <BedtimeRelaxer />

          </div>

          {/* RIGHT COLUMN: Active Alarm schedule listings */}
          <div className="flex flex-col gap-6">
            
            {/* Configured scheduling card */}
            <AlarmList
              alarms={alarms}
              onToggle={handleToggleAlarmState}
              onEdit={openEditModal}
              onDelete={handleDeleteAlarm}
              onAddClick={openAddModal}
            />

            {/* Helpful bedside safety tip checklist card */}
            <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl flex flex-col gap-3 text-left">
              <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-violet-400" />
                <span>Roommate Protection Guidelines</span>
              </h3>
              
              <ul className="flex flex-col gap-2 text-2xs text-zinc-400 font-mono leading-relaxed pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-extrabold select-none shrink-0">•</span>
                  <span><strong>Keep this browser tab open.</strong> Alarms run in the browser client and require the tab to remain awake.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-extrabold select-none shrink-0">•</span>
                  <span><strong>Unplug Auto-Mute</strong> responds instantly to wire pull or Bluetooth disconnects while sleeping.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-extrabold select-none shrink-5">•</span>
                  <span><strong>Set morning volume comfortably.</strong> Standard silicone-tip earphones lock sound in beautifully without any high frequencies escaping.</span>
                </li>
              </ul>
            </div>

          </div>

        </main>

        {/* Modal creator socket wrapper */}
        <AlarmModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAlarm(null);
          }}
          onSave={handleSaveAlarm}
          editingAlarm={editingAlarm}
        />

        {/* Footer info strip */}
        <footer className="mt-8 border-t border-zinc-900 pt-5 pb-8 flex flex-col sm:flex-row justify-between items-center text-3xs font-mono text-zinc-600 gap-3">
          <span>Earphone Alarm Clock — Roommate Isolation Mode v1.2</span>
          <span>© 2026. Standalone Web Audio Synth Client.</span>
        </footer>

      </div>
    </div>
  );
}
