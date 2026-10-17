import { apiClient } from './client';
import { Club, Campus, JoinRequest, ClubMembership } from './types';
import { MOCK_CLUBS, MOCK_CAMPUSES, MOCK_JOIN_REQUESTS } from './mockData';

let localClubs = [...MOCK_CLUBS];
let localJoinRequests = [...MOCK_JOIN_REQUESTS];

export const clubService = {
  async getCampuses(): Promise<Campus[]> {
    try {
      return await apiClient<Campus[]>('/campuses');
    } catch {
      return MOCK_CAMPUSES;
    }
  },

  async getClubs(params?: { campus_id?: string; category?: string }): Promise<Club[]> {
    try {
      const query = new URLSearchParams();
      if (params?.campus_id) query.set('campus_id', params.campus_id);
      if (params?.category) query.set('category', params.category);
      const qStr = query.toString();
      return await apiClient<Club[]>(`/clubs${qStr ? `?${qStr}` : ''}`);
    } catch {
      let filtered = [...localClubs];
      if (params?.campus_id) {
        filtered = filtered.filter((c) => c.campus_id === params.campus_id);
      }
      if (params?.category) {
        filtered = filtered.filter((c) => c.category === params.category);
      }
      return filtered;
    }
  },

  async getClubById(id: string): Promise<Club | null> {
    try {
      return await apiClient<Club>(`/clubs/${id}`);
    } catch {
      return localClubs.find((c) => c.id === id || c.slug === id) || null;
    }
  },

  async createClub(club: Partial<Club>): Promise<Club> {
    try {
      return await apiClient<Club>('/clubs', {
        method: 'POST',
        body: JSON.stringify(club),
      });
    } catch {
      const newClub: Club = {
        id: `club-${Date.now()}`,
        name: club.name || 'Untitled Club',
        slug: (club.name || 'untitled').toLowerCase().replace(/\s+/g, '-'),
        description: club.description || '',
        campus_id: club.campus_id || 'camp-blr',
        campus_name: MOCK_CAMPUSES.find((c) => c.id === club.campus_id)?.name || 'Bangalore',
        category: (club.category as any) || 'Technology',
        capacity: club.capacity || 100,
        member_count: 0,
        meeting_rules: club.meeting_rules,
        status: 'ACTIVE',
        banner_url: club.banner_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        created_at: new Date().toISOString(),
        membership_status: 'NOT_A_MEMBER',
      };
      localClubs.push(newClub);
      return newClub;
    }
  },

  async updateClub(id: string, updates: Partial<Club>): Promise<Club> {
    try {
      return await apiClient<Club>(`/clubs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      const index = localClubs.findIndex((c) => c.id === id);
      if (index !== -1) {
        localClubs[index] = { ...localClubs[index], ...updates };
        return localClubs[index];
      }
      throw new Error('Club not found');
    }
  },

  async requestToJoinClub(clubId: string, data: { is_primary: boolean; statement?: string }): Promise<JoinRequest> {
    try {
      return await apiClient<JoinRequest>(`/clubs/${clubId}/join`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const club = localClubs.find((c) => c.id === clubId);
      const req: JoinRequest = {
        id: `req-${Date.now()}`,
        club_id: clubId,
        club_name: club?.name || 'Sanctioned Club',
        user_id: 'usr-stud-01',
        user_name: 'Alex Chen',
        student_id: 'MST-2026-CS101',
        user_department: 'Computer Science & AI',
        user_year: '2nd Year',
        is_primary: data.is_primary,
        status: 'PENDING',
        statement: data.statement,
        submitted_at: new Date().toISOString(),
      };
      localJoinRequests.unshift(req);
      if (club) {
        club.membership_status = 'PENDING';
      }
      return req;
    }
  },

  async getJoinRequests(clubId?: string): Promise<JoinRequest[]> {
    try {
      return await apiClient<JoinRequest[]>(`/memberships/requests${clubId ? `?club_id=${clubId}` : ''}`);
    } catch {
      if (clubId) {
        return localJoinRequests.filter((r) => r.club_id === clubId);
      }
      return localJoinRequests;
    }
  },

  async reviewJoinRequest(requestId: string, status: 'APPROVED' | 'REJECTED'): Promise<JoinRequest> {
    try {
      return await apiClient<JoinRequest>(`/memberships/requests/${requestId}/review`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
    } catch {
      const req = localJoinRequests.find((r) => r.id === requestId);
      if (req) {
        req.status = status;
        const targetClub = localClubs.find((c) => c.id === req.club_id);
        if (targetClub && status === 'APPROVED') {
          targetClub.member_count += 1;
          targetClub.membership_status = 'APPROVED';
        }
        return req;
      }
      throw new Error('Request not found');
    }
  },
};
