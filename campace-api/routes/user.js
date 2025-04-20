var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// login
router.post('/login', async function (req, res, next) {
  const { email, password } = req.body; 
  console.log(req.body)
  try {
    const user = await prisma.user.findFirst({where: { email: email}})
    if (user.password == password) {
      res.status(200)
    } else {
      res.status(401)
    }
    
    res.json()
  } catch (error) {
    next(error);
  }
  
});

// create new user
router.post('/', async (req, res, next) => {
  try {
    const userData = req.body;
    console.log(userData)
    const newUser = await prisma.user.create({
      data: userData
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

// get user info
router.get('/profile', async (req, res, next) => {
  const { email } = req.query;
  

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        user_name: true,
        email: true,
        
      }
    });

    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }

  } catch (error) {
    console.log('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
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