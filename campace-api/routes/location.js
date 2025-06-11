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


// Add new location (protected)
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const locationData = req.body;

        const newLocation = await prisma.location.create({
            data: {
                address: locationData.address,
                city: locationData.city,
                province_or_state: locationData.province_or_state,
                country: locationData.country,
                postal_code: parseInt(locationData.postal_code),
                owner_id: req.user.user_id,
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

// Update a location (protected, owner only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid location ID' });
        }
        const location = await prisma.location.findUnique({ where: { location_id: id } });
        if (!location) return res.status(404).json({ message: 'Location not found' });
        if (location.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to update this location' });
        }
        const { address, city, province_or_state, country, postal_code } = req.body;
        const updated = await prisma.location.update({
            where: { location_id: id },
            data: {
                address,
                city,
                province_or_state,
                country,
                postal_code: parseInt(postal_code)
            }
        });
        res.json(updated);
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a location (protected, owner only, only if no spots)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid location ID' });
        }
        const location = await prisma.location.findUnique({ where: { location_id: id } });
        if (!location) return res.status(404).json({ message: 'Location not found' });
        if (location.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to delete this location' });
        }
        const spotCount = await prisma.campspot.count({ where: { location_id: id } });
        if (spotCount > 0) {
            return res.status(400).json({ message: 'Cannot delete a location that has camping spots.' });
        }
        await prisma.location.delete({ where: { location_id: id } });
        res.json({ message: 'Location deleted' });
    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
