var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//add new location
router.post('/', async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const locationData = req.body;
        locationData.owner_id = req.session.user.user_id;
        const newLocation = await prisma.location.create({
            data: locationData
        });


        res.status(201).json(newLocation);

    } catch (error) {
        next(error);
    }

});

//get locations
router.get('/', async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const locations = await prisma.location.findMany({
            where: { owner_id: req.session.user.user_id }

        });

        return res.status(200).json(locations);


    } catch (error) {
        console.log('Error fetching loctions:', error);
        return res.status(500).json({ message: 'Server error' });
    }
})

module.exports = router;