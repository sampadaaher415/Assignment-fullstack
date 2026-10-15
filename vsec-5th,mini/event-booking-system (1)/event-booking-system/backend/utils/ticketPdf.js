const PDFDocument = require('pdfkit');

const INK = '#221C48';
const MUTED = '#5A5578';
const MARIGOLD = '#F4A62A';
const RANI = '#C2335E';

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// Streams a one-page ticket PDF into `stream` (e.g. the Express response).
function writeTicketPdf(booking, stream) {
  const W = 420;
  const H = 580;
  const doc = new PDFDocument({ size: [W, H], margin: 0, info: { Title: `Ticket ${booking.ticketId}` } });
  doc.pipe(stream);

  // Header band
  doc.rect(0, 0, W, 150).fill(INK);
  doc.fillColor(MARIGOLD).font('Helvetica-Bold').fontSize(11).text('Seatwise ticket', 32, 32);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22)
    .text(booking.eventTitle, 32, 54, { width: W - 64, height: 60, ellipsis: true });
  const when = [formatDate(booking.eventDate), formatTime(booking.eventTime)].filter(Boolean).join(', ');
  doc.fillColor('#D9D5EC').font('Helvetica').fontSize(11).text(when, 32, 118, { width: W - 64 });

  // Details
  const rows = [
    ['Venue', booking.venue],
    ['Name', booking.customerName],
    ['Seats', booking.seatNumbers.join(', ')],
    ['Amount paid', `Rs. ${booking.totalAmount ?? '—'}`],
  ];
  let y = 178;
  for (const [label, value] of rows) {
    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(label, 32, y);
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text(String(value), 32, y + 12, { width: W - 64 });
    y += 40;
  }

  // Perforation
  y += 6;
  doc.save().moveTo(20, y).lineTo(W - 20, y).dash(4, { space: 4 }).strokeColor('#C9C4DC').stroke().restore();
  doc.circle(0, y, 12).fill('#F3F1F7');
  doc.circle(W, y, 12).fill('#F3F1F7');

  // QR
  const qrSize = 190;
  const qrBuffer = Buffer.from(booking.qrCode.split(',')[1], 'base64');
  doc.image(qrBuffer, (W - qrSize) / 2, y + 24, { width: qrSize, height: qrSize });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text('Show this code at the entrance', 0, y + 24 + qrSize + 10, { width: W, align: 'center' });
  doc.fillColor(INK).font('Courier').fontSize(9)
    .text(booking.ticketId, 0, y + 24 + qrSize + 26, { width: W, align: 'center' });

  if (booking.status === 'cancelled') {
    doc.save().rotate(-28, { origin: [W / 2, H / 2] });
    doc.fillColor(RANI).opacity(0.85).font('Helvetica-Bold').fontSize(56)
      .text('CANCELLED', 0, H / 2 - 30, { width: W, align: 'center' });
    doc.restore();
  }

  doc.end();
}

module.exports = { writeTicketPdf };
