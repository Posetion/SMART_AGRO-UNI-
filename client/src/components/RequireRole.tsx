import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { useAuth, type User } from '../context/AuthContext';

type Props = {
  roles: Array<User['role']>;
  children: React.ReactNode;
};

export function RequireRole({ roles, children }: Props) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="gate-screen">
        <div className="gate-bg" aria-hidden>
          <img src="/images/footer-terraces.png?v=2" alt="" />
          <div className="gate-scrim" />
        </div>

        <div className="gate-card">
          <div className="gate-brand">
            <span className="gate-mark">
              <BrandLogo size={36} decorative />
            </span>
            <div>
              <strong>Smart Agro Admin</strong>
              <small>Field operations console</small>
            </div>
          </div>

          <h1>Sign in to continue</h1>
          <p>
            Use your admin or expert email and password to manage the farm community platform.
          </p>

          <ul className="gate-points">
            <li>Secure email and password sign-in</li>
            <li>Diagnoses, knowledge, and outbreak tools</li>
            <li>Admin &amp; expert roles only</li>
          </ul>

          <div className="gate-actions">
            <Link className="button" to="/login">
              Log in
            </Link>
            <Link className="button secondary" to="/">
              Back to farmer app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="gate-screen">
        <div className="gate-bg" aria-hidden>
          <img src="/images/footer-terraces.png?v=2" alt="" />
          <div className="gate-scrim" />
        </div>

        <div className="gate-card">
          <div className="gate-brand">
            <span className="gate-mark warn">!</span>
            <div>
              <strong>Access restricted</strong>
              <small>Role permissions</small>
            </div>
          </div>

          <h1>This console isn&apos;t available for your account</h1>
          <p>
            You&apos;re signed in as <strong>{user.role}</strong>. Only admin and expert accounts can
            open this area.
          </p>

          <div className="gate-actions">
            <Link className="button" to="/">
              Go to farmer app
            </Link>
            <Link className="button secondary" to="/social">
              Open community feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
