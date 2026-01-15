import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/mongodb';
import Blog from '../lib/models/Blog';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { slug } = req.query;
    
    // Get single blog by slug
    if (slug) {
      const blog = await Blog.findOne({ slug });
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
      return res.status(200).json(blog);
    }
    
    // Get all blogs
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    return res.status(200).json(blogs);
    
  } catch (error: any) {
    console.error('Blog API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
