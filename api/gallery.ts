import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/mongodb';
import Gallery from '../lib/models/Gallery';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const gallery = await Gallery.find()
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: gallery });
  } catch (error: any) {
    console.error('Error fetching gallery:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch gallery items' 
    });
  }
}
