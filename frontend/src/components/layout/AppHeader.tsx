'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, getDashboardPathForRole } from '../../context/AuthContext';
import { notificationService } from '../../lib/api/notifications';
import { Notification } from '../../lib/api/types';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Check,
  ExternalLink,
  ChevronDown,
  Building,
  Menu,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export function AppHeader({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const { user, role, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const notifs = await notificationService.getNotifications();
        setNotifications(notifs);
      } catch {
        // quiet error
      }
    }
    fetchNotifs();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const dashboardPath = role ? getDashboardPathForRole(role) : '/login';

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Wordmark */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href={dashboardPath} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-950/40 border border-cyan-400/30">
              <span className="font-mono text-base tracking-tighter">MC</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition">
                  MIRAI CLUBS
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-cyan-300 border border-surface-border">
                  MSOT
                </span>
              </div>
              <div className="text-[11px] text-slate-400 -mt-0.5 tracking-tight font-medium hidden sm:block">
                Club Activities Tracker
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Campus indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/60 border border-surface-border text-xs text-slate-300">
          <Building className="w-3.5 h-3.5 text-cyan-400" />
          <span>{user?.campus_name || 'Tech City, Bangalore Campus'}</span>
        </div>

        {/* Right: Notifications & User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-surface-elevated rounded-xl transition border border-transparent hover:border-surface-border"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse ring-2 ring-surface" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface-elevated/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="cyan" size="sm">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs hover:bg-surface-elevated/50 transition flex items-start gap-3 ${
                          !n.is_read ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !n.is_read ? 'bg-cyan-400' : 'bg-slate-700'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          <p className="text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => setShowNotifications(false)}
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline mt-1.5 font-medium"
                            >
                              View details <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-elevated transition border border-transparent hover:border-surface-border"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-xs font-semibold text-cyan-300">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-200 leading-none">
                  {user?.full_name || 'Anonymous User'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {role?.replace('_', ' ') || 'STUDENT'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-surface-border bg-surface-elevated/40">
                  <p className="text-xs font-semibold text-slate-200">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  {user?.student_id && (
                    <p className="text-[10px] text-cyan-400 font-mono mt-1">ID: {user.student_id}</p>
                  )}
                  <div className="mt-2">
                    <Badge variant="cyan" size="sm">
                      {role}
                    </Badge>
                  </div>
                </div>

                <div className="p-1">
                  {role === 'STUDENT' && (
                    <Link
                      href="/student/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-surface-elevated rounded-lg transition"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>My Student Profile</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
