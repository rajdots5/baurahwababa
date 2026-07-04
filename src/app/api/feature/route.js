import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';

export async function PATCH(request) {
  try {
    const { table, id, featured } = await request.json();
    const validTables = ['gallery', 'schedule', 'donors'];
    if (!validTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from(table)
      .update({ featured: Boolean(featured) })
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
