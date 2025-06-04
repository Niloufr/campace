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

//get amenities
router.get('/', async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const where = {}
        if (req.query.campspot_id !== undefined) {
            where.campspot_id = parseInt(req.query.campspot_id)
        }
        const amenities = await prisma.campspotAmenity.findMany({
            where: where,
        });

        res.status(200).json(amenities);
    } catch (error) {
        next(error)
    }
});

//delete amenity
router.delete('/:amenity_id', async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const amenity_id = parseInt(req.params.amenity_id)
        const amenity = await prisma.campspotAmenity.findFirst({
            where: {
                amenity_id: amenity_id
            }
        })
        if (!amenity) {
            return res.status(404).json({ message: 'not found' })
        }
        const campspot = await prisma.campspot.findFirst({
            where: {
                campspot_id: amenity.campspot_id
            }
        })
        if (campspot.owner_id !== req.session.user.user_id) {
            return res.status(403).json({ message: "Not Authorized" })
        }
        await prisma.campspotAmenity.delete({
            where: {
                amenity_id
            }
        })
        return res.status(200).json({ message: 'Amenity deleted' })

    } catch (error) {
        next(error)
    }
})




module.exports = router;