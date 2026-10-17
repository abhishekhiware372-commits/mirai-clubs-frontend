'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '../../lib/api/auth';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import {
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  Building,
  GraduationCap,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { MOCK_CAMPUSES } from '../../lib/api/mockData';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [campusId, setCampusId] = useState('camp-blr');
  const [department, setDepartment] = useState('Computer Science & AI');
  const [year, setYear] = useState('1st Year');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({
        email,
        password,
        full_name: fullName,
        student_id: studentId,
        campus_id: campusId,
        department,
        year,
      });

      showToast('Registration successful! Please sign in with your credentials.', 'success');
      router.push('/login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Email or Student ID may already exist.');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 font-bold text-white text-lg shadow-xl mb-3">
          MC
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Student Portal Enrollment
        </h1>
        <p className="text-xs text-slate-400 tracking-wide mt-1">
          Mirai School of Technology • Official Problem 5 Tracker
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <div className="bg-surface-card border border-surface-border py-8 px-6 sm:px-8 rounded-2xl shadow-card">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border pl-10 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@student.mirai.edu"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Student Roll / ID *
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="MST-2026-CS101"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Campus *</label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {MOCK_CAMPUSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.split(' - ')[1] || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option>Computer Science & AI</option>
                  <option>Electronics & Robotics</option>
                  <option>Mechanical & Automation</option>
                  <option>Data Science & Analytics</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-4"
              isLoading={isSubmitting}
            >
              Complete Student Registration
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an institutional account?{' '}
            <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
