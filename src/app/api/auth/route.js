import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_credentials')
      .select('role')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.error('Supabase auth error:', error.message);
      return NextResponse.json({ success: false, error: 'Auth service error: ' + error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' });
    }

    return NextResponse.json({ success: true, role: data.role });
  } catch (err) {
    console.error('Auth route exception:', err);
    return NextResponse.json({ success: false, error: 'Server error: ' + err.message }, { status: 500 });
  }
}
