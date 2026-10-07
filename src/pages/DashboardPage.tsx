import { Search, X, Loader2, Info, HelpCircle, LogOut, ShieldCheck, Settings, AlertCircle, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import VerdictBadge from '@/components/VerdictBadge';
import { SAMPLE_URLS, analyzeUrl } from '@/lib/urlAnalyzer';
import type { AnalysisResult } from '@/lib/types';
import AnalysisResultCard from '@/components/AnalysisResultCard';
import RecentAnalyses from '@/components/RecentAnalyses';
import QrScanner from '@/components/QrScanner';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAnalyze = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setResult(null);
    setSaveError(null);
    setSaveSuccess(false);

    // Simulate brief processing for UX feedback
    await new Promise((r) => setTimeout(r, 350));

    const analysis = analyzeUrl(urlInput);
    setResult(analysis);
    setLoading(false);

    // Only save if the user has opted in to history saving
    if (user && profile?.save_history) {
      setSaveError(null);
      const { error } = await supabase.from('analyses').insert({
        url: analysis.url,
        verdict: analysis.verdict,
        hostname: analysis.parsed.hostname,
        evidence: analysis.evidence,
      });
      if (error) {
        setSaveError('Could not save this analysis to your history. The result is still shown below.');
      } else {
        setSaveSuccess(true);
        window.dispatchEvent(new CustomEvent('cybersafe-analysis-saved'));
      }
    }
  };

  const handleClear = () => {
    setUrlInput('');
    setResult(null);
  };

  const handleSample = (url: string) => {
    setUrlInput(url);
    setResult(null);
  };

  const handleQrAnalyze = async (url: string) => {
    setUrlInput(url);
    setLoading(true);
    setResult(null);
    setSaveError(null);
    setSaveSuccess(false);

    await new Promise((r) => setTimeout(r, 350));

    const analysis = analyzeUrl(url);
    setResult(analysis);
    setLoading(false);

    if (user && profile?.save_history) {
      setSaveError(null);
      const { error } = await supabase.from('analyses').insert({
        url: analysis.url,
        verdict: analysis.verdict,
        hostname: analysis.parsed.hostname,
        evidence: analysis.evidence,
      });
      if (error) {
        setSaveError('Could not save this analysis to your history. The result is still shown below.');
      } else {
        setSaveSuccess(true);
        window.dispatchEvent(new CustomEvent('cybersafe-analysis-saved'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="md" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => { setShowAbout(true); setShowHelp(false); }}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Info size={16} />
              <span className="hidden sm:inline">About</span>
            </button>
            <button
              onClick={() => { setShowHelp(true); setShowAbout(false); }}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <HelpCircle size={16} />
              <span className="hidden sm:inline">Help</span>
            </button>
            <button
              onClick={() => { setShowSettings(true); setShowAbout(false); setShowHelp(false); }}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Check a link before you click
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Paste any URL below to see where it really goes and whether it carries risk indicators.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* URL Input */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6">
              <form onSubmit={handleAnalyze}>
                <label htmlFor="url-input" className="block text-sm font-medium text-slate-300 mb-2">
                  URL to analyze
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="url-input"
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/path"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || !urlInput.trim()}
                      className="flex-1 sm:flex-none bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold rounded-lg px-6 py-3 text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      Analyze
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={loading}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-medium rounded-lg px-4 py-3 text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X size={16} />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Privacy note */}
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-3">
                <ShieldCheck size={16} className="text-cyan-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  CyberSafe analyzes the URL text only. It does not open the destination.
                </p>
              </div>

              {/* Sample URLs */}
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2 font-medium">Try an example:</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_URLS.map((sample) => (
                    <button
                      key={sample.label}
                      onClick={() => handleSample(sample.url)}
                      title={sample.description}
                      className="text-xs bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-slate-200 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* QR Code Scanner */}
            <QrScanner onAnalyze={handleQrAnalyze} />

            {/* Save status messages */}
            {saveError && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{saveError}</p>
              </div>
            )}
            {saveSuccess && !saveError && profile?.save_history && (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5">
                <Save size={14} className="text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-300">Saved to your analysis history.</p>
              </div>
            )}

            {/* Analysis Result */}
            {loading && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                <Loader2 size={32} className="mx-auto text-cyan-400 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Analyzing URL...</p>
              </div>
            )}

            {!loading && result && (
              <AnalysisResultCard result={result} />
            )}

            {!loading && !result && (
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-12 text-center">
                <Search size={40} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">
                  Enter a URL above and click Analyze to see the results.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentAnalyses onResult={setResult} onUrlInput={setUrlInput} />
          </div>
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <Modal title="Help" onClose={() => setShowHelp(false)}>
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <h3 className="font-semibold text-white mb-1">How to use CyberSafe</h3>
              <p className="text-slate-400">Paste a URL into the input field and click "Analyze." The app parses the URL text and checks it against a set of safety rules — it never opens or visits the link.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Understanding verdicts</h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-start gap-2"><VerdictBadge verdict="SAFE" size="sm" /> <span>No significant risk indicator was detected.</span></li>
                <li className="flex items-start gap-2"><VerdictBadge verdict="REVIEW" size="sm" /> <span>Unusual or ambiguous — verify before opening.</span></li>
                <li className="flex items-start gap-2"><VerdictBadge verdict="SUSPICIOUS" size="sm" /> <span>One or more high-risk patterns detected.</span></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">What CyberSafe does NOT do</h3>
              <p className="text-slate-400">CyberSafe does not open, fetch, or follow any URL. It does not use external threat intelligence. It is a screening aid, not a guarantee of safety.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Scanning QR codes</h3>
              <p className="text-slate-400">Click "Scan QR Code" to scan a QR code using your camera or upload an image file. QR images are decoded entirely on your device — nothing is uploaded. If the QR code contains a URL, you can analyze it the same way as a pasted link. If it contains non-URL text, you'll be told and it won't be treated as safe.</p>
            </div>
          </div>
        </Modal>
      )}

      {/* About Modal */}
      {showAbout && (
        <Modal title="About CyberSafe" onClose={() => setShowAbout(false)}>
          <div className="space-y-4 text-sm text-slate-300">
            <p className="text-slate-400">
              CyberSafe is a hackathon prototype built by Team X to help students and college staff understand a link's potential risk before opening it.
            </p>
            <p className="text-slate-400">
              It performs transparent, rule-based analysis on URL text only — no network requests are made to the destination. The same URL always produces the same verdict regardless of context.
            </p>
            <div className="rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-3">
              <p className="text-xs text-slate-500">
                <strong className="text-slate-400">Disclaimer:</strong> CyberSafe is a screening aid, not a guarantee that a URL is safe. Always use judgment and verify through trusted channels.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          profile={profile}
          onUpdate={updateProfile}
        />
      )}
    </div>
  );
}

