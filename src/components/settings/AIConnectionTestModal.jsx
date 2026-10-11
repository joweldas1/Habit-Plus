import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
  testAIConnections,
  getApiKeys,
  saveCustomApiKeys,
} from '../../services/geminiService';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Shield,
} from 'lucide-react';

export const AIConnectionTestModal = ({ isOpen, onClose }) => {
  const { settings } = useApp();
  const { showToast } = useToast();
  const isNight = settings.theme === 'night';

  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [showKeyInputs, setShowKeyInputs] = useState(false);

  const existingKeys = getApiKeys();
  const [primaryKeyInput, setPrimaryKeyInput] = useState(existingKeys.primary || '');
  const [secondaryKeyInput, setSecondaryKeyInput] = useState(existingKeys.secondary || '');

  const handleRunDiagnostic = async () => {
    setTesting(true);
    try {
      const res = await testAIConnections();
      setResults(res);
      showToast('Diagnostic completed!', 'info');
    } catch {
      showToast('Error during connection test.', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKeys = () => {
    saveCustomApiKeys(primaryKeyInput.trim(), secondaryKeyInput.trim());
    showToast('API keys saved. Running test...', 'success');
    handleRunDiagnostic();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gemini AI Diagnostic & Key Status"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <p className="text-zinc-400 text-xs leading-relaxed">
          HabitPlus employs dual-key failover with automated candidate model discovery.
          Real keys are hidden for safety.
        </p>

        {/* Diagnostic Run Button */}
        <button
          onClick={handleRunDiagnostic}
          disabled={testing}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 ${
            isNight
              ? 'bg-violet-600 hover:bg-violet-500 shadow-purple-950/40'
              : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300/40'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Testing Endpoints...' : 'Run Diagnostics Test'}</span>
        </button>

        {/* Results Cards */}
        {results && (
          <div className="space-y-2.5 pt-1">
            {/* Primary Key Status Card */}
            <div
              className={`p-3.5 rounded-xl border space-y-2 ${
                results.primary.status === 'success'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : results.primary.configured
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-bold">Primary Key (Google AI Studio)</span>
                </div>
                {results.primary.status === 'success' ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                ) : results.primary.configured ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold text-xs">
                    <XCircle className="w-4 h-4" /> Failed
                  </span>
                ) : (
                  <span className="text-zinc-500 text-xs">Not Configured</span>
                )}
              </div>

              {results.primary.model && (
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Active Model: <strong>{results.primary.model}</strong></span>
                  <span>Latency: {results.primary.latency}ms</span>
                </div>
              )}

              {results.primary.error && (
                <p className="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded-lg">
                  {results.primary.error}
                </p>
              )}
            </div>

            {/* Secondary Key Status Card */}
            <div
              className={`p-3.5 rounded-xl border space-y-2 ${
                results.secondary.status === 'success'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : results.secondary.configured
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-bold">Secondary Key (Cloud Console)</span>
                </div>
                {results.secondary.status === 'success' ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                ) : results.secondary.configured ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold text-xs">
                    <XCircle className="w-4 h-4" /> Failed
                  </span>
                ) : (
                  <span className="text-zinc-500 text-xs">Not Configured</span>
                )}
              </div>

              {results.secondary.model && (
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Active Model: <strong>{results.secondary.model}</strong></span>
                  <span>Latency: {results.secondary.latency}ms</span>
                </div>
              )}

              {results.secondary.error && (
                <p className="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded-lg">
                  {results.secondary.error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Toggle Manual API Key Input for Local Testing */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowKeyInputs(!showKeyInputs)}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{showKeyInputs ? 'Hide Key Setup' : 'Configure Custom API Keys in Browser'}</span>
          </button>

          {showKeyInputs && (
            <div className={`mt-3 space-y-3 p-3.5 rounded-xl border animate-in fade-in ${
              isNight ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Primary Key (Google AI Studio)
                </label>
                <input
                  type="password"
                  value={primaryKeyInput}
                  onChange={(e) => setPrimaryKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                    isNight
                      ? 'bg-black border-zinc-700 text-white focus:border-violet-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-violet-600'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-semibold ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Secondary Key (Google Cloud)
                </label>
                <input
                  type="password"
                  value={secondaryKeyInput}
                  onChange={(e) => setSecondaryKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                    isNight
                      ? 'bg-black border-zinc-700 text-white focus:border-violet-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-violet-600'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleSaveKeys}
                className={`w-full py-2 rounded-lg font-semibold text-xs shadow-sm transition-colors ${
                  isNight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                Save Keys & Re-Test
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
