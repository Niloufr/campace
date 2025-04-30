var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//add new spot
router.post('/', async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const campspotData = req.body;
        const location = await prisma.location.findFirst({
            where: {
                location_id: campspotData.location_id
            }
        })
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        if (location.owner_id !== req.session.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to add campspot to this location' });
        }
        campspotData.owner_id = req.session.user.user_id;
        const newCampspot = await prisma.campspot.create({
            data: campspotData
        });


        res.status(201).json(newCampspot);

    } catch (error) {
        next(error);
    }

});

//get campspot overview
router.get('/', async (req, res, next) => {


    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }



        const campspots = await prisma.campspot.findMany({
            where: { owner_id: req.session.user.user_id },
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
                },

                //TODO add average rating - reviews

            }


        });

        return res.status(200).json(campspots);


    } catch (error) {
        console.error('Error fetching campspots:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;