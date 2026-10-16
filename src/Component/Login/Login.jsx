import React, { useState } from "react";

const Login = ({ role, onRegister, onLogin }) => {
  const isAdmin = role === "admin";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="nexova-login">

      {/* LEFT PANEL */}
      <section className="login-left-panel">

        <div className="login-grid-pattern"></div>

        <div className="login-left-content">

          {/* Brand */}
          <div className="nexova-brand">
            <div className="nexova-brand-symbol">N</div>

            <div className="nexova-brand-name">
              NEXOVA <span>X</span>
              <small>PROJECT & TASK TRACKER</small>
            </div>
          </div>

          {/* Main Heading */}
          <div className="login-hero-text">
            <span className="login-eyebrow">
              YOUR WORKSPACE, REDEFINED
            </span>

            <h1>
              The Smarter Way
              <br />
              to Manage Your
              <br />
              <span>Work.</span>
            </h1>

            <p>
              Stay organized, meet deadlines, and collaborate
              seamlessly — all in one place.
            </p>
          </div>

          {/* Workspace Preview */}
          <div className="workspace-preview">

            <div className="preview-top">
              <div>
                <span className="preview-label">WORKSPACE OVERVIEW</span>
                <h3>Your team. One workspace.</h3>
              </div>

              <span className="preview-status">
                <i></i> Organized
              </span>
            </div>

            <div className="preview-task">
              <div className="preview-task-icon">01</div>

              <div className="preview-task-details">
                <strong>Project Planning</strong>
                <span>Keep every milestone on track</span>
              </div>

              <span className="preview-task-check">✓</span>
            </div>

            <div className="preview-task">
              <div className="preview-task-icon">02</div>

              <div className="preview-task-details">
                <strong>Task Management</strong>
                <span>Know what needs to happen next</span>
              </div>

              <span className="preview-task-check">✓</span>
            </div>

            <div className="preview-task">
              <div className="preview-task-icon">03</div>

              <div className="preview-task-details">
                <strong>Team Collaboration</strong>
                <span>Make progress visible to everyone</span>
              </div>

              <span className="preview-task-check">✓</span>
            </div>

          </div>

          {/* Bottom Content */}
          <div className="login-left-footer">
            <div className="footer-line"></div>

            <p>
              GOOD WORK DOESN'T HAPPEN BY ACCIDENT.
              <br />
              IT HAPPENS TOGETHER.
            </p>

            <span>© 2026 NEXOVA X</span>
          </div>

        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="login-right-panel">

        <div className="login-right-top">
          <span className="login-secure-dot"></span>
          SECURE WORKSPACE ACCESS
        </div>

        <div className="login-form-wrapper">

          <div className="login-form-heading">
            <span className="form-eyebrow">
              {isAdmin ? "ADMINISTRATOR ACCESS" : "WELCOME TO NEXOVA X"}
            </span>

            <h2>
              Welcome <span>Back!</span>
            </h2>

            <p>
              {isAdmin
                ? "Sign in to manage your projects and team."
                : "Sign in to continue to your workspace."}
            </p>
          </div>

          <form
            className="nexova-auth-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              onLogin?.({
                email: formData.get("email"),
                password: formData.get("password"),
                role,
              });
            }}
          >

            <div className="nexova-form-field">
              <label htmlFor="nexova-email">
                Email Address
              </label>

              <input
                id="nexova-email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />
            </div>

            <div className="nexova-form-field">
              <label htmlFor="nexova-password">
                Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="nexova-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                >
                {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a11 11 0 0 1-3 4.2" />
                    <path d="M6.6 6.6A13 13 0 0 0 2.5 12S6 19 12 19a9.8 9.8 0 0 0 3-.5" />
                    </svg>
                ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
                </button>
              </div>
            </div>

            <div className="login-options">
              <span>Use your registered account</span>
            </div>

            <button className="nexova-login-button" type="submit">
              <span>Log in</span>
              <span className="login-button-arrow">↗</span>
            </button>

          </form>

          <p className="nexova-admin-note">
            Employee accounts are created by the administrator.
            Please contact your admin for login credentials.
            </p>

          {isAdmin && (
            <p className="nexova-admin-note">
              This area is restricted to authorized administrators.
            </p>
          )}

          <div className="nexova-login-bottom">
            <span>© 2026 NEXOVA X</span>
            <span>BUILT FOR BETTER TEAMWORK</span>
          </div>

        </div>
      </section>

    </main>
  );
};

export default Login;