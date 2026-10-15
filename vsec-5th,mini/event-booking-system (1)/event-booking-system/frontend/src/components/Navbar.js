import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Seatwise home">
          <span className="brand-mark" aria-hidden="true" />
          Seatwise
        </Link>

        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>Events</NavLink>
          {user && <NavLink to="/my-bookings">My tickets</NavLink>}
          {isAdmin && <NavLink to="/admin" end>Dashboard</NavLink>}
          {isAdmin && <NavLink to="/admin/check-in">Check-in</NavLink>}
        </nav>

        <div className="nav-account">
          {user ? (
            <>
              <span className="nav-user" title={user.email}>
                <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                <span className="nav-user-name">{user.name}</span>
              </span>
              <button type="button" className="btn btn-quiet btn-sm" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-quiet btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-accent btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
