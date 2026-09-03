import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  GraduationCap,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export const AuthView: React.FC = () => {
  const { loginGoogle, login, register, loginGuest, resetPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [displayName, setDisplayName] = useState('');
  const [upscYear, setUpscYear] = useState('2026');
  const [targetService, setTargetService] = useState('IAS');
  const [optionalSubject, setOptionalSubject] = useState('PSIR');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Status & Error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await loginGoogle();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup closed before completion.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        // Offer instant workspace
        setErrorMsg('Google Sign-In encountered an issue. You can click "Quick Launch Instant Workspace" below to continue immediately.');
      }
    }
  };

  const handleInstantLaunch = async () => {
    setErrorMsg(null);
    try {
      await loginGuest(displayName || 'Nishant Raj', email || 'rajnishant1299@gmail.com', {
        upscYear,
        targetService,
        optionalSubject,
      });
    } catch (err: any) {
      setErrorMsg('Failed to initialize local workspace.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please try again later.');
      } else {
        // Automatically switch to guest workspace
        await loginGuest(email.split('@')[0], email);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    try {
      await register(email, password, displayName, {
        upscYear,
        targetService,
        optionalSubject,
      });
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Please sign in.');
      } else {
        // Seamlessly launch local workspace
        await loginGuest(displayName || email.split('@')[0], email, {
          upscYear,
          targetService,
          optionalSubject,
        });
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotSuccess(false);
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email. You can use Instant Workspace.');
    }
  };

  const handleDemoLogin = async (name: string, service: string, optional: string) => {
    setErrorMsg(null);
    try {
      await loginGuest(name, `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upsc.gov.in`, {
        upscYear: '2026',
        targetService: service,
        optionalSubject: optional,
      });
    } catch (err: any) {
      setErrorMsg('Demo launch failed.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-950 text-white relative overflow-hidden">
      {/* Subtle Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#6366F1]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6366F1]/15 text-[#6366F1] mb-3 border border-[#6366F1]/30 shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-mono">
            StudyOS
          </h1>
          <p className="text-xs text-[#A1A1AA] uppercase tracking-wider mt-1">
            UPSC CSE Real-Time Multi-User Platform
          </p>
        </div>

        {/* GOOGLE SIGN IN (PRIMARY 1-CLICK AUTH) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 mb-5 border border-neutral-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#27272A] w-full" />
          <span className="bg-[#18181B] px-3 text-[10px] font-bold uppercase tracking-widest text-[#71717A] absolute">
            Or credentials
          </span>
        </div>

        {/* Auth Mode Switcher */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-[#09090B] rounded-xl border border-[#27272A] mb-5 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-[#27272A] text-white shadow-xs' : 'text-[#71717A] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-[#27272A] text-white shadow-xs' : 'text-[#71717A] hover:text-white'
              }`}
            >
              New Account
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Aspirant Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aspirant@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                  className="text-[10px] text-[#6366F1] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#27272A] text-white hover:bg-[#3F3F46] font-bold uppercase text-xs tracking-wider border border-[#3F3F46] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Nishant Raj"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nishant@upsc.org"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>
            </div>

            {/* UPSC Target Specifications */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Target Year
                </label>
                <select
                  value={upscYear}
                  onChange={(e) => setUpscYear(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs font-mono"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Target Service
                </label>
                <select
                  value={targetService}
                  onChange={(e) => setTargetService(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs font-mono font-bold"
                >
                  <option value="IAS">IAS</option>
                  <option value="IPS">IPS</option>
                  <option value="IFS">IFS</option>
                  <option value="IRS">IRS</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Optional
                </label>
                <select
                  value={optionalSubject}
                  onChange={(e) => setOptionalSubject(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs font-mono"
                >
                  <option value="PSIR">PSIR</option>
                  <option value="Sociology">Sociology</option>
                  <option value="Geography">Geography</option>
                  <option value="History">History</option>
                  <option value="PubAd">Pub Admin</option>
                  <option value="Anthro">Anthro</option>
                  <option value="Economics">Economics</option>
                  <option value="Law">Law</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Creating User Workspace...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                Reset Password
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                Enter your registered email address to receive a secure password reset link.
              </p>
            </div>

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password reset link sent! Check your inbox.</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="aspirant@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-2.5 rounded-xl border border-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold uppercase text-xs tracking-wider hover:bg-[#E4E4E7] cursor-pointer"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}

        {/* INSTANT 1-CLICK LAUNCH / DEMO ACCOUNTS */}
        <div className="mt-6 pt-5 border-t border-[#27272A]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#71717A] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Instant Workspace Access</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleInstantLaunch}
            disabled={isLoading}
            className="w-full mb-3 py-2.5 px-3 rounded-xl bg-[#6366F1]/10 hover:bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#A5B4FC] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Quick Launch Instant Workspace</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('Nishant Raj', 'IAS', 'PSIR')}
              className="px-3 py-2 rounded-xl bg-[#09090B] hover:bg-[#27272A] border border-[#27272A] text-left transition-all cursor-pointer group"
            >
              <span className="text-[11px] font-bold text-white block group-hover:text-[#6366F1]">
                Nishant Raj (IAS)
              </span>
              <span className="text-[9px] text-[#71717A] font-mono">Profile 1 • PSIR</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('Pooja Verma', 'IPS', 'Sociology')}
              className="px-3 py-2 rounded-xl bg-[#09090B] hover:bg-[#27272A] border border-[#27272A] text-left transition-all cursor-pointer group"
            >
              <span className="text-[11px] font-bold text-white block group-hover:text-[#6366F1]">
                Pooja Verma (IPS)
              </span>
              <span className="text-[9px] text-[#71717A] font-mono">Profile 2 • Sociology</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
