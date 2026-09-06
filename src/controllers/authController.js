import auth from '../lib/auth.js';
import prisma from '../lib/prisma.js';
import { fromNodeHeaders } from 'better-auth/node';

export async function getMe(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session found.',
      });
    }

    // Get cart item count for this user
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    const cartCount = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    res.json({
      success: true,
      data: {
        user: session.user,
        cartCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      asResponse: true,
    });

    // Forward set-cookie headers from Better Auth
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('set-cookie', setCookie);
    }

    const data = await response.json();
    res.status(response.status).json({
      success: response.status >= 200 && response.status < 300,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('set-cookie', setCookie);
    }

    const data = await response.json();
    res.status(response.status).json({
      success: response.status >= 200 && response.status < 300,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const response = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('set-cookie', setCookie);
    }

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}
