const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// CORS configuration for JWT
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: false, // Since you're using JWT in Authorization header
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' })); // Increased limit for file uploads if needed
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Optional: Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routing 
const userRouter = require('./routes/user');
const campspotRouter = require('./routes/campspot');
const locationRouter = require('./routes/location');
const amenityRouter = require('./routes/amenity');
const bookingRouter = require('./routes/booking');
const reviewRouter = require('./routes/review');

app.use('/users', userRouter);
app.use('/campspots', campspotRouter);
app.use('/locations', locationRouter);
app.use('/amenities', amenityRouter);
app.use('/bookings', bookingRouter);
app.use('/reviews', reviewRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Enhanced error handler for API responses
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // For API requests, return JSON instead of rendering error page
  if (req.path.startsWith('/users') || req.path.startsWith('/campspots') ||
    req.path.startsWith('/locations') || req.path.startsWith('/amenities') ||
    req.path.startsWith('/bookings') || req.path.startsWith('/reviews')) {
    return res.status(err.status || 500).json({
      message: err.message,
      error: req.app.get('env') === 'development' ? err.stack : {}
    });
  }

  // render the error page for non-API requests
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
