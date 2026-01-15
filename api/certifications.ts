import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/mongodb';
import Certification from '../lib/models/Certification';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Get all certifications
    const certifications = await Certification.find({}).sort({ year: -1, createdAt: -1 });
    return res.status(200).json(certifications);
    
  } catch (error: any) {
    console.error('Certification API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
