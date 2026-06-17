import React from 'react';
import { Plus, Trash2, Clock, Volume2, Edit, Check } from 'lucide-react';
import { Alarm } from '../types';

interface AlarmListProps {
  alarms: Alarm[];
  onToggle: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
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
  'whisper': 'Whispering breezes 💨',
  'chime': 'Crystal Chimes 🔔',
  'pulse': 'Shoulder Pulse 🤚',
  'nature': 'Warm Stream 🏞️'
};

export default function AlarmList({
  alarms,
  onToggle,
  onEdit,
  onDelete,
  onAddClick,
}: AlarmListProps) {
  const daysOfWeekFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col gap-4 p-5 bg-purple-950/10 border border-purple-800/20 rounded-3xl backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.05)]">
      {/* List Header */}
      <div className="flex justify-between items-center border-b border-purple-900/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/15 rounded-xl text-purple-300">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
              <span>BTS Alarm Schedule</span>
              <span className="text-pink-400">✨</span>
            </h2>
            <p className="text-xs text-purple-300/60 font-mono">Earbud-isolated alarms configured</p>
          </div>
        </div>

        {/* Add Alarm Trigger */}
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 py-1.5 px-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs rounded-xl font-bold transition cursor-pointer select-none shadow-[0_0_12px_rgba(168,85,247,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Alarm</span>
        </button>
      </div>

      {/* Empty State */}
      {alarms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-purple-800/40 rounded-2xl bg-purple-950/20 text-center">
          <p className="text-xs text-purple-300/80 font-mono">No alarms are scheduled.</p>
          <p className="text-3xs text-purple-300/50 font-mono mt-1 leading-relaxed max-w-xs">
            Let BTS songs wake you up gently in your sleep. Click &quot;Add Alarm&quot; to schedule your roommate-safe wake-up.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alarms.map(alarm => {
            // Time breakdown for styling
            const [h, m] = alarm.time.split(':');
            const hoursVal = parseInt(h);
            const ampm = hoursVal >= 12 ? 'PM' : 'AM';
            const displayHour = String(hoursVal % 12 || 12).padStart(2, '0');

            return (
              <div
                key={alarm.id}
                className={`p-4 border rounded-2xl transition flex flex-col gap-3 relative overflow-hidden ${
                  alarm.isEnabled
                    ? 'bg-purple-950/40 border-purple-800/40 shadow-[0_4px_12px_rgba(168,85,247,0.05)]'
                    : 'bg-purple-950/15 border-purple-900/20 opacity-55'
                }`}
              >
                {/* Accent glow on enabled alarms */}
                {alarm.isEnabled && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-pink-500" />
                )}

                {/* Alarm Row Content */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1 text-left">
                    {/* Time display */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-sans text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.05)]">
                        {displayHour}:{m}
                      </span>
                      <span className="text-xs font-black font-sans text-pink-400">
                        {ampm}
                      </span>
                    </div>

                    {/* Description Name */}
                    <span className="text-xs font-bold text-purple-200">
                      {alarm.label}
                    </span>
                  </div>

                  {/* Switch and Config buttons */}
                  <div className="flex items-center gap-3">
                    {/* Edit button */}
                    <button
                      onClick={() => onEdit(alarm)}
                      className="p-2 hover:bg-purple-900/40 text-purple-400/80 hover:text-purple-200 rounded-lg transition-all cursor-pointer"
                      title="Edit parameters"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Trash Delete button */}
                    <button
                      onClick={() => onDelete(alarm.id)}
                      className="p-2 hover:bg-pink-950/30 hover:text-pink-400 text-purple-600 rounded-lg transition-all cursor-pointer"
                      title="Delete schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Enable Toggle Switch */}
                    <button
                      onClick={() => onToggle(alarm.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        alarm.isEnabled ? 'bg-pink-500' : 'bg-purple-950/60 border-purple-800'
                      }`}
                      role="switch"
                      aria-checked={alarm.isEnabled}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          alarm.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sub-status and Days Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-900/30">
                  {/* Days Icons */}
                  <div className="flex gap-1" title="Days scheduled">
                    {daysOfWeekFull.map((d, idx) => {
                      const isActive = alarm.days.includes(idx);
                      return (
                        <span
                          key={idx}
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded transition-all ${
                            isActive
                              ? 'bg-purple-500/20 text-pink-300 font-extrabold'
                              : 'text-purple-300/40 font-normal'
                          }`}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>

                  {/* Active sound profile and Snooze tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-3xs font-mono text-purple-300/60">
                    <Volume2 className="w-3 h-3 text-purple-400" />
                    <span className="font-bold text-purple-200">{soundTypeNames[alarm.soundType] || alarm.soundType}</span>
                    
                    {alarm.heavySleeperMode && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-pink-500/20 border border-pink-400/25 text-pink-300 font-extrabold flex items-center gap-0.5" title="Heavy Sleeper Challenge active">
                        💜 HEAVY SLEEPER MODE
                      </span>
                    )}

                    {alarm.isSnoozed && (
                      <span className="ml-1.5 px-2 py-0.5 rounded bg-pink-500/20 border border-pink-400/20 text-pink-300 animate-pulse font-bold">
                        Snoozed to {alarm.snoozedUntil}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
