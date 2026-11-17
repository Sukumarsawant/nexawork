import { createClient } from '@supabase/supabase-js';

import { localSupabaseConfig } from './local-supabase.mjs';

const { url, anonKey } = localSupabaseConfig();

const password = 'NexaworkDemo123!';

function client() {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function createAccount(label, role, name) {
  const supabase = client();
  const email = `${label}@nexawork.test`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, name } },
  });
  if (error || !data.user) throw error || new Error(`No user was created for ${label}.`);

  const signedIn = data.session
    ? { data: { session: data.session }, error: null }
    : await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    throw signedIn.error || new Error(`No session was created for ${label}.`);
  }
  supabase.auth.setSession(signedIn.data.session);
  return { supabase, id: data.user.id, email };
}

const studentA = await createAccount('student-a', 'student', 'Student A');
const studentB = await createAccount('student-b', 'student', 'Student B');
const business = await createAccount('business', 'business', 'Business Owner');

const { error: projectError } = await studentA.supabase.from('projects').insert({
  user_id: studentA.id,
  title: 'Local portfolio fixture',
  description: 'Synthetic project used only for local database setup.',
  technologies: ['Next.js', 'Supabase'],
  role: 'Developer',
});
if (projectError) throw projectError;

const { data: job, error: jobError } = await business.supabase.from('jobs').insert({
  posted_by: business.id,
  title: 'Local frontend internship',
  description: 'Synthetic job used only for local database setup.',
  company_name: 'Nexawork Local',
  location: 'Remote',
  employment_type: 'internship',
  seniority_level: 'entry',
}).select('id').single();
if (jobError) throw jobError;

const { error: postError } = await studentA.supabase.from('community_posts').insert({
  id: crypto.randomUUID(),
  user_id: studentA.id,
  content: 'Welcome to the local Nexawork feed fixture.',
});
if (postError) throw postError;

console.log(JSON.stringify({
  studentA: studentA.id,
  studentB: studentB.id,
  business: business.id,
  job: job.id,
}, null, 2));
