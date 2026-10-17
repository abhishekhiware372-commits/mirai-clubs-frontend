import { apiClient, ApiError } from './client';
import { AttendanceSession, AttendanceRecord, AttendanceAudit } from './types';
import { MOCK_ATTENDANCE_SESSION, MOCK_ATTENDANCE_RECORDS } from './mockData';

let currentSession = { ...MOCK_ATTENDANCE_SESSION };
let localAttendees = [...MOCK_ATTENDANCE_RECORDS];
let localAudits: AttendanceAudit[] = [];

// Helper to simulate time-based 15-second rotating HMAC tokens
function generateHMACWindow(activityId: string, windowIndex: number): string {
  const chars = '0123456789ABCDEF';
  let hash = 0;
  const str = `${activityId}-${windowIndex}-MIRAI-SALT-2026`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `MRX-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export const attendanceService = {
  async getActiveSession(activityId: string): Promise<AttendanceSession | null> {
    try {
      return await apiClient<AttendanceSession>(`/attendance/session/${activityId}`);
    } catch {
      if (currentSession && currentSession.is_active && currentSession.activity_id === activityId) {
        return currentSession;
      }
      return null;
    }
  },

  async startSession(activityId: string, durationMinutes: number = 45): Promise<AttendanceSession> {
    try {
      return await apiClient<AttendanceSession>('/attendance/session/create', {
        method: 'POST',
        body: JSON.stringify({ activity_id: activityId, duration_minutes: durationMinutes }),
      });
    } catch {
      const now = Date.now();
      const windowIdx = Math.floor(now / 15000);
      currentSession = {
        id: `sess-${Date.now()}`,
        activity_id: activityId,
        activity_title: 'Club Day 08: Rapid B2B SaaS Prototyping',
        club_id: 'club-nexcell',
        is_active: true,
        window_index: windowIdx,
        window_seconds: 15,
        current_token: generateHMACWindow(activityId, windowIdx),
        backup_code: `${Math.floor(100000 + Math.random() * 900000)}`,
        expires_at: new Date(now + durationMinutes * 60 * 1000).toISOString(),
        created_at: new Date(now).toISOString(),
        attendees_count: localAttendees.length,
      };
      return currentSession;
    }
  },

  async getCurrentQR(sessionId: string): Promise<{
    token: string;
    backup_code: string;
    window_index: number;
    seconds_remaining: number;
  }> {
    try {
      return await apiClient<{
        token: string;
        backup_code: string;
        window_index: number;
        seconds_remaining: number;
      }>(`/attendance/session/${sessionId}/current-qr`);
    } catch {
      const now = Date.now();
      const windowIdx = Math.floor(now / 15000);
      const secondsRemaining = 15 - (Math.floor(now / 1000) % 15);
      const token = generateHMACWindow(currentSession.activity_id, windowIdx);
      currentSession.window_index = windowIdx;
      currentSession.current_token = token;

      return {
        token,
        backup_code: currentSession.backup_code,
        window_index: windowIdx,
        seconds_remaining: secondsRemaining,
      };
    }
  },

  async closeSession(sessionId: string): Promise<void> {
    try {
      await apiClient(`/attendance/session/${sessionId}/close`, { method: 'POST' });
    } catch {
      currentSession.is_active = false;
    }
  },

  async studentCheckIn(data: {
    activity_id: string;
    token?: string;
    backup_code?: string;
  }): Promise<{
    success: boolean;
    status: 'PRESENT' | 'LATE';
    message: string;
    record: AttendanceRecord;
  }> {
    try {
      return await apiClient<{
        success: boolean;
        status: 'PRESENT' | 'LATE';
        message: string;
        record: AttendanceRecord;
      }>('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.status && err.status !== 0 && err.message !== 'MOCK_MODE_ACTIVE') {
        throw err;
      }

      // Check for already checked in
      const existing = localAttendees.find(
        (a) => a.activity_id === data.activity_id && a.user_id === 'usr-stud-01'
      );
      if (existing) {
        throw new ApiError('Already checked in for this session at ' + existing.check_in_time, 400);
      }

      // Validate backup code or QR token
      const isBackupValid = data.backup_code && data.backup_code.trim() === currentSession.backup_code;
      const isTokenValid = data.token && data.token.trim().toUpperCase() === currentSession.current_token.toUpperCase();

      if (!isBackupValid && !isTokenValid) {
        // Check if expired
        if (data.token && data.token.startsWith('MRX-')) {
          throw new ApiError('QR Token expired. Please scan the current rotating code displayed on the screen.', 400);
        }
        throw new ApiError('Invalid verification code or QR token provided.', 400);
      }

      // Check session expiry
      if (new Date() > new Date(currentSession.expires_at)) {
        throw new ApiError('Attendance session has concluded.', 400);
      }

      const isLate = Math.floor(Math.random() * 5) === 0;
      const checkInStatus: 'PRESENT' | 'LATE' = isLate ? 'LATE' : 'PRESENT';
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        activity_id: data.activity_id,
        activity_title: currentSession.activity_title,
        club_name: 'Nexcell — Entrepreneurship Club',
        user_id: 'usr-stud-01',
        user_name: 'Alex Chen',
        student_id: 'MST-2026-CS101',
        status: checkInStatus,
        is_presenter: false,
        method: isBackupValid ? 'BACKUP_CODE' : 'QR_SCAN',
        check_in_time: new Date().toISOString(),
      };

      localAttendees.unshift(newRecord);
      currentSession.attendees_count += 1;

      return {
        success: true,
        status: checkInStatus,
        message: isLate
          ? 'Check-in recorded as LATE (Grace window exceeded).'
          : 'Verified On-Time Participation Recorded via Mirai Cryptographic Engine.',
        record: newRecord,
      };
    }
  },

  async getAttendees(activityId: string): Promise<AttendanceRecord[]> {
    try {
      return await apiClient<AttendanceRecord[]>(`/attendance/${activityId}/attendees`);
    } catch {
      return localAttendees.filter((a) => a.activity_id === activityId);
    }
  },

  async togglePresenter(recordId: string, isPresenter: boolean): Promise<AttendanceRecord> {
    try {
      return await apiClient<AttendanceRecord>(`/attendance/record/${recordId}/presenter`, {
        method: 'POST',
        body: JSON.stringify({ is_presenter: isPresenter }),
      });
    } catch {
      const rec = localAttendees.find((r) => r.id === recordId);
      if (!rec) throw new Error('Record not found');
      rec.is_presenter = isPresenter;
      return rec;
    }
  },

  async correctAttendance(
    recordId: string,
    newStatus: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED',
    reason: string
  ): Promise<AttendanceRecord> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Mandatory justification reason required (minimum 5 characters)');
    }

    try {
      return await apiClient<AttendanceRecord>(`/attendance/record/${recordId}/correct`, {
        method: 'POST',
        body: JSON.stringify({ new_status: newStatus, reason }),
      });
    } catch {
      const rec = localAttendees.find((r) => r.id === recordId);
      if (!rec) throw new Error('Record not found');

      const audit: AttendanceAudit = {
        id: `aud-${Date.now()}`,
        attendance_id: recordId,
        supervisor_id: 'usr-coord-01',
        supervisor_name: 'Rohan Sharma (Coordinator)',
        previous_status: rec.status,
        new_status: newStatus,
        reason,
        timestamp: new Date().toISOString(),
      };
      localAudits.unshift(audit);

      rec.status = newStatus;
      rec.override_reason = reason;
      rec.override_by_name = 'Rohan Sharma';
      rec.method = 'MANUAL_OVERRIDE';
      return rec;
    }
  },

  async getAudits(recordId?: string): Promise<AttendanceAudit[]> {
    try {
      return await apiClient<AttendanceAudit[]>(`/attendance/audits${recordId ? `?record_id=${recordId}` : ''}`);
    } catch {
      if (recordId) {
        return localAudits.filter((a) => a.attendance_id === recordId);
      }
      return localAudits;
    }
  },
};
