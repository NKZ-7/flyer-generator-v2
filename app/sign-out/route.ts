import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Redirect to home — derive base URL from the request
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
