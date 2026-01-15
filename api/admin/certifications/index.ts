import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import Certification from '../../../lib/models/Certification';
import { authMiddleware } from '../../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  // GET - List all certifications
  if (req.method === 'GET') {
    try {
      const certifications = await Certification.find({}).sort({ year: -1, createdAt: -1 });
      return res.status(200).json({ success: true, data: certifications });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST - Create new certification
  if (req.method === 'POST') {
    try {
      const certification = await Certification.create(req.body);
      return res.status(201).json({ success: true, data: certification });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // PUT - Update certification
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      console.log('[CERT API] PUT request received');
      console.log('[CERT API] ID:', id);
      console.log('[CERT API] Updates:', updates);
      const certification = await Certification.findByIdAndUpdate(id, updates, { new: true });
      
      if (!certification) {
        return res.status(404).json({ success: false, error: 'Certification not found' });
      }
      
      console.log('[CERT API] Updated certification featured:', certification.featured);
      return res.status(200).json({ success: true, data: certification });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // DELETE - Delete certification
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const certification = await Certification.findByIdAndDelete(id);
      
      if (!certification) {
        return res.status(404).json({ error: 'Certification not found' });
      }
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
