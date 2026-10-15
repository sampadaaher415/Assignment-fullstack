# Event Booking System

Simple full-stack event booking app — event listing, seat selection aur QR code ke saath ticket generation.

## Tech Stack
- Frontend: React 19 (Create React App, react-scripts 5.0.1)
- Backend: Node.js + Express 5
- Database: MongoDB (official `mongodb` driver v7, no Mongoose)
- Other: `cors`, React Testing Library, CommonJS modules

## Folder Structure
```
event-booking-system/
├── backend/
│   ├── server.js        # Express app entry
│   ├── db.js             # MongoDB connection
│   ├── seed.js            # Sample events insert karta hai
│   └── routes/
│       ├── events.js      # GET/POST /api/events
│       └── bookings.js    # POST/GET /api/bookings (QR generation yahi hota hai)
└── frontend/
    ├── public/
    └── src/
        ├── api.js          # Backend se baat karne wala fetch helper
        ├── App.js
        └── pages/
            ├── EventList.js
            ├── EventDetail.js   # Seat selection + booking form
            └── Confirmation.js  # Ticket + QR code display
```

## Setup — Backend

1. MongoDB local mein chalu rakho (ya Atlas connection string use karo).
2. `cd backend`
3. `.env.example` ko `.env` mein copy karo aur values check karo:
   ```
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=eventBookingDB
   PORT=5000
   ```
4. `npm install`
5. Sample events dalne ke liye: `npm run seed`
6. Server start: `npm start`
   - API available hoga `http://localhost:5000/api`

## Setup — Frontend

1. `cd frontend`
2. `npm install`
3. Agar backend kisi alag URL pe chal raha hai to `frontend/.env` mein daalo:
   ```
   REACT_APP_API_BASE=http://localhost:5000/api
   ```
4. `npm start`
   - App khulega `http://localhost:3000`

## Flow
1. Home page pe saare events list hote hain (title, date, venue, available seats, price).
2. Event pe click karke seat map khulta hai — available / selected / booked seats color se dikhte hain.
3. Seats select karo, naam-email bharo, "Confirm Booking" dabao.
4. Backend seats ko booked mark karta hai, ek unique `ticketId` banata hai, aur `qrcode` package se us ticket data (ticketId, eventId, seats) ka QR code (base64 image) generate karke MongoDB ke `bookings` collection mein save karta hai.
5. Confirmation page pe ticket details + QR code dikhta hai — yahi QR venue entry ke liye scan ho sakta hai.

## Tests
`frontend` mein React Testing Library se ek basic smoke test diya hai:
```
cd frontend
npm test
```

## Simple rakha gaya hai, isliye
- Koi authentication/login nahi hai.
- Events add karne ke liye abhi `POST /api/events` API hai (seed script se bhi ho jata hai) — admin UI nahi banaya.
- Routing ke liye react-router use nahi kiya, simple state-based view switching hai App.js mein.
- Seat layout ek simple grid hai (row/column design nahi), chaho to easily extend kar sakte ho.
