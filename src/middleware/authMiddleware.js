import { fromNodeHeaders } from 'better-auth/node';
import auth from '../lib/auth.js';

export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in to proceed.',
      });
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session && session.user) {
      req.user = session.user;
      req.session = session.session;
    }
  } catch (error) {
    // Ignore error for optional authentication
  }
  next();
}
