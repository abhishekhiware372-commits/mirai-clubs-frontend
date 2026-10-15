/**
 * Mirai Clubs - Application Controller
 * Handles view routing, state management, modal interactions,
 * rotating QR sessions, and real API integrations.
 */

class AppController {
  constructor() {
    this.currentView = window.api.currentUser ? 'clubs' : 'login';
    this.unreadNotifsCount = 0;
    this.qrPollTimer = null;
    this.currentQrActivityId = null;
    
    // Quick Demo Credentials for the 5 Official Roles
    this.demoAccounts = {
      student: { email: 'alex.chen@student.mirai.edu', pass: 'MiraiDemo#2026', label: 'Alex Chen (Student)' },
      student2: { email: 'priya.patel@student.mirai.edu', pass: 'MiraiDemo#2026', label: 'Priya Patel (Student)' },
      coordinator: { email: 'rohan.coord@mirai.edu.in', pass: 'MiraiDemo#2026', label: 'Rohan Sharma (Coordinator)' },
      advisor: { email: 'advisor.nair@mirai.edu.in', pass: 'MiraiDemo#2026', label: 'Dr. Radha Nair (Advisor)' },
      campus_manager: { email: 'anita.manager@mirai.edu.in', pass: 'MiraiDemo#2026', label: 'Anita Desai (Campus Manager)' },
      admin: { email: 'admin@mirai.edu.in', pass: 'MiraiDemo#2026', label: 'Dr. Vikram Sen (Admin)' }
    };

    this.init();
  }

  async init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // Validate existing session from backend
    if (window.api.token) {
      try {
        await window.api.getMe();
      } catch (e) {
        console.warn('Session expired or invalid, clearing local session');
        window.api.logout();
      }
    }

    this.updateUserNavbar();
    this.loadUnreadNotifs();
    this.handleRouting();
    
