import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import type { Verdict } from '@/lib/types';

const config = {
  SAFE: {
    icon: ShieldCheck,
    label: 'SAFE',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    dot: 'bg-emerald-400',
  },
  REVIEW: {
    icon: ShieldQuestion,
    label: 'REVIEW',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    dot: 'bg-amber-400',
  },
  SUSPICIOUS: {
    icon: ShieldAlert,
    label: 'SUSPICIOUS',
    classes: 'bg-red-500/15 text-red-400 border-red-500/40',
    dot: 'bg-red-400',
  },
};

export default function VerdictBadge({
  verdict,
  size = 'md',
}: {
  verdict: Verdict;
  size?: 'sm' | 'md' | 'lg';
}) {
  const c = config[verdict];
  const Icon = c.icon;
  const sizes = {
    sm: { box: 'px-2.5 py-1 text-xs gap-1.5', icon: 14 },
    md: { box: 'px-3.5 py-1.5 text-sm gap-2', icon: 16 },
    lg: { box: 'px-5 py-2.5 text-base gap-2.5', icon: 22 },
  };
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${c.classes} ${s.box}`}
    >
      <Icon size={s.icon} strokeWidth={2.5} />
      {c.label}
    </span>
  );
}
