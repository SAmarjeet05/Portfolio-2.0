import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import Blog from '../../../lib/models/Blog';
import { authMiddleware } from '../../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  // GET - List all blogs
  if (req.method === 'GET') {
    try {
      const blogs = await Blog.find({}).sort({ createdAt: -1 });
      return res.status(200).json(blogs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create new blog
  if (req.method === 'POST') {
    try {
      const blog = await Blog.create(req.body);
      return res.status(201).json(blog);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // PUT - Update blog
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      const blog = await Blog.findByIdAndUpdate(id, updates, { new: true });
      
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
      
      return res.status(200).json(blog);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // DELETE - Delete blog
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const blog = await Blog.findByIdAndDelete(id);
      
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
