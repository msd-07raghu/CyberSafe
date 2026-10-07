import { useEffect, useState } from 'react';
import { Clock, Trash2, Inbox, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, type AnalysisRecord } from '@/lib/supabaseClient';
import { analyzeUrl } from '@/lib/urlAnalyzer';
import VerdictBadge from '@/components/VerdictBadge';
import type { AnalysisResult } from '@/lib/types';

export default function RecentAnalyses({
  onResult,
  onUrlInput,
}: {
  onResult: (result: AnalysisResult) => void;
  onUrlInput: (url: string) => void;
}) {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchRecent = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('analyses')
      .select('id, url, verdict, hostname, evidence, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      setFetchError('Could not load your recent analyses. Try again later.');
      setRecords([]);
    } else {
      setRecords((data as AnalysisRecord[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecent();
  }, [user]);

  useEffect(() => {
    const handler = () => fetchRecent();
    window.addEventListener('cybersafe-analysis-saved', handler);
    return () => window.removeEventListener('cybersafe-analysis-saved', handler);
  }, [user]);

  const handleReanalyze = (url: string) => {
    onUrlInput(url);
    onResult(analyzeUrl(url));
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    const { error } = await supabase.from('analyses').delete().eq('id', id);
    if (error) {
      setDeleteError('Could not delete this record. Try again.');
      return;
    }
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = async () => {
    if (!user || records.length === 0) return;
    setDeleteError(null);
    const { error } = await supabase.from('analyses').delete().eq('user_id', user.id);
    if (error) {
      setDeleteError('Could not clear your history. Try again.');
      return;
    }
    setRecords([]);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  };

  // If history saving is disabled, show a prompt instead of the list
  if (!loading && profile && !profile.save_history) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Recent analyses</h2>
        </div>
        <div className="text-center py-6">
          <Inbox size={28} className="mx-auto text-slate-700 mb-2" />
          <p className="text-xs text-slate-500 leading-relaxed">
            History saving is turned off. Enable it in Settings to keep a record of your analyses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Recent analyses</h2>
        </div>
        {records.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 size={13} />
            Clear all
          </button>
        )}
      </div>

      {fetchError && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{fetchError}</p>
        </div>
      )}

      {deleteError && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{deleteError}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8">
          <Inbox size={28} className="mx-auto text-slate-700 mb-2" />
          <p className="text-xs text-slate-500">No analyses yet. Your recent results will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="group rounded-lg bg-slate-950/40 border border-slate-800/50 hover:border-slate-700 px-3.5 py-2.5 transition-colors cursor-pointer"
              onClick={() => handleReanalyze(rec.url)}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-xs font-mono text-slate-300 break-all line-clamp-2 flex-1">
                  {rec.url}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <VerdictBadge verdict={rec.verdict} size="sm" />
                <span className="text-xs text-slate-600">{formatTime(rec.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
