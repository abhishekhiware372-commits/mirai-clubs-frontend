'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const { login, googleLogin, quickLoginAsRole } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError('Please provide both institutional email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      showToast('Successfully authenticated. Redirecting...', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      // Simulate Google Workspace OAuth token verification against backend
      await googleLogin('alex.chen@student.mirai.edu');
      showToast('Verified Google Workspace SSO. Welcome!', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Google Workspace authentication failed.');
      showToast(err.message || 'Google login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your institutional email', 'warning');
      return;
    }
    setIsSendingReset(true);
    setTimeout(() => {
      setIsSendingReset(false);
      setShowForgotModal(false);
      showToast('Password reset instructions sent to ' + forgotEmail, 'info');
      setForgotEmail('');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 font-bold text-white text-xl shadow-xl shadow-cyan-950/40 border border-cyan-400/30 mb-3">
          MC
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          MIRAI CLUBS
        </h1>
        <p className="text-xs text-slate-400 tracking-wide mt-1">
          Club Activities Tracker • Mirai School of Technology
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-surface-card border border-surface-border py-8 px-6 sm:px-8 rounded-2xl shadow-card">
          {/* Error Banner */}
          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{authError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@student.mirai.edu"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-surface text-cyan-500 focus:ring-0"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Demo: MiraiDemo#2026</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Google Workspace SSO */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-mono">
                <span className="bg-surface-card px-2 text-slate-500">Institutional SSO</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="mt-4 w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-surface-border bg-surface-elevated hover:bg-slate-800 text-xs text-slate-200 font-medium transition"
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
              <span>Sign in with Google Workspace</span>
            </button>
          </div>

          {/* Quick Access for Judges & Role Evaluation */}
          <div className="mt-6 pt-5 border-t border-surface-border">
            <span className="text-[11px] font-mono text-cyan-400 font-semibold block mb-2 text-center uppercase tracking-wider">
              Quick Judge Access (Instant Role Switch):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => quickLoginAsRole('student')}
                className="p-1.5 rounded-lg bg-surface-elevated hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-surface-border transition text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => quickLoginAsRole('coordinator')}
                className="p-1.5 rounded-lg bg-surface-elevated hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-surface-border transition text-center"
              >
                Coordinator
              </button>
              <button
                type="button"
                onClick={() => quickLoginAsRole('advisor')}
                className="p-1.5 rounded-lg bg-surface-elevated hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-surface-border transition text-center"
              >
                Advisor
              </button>
              <button
                type="button"
                onClick={() => quickLoginAsRole('campus-manager')}
                className="p-1.5 rounded-lg bg-surface-elevated hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-surface-border transition text-center"
              >
                Campus Mgr
              </button>
              <button
                type="button"
                onClick={() => quickLoginAsRole('admin')}
                className="p-1.5 rounded-lg bg-surface-elevated hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-surface-border transition text-center col-span-2 sm:col-span-1"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            Need an account?{' '}
            <Link href="/register" className="text-cyan-400 hover:underline font-semibold">
              Register as Student
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Institutional Password"
        description="Enter your registered Mirai School of Technology email address."
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. alex.chen@student.mirai.edu"
              className="w-full rounded-xl bg-surface-elevated border border-surface-border p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowForgotModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSendingReset}>
              Send Reset Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
