import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { connectDB } from '../../../lib/mongodb';
import { OTP } from '../../../lib/models/OTP';
import Settings from '../../../lib/models/Settings';

// Generate 6-digit alphanumeric OTP
function generateOTP(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Fetch admin email from settings
    const settings = await Settings.findOne();
    if (!settings || !settings.email) {
      return res.status(400).json({ error: 'Admin email not configured in settings' });
    }

    const adminEmail = settings.email;

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: adminEmail });

    // Save new OTP
    await OTP.create({
      email: adminEmail,
      otp,
      expiresAt,
      verified: false,
    });

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send OTP email
    await transporter.sendMail({
      from: `"Portfolio Admin" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: 'Knock Knock 👀 Here’s Your Access Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin-bottom: 10px;">Admin Login OTP</h1>
            <p style="color: #a1a1a1;">Your one-time password for admin access</p>
          </div>
          
          <div style="background-color: #1a1a1a; border: 2px solid #10b981; border-radius: 12px; padding: 30px; text-align: center;">
            <p style="color: #a1a1a1; margin-bottom: 20px;">Your OTP is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981; margin: 20px 0;">${otp}</div>
            <p style="color: #717171; font-size: 14px; margin-top: 20px;">This OTP will expire in 5 minutes</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #717171; font-size: 12px;">
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p style="margin-top: 10px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent to your email',
      email: adminEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
    });

  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
}
