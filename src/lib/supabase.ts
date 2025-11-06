import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  submitter_id: string;
  submitter_name: string;
  assigned_unit: string;
  assigned_handler: string;
  ai_response: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  deadline: string | null;
}

export interface RequestComment {
  id: string;
  request_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'submitter' | 'handler';
  created_at: string;
}

export const CATEGORIES = [
  'IT and Technical Support',
  'Facilities and Maintenance',
  'Equipment and Furniture',
  'Safety and Fire Protection',
  'HR and Staff Matters',
  'Other'
] as const;

export const PRIORITIES = [
  { value: 'Critical', color: 'bg-red-100 text-red-800 border-red-300', icon: '🔴' },
  { value: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🟠' },
  { value: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🟡' },
  { value: 'Low', color: 'bg-green-100 text-green-800 border-green-300', icon: '🟢' }
] as const;

export const STATUSES = [
  { value: 'Received', color: 'bg-blue-100 text-blue-800' },
  { value: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  { value: 'Resolved', color: 'bg-green-100 text-green-800' }
] as const;