function SettingsModal({
  onClose,
  profile,
  onUpdate,
}: {
  onClose: () => void;
  profile: { id: string; display_name: string | null; save_history: boolean } | null;
  onUpdate: (updates: Partial<{ display_name: string; save_history: boolean }>) => Promise<{ error: string | null }>;
}) {
  const [saveHistory, setSaveHistory] = useState(profile?.save_history ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = async () => {
    const newValue = !saveHistory;
    setSaveHistory(newValue);
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error } = await onUpdate({ save_history: newValue });
    setSaving(false);
    if (error) {
      setError(error);
      setSaveHistory(!newValue);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Save history toggle */}
          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Save analysis history</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When enabled, each URL you analyze is saved to your account — including the URL text, verdict, hostname, and evidence. This lets you review past analyses. You can delete individual records or clear all at any time. URL analysis itself always runs locally in your browser and is never sent to the destination.
                </p>
              </div>
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  saveHistory ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    saveHistory ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
            {success && !error && (
              <p className="mt-2 text-xs text-emerald-400">
                {saveHistory ? 'History saving enabled.' : 'History saving disabled. New analyses will not be saved.'}
              </p>
            )}
            {saving && (
              <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </p>
            )}
          </div>

          {/* Privacy reminder */}
          <div className="rounded-lg bg-slate-950/40 border border-slate-800/50 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={15} className="text-cyan-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                URL and QR analysis always runs in your browser. CyberSafe never opens, fetches, or sends submitted links to any external service. Only your analysis history (if enabled above) is stored in your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
