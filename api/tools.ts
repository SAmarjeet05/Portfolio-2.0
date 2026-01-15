import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/mongodb';
import Tool from '../lib/models/Tool';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Get all tools, optionally filter by showOnHomepage
    const { homepage } = req.query;
    const filter = homepage === 'true' ? { showOnHomepage: true } : {};
    
    const tools = await Tool.find(filter).sort({ order: 1, name: 1 });
    return res.status(200).json(tools);
    
  } catch (error: any) {
    console.error('Tools API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
