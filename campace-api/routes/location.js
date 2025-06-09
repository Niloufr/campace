const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

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

// Helper to get lat/lng from Google Maps Geocoding API
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

// Add new location (protected)
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const locationData = req.body;
        let latLng = { latitude: null, longitude: null };

        try {
            latLng = await fetchLatLng(locationData.address, locationData.city, locationData.country);
        } catch (e) {
            // If geocoding fails, continue with nulls
        }

        const newLocation = await prisma.location.create({
            data: {
                address: locationData.address,
                city: locationData.city,
                province_or_state: locationData.province_or_state,
                country: locationData.country,
                postal_code: parseInt(locationData.postal_code),
                owner_id: req.user.user_id,
                latitude: latLng.latitude,
                longitude: latLng.longitude
            }
        });

        res.status(201).json(newLocation);
    } catch (error) {
        next(error);
    }
});

// Get current user's locations (protected)
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const locations = await prisma.location.findMany({
            where: { owner_id: req.user.user_id }
        });

        return res.status(200).json(locations);
    } catch (error) {
        console.log('Error fetching locations:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Search locations (public route — no token required)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const locations = await prisma.location.findMany({
            where: {
                OR: [
                    { city: { contains: q } },
                    { country: { contains: q } },
                    { address: { contains: q } }
                ]
            },
            distinct: ['city', 'country'],
            orderBy: [
                { city: 'asc' },
                { country: 'asc' }
            ],
            take: 10
        });

        res.json(locations);
    } catch (error) {
        console.error('Error searching locations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get popular locations (public route — no token required)
router.get('/popular', async (req, res) => {
    try {
        const locations = await prisma.location.findMany({
            include: {
                _count: {
                    select: {
                        campspot: true
                    }
                }
            },
            orderBy: {
                campspot: {
                    _count: 'desc'
                }
            },
            take: 6
        });

        const popularLocations = locations.map(location => ({
            ...location,
            campspotCount: location._count.campspot
        }));

        res.json(popularLocations);
    } catch (error) {
        console.error('Error fetching popular locations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
