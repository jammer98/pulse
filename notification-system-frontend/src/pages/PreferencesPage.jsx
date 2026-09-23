import { useEffect, useState } from 'react';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage, PageHeader } from '../components/Layout';

export default function PreferencesPage() {
  const { token } = useAuth(); const [preferences, setPreferences] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { request('/api/preferences', { token }).then((result) => setPreferences(result.preferences || [])).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, [token]);
  const toggle = async (type, channel, enabled) => {
    setPreferences((all) => all.map((row) => row.type === type ? { ...row, channels: row.channels.map((cell) => cell.channel === channel ? { ...cell, enabled } : cell) } : row));
    try { await request('/api/preferences', { method: 'PUT', token, body: { type, channel, enabled } }); } catch (err) { setError(err.message); }
  };
  return <><PageHeader eyebrow="Control your alerts" title="Preferences" /><ErrorMessage message={error} />{loading ? <div className="state-card">Loading preferences…</div> : preferences.length === 0 ? <div className="state-card"><strong>You haven't received any notifications yet</strong><span>Preferences appear here once you have.</span></div> : <div className="table-wrap"><table><thead><tr><th>Notification type</th><th>In-app</th><th>Email</th></tr></thead><tbody>{preferences.map((row) => <tr key={row.type}><th>{row.type}</th>{['in_app', 'email'].map((channel) => { const cell = row.channels.find((item) => item.channel === channel); return <td key={channel}><label className="switch"><input type="checkbox" checked={cell?.enabled ?? false} onChange={(event) => toggle(row.type, channel, event.target.checked)} /><span /></label></td>; })}</tr>)}</tbody></table></div>}</>;
}
