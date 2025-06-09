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

// Add amenity to spot (protected, owner only)
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const amenityData = req.body;

        const campspot = await prisma.campspot.findFirst({
            where: { campspot_id: amenityData.campspot_id }
        });

        if (!campspot) {
            return res.status(404).json({ message: 'Campspot not found' });
        }

        if (campspot.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const existingAmenity = await prisma.campspotAmenity.findFirst({
            where: {
                campspot_id: amenityData.campspot_id,
                amenity_name: amenityData.amenity_name
            }
        });

        if (existingAmenity) {
            return res.status(409).json({ message: 'This amenity has already been added.' });
        }

        const newAmenity = await prisma.campspotAmenity.create({
            data: amenityData
        });

        res.status(201).json(newAmenity);
    } catch (error) {
        next(error);
    }
});

// Get amenities (protected)
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const where = {};
        if (req.query.campspot_id !== undefined) {
            where.campspot_id = parseInt(req.query.campspot_id);
        }

        const amenities = await prisma.campspotAmenity.findMany({
            where: where
        });

        res.status(200).json(amenities);
    } catch (error) {
        next(error);
    }
});

// Delete amenity (protected, owner only)
router.delete('/:amenity_id', authenticateToken, async (req, res, next) => {
    try {
        const amenity_id = parseInt(req.params.amenity_id);

        const amenity = await prisma.campspotAmenity.findFirst({
            where: { amenity_id: amenity_id }
        });

        if (!amenity) {
            return res.status(404).json({ message: 'Amenity not found' });
        }

        const campspot = await prisma.campspot.findFirst({
            where: { campspot_id: amenity.campspot_id }
        });

        if (!campspot) {
            return res.status(404).json({ message: 'Campspot not found' });
        }

        if (campspot.owner_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await prisma.campspotAmenity.delete({
            where: { amenity_id }
        });

        return res.status(200).json({ message: 'Amenity deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
