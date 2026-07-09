import Script from "next/script";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      {/* ── LOGIN GATE ─────────────────────────────────────── */}
      <div id="loginGate" className="ap-login-page">
        {/* Left brand panel */}
        <div className="ap-login-brand-panel">
          <div className="ap-login-brand-inner">
            <div className="ap-login-brand-logo">
              <span className="ap-login-brand-mark">BVD</span>
              <span className="ap-login-brand-name">Logistics</span>
            </div>
            <h2 className="ap-login-brand-headline">Operations Control Center</h2>
            <p className="ap-login-brand-sub">Manage your delivery network, driver onboarding, team assignments, and route operations from one secure dashboard.</p>
            <div className="ap-login-brand-dots" aria-hidden="true">
              <span /><span /><span />
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="ap-login-form-panel">
          <div className="ap-login-card">
            <div className="ap-login-card-inner">
              <p className="ap-login-eyebrow">Admin Portal</p>
              <h1 className="ap-login-title">Sign in</h1>
              <p className="ap-login-sub">Enter your credentials to access the dashboard.</p>
              <form id="adminLoginForm" className="ap-login-form">
                <div className="ap-field">
                  <label htmlFor="adminLoginEmail">Email address</label>
                  <input id="adminLoginEmail" className="ap-input" type="email" name="email" placeholder="you@example.com" required />
                </div>
                <div className="ap-field">
                  <label htmlFor="adminLoginPassword">Password</label>
                  <input id="adminLoginPassword" className="ap-input" type="password" name="password" placeholder="••••••••" required />
                </div>
                <button id="adminLoginBtn" type="submit" className="ap-btn-primary ap-btn-full" style={{ marginTop: "0.5rem" }}>Sign In</button>
              </form>
              <div id="adminLoginStatus" className="ap-login-status notification is-hidden" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DASHBOARD SHELL ────────────────────────────────── */}
      <div id="adminCard" className="ap-shell is-hidden">

        {/* Sidebar */}
        <aside className="ap-sidebar">
          <div className="ap-sidebar-brand">
            <span className="ap-sidebar-logo">BVD</span>
            <span className="ap-sidebar-logo-sub">Admin</span>
          </div>

          <nav className="ap-nav" id="navMenu">
            <a href="#" data-view="dashboard" className="ap-nav-item is-active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Dashboard
            </a>
            <a href="#" data-view="drivers" className="ap-nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Drivers
            </a>
            <a href="#" data-view="helpers" className="ap-nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Helpers
            </a>
            <a href="#" data-view="teams" className="ap-nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Teams
            </a>
            <a href="#" data-view="status" className="ap-nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Onboarding
            </a>
          </nav>

          <button id="logoutBtn" type="button" className="ap-logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </aside>

        {/* Main area */}
        <div className="ap-main">
          <div id="globalStatus" className="notification is-hidden ap-global-status" aria-live="polite"></div>

          {/* Dashboard */}
          <section id="view-dashboard" className="view-panel ap-view">
            <div className="ap-view-header">
              <h2>Dashboard</h2>
            </div>
            <div id="statsCards" className="ap-stats-grid"></div>
          </section>

          {/* Drivers */}
          <section id="view-drivers" className="view-panel ap-view is-hidden">
            <div className="ap-view-header ap-view-header-row">
              <div><h2>Drivers</h2><p>Manage driver profiles and onboarding invites.</p></div>
              <button id="addDriverBtn" type="button" className="ap-btn-primary">+ Add Driver</button>
            </div>
            <div className="ap-card">
              <h3 className="ap-card-title">Driver Roster</h3>
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th></th></tr></thead>
                  <tbody id="driversTableBody"></tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Helpers */}
          <section id="view-helpers" className="view-panel ap-view is-hidden">
            <div className="ap-view-header ap-view-header-row">
              <div><h2>Helpers</h2><p>Manage helper profiles and onboarding invites.</p></div>
              <button id="addHelperBtn" type="button" className="ap-btn-primary">+ Add Helper</button>
            </div>
            <div className="ap-card">
              <h3 className="ap-card-title">Helper Roster</h3>
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th></th></tr></thead>
                  <tbody id="helpersTableBody"></tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Teams */}
          <section id="view-teams" className="view-panel ap-view is-hidden">
            <div className="ap-view-header ap-view-header-row">
              <div><h2>Teams</h2><p>Assign helpers to drivers and manage team status.</p></div>
              <button id="assignTeamBtn" type="button" className="ap-btn-primary">+ Assign Team</button>
            </div>
            <div className="ap-card">
              <h3 className="ap-card-title">Active Assignments</h3>
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead><tr><th>Driver</th><th>Helper</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
                  <tbody id="teamsTableBody"></tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Onboarding Status */}
          <section id="view-status" className="view-panel ap-view is-hidden">
            <div className="ap-view-header">
              <h2>Onboarding Status</h2>
              <p>Review and approve submitted onboarding applications.</p>
            </div>
            <div className="ap-card">
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead>
                  <tbody id="statusTableBody"></tbody>
                </table>
              </div>
            </div>
          </section>
          {/* ── Modals ─────────────────────────────────────── */}

          {/* Add Driver */}
          <div id="modal-add-driver" className="ap-modal-overlay" style={{display:"none"}}>
            <div className="ap-modal">
              <div className="ap-modal-header">
                <h3>Add New Driver</h3>
                <button className="ap-modal-x" data-close-modal="modal-add-driver" type="button">✕</button>
              </div>
              <div className="ap-modal-body">
                <form id="profileFormDrivers" className="ap-create-form" noValidate>
                  <input type="hidden" name="role" value="driver" />
                  <div className="ap-form-row">
                    <div className="ap-field"><label>First Name</label><input className="ap-input" type="text" name="firstName" placeholder="First name" required /></div>
                    <div className="ap-field"><label>Last Name</label><input className="ap-input" type="text" name="lastName" placeholder="Last name" required /></div>
                    <div className="ap-field"><label>Email</label><input className="ap-input" type="email" name="email" placeholder="Email" required /></div>
                    <div className="ap-field"><label>Phone</label><input className="ap-input" type="tel" name="phone" placeholder="Phone" required /></div>
                    <div className="ap-field ap-field-sm"><label>Expires (days)</label><input className="ap-input" type="number" name="expiresInDays" min="1" max="30" defaultValue="7" required /></div>
                  </div>
                  <button type="submit" className="ap-btn-primary">Create Driver + Invite Link</button>
                </form>
                <div id="inviteResultDrivers" className="ap-invite-result notification is-hidden mt-3">
                  <p className="ap-invite-label">Onboarding link ready</p>
                  <div className="ap-invite-row">
                    <input id="inviteUrlDrivers" className="ap-input" type="text" readOnly />
                    <button data-copy-target="inviteUrlDrivers" className="ap-btn-secondary copy-btn" type="button">Copy</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Helper */}
          <div id="modal-add-helper" className="ap-modal-overlay" style={{display:"none"}}>
            <div className="ap-modal">
              <div className="ap-modal-header">
                <h3>Add New Helper</h3>
                <button className="ap-modal-x" data-close-modal="modal-add-helper" type="button">✕</button>
              </div>
              <div className="ap-modal-body">
                <form id="profileFormHelpers" className="ap-create-form" noValidate>
                  <input type="hidden" name="role" value="helper" />
                  <div className="ap-form-row">
                    <div className="ap-field"><label>First Name</label><input className="ap-input" type="text" name="firstName" placeholder="First name" required /></div>
                    <div className="ap-field"><label>Last Name</label><input className="ap-input" type="text" name="lastName" placeholder="Last name" required /></div>
                    <div className="ap-field"><label>Email</label><input className="ap-input" type="email" name="email" placeholder="Email" required /></div>
                    <div className="ap-field"><label>Phone</label><input className="ap-input" type="tel" name="phone" placeholder="Phone" required /></div>
                    <div className="ap-field ap-field-sm"><label>Expires (days)</label><input className="ap-input" type="number" name="expiresInDays" min="1" max="30" defaultValue="7" required /></div>
                  </div>
                  <button type="submit" className="ap-btn-primary">Create Helper + Invite Link</button>
                </form>
                <div id="inviteResultHelpers" className="ap-invite-result notification is-hidden mt-3">
                  <p className="ap-invite-label">Onboarding link ready</p>
                  <div className="ap-invite-row">
                    <input id="inviteUrlHelpers" className="ap-input" type="text" readOnly />
                    <button data-copy-target="inviteUrlHelpers" className="ap-btn-secondary copy-btn" type="button">Copy</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div id="modal-edit-profile" className="ap-modal-overlay" style={{display:"none"}}>
            <div className="ap-modal">
              <div className="ap-modal-header">
                <h3 id="profileViewTitle">Edit Profile</h3>
                <button className="ap-modal-x" data-close-modal="modal-edit-profile" type="button">✕</button>
              </div>
              <div className="ap-modal-body">
                <form id="profileDetailForm" className="ap-create-form" noValidate>
                  <div className="ap-form-row">
                    <div className="ap-field"><label>First Name</label><input id="pd-firstName" className="ap-input" type="text" placeholder="First name" required /></div>
                    <div className="ap-field"><label>Last Name</label><input id="pd-lastName" className="ap-input" type="text" placeholder="Last name" required /></div>
                    <div className="ap-field"><label>Email</label><input id="pd-email" className="ap-input" type="email" placeholder="Email" required /></div>
                    <div className="ap-field"><label>Phone</label><input id="pd-phone" className="ap-input" type="tel" placeholder="Phone" required /></div>
                    <div className="ap-field"><label>Status</label>
                      <div className="ap-select-wrap">
                        <select id="pd-status" className="ap-select">
                          <option value="invited">Invited</option>
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Reviewed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="ap-btn-primary">Save Changes</button>
                </form>
                <div id="pd-app-section" className="ap-card is-hidden" style={{marginTop:"1rem"}}>
                  <h3 className="ap-card-title">Application Info</h3>
                  <div id="pd-app-body"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Assign Team */}
          <div id="modal-assign-team" className="ap-modal-overlay" style={{display:"none"}}>
            <div className="ap-modal">
              <div className="ap-modal-header">
                <h3>Assign Team</h3>
                <button className="ap-modal-x" data-close-modal="modal-assign-team" type="button">✕</button>
              </div>
              <div className="ap-modal-body">
                <form id="teamForm" className="ap-create-form" noValidate>
                  <div className="ap-form-row">
                    <div className="ap-field"><label>Driver</label><div className="ap-select-wrap"><select id="teamDriverSelect" className="ap-select" required></select></div></div>
                    <div className="ap-field"><label>Helper</label><div className="ap-select-wrap"><select id="teamHelperSelect" className="ap-select" required></select></div></div>
                  </div>
                  <button className="ap-btn-primary" type="submit">Assign Team</button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Script src="/admin.js" strategy="afterInteractive" />
    </>
  );
}
