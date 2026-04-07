import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cmpqnkvswugzozzobwiw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcHFua3Zzd3Vnem96em9id2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjkyNzUsImV4cCI6MjA5MTEwNTI3NX0.wWsqS16IbsKxxJJpQAOE9JTiHJwXcRDtIC36w5jibz0';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
