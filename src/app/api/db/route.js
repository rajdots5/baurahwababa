import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin as supabase } from '../../../utils/supabaseAdmin';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

export const dynamic = 'force-dynamic';

// Casing Mapping Helpers
function mapMathadhishFromDb(m) {
  if (!m) return { name: "", phone: "", details: "", photoUrl: "" };
  return {
    name: m.name || "",
    phone: m.phone || "",
    details: m.details || "",
    photoUrl: m.photourl || m.photoUrl || ""
  };
}

function mapMathadhishToDb(m) {
  if (!m) return {};
  return {
    name: m.name,
    phone: m.phone,
    details: m.details,
    photourl: m.photoUrl
  };
}

function mapScheduleFromDb(s) {
  if (!s) return null;
  return {
    id: s.id,
    date: s.date,
    time: s.time,
    toDate: s.todate || s.date,
    toTime: s.totime || s.time,
    pujaName: s.pujaname || s.pujaName,
    conductor: s.conductor,
    featured: s.featured || false
  };
}

function mapScheduleToDb(s) {
  if (!s) return null;
  return {
    id: s.id.toString(),
    date: s.date,
    time: s.time,
    todate: s.toDate || s.date,
    totime: s.toTime || s.time,
    pujaname: s.pujaName,
    conductor: s.conductor,
    featured: s.featured || false
  };
}

function mapGalleryFromDb(g) {
  if (!g) return null;
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    imageUrl: g.imageurl || g.imageUrl,
    featured: g.featured || false
  };
}

function mapGalleryToDb(g) {
  if (!g) return null;
  return {
    id: g.id.toString(),
    title: g.title,
    description: g.description,
    imageurl: g.imageUrl,
    featured: g.featured || false
  };
}

export async function GET() {
  let mathadhish = { name: "", phone: "", details: "", photoUrl: "" };
  let schedule = [];
  let donors = [];
  let gallery = [];
  let fallbackToLocal = false;

  // Read local DB to get default items for auto-seeding
  let localDb = { mathadhish, schedule, donors, gallery };
  try {
    if (fs.existsSync(dbPath)) {
      const fileContents = fs.readFileSync(dbPath, 'utf8');
      localDb = JSON.parse(fileContents);
    }
  } catch (err) {
    console.error('Failed to read local database:', err);
  }

  try {
    // 1. Mathadhish
    const { data: mathadhishData, error: mError } = await supabase
      .from('mathadhish')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (mError) throw mError;
    if (mathadhishData) {
      mathadhish = mapMathadhishFromDb(mathadhishData);
    } else {
      // Seed mathadhish in Supabase if table is empty
      const defaultMathadhish = localDb.mathadhish || mathadhish;
      await supabase.from('mathadhish').insert({ id: 1, ...mapMathadhishToDb(defaultMathadhish) });
      mathadhish = defaultMathadhish;
    }

    // 2. Schedule
    const { data: scheduleData, error: sError } = await supabase
      .from('schedule')
      .select('*')
      .order('date', { ascending: true });

    if (sError) throw sError;
    if (scheduleData) {
      schedule = scheduleData.map(mapScheduleFromDb);
    }

    // 3. Donors
    const { data: donorsData, error: dError } = await supabase
      .from('donors')
      .select('*');

    if (dError) throw dError;
    if (donorsData) {
      donors = donorsData;
    }

    // 4. Gallery
    const { data: galleryData, error: gError } = await supabase
      .from('gallery')
      .select('*');

    if (gError) throw gError;
    if (galleryData) {
      gallery = galleryData.map(mapGalleryFromDb);
    }

    // Save/Sync back to local db.json (will fail silently in read-only environments like Vercel)
    try {
      const syncedDb = { mathadhish, schedule, donors, gallery };
      fs.writeFileSync(dbPath, JSON.stringify(syncedDb, null, 2), 'utf8');
    } catch (fsError) {
      console.warn('Could not write to local db.json (expected in Vercel):', fsError.message);
    }

  } catch (error) {
    console.warn('GET error from Supabase, falling back to local JSON database:', error.message);
    fallbackToLocal = true;
  }

  if (fallbackToLocal) {
    return NextResponse.json({
      mathadhish: localDb.mathadhish || mathadhish,
      schedule: localDb.schedule || schedule,
      donors: localDb.donors || [],
      gallery: localDb.gallery || []
    });
  }

  return NextResponse.json({ mathadhish, schedule, donors, gallery });
}

export async function POST(request) {
  let supabaseSuccess = true;
  let supabaseErrorMsg = '';
  let data;

  try {
    data = await request.json();
    
    // 1. Mathadhish
    if (data.mathadhish) {
      const { error: mError } = await supabase
        .from('mathadhish')
        .upsert({
          id: 1,
          ...mapMathadhishToDb(data.mathadhish)
        });
      if (mError) throw mError;
    }

    // 2. Schedule
    if (data.schedule) {
      const { error: delError } = await supabase
        .from('schedule')
        .delete()
        .neq('id', '0');
      if (delError) throw delError;

      if (data.schedule.length > 0) {
        const newSchedules = data.schedule.map(mapScheduleToDb);
        const { error: insError } = await supabase
          .from('schedule')
          .insert(newSchedules);
        if (insError) throw insError;
      }
    }

    // 3. Donors
    if (data.donors) {
      const { error: delDonError } = await supabase
        .from('donors')
        .delete()
        .neq('id', '0');
      if (delDonError) throw delDonError;

      if (data.donors.length > 0) {
        const newDonors = data.donors.map(item => ({
          id: item.id.toString(),
          name: item.name,
          type: item.type,
          amount: item.amount,
          details: item.details
        }));
        const { error: insDonError } = await supabase
          .from('donors')
          .insert(newDonors);
        if (insDonError) throw insDonError;
      }
    }

    // 4. Gallery
    if (data.gallery) {
      const { error: delGalError } = await supabase
        .from('gallery')
        .delete()
        .neq('id', '0');
      if (delGalError) throw delGalError;

      if (data.gallery.length > 0) {
        const newGallery = data.gallery.map(mapGalleryToDb);
        const { error: insGalError } = await supabase
          .from('gallery')
          .insert(newGallery);
        if (insGalError) throw insGalError;
      }
    }
  } catch (error) {
    console.warn('POST error to Supabase, falling back to local JSON database:', error.message);
    supabaseSuccess = false;
    supabaseErrorMsg = error.message;
  }

  // Always write to local db.json as backup/fallback
  try {
    if (data) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (localError) {
    console.warn('Could not write to local db.json during POST (expected on Vercel):', localError.message);
  }

  return NextResponse.json({ 
    success: true, 
    supabase: supabaseSuccess, 
    supabaseError: supabaseErrorMsg,
    data 
  });
}
