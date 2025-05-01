require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware Order Matters!

// 1. CORS Configuration (must come first)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 2. Body Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 3. Session Configuration (must come before routes)
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 // Clean up expired sessions every 60 minutes
  }),
  name: 'farmnav.sid', // Custom cookie name
  secret: process.env.SESSION_SECRET || 'your-strong-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 4. Session Debugging Middleware (optional)
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// 6. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    session: req.sessionID ? 'Active' : 'Inactive'
  });
});

// 7. Error Handling (must come last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Session store: PostgreSQL (${process.env.DB_NAME})`);
  console.log(`Cookie name: farmnav.sid`);
});