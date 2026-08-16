import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

type Audit = {
  _id: string;
  action: string;
  resourceType?: string;
  metadata?: unknown;
  createdAt?: string;
  ip?: string;
};

export function AdminAudit() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<Audit[]>([]);
  const [backupMsg, setBackupMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    if (!accessToken) return;
    try {
      const data = await api<Audit[]>('/admin/audit-logs', { token: accessToken });
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  async function triggerBackup() {
    if (!accessToken) return;
    setBackupMsg('');
    try {
      const data = await api<{ message: string }>('/admin/backup', {
        method: 'POST',
        token: accessToken,
      });
      setBackupMsg(data.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="admin-topbar">
        <div>
          <h1>Audit & backup</h1>
          <p className="lead">Track platform actions and queue database backups (SRS §5.3 / admin API).</p>
        </div>
        <button type="button" onClick={() => void triggerBackup()}>
          Trigger backup
        </button>
      </div>

      {backupMsg && <p className="success">{backupMsg}</p>}
      {error && <p className="error">{error}</p>}

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td className="muted">
                  {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                </td>
                <td>
                  <strong>{l.action}</strong>
                </td>
                <td>{l.resourceType || '—'}</td>
                <td className="muted">{l.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="empty-state">No audit events yet.</div>}
      </div>
    </div>
  );
}
