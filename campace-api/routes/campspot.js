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
        campspotData.owner_id = req.session.user.user_id;
        const newCampspot = await prisma.campspot.create({
            data: campspotData
        });
        

        res.status(201).json(newCampspot);

    } catch(error) {    
        next(error);
    }

});
