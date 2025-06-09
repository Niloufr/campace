var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// JWT Secret - In production, use environment variable
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

// Login route with JWT
router.post('/login', async function (req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { email: email },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        password: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create new user with hashed password and security question
router.post('/', async (req, res, next) => {
  try {
    const { password, security_question, security_answer, ...userData } = req.body;

    // Validate required fields
    if (!userData.user_name || !userData.email || !password || !security_question || !security_answer) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password and security answer
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const hashedSecurityAnswer = await bcrypt.hash(security_answer.toLowerCase().trim(), saltRounds);

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        security_question,
        security_answer: hashedSecurityAnswer
      }
    });

    // Remove sensitive data from response
    const { password: _, security_answer: __, ...userResponse } = newUser;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
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
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /me - get current user from token
router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({
    user_id: req.user.user_id,
    user_name: req.user.user_name,
    email: req.user.email
  });
});

// Logout route
router.post('/logout', authenticateToken, (req, res) => {
  // In JWT, no real "logout" on server side unless you implement token blacklisting
  // We simply tell client to delete token
  res.status(200).json({ message: 'Logged out successfully, please delete your token' });
});

// Get security question for password reset
router.post('/forgot-password/question', async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { security_question: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      security_question: user.security_question
    });
  } catch (error) {
    console.error('Error fetching security question:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Verify security answer and reset password
router.post('/forgot-password/reset', async (req, res, next) => {
  const { email, security_answer, new_password } = req.body;

  if (!email || !security_answer || !new_password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { user_id: true, security_answer: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify security answer
    const isValidAnswer = await bcrypt.compare(
      security_answer.toLowerCase().trim(),
      user.security_answer
    );

    if (!isValidAnswer) {
      return res.status(401).json({ message: 'Incorrect security answer' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedNewPassword }
    });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update user (protected route)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, security_answer, ...userData } = req.body;

    // Only allow users to update their own profile
    if (req.user.user_id !== parseInt(id)) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }

    let updateData = { ...userData };

    // Hash password if provided
    if (password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Hash security answer if provided
    if (security_answer) {
      const saltRounds = 12;
      updateData.security_answer = await bcrypt.hash(security_answer.toLowerCase().trim(), saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: updateData
    });

    // Remove sensitive data from response
    const { password: _, security_answer: __, ...userResponse } = updatedUser;

    res.json(userResponse);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (protected route)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only allow users to delete their own profile
    if (req.user.user_id !== parseInt(id)) {
      return res.status(403).json({ message: 'Unauthorized to delete this profile' });
    }

    await prisma.user.delete({
      where: { user_id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Token refresh route
router.post('/refresh-token', authenticateToken, (req, res) => {
  try {
    const newToken = jwt.sign(
      {
        user_id: req.user.user_id,
        user_name: req.user.user_name,
        email: req.user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
