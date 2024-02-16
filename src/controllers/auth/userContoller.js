const bcrypt = require('bcrypt');
const jwtUtils = require('../../services/jwtUtils');
const prisma = require('../../database');

async function getUsers(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const totalCount = await prisma.user.count();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        userName: true,
        role: true,
      },
      skip: (page - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    });

    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.json({
      items: users,
      totalCount: totalCount,
      pageSize: parseInt(pageSize, 10),
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
    });

  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function createUser(req, res) {
  try {
    const { userName, password, passwordConfirmation, roleId } = req.body;

    if (!userName || !password || !passwordConfirmation || !roleId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Password and password confirmation do not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        userName,
        password: hashedPassword,
        roleId,
      },
      include: { role: true },
    });

    res.json(createdUser);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).send('Internal Server Error');
  }
}

async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { userName, roleId } = req.body;

    if (!userName || !roleId) {
      return res.status(400).json({ error: 'Username and role are required fields' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userName,
        roleId,
      },
      include: { role: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).send('Internal Server Error');
  }
}

async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const deletedUser = await prisma.user.delete({
      where: { id: userId },
      include: { role: true },
    });

    res.json(deletedUser);
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).send('Internal Server Error');
  }
}

async function getUserById(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function login(req, res) {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ error: 'Username and password are required fields' });
    }

    const user = await prisma.user.findUnique({
      where: { userName },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwtUtils.generateToken(user);

    res.json({ accessToken, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  login,
};
