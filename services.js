// Re-export from modular service files
export { getAllJobs as getJobs } from './services/jobService';
export { saveProfile as saveUserProfile, getProfile as getUserProfile } from './services/userService';
export { postJob } from './services/jobService';

export const getCompanies = async () => [];
export const getCourses = async () => [];
