import { apiClient } from './client';
import { Activity, ActivityApprovalStatus } from './types';
import { MOCK_ACTIVITIES } from './mockData';

let localActivities = [...MOCK_ACTIVITIES];

export const activityService = {
  async getActivities(params?: { club_id?: string; approval_status?: string }): Promise<Activity[]> {
    try {
      const q = new URLSearchParams();
      if (params?.club_id) q.set('club_id', params.club_id);
      if (params?.approval_status) q.set('approval_status', params.approval_status);
      const qStr = q.toString();
      return await apiClient<Activity[]>(`/activities${qStr ? `?${qStr}` : ''}`);
    } catch {
      let filtered = [...localActivities];
      if (params?.club_id) {
        filtered = filtered.filter((a) => a.club_id === params.club_id);
      }
      if (params?.approval_status) {
        filtered = filtered.filter((a) => a.approval_status === params.approval_status);
      }
      return filtered;
    }
  },

  async getActivityById(id: string): Promise<Activity | null> {
    try {
      return await apiClient<Activity>(`/activities/${id}`);
    } catch {
      return localActivities.find((a) => a.id === id) || null;
    }
  },

  async createActivityPlan(data: {
    club_id: string;
    title: string;
    topic: string;
    description: string;
    venue: string;
    date: string;
    start_time: string;
    end_time: string;
    deliverable_name: string;
    deliverable_description: string;
    deliverable_deadline: string;
  }): Promise<Activity> {
    try {
      return await apiClient<Activity>('/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newAct: Activity = {
        id: `act-${Date.now()}`,
        ...data,
        club_name: 'Nexcell — Entrepreneurship Club',
        approval_status: 'PENDING_APPROVAL',
        announced: false,
        created_by_id: 'usr-coord-01',
        created_by_name: 'Rohan Sharma',
        created_at: new Date().toISOString(),
        attendance_count: 0,
        submission_count: 0,
      };
      localActivities.unshift(newAct);
      return newAct;
    }
  },

  async reviewActivityPlan(
    id: string,
    action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT',
    comments?: string
  ): Promise<Activity> {
    try {
      return await apiClient<Activity>(`/activities/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, comments }),
      });
    } catch {
      const act = localActivities.find((a) => a.id === id);
      if (!act) throw new Error('Activity not found');

      if (action === 'APPROVE') {
        act.approval_status = 'APPROVED';
        act.announced = true;
        act.announced_at = new Date().toISOString();
        act.advisor_comments = comments || 'Approved by Faculty Advisor.';
      } else if (action === 'REQUEST_CHANGES') {
        act.approval_status = 'CHANGES_REQUESTED';
        act.advisor_comments = comments || 'Changes requested by Faculty Advisor.';
      } else {
        act.approval_status = 'REJECTED';
        act.advisor_comments = comments || 'Rejected by Faculty Advisor.';
      }
      return act;
    }
  },

  async announceActivity(id: string): Promise<Activity> {
    try {
      return await apiClient<Activity>(`/activities/${id}/announce`, {
        method: 'POST',
      });
    } catch {
      const act = localActivities.find((a) => a.id === id);
      if (!act) throw new Error('Activity not found');
      act.announced = true;
      act.announced_at = new Date().toISOString();
      return act;
    }
  },
};
