import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading, Message } from './PageState';

function ProtectedRoute({ children, admin = false }) {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();

  if (!ready) return <Loading label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (admin && !isAdmin) {
    return (
      <Message
        title="This page is for admins"
        body="Your account doesn't have admin access. Ask an admin to upgrade your role."
        action={{ to: '/', label: 'Browse events' }}
      />
    );
  }
  return children;
}

export default ProtectedRoute;
