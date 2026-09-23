import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage, Field } from '../components/Layout';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { isAuthenticated, saveSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/" replace />;
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const result = await request(`/api/auth/${isRegister ? 'register' : 'login'}`, { method: 'POST', body: isRegister ? form : { email: form.email, password: form.password } });
      saveSession(result); navigate(location.state?.from?.pathname || '/');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  return <div className="auth-layout"><section className="auth-card">
    <div className="brand">Pulse<span>.</span></div>
    <p className="eyebrow">{isRegister ? 'Get started' : 'Welcome back'}</p>
    <h1>{isRegister ? 'Create your account' : 'Sign in to your inbox'}</h1>
    <p className="muted">{isRegister ? 'Your real-time notifications, in one place.' : 'Stay on top of every important update.'}</p>
    <form onSubmit={submit}>
      {isRegister && <Field label="Name" name="name" value={form.name} onChange={update} required autoComplete="name" />}
      <Field label="Email" type="email" name="email" value={form.email} onChange={update} required autoComplete="email" />
      <Field label="Password" type="password" name="password" value={form.password} onChange={update} required minLength="6" autoComplete={isRegister ? 'new-password' : 'current-password'} />
      <ErrorMessage message={error} /><button className="primary-button full-width" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
    </form>
    <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Pulse?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
  </section></div>;
}
