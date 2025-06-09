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

// Search campspots by location and geo (public route)
router.get('/search', async (req, res, next) => {
    try {
        const { location, lat, lng } = req.query;
        let spots;

        if (lat && lng) {
            // If coordinates provided, search all spots and calculate distances
            spots = await prisma.campspot.findMany({
                include: {
                    location: true,
                    amenities: true
                }
            });

            // Calculate distances
            spots = spots.map(spot => {
                if (spot.location.latitude && spot.location.longitude) {
                    const distance = calculateDistance(
                        parseFloat(lat),
                        parseFloat(lng),
                        spot.location.latitude,
                        spot.location.longitude
                    );
                    return {
                        ...spot,
                        distance
                    };
                }
                return spot;
            });

            // Sort by distance
            spots.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        } else if (location) {
            // Search by city or country
            spots = await prisma.campspot.findMany({
                include: {
                    location: true,
                    amenities: true
                },
                where: {
                    OR: [
                        {
                            location: {
                                city: {
                                    contains: location
                                }
                            }
                        },
                        {
                            location: {
                                country: {
                                    contains: location
                                }
                            }
                        }
                    ]
                }
            });
        } else {
            // Return all spots
            spots = await prisma.campspot.findMany({
                include: {
                    location: true,
                    amenities: true
                }
            });
        }

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

        // Fetch spot with location and amenities and reviews
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
                }
            }
        });

        if (!spot) {
            return res.status(404).json({ message: 'Spot not found' });
        }

        // Allow access only to owner OR allow public view — here I assume owner-only view (consistent with old `/profile`)
        if (spot.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to view this campspot' });
        }

        return res.status(200).json(spot);
    } catch (error) {
        console.error('Error fetching single campspot:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

module.exports = router;
