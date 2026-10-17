import { apiClient } from './client';
import { Event, EventRegistration } from './types';
import { MOCK_EVENTS } from './mockData';

let localEvents = [...MOCK_EVENTS];
let localRegistrations: EventRegistration[] = [
  {
    id: 'reg-01',
    event_id: 'evt-01-gambade',
    event_title: 'GAMBADE 2026 — Annual Inter-Campus Cultural & Arts Olympiad',
    user_id: 'usr-stud-01',
    user_name: 'Alex Chen',
    student_id: 'MST-2026-CS101',
    team_name: 'SoundWave Synthesizers',
    team_members: ['Alex Chen (Lead)', 'Priya Patel', 'Tanvi Joshi'],
    status: 'CONFIRMED',
    check_in_status: 'PENDING',
    registered_at: '2026-10-12T10:00:00Z',
  },
  {
    id: 'reg-02',
    event_id: 'evt-02-hackathon',
    event_title: 'Mirai InnovateX 2026: AI & Sustainability Flagship Hackathon',
    user_id: 'usr-stud-01',
    user_name: 'Alex Chen',
    student_id: 'MST-2026-CS101',
    team_name: 'Mirai Zero Agents',
    team_members: ['Alex Chen (Lead)', 'Rohan Sharma', 'Vikram Joshi'],
    status: 'CONFIRMED',
    check_in_status: 'PENDING',
    registered_at: '2026-10-15T15:30:00Z',
  },
];

export const eventService = {
  async getEvents(params?: { category?: string; campus_id?: string; status?: string }): Promise<Event[]> {
    try {
      const q = new URLSearchParams();
      if (params?.category) q.set('category', params.category);
      if (params?.campus_id) q.set('campus_id', params.campus_id);
      if (params?.status) q.set('status', params.status);
      const qStr = q.toString();
      return await apiClient<Event[]>(`/events${qStr ? `?${qStr}` : ''}`);
    } catch {
      let filtered = [...localEvents];
      if (params?.category) {
        filtered = filtered.filter((e) => e.category === params.category);
      }
      if (params?.status) {
        filtered = filtered.filter((e) => e.status === params.status);
      }
      return filtered;
    }
  },

  async getEventById(id: string): Promise<Event | null> {
    try {
      return await apiClient<Event>(`/events/${id}`);
    } catch {
      return localEvents.find((e) => e.id === id || e.slug === id) || null;
    }
  },

  async registerForEvent(
    eventId: string,
    data: {
      team_name?: string;
      team_members?: string[];
    }
  ): Promise<EventRegistration> {
    try {
      return await apiClient<EventRegistration>(`/events/${eventId}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const ev = localEvents.find((e) => e.id === eventId);
      if (!ev) throw new Error('Event not found');

      if (ev.current_registrations >= ev.max_participants) {
        throw new Error('Event capacity has been reached. Registrations are closed.');
      }

      const reg: EventRegistration = {
        id: `reg-${Date.now()}`,
        event_id: eventId,
        event_title: ev.title,
        user_id: 'usr-stud-01',
        user_name: 'Alex Chen',
        student_id: 'MST-2026-CS101',
        team_name: data.team_name,
        team_members: data.team_members || ['Alex Chen'],
        status: 'CONFIRMED',
        check_in_status: 'PENDING',
        registered_at: new Date().toISOString(),
      };

      localRegistrations.push(reg);
      ev.current_registrations += 1;
      ev.user_registered = true;
      ev.user_team_name = data.team_name;

      return reg;
    }
  },

  async getMyRegistrations(): Promise<EventRegistration[]> {
    try {
      return await apiClient<EventRegistration[]>('/events/my-registrations');
    } catch {
      return localRegistrations.filter((r) => r.user_id === 'usr-stud-01');
    }
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      return await apiClient<Event>('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    } catch {
      const newEv: Event = {
        id: `evt-${Date.now()}`,
        title: eventData.title || 'Institutional Event',
        slug: (eventData.title || 'event').toLowerCase().replace(/\s+/g, '-'),
        description: eventData.description || '',
        category: (eventData.category as any) || 'Workshop',
        event_type: eventData.event_type || 'CAMPUS',
        campus_name: 'Mirai Main Campus - Tech City',
        venue: eventData.venue || 'Campus Auditorium',
        start_time: eventData.start_time || new Date(Date.now() + 7 * 86400000).toISOString(),
        end_time: eventData.end_time || new Date(Date.now() + 8 * 86400000).toISOString(),
        registration_deadline: eventData.registration_deadline || new Date(Date.now() + 5 * 86400000).toISOString(),
        max_participants: eventData.max_participants || 150,
        current_registrations: 0,
        team_size_min: eventData.team_size_min || 1,
        team_size_max: eventData.team_size_max || 4,
        prize_pool: eventData.prize_pool,
        status: 'UPCOMING',
        banner_url: eventData.banner_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        user_registered: false,
      };
      localEvents.unshift(newEv);
      return newEv;
    }
  },
};
