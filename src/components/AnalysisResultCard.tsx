import { ShieldQuestion, Globe, FolderTree, Search, Link2, AlertTriangle, FileWarning, type LucideIcon } from 'lucide-react';
import type { AnalysisResult, EvidenceItem } from '@/lib/types';
import VerdictBadge from '@/components/VerdictBadge';

const severityConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'High risk' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Caution' },
  low: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-600/30', label: 'Note' },
};

export default function AnalysisResultCard({ result }: { result: AnalysisResult }) {
  const { parsed, verdict, explanation, evidence, riskScore } = result;

  const verdictGlow = {
    SAFE: 'shadow-emerald-500/10',
    REVIEW: 'shadow-amber-500/10',
    SUSPICIOUS: 'shadow-red-500/10',
  };

  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl ${verdictGlow[verdict]}`}>
      {/* Verdict header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <VerdictBadge verdict={verdict} size="lg" />
          {evidence.length > 0 && (
            <span className="text-xs text-slate-500">
              {evidence.length} {evidence.length === 1 ? 'rule triggered' : 'rules triggered'}
            </span>
          )}
        </div>
        {riskScore > 0 && (
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Risk score</span>
            <span className={`text-2xl font-bold ${verdict === 'SUSPICIOUS' ? 'text-red-400' : verdict === 'REVIEW' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {riskScore}<span className="text-sm text-slate-600">/100</span>
            </span>
          </div>
        )}
      </div>

      {/* Submitted URL */}
      <div className="mb-5">
        <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Submitted URL</p>
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3">
          <p className="text-sm text-slate-200 break-all font-mono leading-relaxed">
            {result.url}
          </p>
        </div>
      </div>

      {/* Parsed components */}
      <div className="mb-5">
        <p className="text-xs text-slate-500 mb-2.5 font-medium uppercase tracking-wide">Parsed components</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <ParsedField icon={Link2} label="Scheme" value={parsed.scheme} />
          <ParsedField icon={Globe} label="Actual hostname" value={parsed.hostname} highlight />
          <ParsedField icon={FolderTree} label="Path" value={parsed.path} />
          <ParsedField icon={Search} label="Query" value={parsed.query} />
        </div>
        {parsed.userinfo && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2.5">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              User-info detected before "@": <span className="font-mono">{parsed.userinfo}</span>. The actual hostname is <span className="font-mono font-semibold">{parsed.hostname}</span>.
            </p>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="mb-5 rounded-lg bg-slate-950/40 border border-slate-800 px-4 py-3">
        <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
      </div>

      {/* Evidence list */}
      {evidence.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-slate-500 mb-2.5 font-medium uppercase tracking-wide">Evidence</p>
          <div className="space-y-2.5">
            {evidence.map((item, i) => {
              const sc = severityConfig[item.severity];
              return (
                <div key={i} className={`rounded-lg ${sc.bg} border ${sc.border} px-4 py-3`}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <FileWarning size={15} className={sc.color} />
                      <span className="text-sm font-semibold text-white">{item.rule}</span>
                    </div>
                    <span className={`text-xs font-medium ${sc.color} flex-shrink-0`}>{sc.label}</span>
                  </div>
                  {item.trigger && (
                    <p className="text-xs text-slate-400 font-mono mb-1.5 break-all">
                      Triggered by: {item.trigger}
                    </p>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg bg-slate-950/40 border border-slate-800/50 px-4 py-3">
        <ShieldQuestion size={15} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          This is a screening aid, not a guarantee that a URL is safe. Always verify through trusted channels before sharing personal information.
        </p>
      </div>
    </div>
  );
}

function ParsedField({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-3.5 py-2.5 ${highlight && value ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-slate-950/40 border-slate-800'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={13} className="text-slate-500" />
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className={`text-sm font-mono break-all ${value ? (highlight ? 'text-cyan-300' : 'text-slate-200') : 'text-slate-600 italic'}`}>
        {value || '—'}
      </p>
    </div>
  );
}
