import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import { OTP } from '../../../lib/models/OTP';
import Settings from '../../../lib/models/Settings';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    // Fetch admin email from settings
    const settings = await Settings.findOne();
    if (!settings || !settings.email) {
      return res.status(400).json({ error: 'Admin email not configured' });
    }

    const adminEmail = settings.email;

    // Find the most recent valid OTP for this email
    const otpRecord = await OTP.findOne({
      email: adminEmail,
      otp: otp.toUpperCase(),
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Generate JWT token for admin session
    const token = jwt.sign(
      { admin: true, email: adminEmail, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=14400; SameSite=Strict; Secure`);

    // Delete all OTPs for this email after successful verification
    await OTP.deleteMany({ email: adminEmail });

    return res.status(200).json({ 
      success: true,
      token,
      expiresIn: 14400, // 4 hours in seconds
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
}
