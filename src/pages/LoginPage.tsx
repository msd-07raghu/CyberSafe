import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Please enter a password.';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setError(error.includes('Invalid login')
          ? 'Invalid email or password. If you don\'t have an account, try signing up.'
          : error
        );
      }
    } else {
      const { error } = await signUp(email, password);
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        setInfoMsg('Account created! You can now sign in with your credentials.');
        setMode('signin');
        setPassword('');
      }
    }
  };

  const fillDemo = () => {
    setEmail('demo@cybersafe.example');
    setPassword('demo123456');
    setError(null);
    setInfoMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-30" />
              <ShieldCheck size={56} className="relative text-cyan-400" strokeWidth={1.8} />
            </div>
          </div>
          <Logo size="lg" />
          <p className="mt-3 text-slate-400 text-sm">
            See the destination. Understand the risk. Stay safe.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-2xl shadow-cyan-500/5 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white mb-1">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {mode === 'signin'
              ? 'Enter your credentials to access the dashboard.'
              : 'Set up a demo account to start analyzing URLs.'}
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-4 py-3">
              <Info size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-cyan-300">{infoMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-11 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            {mode === 'signin' && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-400">Remember me</span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 pt-5 border-t border-slate-800">
            <button
              onClick={fillDemo}
              className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              Use demo credentials
            </button>
            <p className="mt-2 text-xs text-slate-600 text-center">
              Demo mode — this is not production-grade authentication.
            </p>
          </div>

          {/* Switch mode */}
          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setInfoMsg(null);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Team X · Hackathon Prototype · CyberSafe
        </p>
      </div>
    </div>
  );
}
