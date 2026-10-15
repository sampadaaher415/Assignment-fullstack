import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InlineError } from '../components/PageState';

function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const destination = from ? `${from.pathname}${from.search || ''}` : '/';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={destination} replace />;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login({ email: form.email, password: form.password });
      else await register(form);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <h1 className="page-title">{isLogin ? 'Log in' : 'Create your account'}</h1>
        <p className="muted">
          {location.state?.reason ||
            (isLogin ? 'Log in to book seats and see your tickets.' : 'You’ll use this account to book seats and keep your tickets.')}
        </p>

        <form onSubmit={handleSubmit} className="form" noValidate={false}>
          {!isLogin && (
            <label className="field">
              <span>Full name</span>
              <input type="text" autoComplete="name" value={form.name} onChange={update('name')} required />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={form.email} onChange={update('email')} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={isLogin ? undefined : 8}
              value={form.password}
              onChange={update('password')}
              required
            />
            {!isLogin && <small>At least 8 characters.</small>}
          </label>

          <InlineError>{error}</InlineError>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? (isLogin ? 'Logging in…' : 'Creating account…') : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? 'New here? ' : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'} state={location.state}>
            {isLogin ? 'Create an account' : 'Log in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
