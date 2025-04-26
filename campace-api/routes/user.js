var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// login
router.post('/login', async function (req, res, next) {
  const { email, password } = req.body; 
  
  try {
    const user = await prisma.user.findFirst({where: { email: email}, select: { user_id: true, user_name: true, email: true, password: true }});
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email
    };

    
    return res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
  
});

// create new user
router.post('/', async (req, res, next) => {
  try {
    const userData = req.body;
    console.log(userData)
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
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
  const email = req.cookies.email || req.query.email;
  

  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.session.user.user_id },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        date_joined: true
        
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    } 
    return res.status(200).json(user);

  } catch (error) {
    console.log('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
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