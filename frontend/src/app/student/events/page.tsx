'use client';

import React, { useState, useEffect } from 'react';
import { eventService } from '../../../lib/api/events';
import { Event, EventRegistration } from '../../../lib/api/types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function StudentEventsPage() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Registration Modal
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamMemberEmails, setTeamMemberEmails] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        const [evs, regs] = await Promise.all([
          eventService.getEvents(),
          eventService.getMyRegistrations(),
        ]);
        setEvents(evs);
        setRegistrations(regs);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleOpenRegistration = (ev: Event) => {
    setSelectedEvent(ev);
    setTeamName(ev.team_size_min > 1 ? 'Mirai Pioneers' : '');
    setTeamMemberEmails('');
  };

  const handleConfirmRegistration = async () => {
    if (!selectedEvent) return;
    if (selectedEvent.team_size_min > 1 && !teamName.trim()) {
      showToast('Please enter a team name for this group competition', 'warning');
      return;
    }

    setIsRegistering(true);
    try {
      const members = teamMemberEmails
        ? teamMemberEmails.split(',').map((s) => s.trim())
        : ['Alex Chen'];

      const reg = await eventService.registerForEvent(selectedEvent.id, {
        team_name: teamName || undefined,
        team_members: members,
      });

      setRegistrations((prev) => [...prev, reg]);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selectedEvent.id
            ? { ...e, user_registered: true, current_registrations: e.current_registrations + 1 }
            : e
        )
      );

      showToast(`Registered for ${selectedEvent.title}! Confirmation logged.`, 'success');
      setSelectedEvent(null);
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const filteredEvents =
    selectedCategory === 'all'
      ? events
      : events.filter((e) => e.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Flagship & Inter-Campus Hub
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Campus Competitions & Events
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Featuring GAMBADE, InnovateX Hackathon, ICAR International Conference, and Cross Road.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan">{registrations.length} Active Registrations</Badge>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'Gambade', 'Hackathon', 'Conference', 'Cross Road'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
              selectedCategory === cat
                ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-surface-elevated text-slate-400 border-surface-border hover:text-slate-200'
            }`}
          >
            {cat === 'all' ? 'All Competitions' : cat}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((ev) => {
          const isRegistered =
            ev.user_registered || registrations.some((r) => r.event_id === ev.id);

          return (
            <Card key={ev.id} hoverEffect className="flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={ev.event_type === 'FLAGSHIP' ? 'cyan' : 'violet'} size="sm">
                    {ev.event_type}
                  </Badge>

                  {isRegistered ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Registered
                    </Badge>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">
                      Cap: {ev.current_registrations} / {ev.max_participants}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-100">{ev.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {ev.description}
                </p>

                <div className="p-3 rounded-xl bg-surface-elevated text-xs text-slate-300 space-y-1.5 font-mono">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatDate(ev.start_time)} - {formatDate(ev.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{ev.venue}</span>
                  </div>
                  {ev.prize_pool && (
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{ev.prize_pool}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  Team Size: {ev.team_size_min === ev.team_size_max ? ev.team_size_min : `${ev.team_size_min}-${ev.team_size_max}`}
                </span>

                {isRegistered ? (
                  <Button variant="outline" size="sm" disabled>
                    Confirmed Registration
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenRegistration(ev)}
                  >
                    Register Team / Solo
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Team Registration Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Register for ${selectedEvent.title}`}
          description={`Team size requirement: ${selectedEvent.team_size_min} to ${selectedEvent.team_size_max} participants.`}
        >
          <div className="space-y-4">
            {selectedEvent.team_size_max > 1 && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Team / Syndicate Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Mirai Zero Agents"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Teammate Roll IDs or Institutional Emails (Comma-separated)
              </label>
              <textarea
                rows={2}
                value={teamMemberEmails}
                onChange={(e) => setTeamMemberEmails(e.target.value)}
                placeholder="MST-2026-CS102, MST-2026-EC204"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Primary registrant (Alex Chen) will be marked as Team Captain.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRegistration}
                isLoading={isRegistering}
              >
                Confirm Official Registration
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
