import { ShieldCheck } from 'lucide-react';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-xl' },
    lg: { icon: 40, text: 'text-3xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-400 blur-md opacity-40" />
        <ShieldCheck size={s.icon} className="relative text-cyan-400" strokeWidth={2.2} />
      </div>
      <span className={`font-bold tracking-tight ${s.text} text-white`}>
        Cyber<span className="text-cyan-400">Safe</span>
      </span>
    </div>
  );
}
