'use client';

import React, { useState, useEffect } from 'react';
import { eventService } from '../../../lib/api/events';
import { Event } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import { Sparkles, Calendar, MapPin, Trophy, Plus } from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function AdminEventsPage() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Gambade' | 'Hackathon' | 'Conference' | 'Cross Road'>('Hackathon');
  const [venue, setVenue] = useState('Central Campus Quadrangle');
  const [maxParticipants, setMaxParticipants] = useState(200);
  const [prizePool, setPrizePool] = useState('₹1,00,000 Cash');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const all = await eventService.getEvents();
      setEvents(all);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const created = await eventService.createEvent({
        title,
        description,
        category,
        venue,
        max_participants: maxParticipants,
        prize_pool: prizePool,
        event_type: 'FLAGSHIP',
      });
      setEvents((prev) => [created, ...prev]);
      showToast('Flagship competition published to institutional calendar.', 'success');
      setShowModal(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      showToast(err.message || 'Creation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Flagship Programs
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Institutional Competitions Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish and manage GAMBADE, Hackathons, International Conferences, and Cross Road.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Publish Flagship Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.map((ev) => (
          <Card key={ev.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="cyan" size="sm">{ev.category}</Badge>
              <Badge variant="success" size="sm">{ev.status}</Badge>
            </div>

            <h3 className="text-base font-bold text-slate-100">{ev.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>

            <div className="p-3 rounded-xl bg-surface-elevated text-xs font-mono text-slate-300 space-y-1">
              <div>Schedule: {formatDate(ev.start_time)} - {formatDate(ev.end_time)}</div>
              <div>Venue: {ev.venue}</div>
              <div>Registrations: {ev.current_registrations} / {ev.max_participants}</div>
              {ev.prize_pool && <div className="text-amber-300">Prize Pool: {ev.prize_pool}</div>}
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Publish Flagship Competition"
          description="Institutional events are announced across all 4 campuses."
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. GAMBADE 2026 or Mirai HackNova"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Gambade">Gambade (Cultural Olympiad)</option>
                <option value="Hackathon">Flagship Hackathon</option>
                <option value="Conference">International Conference</option>
                <option value="Cross Road">Cross Road (Venture Pitch)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Competition tracks, rules, eligibility..."
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Venue *</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Capacity *</label>
                <input
                  type="number"
                  min={10}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 100)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Prize Pool</label>
              <input
                type="text"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="e.g. ₹2,50,000 Cash + Cloud Credits"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                Publish Event
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
