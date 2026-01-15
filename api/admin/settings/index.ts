import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../../lib/mongodb';
import Settings from '../../../lib/models/Settings';
import { authMiddleware } from '../../../lib/auth';

async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  // GET - Get settings
  if (req.method === 'GET') {
    try {
      let settings = await Settings.findOne();
      
      // Create default if doesn't exist
      if (!settings) {
        settings = await Settings.create({
          fullName: 'Your Name',
          tagline: 'Full Stack Developer',
          bio: 'Add your bio here',
          profileImage: 'https://ui-avatars.com/api/?name=User&size=400&background=00D9FF&color=fff&bold=true',
          email: 'your.email@example.com',
          phone: '',
          github: '',
          linkedin: '',
          twitter: '',
          buyMeACoffee: '',
          discord: '',
          spotify: '',
          gmail: '',
          whatIDo: '',
          focusArea: '',
          resumeUrl: '',
          achievements: [],
        });
      }
      
      res.status(200).json({ success: true, data: settings });
      return;
    } catch (error: any) {
      console.error('Settings GET error:', error);
      res.status(500).json({ success: false, error: error.message });
      return;
    }
  }

  // PUT - Update settings
  if (req.method === 'PUT') {
    try {
      const updates = req.body;
      
      // Find and update or create
      let settings = await Settings.findOne();
      
      if (settings) {
        settings = await Settings.findByIdAndUpdate(settings._id, updates, { new: true, runValidators: true });
      } else {
        settings = await Settings.create(updates);
      }
      
      res.status(200).json({ success: true, data: settings });
      return;
    } catch (error: any) {
      console.error('Settings PUT error:', error);
      res.status(400).json({ success: false, error: error.message });
      return;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
