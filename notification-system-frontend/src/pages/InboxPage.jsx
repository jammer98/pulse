import { useCallback, useEffect, useState } from 'react';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ErrorMessage, PageHeader } from '../components/Layout';

const relativeTime = (date) => {
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function InboxPage() {
  const { token } = useAuth();
  const { unreadCount, setUnreadCount, inboxNotifications, setInboxNotifications } = useSocket();
  const [items, setItems] = useState([]); const [filter, setFilter] = useState(false);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [result, count] = await Promise.all([
        request(`/api/notifications?unread=${filter}&page=${page}&limit=20`, { token }),
        request('/api/notifications/unread-count', { token })
      ]);
      setItems(result.notifications || []); setTotalPages(result.totalPages || 1); setUnreadCount(count.count || 0);
      setInboxNotifications(result.notifications || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [filter, page, token, setInboxNotifications, setUnreadCount]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (inboxNotifications.length) setItems((current) => {
      const merged = [...inboxNotifications, ...current].filter((item, index, all) => all.findIndex((entry) => entry.id === item.id) === index);
      return merged;
    });
  }, [inboxNotifications]);
  const markRead = async (id) => {
    try { await request(`/api/notifications/${id}/read`, { method: 'PATCH', token }); setItems((all) => all.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item)); setUnreadCount(Math.max(0, unreadCount - 1)); }
    catch (err) { setError(err.message); }
  };
  const markAll = async () => { try { await request('/api/notifications/read-all', { method: 'PATCH', token }); setItems((all) => all.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))); setUnreadCount(0); } catch (err) { setError(err.message); } };
  return <><PageHeader eyebrow="Your activity" title="Inbox"><button className="secondary-button" onClick={markAll} disabled={!unreadCount}>Mark all read</button></PageHeader>
    <div className="toolbar"><div className="tabs"><button className={!filter ? 'active' : ''} onClick={() => { setFilter(false); setPage(1); }}>All</button><button className={filter ? 'active' : ''} onClick={() => { setFilter(true); setPage(1); }}>Unread</button></div><span className="muted">{unreadCount} unread</span></div>
    <ErrorMessage message={error} />
    {loading ? <div className="state-card">Loading notifications…</div> : items.length === 0 ? <div className="state-card"><strong>No notifications yet</strong><span>New updates will appear here in real time.</span></div> : <div className="notification-list">{items.map((item) => <article className={`notification ${item.read_at ? '' : 'unread'}`} key={item.id} onClick={() => !item.read_at && markRead(item.id)}><div className="notification-marker">{!item.read_at && <i />}</div><div className="notification-content"><div className="notification-top"><span className="tag">{item.type}</span><time>{relativeTime(item.created_at || item.createdAt)}</time></div><h2>{item.title}</h2><p>{item.body}</p></div>{!item.read_at && <button className="small-button" onClick={(event) => { event.stopPropagation(); markRead(item.id); }}>Mark read</button>}</article>)}</div>}
    {!loading && totalPages > 1 && <div className="pagination"><button className="secondary-button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="secondary-button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
  </>;
}
