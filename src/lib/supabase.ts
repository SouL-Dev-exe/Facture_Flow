import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpsfqktkidgursmnqcep.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwc2Zxa3RraWRndXJzbW5xY2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODAyMjYsImV4cCI6MjEwNjg1NjIyNn0.2BpArHi6m2on4SoRUglZ0Y9_AxVOjEC5504SQvtdnJ0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
