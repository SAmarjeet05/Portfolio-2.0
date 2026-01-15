import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import Experience from '../../../lib/models/Experience';
import { authMiddleware } from '../../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  // GET - List all experience
  if (req.method === 'GET') {
    try {
      const experiences = await Experience.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: experiences });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST - Create new experience
  if (req.method === 'POST') {
    try {
      const experience = await Experience.create(req.body);
      return res.status(201).json({ success: true, data: experience });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // PUT - Update experience
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      const experience = await Experience.findByIdAndUpdate(id, updates, { new: true });
      
      if (!experience) {
        return res.status(404).json({ success: false, error: 'Experience not found' });
      }
      
      return res.status(200).json({ success: true, data: experience });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // DELETE - Delete experience
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const experience = await Experience.findByIdAndDelete(id);
      
      if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
      }
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
