import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/mongodb';
import Settings from '../lib/models/Settings';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Get settings (there should only be one document)
    let settings = await Settings.findOne();
    
    // If no settings exist, create default
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
        whatIDo: '',
        focusArea: '',
        resumeUrl: '',
        achievements: [],
      });
    }
    
    return res.status(200).json(settings);
    
  } catch (error: any) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
