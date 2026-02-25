
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wsebwpnorilwifthfwgh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZWJ3cG5vcmlsd2lmdGhmd2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjI5NDUsImV4cCI6MjA4Njk5ODk0NX0.iy_ZUBmcZ2AzEAFX-08yRXOjod56EXMo8SPV8hH6y_Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
