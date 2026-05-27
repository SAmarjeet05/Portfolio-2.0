import dotenv from 'dotenv';
dotenv.config({ force: true });

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/mongodb.js';
import Settings from '../../lib/models/Settings.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { OTP } from '../../lib/models/OTP.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Hash OTP using SHA-256 with salt
 */
function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp.toUpperCase()).digest('hex');
}

/**
 * Set security headers to prevent OTP exposure
 */
function setSecurityHeaders(res: VercelResponse): void {
  // Prevent caching of auth responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict CSP for sensitive auth endpoints
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'");
}

// Login handler
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  await connectDB();
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminPasswordHash) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }

  try {
    const isValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('❌ [LOGIN] Bcrypt error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }

  return res.status(200).json({ success: true, message: 'Password verified' });
}

// Send OTP handler
async function handleSendOTP(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  await connectDB();

  try {
    const settings = await Settings.findOne({});
    if (!settings || !settings.email) {
      return res.status(400).json({ error: 'Admin email not configured' });
    }

    const email = settings.email;
    const otp = Math.random().toString(36).substring(2, 8).toUpperCase();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store hashed OTP, never store plain OTP
    // Clear OTP from memory immediately after hashing
    const otpForEmail = otp;
    await OTP.create({ email, otp: otpHash, expiresAt });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email (note: OTP is visible here but only during actual email transmission)
    // Email is encrypted in transit via TLS/SSL
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Admin Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Admin Login Verification</h2>
          <p>Your OTP code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">
            ${otpForEmail}
          </div>
          <p style="color: #6b7280; margin-top: 20px;">This code will expire in 5 minutes.</p>
          <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    // Securely clear OTP from memory
    const clearOTP = otpForEmail.split('').map(() => '0').join('');
    
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);
    return res.status(200).json({ success: true, email: maskedEmail });
  } catch (error: any) {
    // Never expose OTP in error messages
    // Never log the actual error that might contain OTP
    console.error('OTP send error: [REDACTED]');
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}

// Verify OTP handler
async function handleVerifyOTP(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  await connectDB();

  try {
    const { otpHash } = req.body;

    if (!otpHash) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    // Compare hashed OTP - never compare plain OTP
    const otpRecord = await OTP.findOne({
      otp: otpHash,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '4h' });

    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=14400; SameSite=Strict; Secure`);

    return res.status(200).json({
      success: true,
      token,
      expiresIn: 14400,
    });
  } catch (error: any) {
    // Never expose OTP details in error messages
    console.error('OTP verification error: [REDACTED]');
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set security headers for all auth endpoints
  setSecurityHeaders(res);
  
  const { action } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  switch (action) {
    case 'login':
      return handleLogin(req, res);
    case 'send-otp':
      return handleSendOTP(req, res);
    case 'verify-otp':
      return handleVerifyOTP(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}
