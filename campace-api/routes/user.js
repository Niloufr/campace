var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all users
router.get('/', async function(req, res, next) {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// GET a single user by ID
router.get('/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// CREATE a new user
router.post('/', async (req, res, next) => {
  try {
    const userData = req.body;
    const newUser = await prisma.user.create({
      data: userData
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

// UPDATE a user
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: userData
    });
    
    res.json(updatedUser);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(error);
  }
});

// DELETE a user
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(error);
  }
});

module.exports = router;