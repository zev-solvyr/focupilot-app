import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, Download, Upload, Loader2, Sparkles, ChevronLeft } from 'lucide-react';
import { UserSettings } from '../types';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [userName, setUserName] = useState(settings.userName || '');
  const [targetMins, setTargetMins] = useState(settings.dailyFocusTargetMinutes || 120);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!geminiApiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please paste your Google Gemini API key first.',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const response = await aiService.testApiKey(geminiApiKey.trim());
      setTestResult(response);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection failed.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      geminiApiKey: geminiApiKey.trim(),
      userName: userName.trim() || 'Pilot',
      dailyFocusTargetMinutes: Number(targetMins) || 120,
    };
    onUpdateSettings(updated);
    storage.saveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleExport = () => {
    const dataStr = storage.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuspilot_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storage.importData(content)) {
        alert('Data successfully imported.');
        window.location.reload();
      } else {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg ios-matte-sheet rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* iOS Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* User Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Your Call Sign / Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Pilot"
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-white" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Get Free Key ↗
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="flex-1 px-3.5 py-2 bg-black/40 border border-white/10 rounded-2xl text-xs text-white font-mono focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTestingKey || !geminiApiKey.trim()}
                className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white disabled:opacity-40 transition-all flex items-center gap-1.5 active:scale-95"
              >
                {isTestingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    Test Key
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2 animate-fadeIn ${
                  testResult.success
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-zinc-400'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed text-[11px]">{testResult.message}</span>
              </div>
            )}

            <p className="text-[10px] text-zinc-500">
              Stored locally on your device. Powered by Google Gemini.
            </p>
          </div>

          {/* Daily Focus Goal Target */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Daily Focus Target (Minutes)
            </label>
            <input
              type="number"
              min="30"
              max="480"
              step="15"
              value={targetMins}
              onChange={(e) => setTargetMins(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white font-mono-numbers transition-colors"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" /> Preferences Saved
              </>
            ) : (
              'Save Preferences'
            )}
          </button>

          {/* Data Backup & Restore */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <label className="text-xs font-semibold text-zinc-500 block">
              Data Storage (100% Offline & Private)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                Export Backup
              </button>
              <label className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95">
                <Upload className="w-3.5 h-3.5 text-white" />
                Import Backup
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all tasks, goals, focus sessions and start completely fresh?')) {
                  storage.clearAllData();
                  window.location.reload();
                }
              }}
              className="w-full mt-2 py-2 rounded-2xl bg-transparent hover:bg-white/5 border border-white/10 text-zinc-500 hover:text-white text-xs font-medium transition-colors"
            >
              Clear All Data & Start Fresh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};