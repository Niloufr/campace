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

// POST /reviews - create a review for a campspot (protected)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { campspot_id, rating, comment } = req.body;

        if (!campspot_id || !rating || !comment) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Only allow one review per user per campspot
        const existing = await prisma.review.findFirst({
            where: {
                user_id: req.user.user_id,
                campspot_id: parseInt(campspot_id)
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'You have already reviewed this spot.' });
        }

        const review = await prisma.review.create({
            data: {
                user_id: req.user.user_id,
                campspot_id: parseInt(campspot_id),
                rating: parseInt(rating),
                comment: comment
            }
        });

        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /reviews?campspot_id= - get all reviews for a campspot (public)
router.get('/', async (req, res) => {
    try {
        const { campspot_id } = req.query;

        if (!campspot_id) {
            return res.status(400).json({ message: 'campspot_id is required' });
        }

        const reviews = await prisma.review.findMany({
            where: { campspot_id: parseInt(campspot_id) },
            include: { user: { select: { user_name: true } } },
            orderBy: { date_posted: 'desc' }
        });

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /reviews/:review_id - delete a review (protected, only by author)
router.delete('/:review_id', authenticateToken, async (req, res) => {
    try {
        const review_id = parseInt(req.params.review_id);

        if (!review_id) {
            return res.status(400).json({ message: 'review_id is required' });
        }

        const review = await prisma.review.findUnique({ where: { review_id } });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.user_id !== req.user.user_id) {
            return res.status(403).json({ message: 'You can only delete your own review.' });
        }

        await prisma.review.delete({ where: { review_id } });

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
