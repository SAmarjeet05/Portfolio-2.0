import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import Gallery from '../../../lib/models/Gallery';
import { authMiddleware } from '../../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  // GET: Fetch all gallery items
  if (req.method === 'GET') {
    try {
      const gallery = await Gallery.find().sort({ date: -1, createdAt: -1 });
      res.status(200).json({ success: true, data: gallery });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }

  // POST: Create new gallery item
  if (req.method === 'POST') {
    try {
      const { title, image, description, category, date } = req.body;

      if (!title || !image) {
        res.status(400).json({ 
          success: false, 
          message: 'Title and image are required' 
        });
        return;
      }

      const newItem = await Gallery.create({
        title,
        image,
        description,
        category,
        date,
      });

      res.status(201).json({ success: true, data: newItem });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }

  // PUT: Update gallery item
  if (req.method === 'PUT') {
    try {
      const { id, title, image, description, category, date } = req.body;

      if (!id) {
        res.status(400).json({ 
          success: false, 
          message: 'Gallery item ID is required' 
        });
        return;
      }

      const updated = await Gallery.findByIdAndUpdate(
        id,
        { title, image, description, category, date },
        { new: true, runValidators: true }
      );

      if (!updated) {
        res.status(404).json({ 
          success: false, 
          message: 'Gallery item not found' 
        });
        return;
      }

      res.status(200).json({ success: true, data: updated });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }

  // DELETE: Delete gallery item
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        res.status(400).json({ 
          success: false, 
          message: 'Gallery item ID is required' 
        });
        return;
      }

      const deleted = await Gallery.findByIdAndDelete(id);

      if (!deleted) {
        res.status(404).json({ 
          success: false, 
          message: 'Gallery item not found' 
        });
        return;
      }

      res.status(200).json({ 
        success: true, 
        message: 'Gallery item deleted successfully' 
      });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }

  res.status(405).json({ message: 'Method not allowed' });
}

export default authMiddleware(handler);
