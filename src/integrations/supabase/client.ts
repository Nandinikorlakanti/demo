// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sjaaalkmiwempfbpwnfb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYWFhbGttaXdlbXBmYnB3bmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTgyMTEsImV4cCI6MjA2NDY3NDIxMX0.ioKPJLmaccafKDe9J0Icw0qaBElkMtnV1QLqLZe_Rio";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);