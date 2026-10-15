const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error("Can't reach the server. Check that the backend is running."), { status: 0 });
  }

  if (res.ok && raw) return res;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw Object.assign(new Error(data.error || `Request failed (${res.status}).`), { status: res.status, data });
  }
  return data;
}

// Auth
export const register = (data) => request('/auth/register', { method: 'POST', body: data });
export const login = (data) => request('/auth/login', { method: 'POST', body: data });
export const getMe = () => request('/auth/me');

// Events
export const getEvents = ({ all = false } = {}) => request(`/events${all ? '?when=all' : ''}`);
export const getEvent = (id) => request(`/events/${id}`);
export const getCategories = () => request('/events/categories');
export const createEvent = (data) => request('/events', { method: 'POST', body: data });
export const updateEvent = (id, data) => request(`/events/${id}`, { method: 'PUT', body: data });
export const deleteEvent = (id) => request(`/events/${id}`, { method: 'DELETE' });

// Bookings
export const createBooking = (data) => request('/bookings', { method: 'POST', body: data });
export const getMyBookings = () => request('/bookings/mine');
export const getTicket = (ticketId) => request(`/bookings/${ticketId}`);
export const cancelBooking = (ticketId) => request(`/bookings/${ticketId}/cancel`, { method: 'POST' });
export const checkInTicket = (ticketId, eventId) =>
  request(`/bookings/${encodeURIComponent(ticketId)}/checkin`, { method: 'POST', body: eventId ? { eventId } : {} });

export async function downloadTicketPdf(ticketId) {
  const res = await request(`/bookings/${ticketId}/pdf`, { raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-${ticketId.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Admin
export const getAdminStats = () => request('/admin/stats');
export const getEventBookings = (eventId) => request(`/admin/events/${eventId}/bookings`);
