import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '../../../utils/supabase';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

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
    pujaName: s.pujaname || s.pujaName,
    conductor: s.conductor
  };
}

function mapScheduleToDb(s) {
  if (!s) return null;
  return {
    id: s.id.toString(),
    date: s.date,
    time: s.time,
    pujaname: s.pujaName,
    conductor: s.conductor
  };
}

function mapGalleryFromDb(g) {
  if (!g) return null;
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    imageUrl: g.imageurl || g.imageUrl
  };
}

function mapGalleryToDb(g) {
  if (!g) return null;
  return {
    id: g.id.toString(),
    title: g.title,
    description: g.description,
    imageurl: g.imageUrl
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
    if (scheduleData && scheduleData.length > 0) {
      schedule = scheduleData.map(mapScheduleFromDb);
    } else if (localDb.schedule && localDb.schedule.length > 0) {
      // Seed schedules to Supabase
      const newSchedules = localDb.schedule.map(mapScheduleToDb);
      await supabase.from('schedule').insert(newSchedules);
      schedule = localDb.schedule;
    }

    // 3. Donors
    const { data: donorsData, error: dError } = await supabase
      .from('donors')
      .select('*');

    if (dError) throw dError;
    if (donorsData && donorsData.length > 0) {
      donors = donorsData;
    } else if (localDb.donors && localDb.donors.length > 0) {
      // Seed donors to Supabase
      const newDonors = localDb.donors.map(item => ({
        id: item.id.toString(),
        name: item.name,
        type: item.type,
        amount: item.amount,
        details: item.details
      }));
      await supabase.from('donors').insert(newDonors);
      donors = localDb.donors;
    }

    // 4. Gallery
    const { data: galleryData, error: gError } = await supabase
      .from('gallery')
      .select('*');

    if (gError) throw gError;
    if (galleryData && galleryData.length > 0) {
      gallery = galleryData.map(mapGalleryFromDb);
    } else if (localDb.gallery && localDb.gallery.length > 0) {
      // Seed gallery to Supabase
      const newGallery = localDb.gallery.map(mapGalleryToDb);
      await supabase.from('gallery').insert(newGallery);
      gallery = localDb.gallery;
    }

    // Save/Sync back to local db.json
    const syncedDb = { mathadhish, schedule, donors, gallery };
    fs.writeFileSync(dbPath, JSON.stringify(syncedDb, null, 2), 'utf8');

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
    return NextResponse.json({ 
      success: true, 
      supabase: supabaseSuccess, 
      supabaseError: supabaseErrorMsg,
      data 
    });
  } catch (localError) {
    return NextResponse.json({ error: 'Failed to write to local database' }, { status: 500 });
  }
}
