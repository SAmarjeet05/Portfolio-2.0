import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/mongodb';
import Experience from '../lib/models/Experience';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Get all experience
    const experiences = await Experience.find({}).sort({ createdAt: -1 });
    return res.status(200).json(experiences);
    
  } catch (error: any) {
    console.error('Experience API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
