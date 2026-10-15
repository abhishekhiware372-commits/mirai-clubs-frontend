/**
 * Mirai Clubs - Centralized Backend API Client
 * Connects directly to the FastAPI Backend (/api/v1/)
 */

const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('mirai_clubs_jwt_token') || null;
    this.currentUser = null;
    const cachedUser = localStorage.getItem('mirai_clubs_user');
    if (cachedUser) {
      try {
        this.currentUser = JSON.parse(cachedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  setToken(token, user) {
    this.token = token;
    this.currentUser = user;
    if (token) {
      localStorage.setItem('mirai_clubs_jwt_token', token);
    } else {
      localStorage.removeItem('mirai_clubs_jwt_token');
    }
    if (user) {
      localStorage.setItem('mirai_clubs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mirai_clubs_user');
    }
  }

  logout() {
    this.setToken(null, null);
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 401) {
        // Token expired or invalid
        this.logout();
        if (window.app && typeof window.app.onSessionExpired === 'function') {
          window.app.onSessionExpired();
        }
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (err) {
      console.error(`API Request Failed: ${endpoint}`, err);
      throw err;
    }
  }

  // --- AUTH ---
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.access_token, data.user);
    return data.user;
  }

  async googleLogin(email, fullName = null, idToken = null) {
    const data = await this.request('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ email, full_name: fullName, id_token: idToken })
    });
    this.setToken(data.access_token, data.user);
    return data.user;
  }

  async register(userData) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getMe() {
    const user = await this.request('/auth/me');
    this.currentUser = user;
    localStorage.setItem('mirai_clubs_user', JSON.stringify(user));
    return user;
  }

  // --- CLUBS ---
  async listClubs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/clubs/?${query}`);
  }

  async getClub(id) {
    return await this.request(`/clubs/${id}`);
  }

  async createClub(clubData) {
    return await this.request('/clubs/', {
      method: 'POST',
      body: JSON.stringify(clubData)
    });
  }

  async updateClub(id, clubData) {
    return await this.request(`/clubs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clubData)
    });
  }

  async getClubMembers(id) {
    return await this.request(`/clubs/${id}/members`);
  }

  // --- MEMBERSHIPS ---
  async requestMembership(clubId, isPrimary = true) {
    return await this.request('/memberships/request', {
      method: 'POST',
      body: JSON.stringify({ club_id: clubId, is_primary: isPrimary })
    });
  }

  async getMyMemberships() {
    return await this.request('/memberships/my');
  }

  async getPendingMemberships(clubId = null) {
    const query = clubId ? `?club_id=${clubId}` : '';
    return await this.request(`/memberships/pending${query}`);
  }

  async reviewMembership(id, status, reason = null) {
    return await this.request(`/memberships/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, rejection_reason: reason })
    });
  }

  // --- CALENDAR ---
  async listCalendar(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/calendar/?${query}`);
  }

  async importCalendarCsv(file, campusId = null, term = 'Spring 2026') {
    const formData = new FormData();
    formData.append('file', file);
    const query = new URLSearchParams({ term, ...(campusId && { campus_id: campusId }) }).toString();
    return await this.request(`/calendar/import-csv?${query}`, {
      method: 'POST',
      body: formData
    });
  }

  // --- ACTIVITIES (CLUB DAY) ---
  async listActivities(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/activities/?${query}`);
  }

  async getActivity(id) {
    return await this.request(`/activities/${id}`);
  }

  async createActivity(activityData) {
    return await this.request('/activities/', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }

  async submitActivity(id) {
    return await this.request(`/activities/${id}/submit`, {
      method: 'POST'
    });
  }

  async approveActivity(id, status, comments = '') {
    return await this.request(`/activities/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ status, comments })
    });
  }

  // --- ATTENDANCE & ROTATING QR ---
  async createQRSession(activityId, durationMinutes = 45, rotationSeconds = 15) {
    return await this.request('/attendance/session/create', {
      method: 'POST',
      body: JSON.stringify({
        activity_id: activityId,
        duration_minutes: durationMinutes,
        rotation_seconds: rotationSeconds
      })
    });
  }

  async getCurrentQR(activityId) {
    return await this.request(`/attendance/session/${activityId}/current-qr`);
  }

  async checkIn(activityId, token) {
    return await this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ activity_id: activityId, token })
    });
  }

  async getActivityAttendance(activityId) {
    return await this.request(`/attendance/activity/${activityId}`);
  }

  async correctAttendance(attendanceId, correctedStatus, reason) {
    return await this.request(`/attendance/correct/${attendanceId}`, {
      method: 'POST',
      body: JSON.stringify({ corrected_status: correctedStatus, reason })
    });
  }

  // --- SUBMISSIONS ---
  async uploadSubmission(formData) {
    return await this.request('/submissions/upload', {
      method: 'POST',
      body: formData
    });
  }

  async getMySubmissions() {
    return await this.request('/submissions/my');
  }

  async getActivitySubmissions(activityId) {
    return await this.request(`/submissions/activity/${activityId}`);
  }

  // --- EVALUATIONS ---
  async evaluateSubmission(data) {
    return await this.request('/evaluations/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSubmissionEvaluation(submissionId) {
    return await this.request(`/evaluations/submission/${submissionId}`);
  }

  // --- EVENTS & TEAMS ---
  async listEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/events/?${query}`);
  }

  async getEvent(id) {
    return await this.request(`/events/${id}`);
  }

  async createEvent(eventData) {
    return await this.request('/events/', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  async registerEvent(eventId, teamId = null) {
    return await this.request(`/events/${eventId}/register${teamId ? `?team_id=${teamId}` : ''}`, {
      method: 'POST'
    });
  }

  async createEventTeam(eventId, teamData) {
    return await this.request(`/events/${eventId}/teams`, {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
  }

  // --- CERTIFICATES ---
  async issueCertificate(certData) {
    return await this.request('/certificates/issue', {
      method: 'POST',
      body: JSON.stringify(certData)
    });
  }

  async getMyCertificates() {
    return await this.request('/certificates/my');
  }

  async verifyCertificate(certNumber) {
    return await this.request(`/certificates/verify/${certNumber}`);
  }

  getCertificateDownloadUrl(certId) {
    return `${API_BASE}/certificates/download/${certId}`;
  }

  // --- NOTIFICATIONS ---
  async getNotifications() {
    return await this.request('/notifications/');
  }

  async getUnreadNotificationCount() {
    return await this.request('/notifications/unread-count');
  }

  async markNotificationRead(id) {
    return await this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return await this.request('/notifications/read-all', { method: 'POST' });
  }

  // --- REPORTS & TRANSCRIPT ---
  async getDashboardStats() {
    return await this.request('/reports/dashboard-stats');
  }

  async getStudentTranscript(studentId) {
    return await this.request(`/reports/transcript/${studentId}`);
  }

  // --- ATTENDANCE PRESENTER UPDATE ---
  async markPresenter(attendanceId, isPresenter, onTheSpotResult = null) {
    return await this.request(`/attendance/presenter/${attendanceId}`, {
      method: 'POST',
      body: JSON.stringify({
        is_presenter: isPresenter,
        on_the_spot_result: onTheSpotResult
      })
    });
  }

  // --- EXTENDED REPORTS & TRANSCRIPTS ---
  async getMonthlyClubReport(clubId, days = 30) {
    return await this.request(`/reports/monthly-club/${clubId}?days=${days}`);
  }

  async getInactiveClubs(thresholdDays = 30) {
    return await this.request(`/reports/inactive-clubs?threshold_days=${thresholdDays}`);
  }

  async getZeroParticipationStudents(campusId = null) {
    const query = campusId ? `?campus_id=${campusId}` : '';
    return await this.request(`/reports/zero-participation-students${query}`);
  }

  async getTopContributors(limit = 10, campusId = null) {
    const query = campusId ? `?limit=${limit}&campus_id=${campusId}` : `?limit=${limit}`;
    return await this.request(`/reports/top-contributors${query}`);
  }

  async getCampusSummary(campusId) {
    return await this.request(`/reports/campus-summary/${campusId}`);
  }

  getTranscriptPdfUrl(studentId) {
    return `${API_BASE}/reports/transcript/${studentId}/download`;
  }

  getReportCsvExportUrl(reportType = 'clubs') {
    return `${API_BASE}/reports/export/csv?report_type=${reportType}`;
  }
}

window.api = new ApiClient();
