import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import Tool from '../../../lib/models/Tool';
import { authMiddleware } from '../../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  // GET - List all tools
  if (req.method === 'GET') {
    try {
      const tools = await Tool.find({}).sort({ order: 1, name: 1 });
      res.status(200).json(tools);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // POST - Create new tool
  if (req.method === 'POST') {
    try {
      const tool = await Tool.create(req.body);
      res.status(201).json(tool);
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
  }

  // PUT - Update tool
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      const tool = await Tool.findByIdAndUpdate(id, updates, { new: true });
      
      if (!tool) {
        res.status(404).json({ error: 'Tool not found' });
        return;
      }
      
      res.status(200).json(tool);
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
  }

  // DELETE - Delete tool
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const tool = await Tool.findByIdAndDelete(id);
      
      if (!tool) {
        res.status(404).json({ error: 'Tool not found' });
        return;
      }
      
      res.status(200).json({ message: 'Tool deleted successfully' });
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
