var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


//book a spot
router.post('/', async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const bookingData = req.body;
        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);
        const existingBooking = await prisma.booking.findFirst({
            where: {
                campspot_id: bookingData.campspot_id,
                startDate: {
                    lte: endDate,
                },
                endDate: {
                    gte: startDate,
                },
            },
        });
        if (existingBooking) {
            return res.status(400).json({ message: 'Campspot is already booked for the selected dates' });
        }
        const campspot = await prisma.campspot.findFirst({
            where: {
                campspot_id: bookingData.campspot_id,
            },
        });
        if (!campspot) {
            return res.status(404).json({ message: 'Campspot not found' });
        }
        if (campspot.owner_id === req.session.user.user_id) {
            return res.status(403).json({ message: 'Cannot book your own campspot' });
        }
        bookingData.user_id = req.session.user.user_id;
        bookingData.startDate = startDate;
        bookingData.endDate = endDate;
        const nbOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        bookingData.totalPrice = nbOfNights * campspot.price_per_night;
        const newBooking = await prisma.booking.create({
            data: bookingData,
        });
        res.status(201).json(newBooking);


    } catch (error) {
        next(error);
    }

});

//accept a booking




module.exports = router;