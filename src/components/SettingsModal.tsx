import React, { useState } from 'react';
import { X, Key, Shield, Download, Upload, Smartphone, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { UserSettings } from '../types';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [targetMins, setTargetMins] = useState(settings.dailyFocusTargetMinutes);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'mobile'>('general');

  // API Key Testing State
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please paste your Google Gemini API key first.' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);

    try {
      const result = await aiService.testApiKey(apiKey);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Test request failed unexpectedly.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      userName: userName.trim() || 'Pilot',
      geminiApiKey: apiKey.trim(),
      dailyFocusTargetMinutes: Number(targetMins) || 90,
    };
    storage.saveSettings(updated);
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExport = () => {
    const dataStr = storage.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuspilot_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-black rounded-3xl p-6 border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full bg-zinc-950 border border-zinc-900"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            FocusPilot Control Center
          </h2>
          <p className="text-xs text-zinc-400">Configure AI Mentor, focus targets, and mobile installation.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-900 mb-5 gap-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            General & AI Config
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'mobile'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Android & PWA Install
          </button>
        </div>

        {activeTab === 'general' ? (
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
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Free Gemini API Key */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-white" />
                  Google Gemini API Key (100% Free)
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Get free key ↗
                </a>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="AIzaSy..."
                  className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTestingKey || !apiKey.trim()}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-white disabled:opacity-40 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {isTestingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Key'
                  )}
                </button>
              </div>

              {/* Test Connection Result Box */}
              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>
              )}

              <p className="text-[10px] text-zinc-500">
                Stored purely in your device's local storage. Click <strong>Test Key</strong> to verify Google's response immediately.
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
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono-numbers"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
            <div className="pt-4 border-t border-zinc-900 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 block">
                Data Storage (100% Offline & Private)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-xs font-medium text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  Export Backup
                </button>
                <label className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-xs font-medium text-zinc-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
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
                className="w-full mt-2 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-500 hover:text-white text-xs font-medium transition-colors"
              >
                Clear All Data & Start Fresh
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3.5 text-xs text-zinc-300">
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900">
              <h3 className="font-bold text-white mb-1 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                Method 1: Instant PWA Home Screen
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400 mt-2 text-[11px]">
                <li>Open this app in <strong>Google Chrome</strong> on Android.</li>
                <li>Tap Chrome's menu <strong>(⋮)</strong> at top-right.</li>
                <li>Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</li>
                <li>Launches with the FocusPilot icon full-screen without address bar!</li>
              </ol>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900">
              <h3 className="font-bold text-white mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Method 2: Standalone Android APK
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                The project includes GitHub Actions configuration in <code className="text-zinc-200">.github/workflows/build-apk.yml</code>. Push to GitHub and trigger "Build Android APK" to get a direct download link for your <code className="text-white font-mono">.apk</code> file!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
