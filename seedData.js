// Firebase seeding — only works when Firebase is fully initialised
// import { firestore, Collections } from './firebase';
const Collections = { JOBS: 'jobs', COMPANIES: 'companies' };

export const seedJobs = async () => {
  const jobs = [
    {
      emoji: '🏗️',
      bg: '#EFF6FF',
      accent: '#3B82F6',
      title: 'Site Engineer',
      company: 'Shapoorji Pallonji',
      location: 'Ahmedabad, Gujarat',
      pay: '₹45,000/mo',
      type: 'Full Time',
      urgent: false,
      posted: '2 days ago',
      applicants: 34,
      exp: '3-5 years',
      skills: ['RCC', 'AutoCAD', 'Site Management'],
      desc: 'Looking for experienced site engineer for G+10 residential project in Bopal.',
    },
    {
      emoji: '⚡',
      bg: '#FEFCE8',
      accent: '#D97706',
      title: 'Electrical Supervisor',
      company: 'L&T Construction',
      location: 'Gandhinagar, Gujarat',
      pay: '₹55,000/mo',
      type: 'Full Time',
      urgent: true,
      posted: '1 day ago',
      applicants: 12,
      exp: '5+ years',
      skills: ['HT/LT Panels', 'Industrial', 'Safety'],
      desc: 'Urgent requirement for electrical supervisor for industrial project at GIDC.',
    },
    {
      emoji: '🏛️',
      bg: '#F0FDF4',
      accent: '#16A34A',
      title: 'Junior Architect',
      company: 'Space Design Co.',
      location: 'Surat, Gujarat',
      pay: '₹30,000/mo',
      type: 'Full Time',
      urgent: false,
      posted: '5 days ago',
      applicants: 56,
      exp: '0-2 years',
      skills: ['SketchUp', 'Revit', '3D Rendering'],
      desc: 'Fresh graduates welcome! Looking for creative junior architect.',
    },
  ];

  console.log('seedJobs: Firebase not yet enabled — skipping.');
};

export const seedCompanies = async () => {
  const companies = [
    {
      emoji: '🏢',
      name: 'Shapoorji Pallonji',
      type: 'Developer',
      location: 'Ahmedabad, Gujarat',
      rating: '4.9',
      reviews: 234,
      verified: true,
      tags: ['Residential', 'Commercial', 'Infrastructure'],
      desc: 'One of India\'s largest construction companies.',
    },
    {
      emoji: '🏭',
      name: 'Gujarat Ready Mix Co.',
      type: 'RMC Supplier',
      location: 'Odhav, Ahmedabad',
      rating: '4.8',
      reviews: 320,
      verified: true,
      tags: ['M15-M60', 'GPS Tracking', 'ISO 9001'],
      desc: 'Gujarat\'s most trusted RMC supplier.',
    },
  ];

  console.log('seedCompanies: Firebase not yet enabled — skipping.');
};