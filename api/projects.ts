import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/mongodb';
import Project from '../lib/models/Project';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { id } = req.query;
    
    // Get single project by ID
    if (id) {
      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.status(200).json(project);
    }
    
    // Get all projects
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return res.status(200).json(projects);
    
  } catch (error: any) {
    console.error('Project API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
