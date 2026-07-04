import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * Route to verify Cloudflare Turnstile token
 * POST /api/turnstile/verify
 * Body: { token }
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing Turnstile token' });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('Missing TURNSTILE_SECRET_KEY in environment variables');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    // Call Cloudflare Turnstile siteverify API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return res.status(200).json({ success: true });
    } else {
      console.warn('Turnstile verification failed:', data['error-codes']);
      return res.status(400).json({ success: false, error: 'Invalid Turnstile token', details: data['error-codes'] });
    }
  } catch (error) {
    console.error('Error during Turnstile verification:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
