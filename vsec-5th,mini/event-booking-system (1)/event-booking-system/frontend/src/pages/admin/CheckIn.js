import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { checkInTicket, getEvents } from '../../api';
import { formatDateTime, formatShortDate } from '../../utils/format';

const READER_ID = 'qr-reader';
const REPEAT_WINDOW_MS = 4000;

// QR codes hold JSON ({ ticketId, ... }); a bare ticket ID also works.
function extractTicketId(text) {
  const raw = String(text || '').trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.ticketId) return String(parsed.ticketId);
  } catch {
    /* not JSON */
  }
  return raw;
}

const RESULT_COPY = {
  ok: { tone: 'go', title: 'Let them in' },
  already: { tone: 'warn', title: 'Already used' },
  cancelled: { tone: 'stop', title: 'Ticket cancelled' },
  wrong_event: { tone: 'stop', title: 'Wrong event' },
  invalid: { tone: 'stop', title: 'Not a valid ticket' },
  error: { tone: 'stop', title: 'Couldn’t check this ticket' },
};

function CheckIn() {
  const [params, setParams] = useSearchParams();
  const eventId = params.get('event') || '';
  const [events, setEvents] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manual, setManual] = useState('');
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);

  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const lastRef = useRef({ code: '', at: 0 });
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  useEffect(() => {
    getEvents().then(setEvents).catch(() => {});
  }, []);

  const verify = useCallback(async (text) => {
    const ticketId = extractTicketId(text);
    if (!ticketId || busyRef.current) return;
    const now = Date.now();
    if (lastRef.current.code === ticketId && now - lastRef.current.at < REPEAT_WINDOW_MS) return;
    lastRef.current = { code: ticketId, at: now };

    busyRef.current = true;
    let next;
    try {
      const res = await checkInTicket(ticketId, eventIdRef.current || undefined);
      next = { result: 'ok', booking: res.booking, message: '' };
    } catch (err) {
      next = { result: err.data?.result || 'error', booking: err.data?.booking, message: err.message };
    } finally {
      busyRef.current = false;
    }
    if (navigator.vibrate) navigator.vibrate(next.result === 'ok' ? 80 : [60, 60, 60]);
    setResult({ ...next, ticketId, at: new Date() });
    setLog((prev) => [{ ...next, ticketId, at: new Date() }, ...prev].slice(0, 8));
  }, []);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => verify(text),
        () => {}
      );
      setScanning(true);
    } catch (err) {
      scannerRef.current = null;
      setCameraError(
        'Camera unavailable. Allow camera access in your browser, and make sure the page is on https or localhost. You can still type the ticket ID below.'
      );
    }
  };

  useEffect(() => () => {
    stopCamera();
  }, [stopCamera]);

  const handleManual = (e) => {
    e.preventDefault();
    lastRef.current = { code: '', at: 0 };
    verify(manual);
    setManual('');
  };

  const copy = result ? RESULT_COPY[result.result] || RESULT_COPY.error : null;
  const b = result?.booking;

  return (
    <div className="admin checkin">
      <div className="admin-head">
        <h1 className="page-title">Check-in</h1>
        <label className="field field-inline">
          <span>Event</span>
          <select
            value={eventId}
            onChange={(e) => setParams(e.target.value ? { event: e.target.value } : {})}
          >
            <option value="">Any event</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title}, {formatShortDate(ev.date)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="checkin-grid">
        <section className="scanner" aria-label="Scanner">
          <div className={`scanner-window ${scanning ? 'is-live' : ''}`}>
            <div id={READER_ID} />
            {!scanning && (
              <div className="scanner-idle">
                <p>Point the camera at the QR code on a guest’s ticket.</p>
                <button type="button" className="btn btn-accent" onClick={startCamera}>Start camera</button>
              </div>
            )}
          </div>
          {scanning && (
            <button type="button" className="btn btn-quiet btn-block" onClick={stopCamera}>Stop camera</button>
          )}
          {cameraError && <p className="inline-error" role="alert">{cameraError}</p>}

          <form className="manual" onSubmit={handleManual}>
            <label className="field">
              <span>Or enter a ticket ID</span>
              <div className="input-row">
                <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 3f2a9c1e-…" spellCheck="false" />
                <button type="submit" className="btn btn-primary" disabled={!manual.trim()}>Check in</button>
              </div>
            </label>
          </form>
        </section>

        <section aria-live="assertive" aria-label="Result">
          {result ? (
            <div key={result.at.getTime()} className={`verdict verdict-${copy.tone}`}>
              <h2>{copy.title}</h2>
              {result.message && result.result !== 'ok' && <p>{result.message}</p>}
              {b && (
                <dl>
                  <div><dt>Guest</dt><dd>{b.customerName}</dd></div>
                  <div><dt>Seats</dt><dd>{b.seatNumbers?.join(', ')}</dd></div>
                  <div><dt>Event</dt><dd>{b.eventTitle}</dd></div>
                  {b.checkedInAt && (
                    <div><dt>{result.result === 'ok' ? 'Checked in' : 'First used'}</dt><dd>{formatDateTime(b.checkedInAt)}</dd></div>
                  )}
                </dl>
              )}
            </div>
          ) : (
            <div className="verdict verdict-idle">
              <h2>Ready to scan</h2>
              <p>Each result shows here. Green means let them in.</p>
            </div>
          )}

          {log.length > 0 && (
            <>
              <h3 className="log-title">Recent scans</h3>
              <ol className="scan-log">
                {log.map((entry, i) => (
                  <li key={i} className={`log-${(RESULT_COPY[entry.result] || RESULT_COPY.error).tone}`}>
                    <span>{entry.booking?.customerName || entry.ticketId.slice(0, 8)}</span>
                    <span>{(RESULT_COPY[entry.result] || RESULT_COPY.error).title}</span>
                    <time>{entry.at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</time>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default CheckIn;
