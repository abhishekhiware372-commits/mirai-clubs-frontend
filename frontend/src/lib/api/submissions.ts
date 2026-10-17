import { apiClient } from './client';
import { Submission } from './types';
import { MOCK_SUBMISSIONS } from './mockData';

let localSubmissions = [...MOCK_SUBMISSIONS];

export const submissionService = {
  async getSubmissions(params?: { activity_id?: string; user_id?: string }): Promise<Submission[]> {
    try {
      const q = new URLSearchParams();
      if (params?.activity_id) q.set('activity_id', params.activity_id);
      if (params?.user_id) q.set('user_id', params.user_id);
      const qStr = q.toString();
      return await apiClient<Submission[]>(`/submissions${qStr ? `?${qStr}` : ''}`);
    } catch {
      let filtered = [...localSubmissions];
      if (params?.activity_id) {
        filtered = filtered.filter((s) => s.activity_id === params.activity_id);
      }
      if (params?.user_id) {
        filtered = filtered.filter((s) => s.user_id === params.user_id);
      }
      return filtered;
    }
  },

  async getSubmissionById(id: string): Promise<Submission | null> {
    try {
      return await apiClient<Submission>(`/submissions/${id}`);
    } catch {
      return localSubmissions.find((s) => s.id === id) || null;
    }
  },

  async uploadDeliverable(data: {
    activity_id: string;
    file_name: string;
    file_size_kb: number;
    notes?: string;
  }): Promise<Submission> {
    try {
      return await apiClient<Submission>('/submissions/upload', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newSub: Submission = {
        id: `sub-${Date.now()}`,
        activity_id: data.activity_id,
        activity_title: 'Club Day 08: Rapid B2B SaaS Prototyping & Pitch Clinic',
        club_name: 'Nexcell — Entrepreneurship Club',
        user_id: 'usr-stud-01',
        user_name: 'Alex Chen',
        student_id: 'MST-2026-CS101',
        file_url: `/uploads/${data.file_name}`,
        file_name: data.file_name,
        file_size_kb: data.file_size_kb || 2048,
        notes: data.notes,
        submitted_at: new Date().toISOString(),
        status: 'SUBMITTED',
      };
      localSubmissions.unshift(newSub);
      return newSub;
    }
  },
};
