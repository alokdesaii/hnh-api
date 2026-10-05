import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PREVIEW } from '../api/portalAuth';
import { BrandLogo } from './BrandLogo';
import { ArrowRight, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

// Background: the flowing line field from harbourandhills.com, with teal "packets" travelling along a few lines.
const LINES = Array.from({ length: 26 }, (_, i) => {
  const y = 90 + i * 26;
  const a = 50 + 45 * Math.sin(i * 0.45);
  return `M -80 ${y} C 220 ${y - a} 460 ${y + a} 720 ${y} S 1120 ${y - a * 0.7} 1320 ${y + a * 0.2}`;
});
const PACKETS = [
  { line: 5, dur: 7, delay: 0 },
  { line: 11, dur: 9, delay: 2.4 },
  { line: 16, dur: 6.5, delay: 4.1 },
  { line: 21, dur: 8, delay: 1.2 },
];

const FlowField: React.FC = () => (
  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="fade" x1="0" x2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.35" stopColor="#fff" stopOpacity="1" />
        <stop offset="1" stopColor="#fff" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <g className="login-drift" stroke="url(#fade)" fill="none" strokeWidth="1">
      {LINES.map((d, i) => (
        <path key={i} d={d} opacity={0.05 + (i % 5) * 0.018} />
      ))}
    </g>
    <g fill="none" stroke="#1dbab0" strokeWidth="1.6" strokeLinecap="round" className="login-drift">
      {PACKETS.map((p) => (
        <path
          key={p.line}
          d={LINES[p.line]}
          className="login-packet"
          pathLength={1000}
          style={{ animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </g>
  </svg>
);

const TRACE = [
  { prompt: true, text: 'POST /api/users/authenticate' },
  { prompt: false, code: 'HH5000', text: 'User validated successfully' },
  { prompt: true, text: 'POST /api/transaction/create' },
  { prompt: false, code: 'HH5000', text: 'TransactionNumber 125484532' },
  { prompt: true, text: 'GET /api/transaction/status/HK0002854498' },
  { prompt: false, code: 'HH5008', text: 'Payment Success' },
];

const Trace: React.FC = () => (
  <div className="rounded-[10px] border border-white/[0.08] bg-black/40 backdrop-blur-sm overflow-hidden max-w-[480px]">
    <div className="h-8 px-3 flex items-center gap-1.5 border-b border-white/[0.06]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-2 h-2 rounded-full bg-white/15" />
      ))}
      <span className="ml-2 mono text-[11px] text-white/40">sandbox</span>
    </div>
    <div className="p-4 mono text-[12px] leading-[1.9]">
      {TRACE.map((l, i) => (
        <div key={i} className="login-line flex gap-2 whitespace-nowrap overflow-hidden" style={{ animationDelay: `${0.35 + i * 0.45}s` }}>
          {l.prompt ? (
            <>
              <span className="text-[#1dbab0]">›</span>
              <span className="text-white/85 truncate">{l.text}</span>
            </>
          ) : (
            <>
              <span className="text-white/25">←</span>
              <span className="text-[#4cc28d]">{l.code}</span>
              <span className="text-white/45 truncate">{l.text}</span>
            </>
          )}
        </div>
      ))}
      <div className="login-line flex gap-2" style={{ animationDelay: `${0.35 + TRACE.length * 0.45}s` }}>
        <span className="text-[#1dbab0]">›</span>
        <span className="login-caret w-[7px] h-[15px] mt-[5px] bg-white/70" />
      </div>
    </div>
  </div>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const devPreview = PREVIEW;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);
    if (result.success) {
      onSuccess?.();
    } else {
      setErrorMessage(result.error || 'Sign-in failed. Please try again.');
      setShakeKey((k) => k + 1);
    }
  };

  const trackCaps = (e: React.KeyboardEvent) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  return (
    // The sign-in screen is always on the brand near-black, whatever the portal theme.
    <div className="dark relative min-h-screen bg-paper text-ink flex flex-col overflow-hidden">
      {/* Full-bleed line field behind everything; a soft vignette keeps text readable. */}
      <FlowField />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_0%,transparent_35%,var(--paper)_95%)] pointer-events-none" />

      <header className="relative px-6 sm:px-10 lg:px-14 pt-7 lg:pt-10">
        <BrandLogo />
      </header>

      <main className="relative flex-1 w-full max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 py-10 grid lg:grid-cols-[minmax(0,1fr)_440px] gap-12 lg:gap-20 items-center">
        <div>
          <div className="eyebrow text-[#1dbab0] mb-4">Client portal · Payments API V2.3.3</div>
          <h1 className="text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.04] font-semibold tracking-[-0.03em] max-w-[14ch]">
            Build your integration with Harbour &amp; Hills.
          </h1>
          <p className="mt-5 text-[15px] text-ink-2 leading-relaxed max-w-[46ch]">
            The full API specification, a sandbox console that checks every request, and code your team can copy.
          </p>
          <div className="hidden sm:block mt-10">
            <Trace />
          </div>
        </div>

        <div className="w-full max-w-[440px] mx-auto lg:mx-0 rounded-[16px] border border-white/[0.1] bg-folio/35 backdrop-blur-[2px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-7 sm:p-9">
          <div key={shakeKey} className={shakeKey ? 'login-shake' : ''}>
            <div className="w-10 h-10 rounded-full border border-rule-strong grid place-items-center mb-6">
              <Lock className="w-4 h-4 text-ink-2" />
            </div>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Sign in</h2>
            <p className="mt-1.5 text-[14px] text-ink-3">Use the credentials Harbour &amp; Hills issued to your team.</p>

            {errorMessage && (
              <div role="alert" className="mt-6 px-3.5 py-3 rounded-md bg-fail-wash border border-fail/25 text-fail text-[13px] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <div>
                <label htmlFor="username" className="block text-[13px] font-medium text-ink-2 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  required
                  className="field mono h-11 px-3.5 text-[14px]"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[13px] font-medium text-ink-2 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={trackCaps}
                    onKeyDown={trackCaps}
                    onBlur={() => setCapsLock(false)}
                    autoComplete="current-password"
                    required
                    aria-describedby={capsLock ? 'caps-warning' : undefined}
                    className="field h-11 pl-3.5 pr-11 text-[14px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-md text-ink-3 hover:text-ink cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p id="caps-warning" className="mt-2 text-[12px] text-hold">
                    Caps Lock is on.
                  </p>
                )}
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full h-11 text-[14px] font-semibold mt-2">
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 pt-6 border-t border-rule-soft text-[13px] text-ink-3 leading-relaxed">
              Forgot your password or need access for a colleague? Contact your Harbour &amp; Hills relationship manager.
            </p>
            {devPreview && <p className="mt-3 mono text-[11px] text-hold">Preview: any username and password will sign in.</p>}
          </div>
        </div>
      </main>

      <footer className="relative px-6 sm:px-10 lg:px-14 pb-7 lg:pb-9 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-4">
        <div className="hidden md:flex items-center gap-6 mono text-[11px] text-ink-3">
          <span>14 methods</span>
          <span className="w-px h-3 bg-rule-strong" />
          <span>4 payment types</span>
          <span className="w-px h-3 bg-rule-strong" />
          <span>Sandbox console</span>
        </div>
        <div className="flex items-center gap-5">
          <span>© 2026 Harbour &amp; Hills</span>
          <a href="https://www.harbourandhills.com/" target="_blank" rel="noopener noreferrer" className="hover:text-ink-2">
            harbourandhills.com
          </a>
        </div>
      </footer>
    </div>
  );
};
