import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { Loading } from './components/PageState';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import AuthPage from './pages/AuthPage';
import MyBookings from './pages/MyBookings';
import TicketPage from './pages/TicketPage';
import NotFound from './pages/NotFound';
import './App.css';

// Admin screens (and the camera library) load only when an admin opens them.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const EventForm = lazy(() => import('./pages/admin/EventForm'));
const EventBookings = lazy(() => import('./pages/admin/EventBookings'));
const CheckIn = lazy(() => import('./pages/admin/CheckIn'));

const admin = (el) => <ProtectedRoute admin>{el}</ProtectedRoute>;
const member = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

function App() {
  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main" className="main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/my-bookings" element={member(<MyBookings />)} />
            <Route path="/tickets/:ticketId" element={member(<TicketPage />)} />
            <Route path="/admin" element={admin(<AdminDashboard />)} />
            <Route path="/admin/events/new" element={admin(<EventForm />)} />
            <Route path="/admin/events/:id/edit" element={admin(<EventForm />)} />
            <Route path="/admin/events/:id/bookings" element={admin(<EventBookings />)} />
            <Route path="/admin/check-in" element={admin(<CheckIn />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="footer">
        <p>Seatwise. Tickets are issued instantly and checked at the door by QR code.</p>
      </footer>
    </div>
  );
}

export default App;