    if (window.lucide) window.lucide.createIcons();
  }

  getDashboardForRole(role) {
    switch (role) {
      case 'STUDENT': return 'dashboard-student';
      case 'COORDINATOR': return 'dashboard-coordinator';
      case 'ADVISOR': return 'dashboard-advisor';
      case 'CAMPUS_MANAGER': return 'dashboard-campus-manager';
      case 'ADMIN': return 'dashboard-admin';
      default: return 'login';
    }
  }

  redirectToRoleDashboard() {
    if (!window.api.currentUser) {
      this.navigateTo('login', true);
      return;
    }
    const target = this.getDashboardForRole(window.api.currentUser.role);
    this.navigateTo(target, true);
  }

  async loginAs(roleKey) {
    const creds = this.demoAccounts[roleKey];
    if (!creds) return;
    try {
      const user = await window.api.login(creds.email, creds.pass);
      this.showToast(`Authenticated as ${creds.label}`, 'success');
      this.updateUserNavbar();
      this.loadUnreadNotifs();
      this.redirectToRoleDashboard();
    } catch (err) {
      this.showToast(`Login failed: ${err.message}`, 'error');
    }
  }

  logout() {
    window.api.logout();
    this.unreadNotifsCount = 0;
    this.showToast('You have been signed out.', 'info');
    this.updateUserNavbar();
    this.navigateTo('login', true);
  }

  openAuthModal() {
    this.navigateTo('login');
  }

  async submitGoogleLogin() {
    const input = document.getElementById('google-email-input');
    const errContainer = document.getElementById('login-error-container');
    if (!input || !input.value.trim()) {
      this.showToast('Please enter an institutional email for Google verification', 'error');
      return;
    }
    const email = input.value.trim().toLowerCase();
    try {
      if (errContainer) errContainer.classList.add('hidden');
      const user = await window.api.googleLogin(email);
      this.showToast(`Google authenticated as ${user.full_name} (${user.role})`, 'success');
      this.updateUserNavbar();
      this.loadUnreadNotifs();
      this.redirectToRoleDashboard();
    } catch (err) {
      if (errContainer) {
        errContainer.innerHTML = `
          <div class="flex items-start gap-3">
            <i data-lucide="alert-octagon" class="w-5 h-5 text-rose-400 shrink-0 mt-0.5"></i>
            <div>
              <div class="font-bold text-white mb-1">Access Denied: Account Not Registered</div>
              <p class="leading-relaxed">${err.message}</p>
              <div class="mt-2 text-[11px] text-rose-200/90 font-mono">
                Institutional Policy: Only pre-registered Mirai accounts can access dashboards. Contact Dean of Student Affairs or Campus Administrator to register.
              </div>
            </div>
          </div>
        `;
        errContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
      this.showToast(`Authentication failed: ${err.message}`, 'error');
    }
  }

  async submitCredentialsLogin(e) {
    if (e) e.preventDefault();
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    const errContainer = document.getElementById('login-error-container');
    if (!emailEl || !passEl) return;
    try {
      if (errContainer) errContainer.classList.add('hidden');
      const user = await window.api.login(emailEl.value.trim(), passEl.value);
      this.showToast(`Logged in as ${user.full_name} (${user.role})`, 'success');
      this.updateUserNavbar();
      this.loadUnreadNotifs();
      this.redirectToRoleDashboard();
    } catch (err) {
      if (errContainer) {
        errContainer.innerHTML = `
          <div class="font-bold text-white mb-1">Login Failed</div>
          <div>${err.message}</div>
        `;
        errContainer.classList.remove('hidden');
      }
      this.showToast(`Login failed: ${err.message}`, 'error');
    }
  }

  handleRouting() {
    const hash = window.location.hash.replace('#', '') || (window.api.currentUser ? 'clubs' : 'login');
    const protectedViews = [
      'attendance', 'submissions', 'transcript',
      'dashboard', 'dashboard-student', 'dashboard-coordinator',
      'dashboard-advisor', 'dashboard-campus-manager', 'dashboard-admin'
    ];

    if (protectedViews.includes(hash) && !window.api.currentUser) {
      this.showToast('Please sign in with your registered institutional account to continue.', 'info');
      this.navigateTo('login', false);
      return;
    }

    if (hash === 'dashboard') {
      this.redirectToRoleDashboard();
      return;
    }

    // Role-based route guard
    if (hash.startsWith('dashboard-') && window.api.currentUser) {
      const userRole = window.api.currentUser.role;
      const expected = this.getDashboardForRole(userRole);
      if (hash !== expected && userRole !== 'ADMIN') {
        this.showToast(`Access Denied: Your account role (${userRole}) cannot access this dashboard.`, 'error');
        this.navigateTo(expected, true);
        return;
      }
    }

    const validViews = [
      'login', 'clubs', 'club-days', 'attendance', 'submissions', 'events',
      'transcript', 'verify', 'dashboard-student', 'dashboard-coordinator',
      'dashboard-advisor', 'dashboard-campus-manager', 'dashboard-admin'
    ];

    if (validViews.includes(hash)) {
      this.navigateTo(hash, false);
    } else {
      this.navigateTo(window.api.currentUser ? 'clubs' : 'login', false);
    }
  }

  navigateTo(viewName, updateHash = true) {
    if (this.qrPollTimer) {
      clearInterval(this.qrPollTimer);
      this.qrPollTimer = null;
    }

    this.currentView = viewName;
    if (updateHash) {
      window.location.hash = viewName;
    }

    // Highlight active nav links
    document.querySelectorAll('[data-nav-link]').forEach(el => {
      const target = el.getAttribute('data-nav-link');
      if (target === viewName || (viewName.startsWith('dashboard-') && target === 'dashboard')) {
        el.classList.add('text-sky-400', 'font-bold', 'border-b-2', 'border-sky-400');
        el.classList.remove('text-slate-400');
      } else {
        el.classList.remove('text-sky-400', 'font-bold', 'border-b-2', 'border-sky-400');
        el.classList.add('text-slate-400');
      }
    });

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateUserNavbar() {
    const user = window.api.currentUser;
    const container = document.getElementById('nav-user-container');
    if (!container) return;

    if (!user) {
      container.innerHTML = `
        <button onclick="app.navigateTo('login')" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition shadow-md shadow-sky-500/20 flex items-center gap-1.5">
          <i data-lucide="log-in" class="w-3.5 h-3.5"></i> Sign In
        </button>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const roleBadgeColor = {
      ADMIN: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      CAMPUS_MANAGER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      ADVISOR: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      COORDINATOR: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      STUDENT: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    }[user.role] || 'bg-slate-700 text-slate-300';

    container.innerHTML = `
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Notification Bell -->
        <button onclick="app.toggleNotificationsDropdown()" class="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition" title="Notifications">
          <i data-lucide="bell" class="w-4 h-4"></i>
          <span id="notif-badge" class="${this.unreadNotifsCount > 0 ? '' : 'hidden'} absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
            ${this.unreadNotifsCount}
          </span>
        </button>

        <!-- User Role Console Shortcut -->
        <button onclick="app.redirectToRoleDashboard()" class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-xs text-sky-300 font-semibold transition" title="Go to My Role Console">
          <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i> My Console
        </button>

        <!-- User Profile Pill -->
        <div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            ${user.full_name ? user.full_name.charAt(0) : 'M'}
          </div>
          <div class="text-left hidden sm:block">
            <div class="text-xs font-bold text-white">${user.full_name}</div>
            <div class="text-[10px] text-slate-400 truncate max-w-[120px]">${user.email}</div>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${roleBadgeColor}">
            ${user.role}
          </span>
        </div>

        <!-- Sign Out Button -->
        <button onclick="app.logout()" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition" title="Sign Out">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  async loadUnreadNotifs() {
    if (!window.api.token) return;
    try {
      const data = await window.api.getUnreadNotificationCount();
      this.unreadNotifsCount = data.unread_count || 0;
      const badge = document.getElementById('notif-badge');
      if (badge) {
        if (this.unreadNotifsCount > 0) {
          badge.textContent = this.unreadNotifsCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    } catch (e) {}
  }

  async toggleNotificationsDropdown() {
    const container = document.getElementById('modal-container');
    try {
      const notifs = await window.api.getNotifications();
      await window.api.markAllNotificationsRead();
      this.unreadNotifsCount = 0;
      this.loadUnreadNotifs();

      const listHtml = notifs.length === 0 ? `
        <div class="p-6 text-center text-slate-400 text-xs">No notifications yet.</div>
      ` : notifs.map(n => `
        <div class="p-3 border-b border-slate-800/80 hover:bg-slate-800/40 transition rounded-lg">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-sky-400">${n.title}</span>
            <span class="text-[10px] text-slate-500">${new Date(n.created_at).toLocaleDateString()}</span>
          </div>
          <div class="text-xs text-slate-300 leading-relaxed">${n.message}</div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm" onclick="app.closeModal(event)">
          <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 mt-16" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="bell" class="w-4 h-4 text-sky-400"></i> Notifications
              </h3>
              <button onclick="app.closeModal()" class="text-slate-400 hover:text-white text-xs">✕ Close</button>
            </div>
            <div class="max-h-96 overflow-y-auto mt-2 space-y-1">
              ${listHtml}
            </div>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      this.showToast('Failed to load notifications: ' + err.message, 'error');
    }
  }

  // --- RENDERING ROUTER ---
  async renderCurrentView() {
    const main = document.getElementById('main-content');
    if (!main) return;

    main.innerHTML = `
      <div class="flex items-center justify-center min-h-[50vh]">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-mono text-slate-400">Connecting to PostgreSQL backend...</span>
        </div>
      </div>
    `;

    try {
      switch (this.currentView) {
        case 'login':
          main.innerHTML = this.renderLoginView();
          break;
        case 'clubs':
          main.innerHTML = await this.renderClubsView();
          break;
        case 'club-days':
          main.innerHTML = await this.renderClubDaysView();
          break;
        case 'attendance':
          main.innerHTML = await this.renderAttendanceView();
          break;
        case 'submissions':
          main.innerHTML = await this.renderSubmissionsView();
          break;
        case 'events':
          main.innerHTML = await this.renderEventsView();
          break;
        case 'transcript':
          main.innerHTML = await this.renderTranscriptView();
          break;
        case 'verify':
          main.innerHTML = this.renderVerifyView();
          break;
        case 'dashboard':
        case 'dashboard-student':
        case 'dashboard-coordinator':
        case 'dashboard-advisor':
        case 'dashboard-campus-manager':
        case 'dashboard-admin':
          main.innerHTML = await this.renderDashboardView();
          break;
        default:
          main.innerHTML = await this.renderClubsView();
      }
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      main.innerHTML = `
        <div class="max-w-xl mx-auto my-12 p-8 bg-red-950/20 border border-red-500/30 rounded-2xl text-center">
          <div class="text-red-400 font-bold text-base mb-2">Error Loading View</div>
          <p class="text-xs text-slate-300 mb-4">${err.message}</p>
          <button onclick="app.renderCurrentView()" class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-semibold">
            Retry Request
          </button>
        </div>
      `;
    }
  }

  // 0. SIGN-IN & AUTHENTICATION VIEW
  renderLoginView() {
    return `
      <div class="max-w-xl mx-auto px-4 py-12">
        <div class="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div class="text-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-sky-500/25">
              <i data-lucide="shield-check" class="w-8 h-8"></i>
            </div>
            <h1 class="text-3xl font-black text-white tracking-tight">MIRAI CLUBS</h1>
            <div class="text-xs font-mono text-sky-400 font-semibold tracking-wide mt-1 uppercase">Club Activities Tracker</div>
            <p class="text-xs text-slate-400 mt-2">
              Mirai School of Technology • Official Multi-Campus Co-Curricular Platform
            </p>
          </div>

          <!-- Unregistered / Error Notice Banner -->
          <div id="login-error-container" class="hidden mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs"></div>

          <!-- 1. Google Workspace Sign-In -->
          <div class="mb-6 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Google Workspace Sign-In</span>
            </div>
            <p class="text-[11px] text-slate-400 mb-3">
              Sign in using your institutional Gmail or Mirai email. Only registered profiles are admitted.
            </p>
            <div class="flex flex-col sm:flex-row gap-2">
              <input id="google-email-input" type="email" placeholder="e.g. alex.chen@student.mirai.edu" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 outline-none" />
              <button onclick="app.submitGoogleLogin()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition shadow">
                Verify & Sign In
              </button>
            </div>
          </div>

          <div class="relative flex py-2 items-center mb-6">
            <div class="flex-grow border-t border-slate-800"></div>
            <span class="flex-shrink mx-4 text-slate-500 text-[10px] font-mono uppercase tracking-widest">Or Institutional Password</span>
            <div class="flex-grow border-t border-slate-800"></div>
          </div>

          <!-- 2. Password Sign-In -->
          <form onsubmit="app.submitCredentialsLogin(event)" class="space-y-4 mb-8">
            <div>
              <label class="block text-xs font-mono text-slate-300 font-semibold mb-1">Institutional Email</label>
              <input id="login-email" type="email" required placeholder="name@mirai.edu.in" class="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-mono text-slate-300 font-semibold mb-1">Password</label>
              <input id="login-password" type="password" required placeholder="••••••••" class="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 outline-none" />
            </div>
            <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-sky-500/25">
              Sign In to Dashboard
            </button>
          </form>

          <!-- 3. Pre-Configured Official Demo Roles Selector -->
          <div class="border-t border-slate-800 pt-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Demo Quick Access (5 Roles):</span>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">All Tested</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-left">
              <button onclick="app.loginAs('student')" class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-sky-500/30 text-xs text-sky-300 font-semibold transition flex items-center gap-2">
                <span>🎓</span>
                <div class="truncate">
                  <div class="font-bold text-white text-[11px]">Alex Chen</div>
                  <div class="text-[10px] text-sky-400 font-mono">STUDENT</div>
                </div>
              </button>
              <button onclick="app.loginAs('student2')" class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-sky-500/30 text-xs text-sky-300 font-semibold transition flex items-center gap-2">
                <span>🎓</span>
                <div class="truncate">
                  <div class="font-bold text-white text-[11px]">Priya Patel</div>
                  <div class="text-[10px] text-sky-400 font-mono">STUDENT</div>
                </div>
              </button>
              <button onclick="app.loginAs('coordinator')" class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 text-xs text-amber-300 font-semibold transition flex items-center gap-2">
                <span>⚡</span>
                <div class="truncate">
                  <div class="font-bold text-white text-[11px]">Rohan Sharma</div>
                  <div class="text-[10px] text-amber-400 font-mono">COORDINATOR</div>
                </div>
              </button>
              <button onclick="app.loginAs('advisor')" class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-purple-500/30 text-xs text-purple-300 font-semibold transition flex items-center gap-2">
                <span>🔬</span>
                <div class="truncate">
                  <div class="font-bold text-white text-[11px]">Dr. Radha Nair</div>
                  <div class="text-[10px] text-purple-400 font-mono">ADVISOR</div>
                </div>
              </button>
              <button onclick="app.loginAs('campus_manager')" class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 text-xs text-emerald-300 font-semibold transition flex items-center gap-2">
                <span>🏛️</span>
                <div class="truncate">
                  <div class="font-bold text-white text-[11px]">Anita Desai</div>
                  <div class="text-[10px] text-emerald-400 font-mono">CAMPUS MANAGER</div>
                </div>
              </button>
              <button onclick="app.loginAs('admin')" class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-rose-500/30 text-xs text-rose-300 font-semibold transition flex items-center gap-2">
                <span>🛡️</span>
                <div class="truncate">
                  <div class="font-bold text-white text-[11px]">Dr. Vikram Sen</div>
                  <div class="text-[10px] text-rose-400 font-mono">ADMIN / DEAN</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 1. CLUBS DIRECTORY VIEW
  async renderClubsView() {
    const clubs = await window.api.listClubs();
    const myMemberships = window.api.token ? await window.api.getMyMemberships().catch(() => []) : [];
    const myClubMap = {};
    myMemberships.forEach(m => { myClubMap[m.club_id] = m.status; });

    const selectedCampus = this.selectedCampusFilter || 'ALL';
    const filteredClubs = selectedCampus === 'ALL'
      ? clubs
      : clubs.filter(c => (c.campus_code === selectedCampus || c.campus_id === selectedCampus || (c.campus_name && c.campus_name.toLowerCase().includes(selectedCampus.toLowerCase()))));

    const cardsHtml = filteredClubs.map(club => {
      const memStatus = myClubMap[club.id];
      let actionBtn = '';
      if (memStatus === 'APPROVED') {
        actionBtn = `<span class="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">Member (Active)</span>`;
      } else if (memStatus === 'PENDING') {
        actionBtn = `<span class="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/30">Request Pending</span>`;
      } else {
        actionBtn = `
          <button onclick="app.openJoinClubModal('${club.id}', '${club.name}')" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition shadow-md shadow-sky-500/20">
            Request to Join
          </button>
        `;
      }

      return `
        <div class="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-sky-500/40 transition">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                ${club.category}
              </span>
              <span class="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <i data-lucide="users" class="w-3.5 h-3.5"></i> ${club.member_count} / ${club.capacity}
              </span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${club.name}</h3>
            <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">${club.description}</p>
            
            <div class="space-y-1.5 text-xs text-slate-400 mb-6 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div class="flex items-center gap-2">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>${club.campus_name || 'Main Campus'}</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="user-check" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>Advisor: ${club.advisor_name || 'Assigned Directorate'}</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-500"></i>
                <span class="truncate">${club.meeting_rules || 'Regular Club Day Sessions'}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-800">
            <span class="text-[11px] text-slate-500 font-mono">Capacity: ${Math.round((club.member_count / club.capacity) * 100)}% filled</span>
            ${actionBtn}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-slate-800/80">
          <div>
            <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase mb-1">Central University Registry</div>
            <h1 class="text-3xl font-black text-white tracking-tight">Active Student Clubs</h1>
            <p class="text-sm text-slate-400 mt-1 max-w-xl">
              Browse approved co-curricular clubs across Mirai School of Technology campuses. Enrol in up to 2 clubs per academic term.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-400 font-mono">Filter Campus:</label>
              <select onchange="app.filterClubsByCampus(this.value)" class="bg-slate-900 border border-slate-800 text-xs text-sky-300 font-semibold rounded-xl px-3 py-2 outline-none focus:border-sky-500">
                <option value="ALL" ${selectedCampus === 'ALL' ? 'selected' : ''}>All Campuses (${clubs.length} Clubs)</option>
                <option value="MST-BLR" ${selectedCampus === 'MST-BLR' ? 'selected' : ''}>Bangalore (MST-BLR)</option>
                <option value="MST-NCR" ${selectedCampus === 'MST-NCR' ? 'selected' : ''}>Noida / NCR (MST-NCR)</option>
                <option value="MST-HYD" ${selectedCampus === 'MST-HYD' ? 'selected' : ''}>Hyderabad (MST-HYD)</option>
                <option value="MST-PUN" ${selectedCampus === 'MST-PUN' ? 'selected' : ''}>Pune (MST-PUN)</option>
              </select>
            </div>
            <span class="text-xs font-mono text-slate-400 hidden sm:inline">Showing: <b class="text-white">${filteredClubs.length}</b></span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${cardsHtml.length > 0 ? cardsHtml : '<div class="col-span-3 p-8 text-center text-slate-400 text-xs">No clubs found for this campus filter.</div>'}
        </div>
      </div>
    `;
  }

  filterClubsByCampus(campusCode) {
    this.selectedCampusFilter = campusCode;
    this.renderCurrentView();
  }

  openJoinClubModal(clubId, clubName) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onclick="app.closeModal(event)">
        <div class="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <h3 class="text-lg font-bold text-white mb-2">Request Membership</h3>
          <p class="text-xs text-slate-400 mb-6">Submit membership request for <b class="text-sky-400">${clubName}</b>. Subject to coordinator review and term capacity limits.</p>

          <form onsubmit="app.submitMembershipRequest(event, '${clubId}')" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2">Club Designation Priority</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-sky-500/50">
                  <input type="radio" name="is_primary" value="true" checked class="text-sky-500" />
                  <span class="text-xs font-bold text-white">Primary Club</span>
                </label>
                <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-sky-500/50">
                  <input type="radio" name="is_primary" value="false" class="text-sky-500" />
                  <span class="text-xs font-bold text-slate-300">Secondary Club</span>
                </label>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" onclick="app.closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white">Submit Request</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async submitMembershipRequest(e, clubId) {
    e.preventDefault();
    const isPrimary = e.target.is_primary.value === 'true';
    try {
      await window.api.requestMembership(clubId, isPrimary);
      this.closeModal();
      this.showToast('Membership request submitted successfully for coordinator review!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // 2. CLUB DAYS & ACTIVITIES VIEW
  async renderClubDaysView() {
    const activities = await window.api.listActivities();
    const calendar = await window.api.listCalendar().catch(() => []);
    const user = window.api.currentUser;
    const isCoordinator = user && (user.role === 'COORDINATOR' || user.role === 'ADMIN');
    const isAdvisor = user && (user.role === 'ADVISOR' || user.role === 'ADMIN');

    const activitiesHtml = activities.map(act => {
      let actions = '';
      if (isCoordinator && act.status === 'DRAFT') {
        actions = `
          <button onclick="app.submitActivityPlan('${act.id}')" class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold">
            Submit for Approval
          </button>
        `;
      } else if (isAdvisor && act.status === 'SUBMITTED') {
        actions = `
          <div class="flex items-center gap-2">
            <button onclick="app.reviewActivityPlan('${act.id}', 'APPROVED')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold">
              Approve
            </button>
            <button onclick="app.reviewActivityPlan('${act.id}', 'REJECTED')" class="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold">
              Reject
            </button>
          </div>
        `;
      } else if (act.status === 'APPROVED') {
        actions = `
          <a href="#attendance" onclick="app.navigateTo('attendance')" class="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-1.5">
            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> Check-in Session
          </a>
        `;
      }

      const statusBadge = {
        APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        SUBMITTED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        DRAFT: 'bg-slate-700 text-slate-300 border-slate-600',
        COMPLETED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      }[act.status] || 'bg-slate-700 text-slate-300';

      return `
        <div class="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${statusBadge} border">
                ${act.status}
              </span>
              <span class="text-xs text-sky-400 font-bold font-mono">${act.club_name}</span>
            </div>
            <span class="text-xs text-slate-400 font-mono">
              ${new Date(act.start_time).toLocaleDateString()} • ${new Date(act.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h3 class="text-base font-bold text-white mb-2">${act.topic}</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-4">${act.description}</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 mb-4">
            <div><b class="text-slate-500 block text-[10px] uppercase">Venue</b>${act.venue}</div>
            <div><b class="text-slate-500 block text-[10px] uppercase">Deliverable</b>${act.deliverable || 'None'}</div>
            <div><b class="text-slate-500 block text-[10px] uppercase">Submission Deadline</b>${act.submission_deadline ? new Date(act.submission_deadline).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <span class="text-xs text-slate-500">Advisor: ${act.advisor_name || 'Assigned'}</span>
            ${actions}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-slate-800/80">
          <div>
            <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase mb-1">Academic Calendar & Planning</div>
            <h1 class="text-3xl font-black text-white tracking-tight">Club Day Activity Planner</h1>
            <p class="text-sm text-slate-400 mt-1 max-w-xl">
              Coordinators submit 7-day activity plans. Faculty advisors review and approve deliverable standards.
            </p>
          </div>
          <div class="flex items-center gap-3">
            ${(user && (user.role === 'ADMIN' || user.role === 'CAMPUS_MANAGER' || user.role === 'COORDINATOR')) ? `
              <button onclick="app.openImportCalendarModal()" class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition">
                <i data-lucide="upload" class="w-4 h-4 text-sky-400"></i> Import Calendar CSV
              </button>
            ` : ''}
            ${isCoordinator ? `
              <button onclick="app.openNewActivityModal()" class="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20">
                <i data-lucide="plus" class="w-4 h-4"></i> Create Activity Plan
              </button>
            ` : ''}
          </div>
        </div>

        <div class="space-y-4">
          ${activitiesHtml || '<div class="p-8 text-center text-slate-400 text-xs">No activity plans currently scheduled.</div>'}
        </div>
      </div>
    `;
  }

  openImportCalendarModal() {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onclick="app.closeModal(event)">
        <div class="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <h3 class="text-base font-bold text-white mb-1">Import Academic Calendar CSV</h3>
          <p class="text-xs text-slate-400 mb-4">Upload an institutional CSV schedule of official Club Day dates.</p>

          <form onsubmit="app.submitCalendarCsv(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Academic Term</label>
              <input type="text" name="term" value="Spring 2026" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Select CSV File</label>
              <input type="file" name="file" accept=".csv" required class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30" />
              <p class="text-[10px] text-slate-500 mt-1">Columns expected: date (YYYY-MM-DD), start_time, end_time, description</p>
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onclick="app.closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white">Import Schedule</button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  async submitCalendarCsv(e) {
    e.preventDefault();
    const file = e.target.file.files[0];
    const term = e.target.term.value;
    if (!file) return;
    try {
      const res = await window.api.importCalendarCsv(file, null, term);
      this.closeModal();
      this.showToast(`Imported ${res.imported_count || 'calendar'} Club Day dates successfully!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async submitActivityPlan(actId) {
    try {
      await window.api.submitActivity(actId);
      this.showToast('Activity submitted for Faculty Advisor approval!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async reviewActivityPlan(actId, status) {
    try {
      await window.api.approveActivity(actId, status, 'Reviewed according to collegiate rubric.');
      this.showToast(`Activity successfully marked as ${status}!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // 3. ATTENDANCE & ROTATING QR CODES VIEW
  async renderAttendanceView() {
    const activities = await window.api.listActivities();
    const approvedActivities = activities.filter(a => a.status === 'APPROVED' || a.status === 'COMPLETED');
    const user = window.api.currentUser;
    const isCoordinator = user && (user.role === 'COORDINATOR' || user.role === 'ADMIN');

    if (approvedActivities.length === 0) {
      return `
        <div class="max-w-3xl mx-auto px-4 py-16 text-center">
          <div class="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-sky-400">
            <i data-lucide="qr-code" class="w-8 h-8"></i>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">No Active Attendance Sessions</h2>
          <p class="text-xs text-slate-400">There are no approved Club Day activities ready for check-in right now.</p>
        </div>
      `;
    }

    const defaultAct = approvedActivities[0];
    this.currentQrActivityId = defaultAct.id;

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="mb-10 pb-6 border-b border-slate-800/80">
          <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase mb-1">High-Integrity Verification</div>
          <h1 class="text-3xl font-black text-white tracking-tight">Rotating QR Attendance Check-In</h1>
          <p class="text-sm text-slate-400 mt-1 max-w-xl">
            Cryptographic 15-second rotating HMAC tokens prevent proxy check-ins and enforce attendance integrity.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- LEFT: COORDINATOR BROADCAST PANEL -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="projector" class="w-5 h-5 text-sky-400"></i> Coordinator Live Display
              </h2>
              <span class="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">15s Rotation Engine</span>
            </div>

            <div class="mb-4">
              <label class="block text-xs font-semibold text-slate-300 mb-2">Select Activity</label>
              <select id="qr-activity-select" onchange="app.changeQrActivity(this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                ${approvedActivities.map(a => `<option value="${a.id}">${a.topic} (${a.club_name})</option>`).join('')}
              </select>
            </div>

            <div class="flex gap-2 mb-6">
              <button onclick="app.startQrSession()" class="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition flex items-center justify-center gap-2">
                <i data-lucide="play" class="w-4 h-4"></i> Open 45-Min Session
              </button>
            </div>

            <!-- Dynamic QR Box -->
            <div id="qr-display-box" class="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center min-h-[300px]">
              <div class="text-xs text-slate-400 mb-2">Click "Open 45-Min Session" to generate live rotating QR tokens.</div>
            </div>
          </div>

          <!-- RIGHT: STUDENT CHECK-IN & RECENT AUDIT -->
          <div class="space-y-6">
            <div class="glass-panel rounded-2xl p-6 border border-slate-800">
              <h2 class="text-base font-bold text-white flex items-center gap-2 mb-4">
                <i data-lucide="scan" class="w-5 h-5 text-emerald-400"></i> Student Check-In Scanner
              </h2>
              <p class="text-xs text-slate-400 mb-4">
                Enter the live rotating token displayed on the coordinator screen (or simulated scan) to register your attendance.
              </p>

              <form onsubmit="app.submitStudentCheckIn(event)" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">15-Second Token</label>
                  <input type="text" id="checkin-token-input" placeholder="e.g. 11952044-8f2a1b9c3e" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono" />
                </div>
                <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition flex items-center justify-center gap-2">
                  <i data-lucide="check-circle" class="w-4 h-4"></i> Submit Check-In
                </button>
              </form>

              <div id="checkin-result-badge" class="mt-4 hidden p-3 rounded-xl text-xs font-bold text-center"></div>
            </div>

            <!-- ATTENDANCE ROSTER FOR THIS ACTIVITY -->
            <div class="glass-panel rounded-2xl p-6 border border-slate-800">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-white">Live Attendance Roster</h3>
                <button onclick="app.refreshAttendanceRoster()" class="text-xs text-sky-400 hover:underline">Refresh</button>
              </div>
              <div id="attendance-roster-list" class="max-h-48 overflow-y-auto space-y-2 text-xs">
                <div class="text-slate-500 text-center py-4">Click "Refresh" to view attendees.</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  async changeQrActivity(actId) {
    this.currentQrActivityId = actId;
    if (this.qrPollTimer) {
      clearInterval(this.qrPollTimer);
      this.qrPollTimer = null;
    }
    const box = document.getElementById('qr-display-box');
    box.innerHTML = `<div class="text-xs text-slate-400">Activity selected. Click "Open Session" to start.</div>`;
  }

  async startQrSession() {
    try {
      await window.api.createQRSession(this.currentQrActivityId, 45, 15);
      this.showToast('Attendance window opened! Starting 15s token rotation...', 'success');
      this.pollQrCode();
      if (this.qrPollTimer) clearInterval(this.qrPollTimer);
      this.qrPollTimer = setInterval(() => this.pollQrCode(), 3000);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async pollQrCode() {
    const box = document.getElementById('qr-display-box');
    if (!box) return;
    try {
      const data = await window.api.getCurrentQR(this.currentQrActivityId);
      box.innerHTML = `
        <div class="bg-white p-3 rounded-2xl shadow-xl mb-3">
          <img src="${data.qr_code_data}" alt="Attendance QR Code" class="w-48 h-48 mx-auto" />
        </div>
        <div class="text-xs font-mono font-bold text-sky-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 mb-2">
          Token: ${data.token}
        </div>
        <div class="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
          <div class="bg-sky-400 h-full transition-all" style="width: ${(data.seconds_remaining / 15) * 100}%"></div>
        </div>
        <div class="text-[11px] text-slate-400 font-mono">Rotating in ${data.seconds_remaining}s (Window: 15s)</div>
      `;
      // Auto-fill student input for one-click demo testing convenience
      const tokenInput = document.getElementById('checkin-token-input');
      if (tokenInput && !tokenInput.value) {
        tokenInput.value = data.token;
      }
    } catch (err) {
      box.innerHTML = `<div class="text-xs text-amber-400">Session closed or inactive.</div>`;
    }
  }

  async submitStudentCheckIn(e) {
    e.preventDefault();
    const token = document.getElementById('checkin-token-input').value.trim();
    const badge = document.getElementById('checkin-result-badge');
    badge.className = 'mt-4 p-3 rounded-xl text-xs font-bold text-center';
    
    try {
      const res = await window.api.checkIn(this.currentQrActivityId, token);
      if (res.status === 'SUCCESS') {
        badge.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/30');
        badge.textContent = `SUCCESS: Attendance recorded on-time! (ID: ${res.attendance_id.slice(0, 8)})`;
      } else if (res.status === 'LATE_CHECK_IN') {
        badge.classList.add('bg-amber-500/20', 'text-amber-300', 'border', 'border-amber-500/30');
        badge.textContent = `LATE_CHECK_IN: Recorded as late arrival.`;
      } else if (res.status === 'ALREADY_CHECKED_IN') {
        badge.classList.add('bg-sky-500/20', 'text-sky-300', 'border', 'border-sky-500/30');
        badge.textContent = `ALREADY_CHECKED_IN: Attendance was previously verified.`;
      }
      badge.classList.remove('hidden');
      this.refreshAttendanceRoster();
    } catch (err) {
      badge.classList.add('bg-rose-500/20', 'text-rose-300', 'border', 'border-rose-500/30');
      badge.textContent = err.message;
      badge.classList.remove('hidden');
    }
  }

  async refreshAttendanceRoster() {
    const list = document.getElementById('attendance-roster-list');
    try {
      const records = await window.api.getActivityAttendance(this.currentQrActivityId);
      if (records.length === 0) {
        list.innerHTML = `<div class="text-slate-500 text-center py-4">0 attendees recorded so far.</div>`;
        return;
      }
      list.innerHTML = records.map(r => {
        const presenterBadge = r.is_presenter
          ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Presenter${r.on_the_spot_result ? `: ${r.on_the_spot_result}` : ''}</span>`
          : '';
        const escapedResult = (r.on_the_spot_result || '').replace(/'/g, "\\'");
        return `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div>
            <div class="font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>${r.user_name} (${r.student_id || 'ID'})</span>
              ${presenterBadge}
            </div>
            <div class="text-[10px] text-slate-500 font-mono">${new Date(r.checked_in_at).toLocaleTimeString()} • ${r.method}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}">
              ${r.status}
            </span>
            <button onclick="app.openPresenterModal('${r.id}', '${r.user_name.replace(/'/g, "\\'")}', ${r.is_presenter ? 'true' : 'false'}, '${escapedResult}')" class="text-[10px] text-purple-400 hover:underline">Presenter</button>
            <button onclick="app.openCorrectionModal('${r.id}', '${r.user_name.replace(/'/g, "\\'")}', '${r.status}')" class="text-[10px] text-sky-400 hover:underline">Correct</button>
          </div>
        </div>
      `;
      }).join('');
    } catch (err) {
      list.innerHTML = `<div class="text-rose-400 text-center py-2">${err.message}</div>`;
    }
  }

  openPresenterModal(attendanceId, userName, currentIsPresenter, currentResult) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onclick="app.closeModal(event)">
        <div class="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <h3 class="text-base font-bold text-white mb-1">Session Presenter & Recognition</h3>
          <p class="text-xs text-slate-400 mb-4">Record presentation delivery and on-the-spot recognition for <b>${userName}</b>.</p>

          <form onsubmit="app.submitPresenterUpdate(event, '${attendanceId}')" class="space-y-4">
            <div>
              <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-purple-500/50">
                <input type="checkbox" name="is_presenter" value="true" ${currentIsPresenter ? 'checked' : ''} class="w-4 h-4 rounded text-purple-500 bg-slate-900" />
                <span class="text-xs font-bold text-white">Delivered Presentation / Pitch</span>
              </label>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">On-The-Spot Result / Recognition (Optional)</label>
              <input type="text" name="on_the_spot_result" value="${currentResult || ''}" placeholder="e.g. Best Technical Demo, Top Pitch, Runner-Up" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onclick="app.closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white">Save Presenter Status</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async submitPresenterUpdate(e, attId) {
    e.preventDefault();
    const isPresenter = e.target.is_presenter.checked;
    const result = e.target.on_the_spot_result.value.trim() || null;
    try {
      await window.api.markPresenter(attId, isPresenter, result);
      this.closeModal();
      this.showToast('Presenter and recognition record updated!', 'success');
      this.refreshAttendanceRoster();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openCorrectionModal(attendanceId, userName, currentStatus) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onclick="app.closeModal(event)">
        <div class="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <h3 class="text-base font-bold text-white mb-1">Manual Attendance Correction</h3>
          <p class="text-xs text-slate-400 mb-4">Audited override for <b>${userName}</b> (Current: ${currentStatus}).</p>

          <form onsubmit="app.submitAttendanceCorrection(event, '${attendanceId}')" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">New Status</label>
              <select name="status" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                <option value="PRESENT">PRESENT</option>
                <option value="EXCUSED">EXCUSED (Medical / Duty Leave)</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Audit Reason (Required)</label>
              <textarea name="reason" required placeholder="e.g. Approved University Duty Leave for Hackathon presentation" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-20"></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onclick="app.closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950">Record Correction</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async submitAttendanceCorrection(e, attId) {
    e.preventDefault();
    const status = e.target.status.value;
    const reason = e.target.reason.value;
    try {
      await window.api.correctAttendance(attId, status, reason);
      this.closeModal();
      this.showToast('Attendance correction recorded with immutable audit trail!', 'success');
      this.refreshAttendanceRoster();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // 4. SUBMISSIONS & EVALUATIONS VIEW
  async renderSubmissionsView() {
    const activities = await window.api.listActivities();
    const mySubmissions = await window.api.getMySubmissions().catch(() => []);
    const user = window.api.currentUser;
    const isEvaluator = user && (user.role === 'COORDINATOR' || user.role === 'ADVISOR' || user.role === 'ADMIN');

    let evaluatorListHtml = '';
    if (isEvaluator && activities.length > 0) {
      const actSubmissions = await window.api.getActivitySubmissions(activities[0].id).catch(() => []);
      evaluatorListHtml = `
        <div class="glass-panel rounded-2xl p-6 border border-slate-800 mb-8">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="check-square" class="w-5 h-5 text-amber-400"></i> Evaluator Scoring Console
            </h2>
            <span class="text-xs text-slate-400">Activity: <b>${activities[0].topic}</b></span>
          </div>

          <div class="space-y-3">
            ${actSubmissions.length === 0 ? '<div class="text-slate-500 text-xs text-center py-4">No submissions received for this activity yet.</div>' : actSubmissions.map(s => `
              <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div class="font-bold text-white text-sm">${s.title}</div>
                  <div class="text-xs text-slate-400">Submitted by: <b class="text-slate-300">${s.user_name}</b> (${s.student_id})</div>
                  <div class="text-[11px] text-sky-400 font-mono mt-1"><a href="${s.external_link || '#'}" target="_blank" class="hover:underline">${s.external_link || s.file_name}</a></div>
                </div>
                <button onclick="app.openEvaluationModal('${s.id}', '${s.title}', '${s.user_name}')" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">
                  Score Rubric (3 Criteria)
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="mb-10 pb-6 border-b border-slate-800/80">
          <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase mb-1">Deliverables & Grading</div>
          <h1 class="text-3xl font-black text-white tracking-tight">Activity Submissions & Rubrics</h1>
          <p class="text-sm text-slate-400 mt-1 max-w-xl">
            Upload workshop presentations, assignments, and repositories. Evaluators score against Content, Presentation, and Participation rubrics.
          </p>
        </div>

        ${evaluatorListHtml}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- UPLOAD FORM -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 class="text-base font-bold text-white mb-4 flex items-center gap-2">
              <i data-lucide="upload" class="w-4 h-4 text-sky-400"></i> Upload Deliverable
            </h3>

            <form onsubmit="app.submitStudentDeliverable(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Target Activity</label>
                <select name="activity_id" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                  ${activities.map(a => `<option value="${a.id}">${a.topic} (Due: ${a.submission_deadline ? new Date(a.submission_deadline).toLocaleDateString() : 'Rolling'})</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Project / Deliverable Title</label>
                <input type="text" name="title" required placeholder="e.g. Distributed SLAM Drone Telemetry" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">External Link (GitHub, Figma, Slides)</label>
                <input type="url" name="external_link" placeholder="https://github.com/..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Or Upload File (PDF, PPT, ZIP up to 25MB)</label>
                <input type="file" name="file" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400" />
              </div>

              <button type="submit" class="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition">
                Submit Deliverable
              </button>
            </form>
          </div>

          <!-- STUDENT PAST SUBMISSIONS -->
          <div class="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 class="text-base font-bold text-white mb-4">My Submitted Deliverables</h3>
            <div class="space-y-3">
              ${mySubmissions.length === 0 ? '<div class="text-slate-500 text-xs py-8 text-center">You have not submitted deliverables yet.</div>' : mySubmissions.map(s => `
                <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] font-mono text-sky-400 font-bold uppercase">${s.activity_topic}</span>
                    <h4 class="text-sm font-bold text-white">${s.title}</h4>
                    <span class="text-xs text-slate-400">Submitted ${new Date(s.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${s.status === 'EVALUATED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}">
                      ${s.status}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async submitStudentDeliverable(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await window.api.uploadSubmission(formData);
      this.showToast('Deliverable stored in PostgreSQL and server storage!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openEvaluationModal(submissionId, subTitle, studentName) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onclick="app.closeModal(event)">
        <div class="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <h3 class="text-base font-bold text-white mb-1">Evaluate Submission</h3>
          <p class="text-xs text-slate-400 mb-4">Scoring <b>${subTitle}</b> by <b>${studentName}</b>.</p>

          <form onsubmit="app.submitEvaluation(event, '${submissionId}')" class="space-y-4">
            <div>
              <div class="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>1. Content & Technical Rigor (0-10)</span>
                <span id="score-val-1" class="font-mono text-sky-400">9.0</span>
              </div>
              <input type="range" name="crit1" min="0" max="10" step="0.5" value="9.0" oninput="document.getElementById('score-val-1').textContent=this.value" class="w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>2. Presentation & Clarity (0-10)</span>
                <span id="score-val-2" class="font-mono text-sky-400">8.5</span>
              </div>
              <input type="range" name="crit2" min="0" max="10" step="0.5" value="8.5" oninput="document.getElementById('score-val-2').textContent=this.value" class="w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>3. Participation & Timeliness (0-10)</span>
                <span id="score-val-3" class="font-mono text-sky-400">10.0</span>
              </div>
              <input type="range" name="crit3" min="0" max="10" step="0.5" value="10.0" oninput="document.getElementById('score-val-3').textContent=this.value" class="w-full" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Feedback Comments</label>
              <textarea name="feedback" required placeholder="Detailed engineering and rubric feedback for the student..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-20">Exceptional engineering rigor and clear live prototype execution.</textarea>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onclick="app.closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950">Publish Evaluation</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async submitEvaluation(e, submissionId) {
    e.preventDefault();
    const c1 = parseFloat(e.target.crit1.value);
    const c2 = parseFloat(e.target.crit2.value);
    const c3 = parseFloat(e.target.crit3.value);
    const feedback = e.target.feedback.value;

    const payload = {
      submission_id: submissionId,
      feedback: feedback,
      is_published: true,
      criteria: [
        { name: 'Content & Technical Rigor', score: c1, max_score: 10.0 },
        { name: 'Presentation & Clarity', score: c2, max_score: 10.0 },
        { name: 'Participation & Timeliness', score: c3, max_score: 10.0 }
      ]
    };

    try {
      await window.api.evaluateSubmission(payload);
      this.closeModal();
      this.showToast('Evaluation scores and feedback published to student!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // 5. CAMPUS EVENTS & TEAMS VIEW
  async renderEventsView() {
    const events = await window.api.listEvents();

    const eventsHtml = events.map(ev => `
      <div class="glass-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between">
        ${ev.banner_url ? `<img src="${ev.banner_url}" class="w-full h-44 object-cover border-b border-slate-800" alt="${ev.title}">` : ''}
        <div class="p-6">
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 font-mono">
              ${ev.event_type}
            </span>
            <span class="text-xs font-bold text-amber-400">${ev.prize_pool || 'Trophies & Grants'}</span>
          </div>

          <h3 class="text-lg font-bold text-white mb-2">${ev.title}</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-4">${ev.description}</p>

          <div class="space-y-1.5 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 mb-6">
            <div><b class="text-slate-500">Venue:</b> ${ev.venue}</div>
            <div><b class="text-slate-500">Dates:</b> ${new Date(ev.start_time).toLocaleDateString()} - ${new Date(ev.end_time).toLocaleDateString()}</div>
            <div><b class="text-slate-500">Team Size:</b> ${ev.team_size_min} to ${ev.team_size_max} Students</div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-800">
            <span class="text-xs font-mono text-slate-400">${ev.registration_count} / ${ev.max_participants} registered</span>
            <button onclick="app.openEventRegisterModal('${ev.id}', '${ev.title}')" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/20">
              Register Team
            </button>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="mb-10 pb-6 border-b border-slate-800/80">
          <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase mb-1">Inter-Campus Competitions</div>
          <h1 class="text-3xl font-black text-white tracking-tight">Campus Events & Hackathons</h1>
          <p class="text-sm text-slate-400 mt-1 max-w-xl">
            Flagship hackathons, symposia, and inter-campus engineering tournaments with online team formation.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${eventsHtml}
        </div>
      </div>
    `;
  }

  openEventRegisterModal(eventId, eventTitle) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onclick="app.closeModal(event)">
        <div class="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <h3 class="text-base font-bold text-white mb-1">Register for Event</h3>
          <p class="text-xs text-slate-400 mb-4">${eventTitle}</p>

          <form onsubmit="app.submitEventRegistration(event, '${eventId}')" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Team Name</label>
              <input type="text" name="team_name" placeholder="e.g. Quantum Pioneers" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Teammate Student Email (Optional)</label>
              <input type="email" name="teammate_email" placeholder="priya.patel@student.mirai.edu" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onclick="app.closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white">Confirm Registration</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async submitEventRegistration(e, eventId) {
    e.preventDefault();
    const teamName = e.target.team_name.value.trim();
    const teammate = e.target.teammate_email.value.trim();
    try {
      await window.api.createEventTeam(eventId, {
        name: teamName,
        member_emails: teammate ? [teammate] : []
      });
      this.closeModal();
      this.showToast('Team formed and registered successfully for the event!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // 6. CO-CURRICULAR TRANSCRIPT VIEW
  async renderTranscriptView() {
    const user = window.api.currentUser;
    const studentId = user?.student_id || 'MST-2026-CS101';
    const transcript = await window.api.getStudentTranscript(studentId);

    const clubsList = transcript.clubs.map(c => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div class="font-bold text-white text-xs">${c.club_name}</div>
          <div class="text-[10px] text-slate-400">Enrolled: ${c.joined_date}</div>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-400 font-bold">${c.role}</span>
      </div>
    `).join('');

    const certsList = transcript.certificates.map(c => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div class="font-bold text-white text-xs">${c.title}</div>
          <div class="text-[10px] text-slate-400">ID: ${c.certificate_number} • ${c.issue_date}</div>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">${c.cert_type}</span>
      </div>
    `).join('');

    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase mb-1">Student Record of Achievement</div>
            <h1 class="text-3xl font-black text-white tracking-tight">Co-Curricular Transcript</h1>
            <p class="text-xs text-slate-400 mt-1">Directly integrated with the university database and Placement Readiness Copilot.</p>
          </div>
          <div class="flex items-center gap-2">
            <a href="${window.api.getTranscriptPdfUrl(studentId)}" target="_blank" download="Mirai_Transcript_${studentId}.pdf" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition">
              <i data-lucide="file-down" class="w-4 h-4"></i> Official PDF Download
            </a>
            <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center gap-2 border border-slate-700 transition">
              <i data-lucide="printer" class="w-4 h-4"></i> Print Record
            </button>
          </div>
        </div>

        <!-- TRANSCRIPT CARD -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
          <!-- Institutional Header -->
          <div class="text-center pb-6 border-b border-slate-800 mb-6">
            <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">Mirai School of Technology</div>
            <h2 class="text-xl font-black text-white mt-1">OFFICIAL CO-CURRICULAR TRANSCRIPT</h2>
            <div class="text-[10px] text-slate-500 mt-1 font-mono">${transcript.institutional_verification}</div>
          </div>

          <!-- Student Profile Box -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs mb-8">
            <div><b class="text-slate-500 block text-[10px] uppercase">Student Name</b><span class="font-bold text-white">${transcript.student.name}</span></div>
            <div><b class="text-slate-500 block text-[10px] uppercase">Mains / Roll ID</b><span class="font-mono text-sky-400 font-bold">${transcript.student.student_id}</span></div>
            <div><b class="text-slate-500 block text-[10px] uppercase">Department</b><span class="text-slate-300">${transcript.student.department}</span></div>
            <div><b class="text-slate-500 block text-[10px] uppercase">Campus</b><span class="text-slate-300">${transcript.student.campus}</span></div>
          </div>

          <!-- Section 1: Memberships -->
          <div class="mb-6">
            <h3 class="text-xs font-mono uppercase font-bold text-slate-400 mb-3 tracking-wider">1. Enrolled Club Memberships</h3>
            <div class="space-y-2">${clubsList || '<div class="text-xs text-slate-500">None recorded.</div>'}</div>
          </div>

          <!-- Section 2: Attendance -->
          <div class="mb-6">
            <h3 class="text-xs font-mono uppercase font-bold text-slate-400 mb-3 tracking-wider">2. Club Day Session Attendance (${transcript.attendances.length} Sessions)</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              ${transcript.attendances.map(a => `
                <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span class="text-white font-medium truncate">${a.activity_topic}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded font-bold ${a.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}">${a.status}</span>
                </div>
              `).join('') || '<div class="text-xs text-slate-500">No attendance records.</div>'}
            </div>
          </div>

          <!-- Section 3: Issued Certificates -->
          <div>
            <h3 class="text-xs font-mono uppercase font-bold text-slate-400 mb-3 tracking-wider">3. Verified Certificates & Honors</h3>
            <div class="space-y-2">${certsList || '<div class="text-xs text-slate-500">No certificates awarded yet.</div>'}</div>
          </div>
        </div>
      </div>
    `;
  }

  // 7. PUBLIC CERTIFICATE VERIFICATION VIEW
  renderVerifyView() {
    return `
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center mb-10">
          <div class="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-4">
            <i data-lucide="shield-check" class="w-8 h-8"></i>
          </div>
          <div class="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase mb-1">Public Trust Registry</div>
          <h1 class="text-3xl font-black text-white tracking-tight">Certificate Authenticity Verification</h1>
          <p class="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Input any unique Certificate ID generated by Mirai School of Technology to verify cryptographic signature and issuance records.
          </p>
        </div>

        <div class="glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl mb-8">
          <form onsubmit="app.verifyCertificatePublic(event)" class="flex flex-col sm:flex-row gap-3">
            <input type="text" id="verify-input-id" value="MST-CERT-2026-88201" placeholder="e.g. MST-CERT-2026-88201" required class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white" />
            <button type="submit" class="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition">
              Verify Record
            </button>
          </form>
        </div>

        <div id="verify-result-container"></div>
      </div>
    `;
  }

  async verifyCertificatePublic(e) {
    e.preventDefault();
    const id = document.getElementById('verify-input-id').value.trim();
    const container = document.getElementById('verify-result-container');
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">Verifying signature...</div>`;

    try {
      const res = await window.api.verifyCertificate(id);
      if (res.is_valid) {
        container.innerHTML = `
          <div class="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-slate-200 shadow-xl">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</div>
              <div>
                <div class="text-[10px] font-mono uppercase text-emerald-400 font-bold">Official Credential Verified</div>
                <h3 class="text-base font-bold text-white">${res.title}</h3>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono mb-4">
              <div><b class="text-slate-500 block">Recipient:</b>${res.student_name}</div>
              <div><b class="text-slate-500 block">Certificate ID:</b>${res.certificate_number}</div>
              <div><b class="text-slate-500 block">Type:</b>${res.cert_type}</div>
              <div><b class="text-slate-500 block">Issue Date:</b>${res.issue_date}</div>
            </div>
            <div class="text-[11px] text-slate-400">Issued by: <b>${res.issuer}</b></div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-slate-200 shadow-xl text-center">
            <div class="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2 font-bold">✕</div>
            <h3 class="text-sm font-bold text-white mb-1">Verification Failed</h3>
            <p class="text-xs text-slate-400">${res.tamper_detected ? 'Tamper Alert: Cryptographic signature mismatch detected.' : 'No record matching this certificate ID exists in the central registry.'}</p>
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-center text-xs text-rose-400">${err.message}</div>`;
    }
  }

  // 8. ROLE-SPECIFIC DASHBOARDS
  async renderDashboardView() {
    const statsData = await window.api.getDashboardStats();
    const user = window.api.currentUser;
    if (!user) {
      this.navigateTo('login');
      return '';
    }

    // Determine target role from currentView (if admin is inspecting) or user.role
    let effectiveRole = user.role;
    if (this.currentView === 'dashboard-student') effectiveRole = 'STUDENT';
    else if (this.currentView === 'dashboard-coordinator') effectiveRole = 'COORDINATOR';
    else if (this.currentView === 'dashboard-advisor') effectiveRole = 'ADVISOR';
    else if (this.currentView === 'dashboard-campus-manager') effectiveRole = 'CAMPUS_MANAGER';
    else if (this.currentView === 'dashboard-admin') effectiveRole = 'ADMIN';

    switch (effectiveRole) {
      case 'STUDENT':
        return await this.renderStudentDashboard(statsData);
      case 'COORDINATOR':
        return await this.renderCoordinatorDashboard(statsData);
      case 'ADVISOR':
        return await this.renderAdvisorDashboard(statsData);
      case 'CAMPUS_MANAGER':
        return await this.renderCampusManagerDashboard(statsData);
      case 'ADMIN':
      default:
        return await this.renderAdminDashboard(statsData);
    }
  }

  // --- 8.1 STUDENT DASHBOARD ---
  async renderStudentDashboard(statsData) {
    const user = window.api.currentUser;
    const stats = statsData.stats || {};
    const [myMemberships, mySubmissions, myCerts, activities] = await Promise.all([
      window.api.getMyMemberships().catch(() => []),
      window.api.getMySubmissions().catch(() => []),
      window.api.getMyCertificates().catch(() => []),
      window.api.listActivities().catch(() => [])
    ]);

    const activeMemberships = myMemberships.filter(m => m.status === 'APPROVED');
    const upcomingActivities = activities.filter(a => a.status === 'APPROVED' || a.status === 'PLANNED').slice(0, 4);

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <!-- Student Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                STUDENT CONSOLE • ${user.campus_name || 'Bangalore Campus'}
              </span>
              <span class="text-xs text-slate-500 font-mono">${user.student_id || user.email}</span>
            </div>
            <h1 class="text-3xl font-black text-white tracking-tight">Welcome back, ${user.full_name}</h1>
            <p class="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Official Institutional Record: View your club memberships, verify session attendances, track deliverable submissions, and download your verified co-curricular transcript.
            </p>
          </div>
          <!-- Download Transcript Action -->
          <div class="flex items-center gap-3">
            <a href="${window.api.getTranscriptPdfUrl(user.id)}" target="_blank" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 transition">
              <i data-lucide="file-text" class="w-4 h-4"></i> Official Transcript PDF
            </a>
          </div>
        </div>

        <!-- Student KPI Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Active Clubs</span>
              <i data-lucide="compass" class="w-4 h-4 text-sky-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${activeMemberships.length} <span class="text-xs text-slate-500 font-normal">/ 2 max</span></div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Sessions Attended</span>
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.sessions_attended ?? 0}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Submissions</span>
              <i data-lucide="file-check" class="w-4 h-4 text-purple-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.submissions_completed ?? mySubmissions.length}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Certificates</span>
              <i data-lucide="award" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.certificates_earned ?? myCerts.length}</div>
          </div>
        </div>

        <!-- Quick Access Hub -->
        <div class="glass-panel rounded-2xl p-4 border border-slate-800/80 mb-8 flex flex-wrap items-center justify-between gap-3">
          <span class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Quick Actions:</span>
          <div class="flex flex-wrap items-center gap-2">
            <a href="#attendance" onclick="app.navigateTo('attendance')" class="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-300 hover:text-white font-semibold transition flex items-center gap-1.5">
              <i data-lucide="qr-code" class="w-3.5 h-3.5 text-sky-400"></i> QR Check-In
            </a>
            <a href="#submissions" onclick="app.navigateTo('submissions')" class="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-300 hover:text-white font-semibold transition flex items-center gap-1.5">
              <i data-lucide="upload" class="w-3.5 h-3.5 text-indigo-400"></i> Submit Deliverable
            </a>
            <a href="#clubs" onclick="app.navigateTo('clubs')" class="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-300 hover:text-white font-semibold transition flex items-center gap-1.5">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-emerald-400"></i> Browse Clubs
            </a>
            <a href="#verify" onclick="app.navigateTo('verify')" class="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-300 hover:text-white font-semibold transition flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-amber-400"></i> Verify Certificate
            </a>
          </div>
        </div>

        <!-- Two Column Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- My Club Memberships -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="users" class="w-4 h-4 text-sky-400"></i> My Enrolled Clubs
              </h2>
              <span class="text-[10px] font-mono text-slate-400">Limit: 2 Clubs (1 Primary, 1 Secondary)</span>
            </div>
            <div class="space-y-3">
              ${myMemberships.map(m => `
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-bold text-white text-xs">${m.club_name || 'Enrolled Club'}</span>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold ${m.is_primary ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' : 'bg-slate-800 text-slate-400'}">
                        ${m.is_primary ? 'PRIMARY' : 'SECONDARY'}
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-500 font-mono">Role: ${m.role} • Applied: ${new Date(m.requested_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${m.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}">
                      ${m.status === 'APPROVED' ? 'Active Member' : 'Pending Review'}
                    </span>
                  </div>
                </div>
              `).join('') || `
                <div class="p-8 text-center text-slate-500 text-xs">
                  You are not enrolled in any clubs yet.<br>
                  <a href="#clubs" onclick="app.navigateTo('clubs')" class="text-sky-400 font-bold hover:underline mt-2 inline-block">Explore Clubs Directory →</a>
                </div>
              `}
            </div>
          </div>

          <!-- Earned Certificates -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> Earned Certificates & Badges
              </h2>
              <span class="text-[10px] font-mono text-amber-400">Cryptographically Verified</span>
            </div>
            <div class="space-y-3">
              ${myCerts.map(c => `
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div class="font-bold text-white text-xs mb-1">${c.title}</div>
                    <div class="text-[10px] font-mono text-slate-400">${c.certificate_number} • ${new Date(c.issued_at).toLocaleDateString()}</div>
                    <div class="text-[10px] font-mono text-sky-400/80 mt-1 truncate max-w-xs">Hash: ${c.verification_hash ? c.verification_hash.substring(0, 16) + '...' : 'Tamper-Evident'}</div>
                  </div>
                  <a href="${window.api.getCertificateDownloadUrl(c.id)}" target="_blank" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> PDF
                  </a>
                </div>
              `).join('') || `
                <div class="p-8 text-center text-slate-500 text-xs">
                  No certificates earned yet. Attend Club Day sessions and submit deliverables to earn certified credentials.
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Upcoming Club Day Sessions -->
        <div class="glass-panel rounded-2xl p-6 border border-slate-800">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4 text-sky-400"></i> Upcoming Club Day Activities
            </h2>
            <a href="#club-days" onclick="app.navigateTo('club-days')" class="text-xs text-sky-400 font-bold hover:underline">View All Sessions →</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${upcomingActivities.map(a => `
              <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/20">${a.club_name}</span>
                    <span class="text-[10px] font-mono text-slate-400">${new Date(a.start_time).toLocaleDateString()}</span>
                  </div>
                  <h3 class="text-xs font-bold text-white mb-1">${a.topic}</h3>
                  <p class="text-[11px] text-slate-400 line-clamp-2 mb-3">${a.description}</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                  <span class="text-slate-500 font-mono">Venue: ${a.venue || 'Campus Lab'}</span>
                  <a href="#attendance" onclick="app.navigateTo('attendance')" class="text-sky-400 font-bold hover:underline flex items-center gap-1">
                    Check-In <i data-lucide="arrow-right" class="w-3 h-3"></i>
                  </a>
                </div>
              </div>
            `).join('') || '<div class="col-span-2 p-6 text-center text-slate-500 text-xs">No upcoming activities currently scheduled.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  // --- 8.2 COORDINATOR DASHBOARD ---
  async renderCoordinatorDashboard(statsData) {
    const user = window.api.currentUser;
    const stats = statsData.stats || {};
    const [pendingMemberships, activities] = await Promise.all([
      window.api.getPendingMemberships().catch(() => []),
      window.api.listActivities().catch(() => [])
    ]);

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <!-- Coordinator Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                COORDINATOR OPERATIONS CONSOLE • ${user.club_name || 'Nexcell Club'}
              </span>
              <span class="text-xs text-slate-500 font-mono">${user.email}</span>
            </div>
            <h1 class="text-3xl font-black text-white tracking-tight">Club Day Management Console</h1>
            <p class="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Mobile-optimized coordinator workflows: One-click membership review, 7-day activity plan submission for Faculty Advisor sign-off, and rotating 15s attendance QR broadcasting.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="app.openNewActivityModal()" class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition">
              <i data-lucide="plus" class="w-4 h-4"></i> Plan Club Day Session
            </button>
            <a href="#attendance" onclick="app.navigateTo('attendance')" class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2 transition">
              <i data-lucide="qr-code" class="w-4 h-4"></i> Launch QR Code
            </a>
          </div>
        </div>

        <!-- Coordinator KPI Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Club Members</span>
              <i data-lucide="users" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.total_club_members ?? 0}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Pending Requests</span>
              <i data-lucide="user-plus" class="w-4 h-4 text-rose-400"></i>
            </div>
            <div class="text-3xl font-black ${pendingMemberships.length > 0 ? 'text-rose-400' : 'text-white'}">${pendingMemberships.length}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Total Activities</span>
              <i data-lucide="calendar" class="w-4 h-4 text-sky-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.total_activities ?? activities.length}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Draft Plans</span>
              <i data-lucide="file-edit" class="w-4 h-4 text-yellow-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.draft_activities ?? activities.filter(a => a.status === 'DRAFT').length}</div>
          </div>
        </div>

        <!-- Pending Membership Approvals (Critical Coordinator Responsibility) -->
        <div class="glass-panel rounded-2xl p-6 border border-slate-800 mb-8">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="user-check" class="w-4 h-4 text-amber-400"></i> Membership Applications Queue (${pendingMemberships.length})
              </h2>
              ${pendingMemberships.length > 0 ? '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">Requires Action</span>' : ''}
            </div>
            <span class="text-[10px] font-mono text-slate-400">One-Click Approval / Rejection</span>
          </div>

          ${pendingMemberships.length === 0 ? `
            <div class="p-8 text-center text-slate-500 text-xs">
              <i data-lucide="check-circle" class="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60"></i>
              No pending membership applications. All student requests have been processed!
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="text-[10px] text-slate-500 uppercase font-mono border-b border-slate-800/60">
                  <tr>
                    <th class="pb-2.5">Student</th>
                    <th class="pb-2.5">Student ID</th>
                    <th class="pb-2.5">Priority</th>
                    <th class="pb-2.5">Applied Date</th>
                    <th class="pb-2.5 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/40">
                  ${pendingMemberships.map(m => `
                    <tr class="hover:bg-slate-900/40 transition">
                      <td class="py-3">
                        <div class="font-bold text-white">${m.user_name || 'Applicant'}</div>
                        <div class="text-[10px] text-slate-500 font-mono">${m.user_email}</div>
                      </td>
                      <td class="py-3 font-mono text-slate-400">${m.student_id || 'MSOT-STU'}</td>
                      <td class="py-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${m.is_primary ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' : 'bg-slate-800 text-slate-400'}">
                          ${m.is_primary ? 'PRIMARY' : 'SECONDARY'}
                        </span>
                      </td>
                      <td class="py-3 text-slate-400 font-mono">${new Date(m.requested_at).toLocaleDateString()}</td>
                      <td class="py-3 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button onclick="app.approveMembership('${m.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">
                            Approve
                          </button>
                          <button onclick="app.rejectMembership('${m.id}')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Club Day Activity Management Pipeline -->
        <div class="glass-panel rounded-2xl p-6 border border-slate-800">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4 text-sky-400"></i> Club Day Activity Pipeline & 7-Day Plans
            </h2>
            <button onclick="app.openNewActivityModal()" class="text-xs text-amber-400 font-bold hover:underline">+ New Session</button>
          </div>
          <div class="space-y-3">
            ${activities.map(act => {
              let actionHtml = '';
              if (act.status === 'DRAFT') {
                actionHtml = `
                  <button onclick="app.submitActivityPlan('${act.id}')" class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition">
                    Submit for Advisor Sign-off
                  </button>
                `;
              } else if (act.status === 'APPROVED') {
                actionHtml = `
                  <a href="#attendance" onclick="app.navigateTo('attendance')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5">
                    <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> Launch QR Code
                  </a>
                `;
              } else if (act.status === 'SUBMITTED') {
                actionHtml = `<span class="px-2.5 py-1 rounded text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20">Awaiting Advisor Sign-off</span>`;
              }

              const badgeColor = {
                APPROVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                SUBMITTED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
                COMPLETED: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
              }[act.status] || 'bg-slate-800 text-slate-300';

              return `
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}">${act.status}</span>
                      <span class="font-bold text-white text-xs">${act.topic}</span>
                    </div>
                    <div class="text-[11px] text-slate-400 font-mono">
                      Venue: ${act.venue || 'Campus Lab'} • Date: ${new Date(act.start_time).toLocaleDateString()} • Deliverable: ${act.deliverable || 'None'}
                    </div>
                  </div>
                  <div class="shrink-0">
                    ${actionHtml}
                  </div>
                </div>
              `;
            }).join('') || '<div class="p-6 text-center text-slate-500 text-xs">No Club Day activities planned. Click "Plan Club Day Session" above to start.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  // --- 8.3 ADVISOR DASHBOARD ---
  async renderAdvisorDashboard(statsData) {
    const user = window.api.currentUser;
    const stats = statsData.stats || {};
    const activities = await window.api.listActivities().catch(() => []);
    const submittedPlans = activities.filter(a => a.status === 'SUBMITTED');

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <!-- Advisor Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                FACULTY ADVISOR CONSOLE • ${user.club_name || 'Nexcell / Bangalore'}
              </span>
              <span class="text-xs text-slate-500 font-mono">${user.email}</span>
            </div>
            <h1 class="text-3xl font-black text-white tracking-tight">Faculty Academic Oversight</h1>
            <p class="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Official 7-day Club Day sign-offs, student deliverable evaluation using the 3-criteria rubric (Content, Presentation, Participation), and club activity compliance.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <a href="#submissions" onclick="app.navigateTo('submissions')" class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 transition">
              <i data-lucide="check-square" class="w-4 h-4"></i> Evaluation Console
            </a>
          </div>
        </div>

        <!-- Advisor KPI Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Plans Awaiting Sign-off</span>
              <i data-lucide="file-check" class="w-4 h-4 text-purple-400"></i>
            </div>
            <div class="text-3xl font-black ${submittedPlans.length > 0 ? 'text-purple-400' : 'text-white'}">${submittedPlans.length}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Approved Activities</span>
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.approved_activities ?? activities.filter(a => a.status === 'APPROVED').length}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Sessions Advised</span>
              <i data-lucide="calendar" class="w-4 h-4 text-sky-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${activities.length}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Certificates Issued</span>
              <i data-lucide="award" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.issued_certificates ?? 0}</div>
          </div>
        </div>

        <!-- Activity Plans Awaiting 7-Day Approval -->
        <div class="glass-panel rounded-2xl p-6 border border-slate-800 mb-8">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="clock" class="w-4 h-4 text-purple-400"></i> 7-Day Activity Plans Awaiting Sign-off (${submittedPlans.length})
              </h2>
              ${submittedPlans.length > 0 ? '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300">Action Required</span>' : ''}
            </div>
            <span class="text-[10px] font-mono text-slate-400">7-Day Lead-Time Compliance</span>
          </div>

          ${submittedPlans.length === 0 ? `
            <div class="p-8 text-center text-slate-500 text-xs">
              <i data-lucide="shield-check" class="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60"></i>
              No activity plans currently awaiting advisor sign-off. All submitted plans have been reviewed!
            </div>
          ` : `
            <div class="space-y-4">
              ${submittedPlans.map(act => `
                <div class="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div class="space-y-1.5">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20">SUBMITTED</span>
                      <h3 class="font-bold text-white text-sm">${act.topic}</h3>
                    </div>
                    <p class="text-xs text-slate-400 max-w-xl">${act.description}</p>
                    <div class="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                      <span>Venue: <b class="text-slate-300">${act.venue || 'Campus Lab'}</b></span>
                      <span>Scheduled: <b class="text-slate-300">${new Date(act.start_time).toLocaleDateString()}</b></span>
                      <span>Deliverable: <b class="text-purple-300">${act.deliverable || 'Standard Project'}</b></span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button onclick="app.reviewActivityPlan('${act.id}', 'APPROVED')" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20">
                      Approve Plan
                    </button>
                    <button onclick="app.reviewActivityPlan('${act.id}', 'REJECTED')" class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition">
                      Request Changes
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Rubric Grading Standards Card -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <h2 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <i data-lucide="scale" class="w-4 h-4 text-purple-400"></i> Collegiate 3-Criteria Rubric
            </h2>
            <p class="text-xs text-slate-400 leading-relaxed mb-4">
              All student deliverable submissions are graded according to institutional standards:
            </p>
            <div class="space-y-2.5 text-xs">
              <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div class="font-bold text-white">1. Content & Technical Rigor (0-10)</div>
                <div class="text-[11px] text-slate-400">Depth of solution, technical complexity, and architectural correctness.</div>
              </div>
              <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div class="font-bold text-white">2. Presentation & Clarity (0-10)</div>
                <div class="text-[11px] text-slate-400">Documentation clarity, code hygiene, and live demonstration effectiveness.</div>
              </div>
              <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div class="font-bold text-white">3. Participation & Timeliness (0-10)</div>
                <div class="text-[11px] text-slate-400">Punctuality of submission and engagement in Club Day peer discussions.</div>
              </div>
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <h2 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <i data-lucide="check-square" class="w-4 h-4 text-emerald-400"></i> Evaluate Student Deliverables
              </h2>
              <p class="text-xs text-slate-400 leading-relaxed mb-4">
                Open the evaluation console to inspect GitHub repos, uploaded PDFs, and live demo links submitted by student club members.
              </p>
              <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 mb-4">
                Evaluations update the student's verified transcript and trigger automatic certificate qualification when meeting credit milestones.
              </div>
            </div>
            <a href="#submissions" onclick="app.navigateTo('submissions')" class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs text-center transition shadow-lg shadow-purple-500/25">
              Launch Submissions & Rubrics Console →
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // --- 8.4 CAMPUS MANAGER DASHBOARD ---
  async renderCampusManagerDashboard(statsData) {
    const user = window.api.currentUser;
    const stats = statsData.stats || {};
    const [inactiveClubs, zeroStudents, topContributors, allClubs] = await Promise.all([
      window.api.getInactiveClubs(30).catch(() => []),
      window.api.getZeroParticipationStudents(user.campus_id).catch(() => []),
      window.api.getTopContributors(5, user.campus_id).catch(() => []),
      window.api.listClubs().catch(() => [])
    ]);

    const campusClubs = allClubs.filter(c => c.campus_id === user.campus_id || c.campus_code === user.campus_code);

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <!-- Campus Manager Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                CAMPUS MANAGER CONSOLE • ${statsData.campus_name || user.campus_name || 'Bangalore Campus'}
              </span>
              <span class="text-xs text-slate-500 font-mono">${user.email}</span>
            </div>
            <h1 class="text-3xl font-black text-white tracking-tight">Campus Operations & Oversight</h1>
            <p class="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Oversight of campus clubs, monitoring attendance integrity, proactive zero-participation alerts for student affairs outreach, and official academic CSV exports.
            </p>
          </div>
          <!-- CSV Export Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <a href="${window.api.getReportCsvExportUrl('clubs')}" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold hover:text-white transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-400"></i> Clubs CSV
            </a>
            <a href="${window.api.getReportCsvExportUrl('attendance')}" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold hover:text-white transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-3.5 h-3.5 text-sky-400"></i> Attendance CSV
            </a>
            <a href="${window.api.getReportCsvExportUrl('inactive_clubs')}" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold hover:text-white transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-3.5 h-3.5 text-rose-400"></i> Inactive Clubs CSV
            </a>
          </div>
        </div>

        <!-- Campus Manager KPI Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Campus Students</span>
              <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.campus_students ?? '50+'}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Campus Clubs</span>
              <i data-lucide="compass" class="w-4 h-4 text-sky-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.campus_clubs ?? campusClubs.length}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Campus Sessions</span>
              <i data-lucide="calendar" class="w-4 h-4 text-purple-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.campus_activities ?? 0}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Total Check-Ins</span>
              <i data-lucide="check-circle-2" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.campus_attendances ?? 0}</div>
          </div>
        </div>

        <!-- Campus Clubs Health & Monthly Audit Inspector -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Campus Clubs Table -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="building" class="w-4 h-4 text-emerald-400"></i> Campus Clubs Status
              </h2>
              <span class="text-[10px] font-mono text-slate-400">${statsData.campus_name || 'Bangalore'}</span>
            </div>
            <div class="space-y-3">
              ${(campusClubs.length > 0 ? campusClubs : allClubs.slice(0, 2)).map(c => `
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-bold text-white text-xs">${c.name}</span>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/20">${c.category}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 font-mono">Advisor: ${c.advisor_name || 'Assigned'} • Capacity: ${c.member_count} / ${c.capacity}</div>
                  </div>
                  <div>
                    <span class="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Monthly Health Audit Inspector -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="file-check" class="w-4 h-4 text-sky-400"></i> Monthly Club Health Audit
              </h2>
              <span class="text-[10px] font-mono text-sky-400">30-Day Window</span>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-2">Select Club to Audit</label>
                <div class="flex gap-2">
                  <select id="monthly-club-select" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                    ${allClubs.map(c => `<option value="${c.id}">${c.name} (${c.campus_code || 'MST'})</option>`).join('')}
                  </select>
                  <button onclick="app.inspectMonthlyClubHealth()" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">
                    Audit
                  </button>
                </div>
              </div>
              <div id="monthly-health-result" class="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                <span class="text-slate-500">Select a club above and click "Audit" to generate instant monthly metrics.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance & Intervention Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Inactive Clubs Alert -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400"></i> Inactive Clubs Alert (${inactiveClubs.length})
              </h2>
              <span class="text-[10px] font-mono text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">0 sessions in 30d</span>
            </div>
            <div class="overflow-x-auto max-h-56 overflow-y-auto">
              <table class="w-full text-xs text-left">
                <thead class="text-[10px] text-slate-500 uppercase font-mono border-b border-slate-800/60">
                  <tr>
                    <th class="pb-2">Club</th>
                    <th class="pb-2">Campus</th>
                    <th class="pb-2">Advisor</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/40">
                  ${inactiveClubs.map(ic => `
                    <tr class="hover:bg-slate-900/40">
                      <td class="py-2.5 font-bold text-slate-200">${ic.club_name}</td>
                      <td class="py-2.5 text-slate-400 font-mono">${ic.campus_code || ic.campus_id}</td>
                      <td class="py-2.5 text-slate-400 text-[11px]">${ic.advisor_name || 'Assigned'}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="py-4 text-center text-emerald-400">All registered clubs are currently compliant!</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Zero-Participation Students Watchlist -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="user-x" class="w-4 h-4 text-amber-400"></i> Zero-Participation Students (${zeroStudents.length})
              </h2>
              <span class="text-[10px] font-mono text-slate-400">Needs Advisor Outreach</span>
            </div>
            <div class="overflow-x-auto max-h-56 overflow-y-auto">
              <table class="w-full text-xs text-left">
                <thead class="text-[10px] text-slate-500 uppercase font-mono border-b border-slate-800/60">
                  <tr>
                    <th class="pb-2">Student</th>
                    <th class="pb-2">Department</th>
                    <th class="pb-2">Campus</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/40">
                  ${zeroStudents.map(zs => `
                    <tr class="hover:bg-slate-900/40">
                      <td class="py-2.5">
                        <div class="font-bold text-white">${zs.name}</div>
                        <div class="text-[10px] text-slate-500 font-mono">${zs.email}</div>
                      </td>
                      <td class="py-2.5 text-slate-400">${zs.department}</td>
                      <td class="py-2.5 text-slate-400 font-mono">${zs.campus_code || 'Main'}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="py-4 text-center text-emerald-400">100% of campus students have logged participation!</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- 8.5 ADMIN DASHBOARD ---
  async renderAdminDashboard(statsData) {
    const user = window.api.currentUser;
    const stats = statsData.stats || {};
    const [inactiveClubs, zeroStudents, topContributors, allClubs] = await Promise.all([
      window.api.getInactiveClubs(30).catch(() => []),
      window.api.getZeroParticipationStudents().catch(() => []),
      window.api.getTopContributors(5).catch(() => []),
      window.api.listClubs().catch(() => [])
    ]);

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <!-- Admin Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                SYSTEM ADMINISTRATOR & DEAN CONSOLE • ALL CAMPUSES
              </span>
              <span class="text-xs text-slate-500 font-mono">${user.email}</span>
            </div>
            <h1 class="text-3xl font-black text-white tracking-tight">Institution-Wide Governance</h1>
            <p class="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              University-level governance: Strictly enforcing the 4 official clubs across all 4 campuses, tamper-evident certificate audits, engagement leaderboards, and academic CSV exports.
            </p>
          </div>
          <!-- Full Academic CSV Export Suite -->
          <div class="flex flex-wrap items-center gap-2">
            <a href="${window.api.getReportCsvExportUrl('clubs')}" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold hover:text-white transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-3.5 h-3.5 text-sky-400"></i> Clubs CSV
            </a>
            <a href="${window.api.getReportCsvExportUrl('attendance')}" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold hover:text-white transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-400"></i> Attendance CSV
            </a>
            <a href="${window.api.getReportCsvExportUrl('inactive_clubs')}" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold hover:text-white transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-3.5 h-3.5 text-rose-400"></i> Inactive Clubs CSV
            </a>
          </div>
        </div>

        <!-- Admin KPI Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Official Clubs</span>
              <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div class="text-3xl font-black text-white">4 <span class="text-xs text-emerald-400 font-mono font-semibold">Strict Limit</span></div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Campuses</span>
              <i data-lucide="map-pin" class="w-4 h-4 text-sky-400"></i>
            </div>
            <div class="text-3xl font-black text-white">4 <span class="text-xs text-slate-500 font-mono">BLR/NOI/PUN/HYD</span></div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Total Check-Ins</span>
              <i data-lucide="check-circle-2" class="w-4 h-4 text-indigo-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.total_attendances ?? 0}</div>
          </div>
          <div class="glass-card rounded-2xl p-5 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono uppercase mb-2">
              <span>Registered Students</span>
              <i data-lucide="users" class="w-4 h-4 text-rose-400"></i>
            </div>
            <div class="text-3xl font-black text-white">${stats.registered_students ?? '50+'}</div>
          </div>
        </div>

        <!-- Official 4 Clubs Health Monitor (Strict Enforcement) -->
        <div class="glass-panel rounded-2xl p-6 border border-slate-800 mb-8">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="check-square" class="w-4 h-4 text-sky-400"></i> Official 4-Club Multi-Campus Registry
              </h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Strictly 4 Clubs Policy</span>
            </div>
            <span class="text-[10px] font-mono text-slate-400">Enforced via DB & API Constraint</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="text-[10px] text-slate-500 uppercase font-mono border-b border-slate-800/60">
                <tr>
                  <th class="pb-2.5">Official Club</th>
                  <th class="pb-2.5">Campus</th>
                  <th class="pb-2.5">Category</th>
                  <th class="pb-2.5">Faculty Advisor</th>
                  <th class="pb-2.5">Capacity</th>
                  <th class="pb-2.5 text-right">Compliance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                ${allClubs.map(c => {
                  const isInactive = inactiveClubs.some(ic => ic.club_id === c.id);
                  return `
                    <tr class="hover:bg-slate-900/40 transition">
                      <td class="py-3 font-bold text-white">${c.name}</td>
                      <td class="py-3 text-slate-400 font-mono">${c.campus_code || c.campus_id}</td>
                      <td class="py-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/20">${c.category}</span>
                      </td>
                      <td class="py-3 text-slate-300">${c.advisor_name || 'Assigned'}</td>
                      <td class="py-3 text-slate-400 font-mono">${c.member_count} / ${c.capacity}</td>
                      <td class="py-3 text-right">
                        <span class="px-2.5 py-1 rounded text-[10px] font-mono font-bold ${isInactive ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}">
                          ${isInactive ? 'INACTIVE (0 sessions / 30d)' : 'ACTIVE / COMPLIANT'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Contributors Leaderboard & Inactive Clubs Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Top Student Contributors -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> Top Student Contributors
              </h2>
              <span class="text-[10px] font-mono text-slate-400">Weighted Engagement Points</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="text-[10px] text-slate-500 uppercase font-mono border-b border-slate-800/60">
                  <tr>
                    <th class="pb-2">Rank</th>
                    <th class="pb-2">Student</th>
                    <th class="pb-2">Campus</th>
                    <th class="pb-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/40">
                  ${topContributors.map((tc, idx) => `
                    <tr class="hover:bg-slate-900/40">
                      <td class="py-2.5 font-mono text-slate-400">#${idx + 1}</td>
                      <td class="py-2.5">
                        <div class="font-bold text-white">${tc.student_name}</div>
                        <div class="text-[10px] text-slate-500 font-mono">${tc.student_id}</div>
                      </td>
                      <td class="py-2.5 text-slate-400">${tc.campus_code}</td>
                      <td class="py-2.5 text-right font-mono font-bold text-sky-400">${tc.points} pts</td>
                    </tr>
                  `).join('') || '<tr><td colspan="4" class="py-4 text-center text-slate-500">No activity points calculated yet.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Inactive Clubs Alert -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400"></i> Inactive Clubs Alert (${inactiveClubs.length})
              </h2>
              <span class="text-[10px] font-mono text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">0 sessions in 30d</span>
            </div>
            <div class="overflow-x-auto max-h-60 overflow-y-auto">
              <table class="w-full text-xs text-left">
                <thead class="text-[10px] text-slate-500 uppercase font-mono border-b border-slate-800/60">
                  <tr>
                    <th class="pb-2">Club</th>
                    <th class="pb-2">Campus</th>
                    <th class="pb-2">Advisor</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/40">
                  ${inactiveClubs.map(ic => `
                    <tr class="hover:bg-slate-900/40">
                      <td class="py-2.5 font-bold text-slate-200">${ic.club_name}</td>
                      <td class="py-2.5 text-slate-400">${ic.campus_code || ic.campus_id}</td>
                      <td class="py-2.5 text-slate-400 text-[11px]">${ic.advisor_name || 'Assigned'}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="py-4 text-center text-emerald-400">All registered clubs are currently compliant!</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Zero Participation Watchlist & Monthly Club Health Audit Inspector -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Zero Participation Students -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="user-x" class="w-4 h-4 text-amber-400"></i> Zero-Participation Registry (${zeroStudents.length})
              </h2>
              <span class="text-[10px] font-mono text-slate-400">Needs Advisor Outreach</span>
            </div>
            <div class="overflow-x-auto max-h-60 overflow-y-auto">
              <table class="w-full text-xs text-left">
                <thead class="text-[10px] text-slate-500 uppercase font-mono border-b border-slate-800/60">
                  <tr>
                    <th class="pb-2">Student</th>
                    <th class="pb-2">Department</th>
                    <th class="pb-2">Campus</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/40">
                  ${zeroStudents.map(zs => `
                    <tr class="hover:bg-slate-900/40">
                      <td class="py-2">
                        <div class="font-bold text-white">${zs.name}</div>
                        <div class="text-[10px] text-slate-500 font-mono">${zs.email}</div>
                      </td>
                      <td class="py-2 text-slate-400">${zs.department}</td>
                      <td class="py-2 text-slate-400">${zs.campus_code || 'Main'}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="py-4 text-center text-emerald-400">100% of students have logged participation!</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Monthly Health Audit Inspector -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="file-check" class="w-4 h-4 text-sky-400"></i> Monthly Club Health Audit
              </h2>
              <span class="text-[10px] font-mono text-sky-400">30-Day Window</span>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-2">Select Club to Inspect</label>
                <div class="flex gap-2">
                  <select id="monthly-club-select" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                    ${allClubs.map(c => `<option value="${c.id}">${c.name} (${c.campus_code || 'MST'})</option>`).join('')}
                  </select>
                  <button onclick="app.inspectMonthlyClubHealth()" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition">
                    Audit
                  </button>
                </div>
              </div>
              <div id="monthly-health-result" class="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                <span class="text-slate-500">Select a club above and click "Audit" to generate instant monthly metrics.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- COORDINATOR MEMBERSHIP ACTIONS ---
  async approveMembership(id) {
    try {
      await window.api.reviewMembership(id, 'APPROVED');
      this.showToast('Student membership approved successfully!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast('Failed to approve membership: ' + err.message, 'error');
    }
  }

  async rejectMembership(id) {
    const reason = prompt('Please enter a rejection reason (optional):', 'Club capacity full or term priority limit');
    if (reason === null) return;
    try {
      await window.api.reviewMembership(id, 'REJECTED', reason || 'Membership application not accepted.');
      this.showToast('Student membership request rejected.', 'info');
      this.renderCurrentView();
    } catch (err) {
      this.showToast('Failed to reject membership: ' + err.message, 'error');
    }
  }

  async inspectMonthlyClubHealth() {
    const clubId = document.getElementById('monthly-club-select').value;
    const resultBox = document.getElementById('monthly-health-result');
    resultBox.innerHTML = '<span class="text-slate-400 font-mono">Aggregating session metrics...</span>';

    try {
      const data = await window.api.getMonthlyClubReport(clubId, 30);
      resultBox.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <span class="font-bold text-white text-sm">${data.club_name}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${data.is_compliant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
              ${data.is_compliant ? 'ACTIVE / COMPLIANT' : 'NON-COMPLIANT (INACTIVE)'}
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Sessions</span>
              <span class="font-bold font-mono text-white text-base">${data.sessions_held}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Attendees</span>
              <span class="font-bold font-mono text-sky-400 text-base">${data.unique_attendees}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Deliverables</span>
              <span class="font-bold font-mono text-white text-base">${data.deliverables_submitted}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Evaluations</span>
              <span class="font-bold font-mono text-emerald-400 text-base">${data.evaluations_completed}</span>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 flex justify-between pt-1">
            <span>Advisor: <b>${data.advisor_name || 'Assigned'}</b></span>
            <span>Total Check-Ins: <b>${data.total_checkins}</b></span>
          </div>
        </div>
      `;
    } catch (err) {
      resultBox.innerHTML = `<span class="text-rose-400">${err.message}</span>`;
    }
  }

  // --- UTILS ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const color = type === 'success' ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/80' :
                  type === 'error' ? 'border-rose-500/50 text-rose-300 bg-rose-950/80' :
                  'border-sky-500/50 text-sky-300 bg-slate-900/90';
    toast.className = `p-4 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-md mb-2 transition transform duration-300 ${color}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const container = document.getElementById('modal-container');
    if (container) container.innerHTML = '';
  }
}

window.app = new AppController();
