import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

const Register = ({ onBack, onLogin, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: "employee",
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
            setSuccess(
                data.session
                ? "Account created successfully! You can now sign in."
                : "Registration successful! Please check your email to confirm your account."
            );

            onRegister?.({
                name,
                email,
                role: "employee",
            });
            }
    } catch (err) {
      setError(
        err.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="nexova-login">
      <section className="login-left-panel">
        <div className="login-grid-pattern"></div>

        <div className="login-left-content">
          <div className="nexova-brand">
            <div className="nexova-brand-symbol">N</div>

            <div className="nexova-brand-name">
              NEXOVA <span>X</span>
              <small>PROJECT & TASK TRACKER</small>
            </div>
          </div>

          <div className="login-hero-text">
            <span className="login-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </span>

            <h1>
              Great teams
              <br />
              start with
              <br />
              <span>great people.</span>
            </h1>

            <p>
              Join your team workspace, keep track of your
              responsibilities, and turn everyday tasks into
              meaningful progress.
            </p>
          </div>

          <div className="workspace-preview">
            <div className="preview-top">
              <div>
                <span className="preview-label">YOUR WORKSPACE</span>
                <h3>Everything in one place.</h3>
              </div>

              <span className="preview-status">
                <i></i> Ready to grow
              </span>
            </div>

            <div className="preview-task">
              <div className="preview-task-icon">01</div>
              <div className="preview-task-details">
                <strong>Know your priorities</strong>
                <span>See your assigned tasks and deadlines</span>
              </div>
              <span className="preview-task-check">✓</span>
            </div>

            <div className="preview-task">
              <div className="preview-task-icon">02</div>
              <div className="preview-task-details">
                <strong>Track your progress</strong>
                <span>Keep your work status up to date</span>
              </div>
              <span className="preview-task-check">✓</span>
            </div>

            <div className="preview-task">
              <div className="preview-task-icon">03</div>
              <div className="preview-task-details">
                <strong>Work as one team</strong>
                <span>Stay connected with your team</span>
              </div>
              <span className="preview-task-check">✓</span>
            </div>
          </div>

          <div className="login-left-footer">
            <div className="footer-line"></div>
            <p>
              SHOW UP. DO GREAT WORK.
              <br />
              MAKE EVERY TASK COUNT.
            </p>
            <span>© 2026 NEXOVA X</span>
          </div>
        </div>
      </section>

      <section className="login-right-panel">
        <div className="login-right-top">
          <span className="login-secure-dot"></span>
          EMPLOYEE REGISTRATION
        </div>

        <div className="login-form-wrapper">
          <div className="login-form-heading">
            <span className="form-eyebrow">
              CREATE YOUR ACCOUNT
            </span>

            <h2>
              Join the <span>team.</span>
            </h2>

            <p>
              Enter your details to create your employee account.
            </p>
          </div>

          <form
            className="nexova-auth-form"
            onSubmit={handleSubmit}
          >
            <div className="nexova-form-field">
              <label htmlFor="register-name">Full Name</label>

              <input
                id="register-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="nexova-form-field">
              <label htmlFor="register-email">Work Email</label>

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="nexova-form-field">
              <label htmlFor="register-password">Password</label>

              <div className="password-input-wrapper">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="nexova-form-field">
              <label htmlFor="register-confirm-password">
                Confirm Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p className="register-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="register-success" role="status">
                {success}
              </p>
            )}

            <button
              className="nexova-login-button"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading ? "Creating account..." : "Create employee account"}
              </span>

              <span className="login-button-arrow">
                {loading ? "…" : "↗"}
              </span>
            </button>
          </form>

          <div className="nexova-register-prompt">
            <span>Already have an account?</span>

            <button type="button" onClick={onLogin}>
              Sign in <span>→</span>
            </button>
          </div>

          <div className="nexova-login-bottom">
            <span>© 2026 NEXOVA X</span>
            <span>BUILT FOR BETTER TEAMWORK</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Register;