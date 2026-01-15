import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import Project from '../../../lib/models/Project';
import { authMiddleware } from '../../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  // GET - List all projects
  if (req.method === 'GET') {
    try {
      const projects = await Project.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: projects });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST - Create new project
  if (req.method === 'POST') {
    try {
      const project = await Project.create(req.body);
      return res.status(201).json({ success: true, data: project });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // PUT - Update project
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      console.log('[PROJ API] PUT request received');
      console.log('[PROJ API] ID:', id);
      console.log('[PROJ API] Updates:', updates);
      const project = await Project.findByIdAndUpdate(id, updates, { new: true });
      
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      
      console.log('[PROJ API] Updated project featured:', project.featured);
      return res.status(200).json({ success: true, data: project });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // DELETE - Delete project
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const project = await Project.findByIdAndDelete(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
