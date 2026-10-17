'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { notificationService } from '../../../lib/api/notifications';
import { Notification } from '../../../lib/api/types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { Bell, Check, ExternalLink, Clock } from 'lucide-react';
import { formatRelativeTime } from '../../../lib/utils';

export default function StudentNotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifs() {
      try {
        const list = await notificationService.getNotifications();
        setNotifications(list);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    showToast('Notification marked as read', 'info');
  };

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const filtered =
    filter === 'UNREAD' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Alert Dispatch
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time activity approvals, Club Day notices, evaluation scores, and certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            filter === 'ALL'
              ? 'bg-cyan-600 text-white border-cyan-400'
              : 'bg-surface-elevated text-slate-400 border-surface-border'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            filter === 'UNREAD'
              ? 'bg-cyan-600 text-white border-cyan-400'
              : 'bg-surface-elevated text-slate-400 border-surface-border'
          }`}
        >
          Unread Only ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="All caught up!"
          description="You have no notifications in this view."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                !n.is_read ? 'bg-cyan-950/20 border-cyan-500/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    !n.is_read ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="cyan" size="sm">
                      {n.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{n.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link href={n.link}>
                    <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Open
                    </Button>
                  </Link>
                )}
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
