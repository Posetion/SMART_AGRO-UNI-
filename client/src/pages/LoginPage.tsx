import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { loginCopy } from '../i18n/messages';
import {
  friendlyAuthError,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../utils/authValidation';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { login, register, loginAsGuest, user } = useAuth();
  const { lang, setLang } = useLanguage();
  const t = loginCopy(lang);
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>(location.pathname.includes('register') ? 'register' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const emailCheck = useMemo(() => validateEmail(email), [email]);
  const passwordCheck = useMemo(() => validatePassword(password), [password]);
  const confirmCheck = useMemo(
    () => validatePasswordConfirm(password, confirmPassword),
    [password, confirmPassword]
  );
  const isRegister = mode === 'register';

  useEffect(() => {
    setMode(location.pathname.includes('register') ? 'register' : 'login');
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    navigate(user.role === 'admin' || user.role === 'expert' ? '/admin' : '/home', { replace: true });
  }, [user, navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setFormError('');
    setPassword('');
    setConfirmPassword('');
    setTouched({ email: false, password: false, confirm: false });
    navigate(next === 'register' ? '/register' : '/login', { replace: true });
  }

  const emailShowError = touched.email && emailCheck.status === 'invalid';
  const emailShowOk = touched.email && emailCheck.status === 'valid';
  const passwordShowError = touched.password && passwordCheck.status === 'invalid';
  const passwordShowOk = touched.password && passwordCheck.status === 'valid';
  const confirmShowError = touched.confirm && confirmCheck.status === 'invalid';
  const confirmShowOk = touched.confirm && confirmCheck.status === 'valid';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: isRegister });
    setFormError('');

    if (emailCheck.status !== 'valid') {
      setFormError(emailCheck.message || 'Please enter a valid email.');
      return;
    }
    if (passwordCheck.status !== 'valid') {
      setFormError(passwordCheck.message || 'Password must be at least 8 characters.');
      return;
    }
    if (isRegister && confirmCheck.status !== 'valid') {
      setFormError(confirmCheck.message || 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (isRegister) {
        await register(normalizedEmail, password, fullName.trim());
      } else {
        await login(normalizedEmail, password);
      }
    } catch (err) {
      setFormError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGuest() {
    if (loading) return;
    setFormError('');
    setLoading(true);
    try {
      await loginAsGuest();
    } catch (err) {
      setFormError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  function renderForm(submitLabel: string) {
    const canSubmit =
      emailCheck.status === 'valid' &&
      passwordCheck.status === 'valid' &&
      (!isRegister || confirmCheck.status === 'valid');

    return (
      <form className="auth-slide-fields" onSubmit={(e) => void onSubmit(e)} noValidate>
        {isRegister && (
          <input
            type="text"
            autoComplete="name"
            placeholder={lang === 'my' ? 'အမည် (optional)' : 'Name (optional)'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t.email}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError('');
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          aria-invalid={emailShowError}
          className={emailShowError ? 'is-invalid' : emailShowOk ? 'is-valid' : ''}
        />
        {emailShowError && <p className="auth-slide-hint error">{emailCheck.message}</p>}
        <input
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          placeholder={lang === 'my' ? 'စကားဝှက်' : 'Password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFormError('');
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          aria-invalid={passwordShowError}
          className={passwordShowError ? 'is-invalid' : passwordShowOk ? 'is-valid' : ''}
        />
        {passwordShowError && <p className="auth-slide-hint error">{passwordCheck.message}</p>}
        {isRegister && (
          <>
            <input
              type="password"
              autoComplete="new-password"
              placeholder={lang === 'my' ? 'စကားဝှက် အတည်ပြုရန်' : 'Confirm password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFormError('');
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
              aria-invalid={confirmShowError}
              className={confirmShowError ? 'is-invalid' : confirmShowOk ? 'is-valid' : ''}
            />
            {confirmShowError && <p className="auth-slide-hint error">{confirmCheck.message}</p>}
          </>
        )}
        <button type="submit" className="auth-slide-btn solid" disabled={loading || !canSubmit}>
          {loading ? (lang === 'my' ? 'ခဏစောင့်ပါ…' : 'Please wait…') : submitLabel}
        </button>
      </form>
    );
  }

  if (user) {
    return (
      <div className="auth-slide-page">
        <div className="auth-slide-card auth-redirect">
          <p>You’re signed in. Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-slide-page">
      <div className="auth-slide-top">
        <Link to="/" className="auth-slide-brand">
          <span className="auth-slide-logo-wrap" aria-hidden>
            <BrandLogo size={72} decorative />
          </span>
          <span className="auth-slide-brand-text">
            <strong>SMART AGRO</strong>
            <small>{lang === 'my' ? 'အသိုင်းအဝိုင်း' : 'Community'}</small>
          </span>
        </Link>
        <div className="auth-slide-lang">
          <button type="button" className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>
            EN
          </button>
          <button type="button" className={lang === 'my' ? 'is-active' : ''} onClick={() => setLang('my')}>
            MY
          </button>
        </div>
      </div>

      <div className={`auth-slide-card ${isRegister ? 'is-register' : 'is-login'}`}>
        <div className="auth-slide-forms">
          <div className="auth-slide-form auth-slide-signin">
            <h1>{lang === 'my' ? 'ဝင်ရန်' : 'Log in'}</h1>
            <p className="auth-slide-or">
              {lang === 'my' ? 'အီးမေးလ်နှင့် စကားဝှက်ဖြင့် ဝင်ပါ' : 'or use your email and password'}
            </p>
            {mode === 'login' && renderForm(lang === 'my' ? t.login : 'LOG IN')}
            {mode === 'login' && formError && <div className="auth-slide-banner error">{formError}</div>}
            <button type="button" className="auth-slide-guest" disabled={loading} onClick={() => void onGuest()}>
              {loading ? t.guestLoading : t.continueAsGuest}
            </button>
          </div>

          <div className="auth-slide-form auth-slide-signup">
            <h1>{lang === 'my' ? 'စာရင်းသွင်းရန်' : 'Register'}</h1>
            <p className="auth-slide-or">
              {lang === 'my' ? 'အီးမေးလ်နှင့် စကားဝှက်ဖြင့် စာရင်းသွင်းပါ' : 'or use your email and password'}
            </p>
            {mode === 'register' && renderForm(lang === 'my' ? t.register : 'REGISTER')}
            {mode === 'register' && formError && <div className="auth-slide-banner error">{formError}</div>}
          </div>
        </div>

        <div className="auth-slide-overlay-wrap">
          <div className="auth-slide-overlay">
            <div className="auth-slide-overlay-panel overlay-left">
              <h2>{lang === 'my' ? 'ပြန်လည် ကြိုဆိုပါသည်!' : 'Welcome Back!'}</h2>
              <p>
                {lang === 'my'
                  ? 'ရှိပြီးသား အကောင့်ဖြင့် ဝင်ရောက်ပြီး Smart Agro အားလုံး သုံးပါ။'
                  : 'Enter your details to use all of Smart Agro features'}
              </p>
              <button type="button" className="auth-slide-btn ghost" onClick={() => switchMode('login')}>
                {lang === 'my' ? t.login : 'LOG IN'}
              </button>
            </div>
            <div className="auth-slide-overlay-panel overlay-right">
              <h2>{lang === 'my' ? 'မင်္ဂလာပါ!' : 'Hello, Friend!'}</h2>
              <p>
                {lang === 'my'
                  ? 'စာရင်းသွင်းပြီး ရောဂါရှာနှင့် အသိုင်းအဝိုင်းကို သုံးပါ။'
                  : 'Register with your email to use all of site features'}
              </p>
              <button type="button" className="auth-slide-btn ghost" onClick={() => switchMode('register')}>
                {lang === 'my' ? t.register : 'REGISTER'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-slide-mobile-switch">
        {isRegister ? (
          <button type="button" onClick={() => switchMode('login')}>
            {lang === 'my' ? 'အကောင့်ရှိပြီးသားလား? ဝင်ရန်' : 'Already have an account? Log in'}
          </button>
        ) : (
          <button type="button" onClick={() => switchMode('register')}>
            {lang === 'my' ? 'အကောင့် မရှိသေးဘူးလား? စာရင်းသွင်းရန်' : 'New here? Register'}
          </button>
        )}
      </div>
    </div>
  );
}
