import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(req) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const token = req.cookies['sb-access-token']; // Supabase stores token in cookies
  const url = req.nextUrl.clone();

  if (!token) {
    // If no token, redirect to login page
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (!user) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Fetch user profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Example: Protect student dashboard
  if (url.pathname.startsWith('/student') && profile.role !== 'student') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Example: Protect business dashboard
  if (url.pathname.startsWith('/business') && profile.role !== 'business') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Apply middleware only to dashboard routes
export const config = {
  matcher: ['/student/:path*', '/business/:path*'],
};
