import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Build a clean, unique filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${Date.now()}_${cleanName}`;

    // Convert file to ArrayBuffer → Buffer for Supabase upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage bucket "temple-images" using admin client
    const { data, error } = await supabaseAdmin.storage
      .from('temple-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the permanent public URL for the uploaded file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('temple-images')
      .getPublicUrl(data.path);

    return NextResponse.json({ success: true, imageUrl: publicUrlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
