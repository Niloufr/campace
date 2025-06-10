const express = require('express');
const router = express.Router();

const { PrismaClient, Prisma } = require('@prisma/client');
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

// Add new spot (protected)
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const campspotData = req.body;
        const location = await prisma.location.findFirst({
            where: {
                location_id: campspotData.location_id
            }
        });

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        if (location.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to add campspot to this location' });
        }

        campspotData.owner_id = req.user.user_id;

        const newCampspot = await prisma.campspot.create({
            data: campspotData
        });

        res.status(201).json(newCampspot);
    } catch (error) {
        next(error);
    }
});

// Get campspot overview (protected)
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const campspots = await prisma.campspot.findMany({
            where: { owner_id: req.user.user_id },
            select: {
                campspot_id: true,
                name: true,
                description: true,
                price_per_night: true,
                capacity: true,
                location: {
                    select: {
                        address: true,
                        city: true,
                        country: true
                    }
                }
                // TODO: add average rating if needed
            }
        });

        return res.status(200).json(campspots);
    } catch (error) {
        console.error('Error fetching campspots:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const { city, country, minPrice, maxPrice, amenities, minCapacity, maxCapacity } = req.query;
        const where = {
            location: {
                ...(city && { city: { contains: city } }),
                ...(country && { country: { contains: country } })
            }
        };
        if (minPrice) where.price_per_night = { ...where.price_per_night, gte: parseFloat(minPrice) };
        if (maxPrice) where.price_per_night = { ...where.price_per_night, lte: parseFloat(maxPrice) };
        if (minCapacity) where.capacity = { ...where.capacity, gte: parseInt(minCapacity) };
        if (maxCapacity) where.capacity = { ...where.capacity, lte: parseInt(maxCapacity) };
        if (amenities) {
            const amenityList = amenities.split(',');
            where.amenities = {
                some: {
                    amenity_name: { in: amenityList }
                }
            };
        }
        const spots = await prisma.campspot.findMany({
            where,
            include: {
                location: true,
                amenities: true
            }
        });

        return res.status(200).json(spots);
    } catch (error) {
        console.error('Error searching campspots:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get a single campspot (protected)
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid campspot ID' });
        }

        // Fetch spot with location, amenities, reviews, and owner info
        const spot = await prisma.campspot.findUnique({
            where: {
                campspot_id: id
            },
            include: {
                location: true,
                amenities: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                user_name: true
                            }
                        }
                    }
                },
                owner: {
                    select: {
                        user_name: true,
                        email: true
                    }
                }
            }
        });

        if (!spot) {
            return res.status(404).json({ message: 'Spot not found' });
        }

        return res.status(200).json(spot);
    } catch (error) {
        console.error('Error fetching single campspot:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a campspot (protected, owner only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid campspot ID' });
        }
        // Only allow owner to update
        const spot = await prisma.campspot.findUnique({ where: { campspot_id: id } });
        if (!spot) return res.status(404).json({ message: 'Spot not found' });
        if (spot.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to update this spot' });
        }
        // Only allow updating scalar fields, not nested location
        const { name, description, price_per_night, capacity } = req.body;
        const updateData = {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(price_per_night !== undefined && { price_per_night: Number(price_per_night) }),
            ...(capacity !== undefined && { capacity: Number(capacity) })
        };
        const updated = await prisma.campspot.update({
            where: { campspot_id: id },
            data: updateData
        });
        res.json(updated);
    } catch (error) {
        console.error('Error updating campspot:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a campspot (protected, owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid campspot ID' });
        }
        // Only allow owner to delete
        const spot = await prisma.campspot.findUnique({ where: { campspot_id: id } });
        if (!spot) return res.status(404).json({ message: 'Spot not found' });
        if (spot.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to delete this spot' });
        }
        await prisma.campspot.delete({ where: { campspot_id: id } });
        res.json({ message: 'Campspot deleted' });
    } catch (error) {
        console.error('Error deleting campspot:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

module.exports = router;
