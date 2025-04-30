var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//add amenity to spot (owner)

router.post('/', async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const amenityData = req.body;
        const campspot = await prisma.campspot.findFirst({
            where: {
                campspot_id: amenityData.campspot_id
            }
        });
        if (campspot.owner_id = !req.session.user) {
            return res.status(403).json({ message: 'Not authorized' })
        };
        const existingAmenity = await prisma.campspotAmenity.findFirst(
            {
                where: {
                    campspot_id: amenityData.campspot_id,
                    amenity_name: amenityData.amenity_name
                }

            }
        );
        if (existingAmenity) {
            return res.status(409).json("This amenity has been already added.")
        };
        const newAmenity = await prisma.campspotAmenity.create({
            data: amenityData
        });

        res.status(201).json(newAmenity);

    } catch (error) {
        next(error)
    }
});





module.exports = router;