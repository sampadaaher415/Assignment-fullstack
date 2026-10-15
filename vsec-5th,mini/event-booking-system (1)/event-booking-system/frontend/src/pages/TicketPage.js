import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { cancelBooking, downloadTicketPdf, getTicket } from '../api';
import { useAuth } from '../context/AuthContext';
import TicketStub from '../components/TicketStub';
import StatusPill from '../components/StatusPill';
import ConfirmButton from '../components/ConfirmButton';
import { InlineError, Loading, Message } from '../components/PageState';
import { bookingState, formatDateTime, formatRupees, formatWhen } from '../utils/format';

function TicketPage() {
  const { ticketId } = useParams();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [justBooked] = useState(Boolean(location.state?.justBooked));

  useEffect(() => {
    getTicket(ticketId).then(setTicket).catch((err) => setLoadError(err.message));
  }, [ticketId]);

  if (loadError) {
    return <Message tone="error" title="Ticket not found" body={loadError} action={{ to: '/my-bookings', label: 'Go to my tickets' }} />;
  }
  if (!ticket) return <Loading label="Loading your ticket" />;

  const state = bookingState(ticket);
  const canCancel = state === 'confirmed' || (isAdmin && state === 'past' && !ticket.checkedInAt);

  const handleDownload = async () => {
    setError('');
    setBusy('pdf');
    try {
      await downloadTicketPdf(ticket.ticketId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleCancel = async () => {
    setError('');
    setBusy('cancel');
    try {
      setTicket(await cancelBooking(ticket.ticketId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const heading = {
    confirmed: justBooked ? 'You’re booked' : 'Your ticket',
    'checked-in': 'You’re in',
    cancelled: 'Booking cancelled',
    past: 'Your ticket',
  }[state];

  const note = {
    confirmed: 'Show the QR code at the entrance. You can also download it as a PDF.',
    'checked-in': `Checked in ${formatDateTime(ticket.checkedInAt)}. Enjoy the event.`,
    cancelled: `Cancelled ${formatDateTime(ticket.cancelledAt)}. Your seats were released.`,
    past: 'This event has finished.',
  }[state];

  return (
    <div className="ticket-page">
      <Link to="/my-bookings" className="back-link">My tickets</Link>
      <div className="ticket-page-head">
        <h1 className="page-title">{heading}</h1>
        <StatusPill state={state} />
      </div>
      <p className="muted">{note}</p>

      <div className={`ticket-slot ${justBooked ? 'is-printing' : ''}`}>
        <TicketStub
          variant="full"
          state={state}
          title={ticket.eventTitle}
          subtitle={formatWhen(ticket.eventDate, ticket.eventTime)}
          fields={[
            ['Venue', ticket.venue],
            ['Name', ticket.customerName],
            ['Seats', ticket.seatNumbers.join(', ')],
            ['Paid', formatRupees(ticket.totalAmount)],
          ]}
          stub={
            <figure className="qr">
              <img src={ticket.qrCode} alt={`QR code for ticket ${ticket.ticketId}`} />
              <figcaption><code>{ticket.ticketId.slice(0, 8)}</code></figcaption>
            </figure>
          }
        />
      </div>

      <InlineError>{error}</InlineError>

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={busy === 'pdf'}>
          {busy === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
        </button>
        {canCancel && (
          <ConfirmButton
            label="Cancel booking"
            question={`Release seat${ticket.seatNumbers.length > 1 ? 's' : ''} ${ticket.seatNumbers.join(', ')}?`}
            confirmLabel="Cancel booking"
            onConfirm={handleCancel}
            busy={busy === 'cancel'}
          />
        )}
      </div>
    </div>
  );
}

export default TicketPage;
