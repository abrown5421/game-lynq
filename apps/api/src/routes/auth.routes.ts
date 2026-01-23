import { Router } from 'express';
import { UserModel } from '../entities/user/user.model';
import { comparePassword, hashPassword } from '../shared/password';
import { generateToken, verifyToken } from '../shared/jwt';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, type } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashed = await hashPassword(password);
    const user = await UserModel.create({ firstName, lastName, email, password: hashed, type });

    const token = generateToken(user._id.toString());
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, 
    });
    
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      type: user.type,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    res.status(201).json(userResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await comparePassword(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user._id.toString());
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      type: user.type,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    res.json(userResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out' });
});

router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = await UserModel.findById(decoded.userId).select('-password');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

export default router;