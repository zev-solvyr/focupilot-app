import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Waves, CloudRain, Radio } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, Category } from '../types';
import { sound } from '../services/sound';

interface FocusTimerViewProps {
  tasks: Task[];
  onSessionComplete: (durationMinutes: number, category: Category, taskTitle?: string) => void;
}

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({ tasks, onSessionComplete }) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(25); // minutes
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('career');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'whitenoise' | 'binaural40hz'>('none');
  const [volume, setVolume] = useState<number>(0.3);

  const timerRef = useRef<any>(null);

  const changePreset = (minutes: number) => {
    setIsRunning(false);
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleAmbient = (type: 'rain' | 'whitenoise' | 'binaural40hz') => {
    if (ambientSound === type) {
      sound.stopAmbient();
      setAmbientSound('none');
    } else {
      sound.startAmbient(type, volume);
      setAmbientSound(type);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    sound.setVolume(newVol);
  };

  const handleCompleteSession = () => {
    setIsRunning(false);
    sound.stopAmbient();
    setAmbientSound('none');
    sound.playCompletionChime();

    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#e4e4e7', '#71717a'],
    });

    const activeTask = tasks.find((t) => t.id === selectedTaskId);
    onSessionComplete(selectedDuration, selectedCategory, activeTask?.title);
    setTimeLeft(selectedDuration * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = selectedDuration * 60;
  const progressRatio = (totalSeconds - timeLeft) / (totalSeconds || 1);
  const radius = 95;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto px-4 sm:px-0">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Deep Work Focus Cockpit
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">Eliminate distraction. Protect your attention.</p>
      </div>

      {/* Preset Pills */}
      <div className="flex justify-center gap-2">
        {[
          { label: '25m Pomodoro', mins: 25 },
          { label: '50m Deep Flow', mins: 50 },
          { label: '5m Sprint', mins: 5 },
          { label: '90m Ultradian', mins: 90 },
        ].map((p) => (
          <button
            key={p.mins}
            onClick={() => changePreset(p.mins)}
            disabled={isRunning}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
              selectedDuration === p.mins
                ? 'bg-white text-black border-white'
                : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Dial Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Circular Countdown Ring - Pure White */}
        <div className="relative flex items-center justify-center my-4">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            <circle
              stroke="#1f1f1f"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#ffffff"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          {/* Time text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-extrabold tracking-tight font-mono-numbers text-white">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">
              {isRunning ? 'Flow State Active' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${
              isRunning
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Enter Focus
              </>
            )}
          </button>

          <button
            onClick={handleCompleteSession}
            className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-all"
            title="Finish & Log Now"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Task & Goal Linking */}
      <div className="glass-panel rounded-2xl p-4 border border-zinc-900 space-y-2.5">
        <label className="text-xs font-semibold text-zinc-400 block">
          Anchor Session to a Pillar / Task
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category)}
            className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
          >
            <option value="career">Career & Wealth</option>
            <option value="health">Health & Body</option>
            <option value="learning">Knowledge</option>
            <option value="finance">Finance</option>
            <option value="personal">Personal</option>
          </select>

          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
          >
            <option value="">(No specific task)</option>
            {tasks
              .filter((t) => !t.completed)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Web Audio Ambient Noise Cockpit */}
      <div className="glass-panel rounded-2xl p-4 border border-zinc-900 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-white" />
            Bio-Acoustic Soundscapes (Offline)
          </span>
          {ambientSound !== 'none' && (
            <span className="text-[10px] text-white flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Playing
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => toggleAmbient('rain')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
              ambientSound === 'rain'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <CloudRain className="w-4 h-4" />
            Rain
          </button>

          <button
            onClick={() => toggleAmbient('binaural40hz')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
              ambientSound === 'binaural40hz'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            40Hz Wave
          </button>

          <button
            onClick={() => toggleAmbient('whitenoise')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
              ambientSound === 'whitenoise'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Waves className="w-4 h-4" />
            White Noise
          </button>
        </div>

        {/* Volume slider */}
        {ambientSound !== 'none' && (
          <div className="flex items-center gap-3 pt-1">
            <VolumeX className="w-3.5 h-3.5 text-zinc-600" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer h-1 bg-zinc-800 rounded-lg"
            />
            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        )}
      </div>
    </div>
  );
};
