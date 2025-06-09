const express = require('express');
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// JWT Middleware for protected routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Book a spot (protected)
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const bookingData = req.body;
        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);

        // Check for existing booking (non-cancelled)
        const existingBooking = await prisma.booking.findFirst({
            where: {
                campspot_id: bookingData.campspot_id,
                status: { not: 'CANCELLED' },
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Campspot is already booked for the selected dates' });
        }

        const campspot = await prisma.campspot.findFirst({
            where: { campspot_id: bookingData.campspot_id },
        });

        if (!campspot) {
            return res.status(404).json({ message: 'Campspot not found' });
        }

        if (campspot.owner_id === req.user.user_id) {
            return res.status(403).json({ message: 'Cannot book your own campspot' });
        }

        bookingData.user_id = req.user.user_id;
        bookingData.startDate = startDate;
        bookingData.endDate = endDate;

        const nbOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        bookingData.total_price = nbOfNights * campspot.price_per_night;

        const newBooking = await prisma.booking.create({
            data: {
                campspot_id: bookingData.campspot_id,
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                user_id: bookingData.user_id,
                total_price: bookingData.total_price
            }
        });

        res.status(201).json(newBooking);
    } catch (error) {
        next(error);
    }
});

// Get bookings for a campspot (public — no auth required)
router.get('/', async (req, res) => {
    try {
        const { campspot_id } = req.query;
        if (!campspot_id) {
            return res.status(400).json({ message: 'campspot_id is required' });
        }

        const bookings = await prisma.booking.findMany({
            where: { campspot_id: parseInt(campspot_id) },
            orderBy: { startDate: 'asc' }
        });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get current user's bookings (my trips) (protected)
router.get('/mine', authenticateToken, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { user_id: req.user.user_id },
            include: {
                campspot: {
                    include: { location: true }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get bookings for campspots owned by current user (protected)
router.get('/owner', authenticateToken, async (req, res) => {
    try {
        const spots = await prisma.campspot.findMany({
            where: { owner_id: req.user.user_id },
            select: { campspot_id: true, name: true }
        });

        const spotIds = spots.map(s => s.campspot_id);

        if (!spotIds.length) return res.json([]);

        const bookings = await prisma.booking.findMany({
            where: { campspot_id: { in: spotIds } },
            include: {
                user: { select: { user_name: true } },
                campspot: { select: { name: true } }
            },
            orderBy: { startDate: 'desc' }
        });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching owner bookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update booking status (confirm/cancel) (protected)
router.put('/:booking_id', authenticateToken, async (req, res) => {
    try {
        const booking_id = parseInt(req.params.booking_id);
        const { status } = req.body;

        if (!booking_id || !status) {
            return res.status(400).json({ message: 'booking_id and status are required' });
        }

        const booking = await prisma.booking.findUnique({
            where: { booking_id },
            include: { campspot: true }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.campspot.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'You can only update bookings for your own spots.' });
        }

        if (booking.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending bookings can be updated.' });
        }

        const updated = await prisma.booking.update({
            where: { booking_id },
            data: { status }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// (Optional) Helper to get lat/lng from Google Maps API (currently unused here)
const fetchLatLng = async (address, city, country) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('Google Maps API key not set');

    const query = encodeURIComponent(`${address}, ${city}, ${country}`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return { latitude: loc.lat, longitude: loc.lng };
    }

    throw new Error('Could not geocode address');
};

module.exports = router;
