import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { navCopy } from '../i18n/messages';

type Options = {
  /** Navigate after successful logout (e.g. '/') */
  afterLogout?: () => void;
};

/**
 * Shared logout flow with an "Are you sure?" confirmation dialog.
 */
export function useLogoutConfirm(options: Options = {}) {
  const { logout } = useAuth();
  const { lang } = useLanguage();
  const t = navCopy(lang);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const afterLogout = options.afterLogout;

  const requestLogout = useCallback(() => setOpen(true), []);
  const cancelLogout = useCallback(() => {
    if (!busy) setOpen(false);
  }, [busy]);

  const confirmLogout = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      setOpen(false);
      afterLogout?.();
    } finally {
      setBusy(false);
    }
  }, [busy, logout, afterLogout]);

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="lo-confirm-backdrop"
            role="presentation"
            onClick={cancelLogout}
          >
            <div
              className="lo-confirm-card"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="lo-confirm-title"
              aria-describedby="lo-confirm-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lo-confirm-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h2 id="lo-confirm-title">{t.logoutConfirmTitle}</h2>
              <p id="lo-confirm-desc">{t.logoutConfirmBody}</p>
              <div className="lo-confirm-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={cancelLogout}
                  disabled={busy}
                >
                  {t.logoutCancel}
                </button>
                <button
                  type="button"
                  className="button lo-confirm-danger"
                  onClick={() => void confirmLogout()}
                  disabled={busy}
                >
                  {busy ? t.logoutWorking : t.logoutConfirm}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return { requestLogout, dialog };
}
