import Image from "next/image";
import fs from 'fs';
import path from 'path';
import styles from "./page.module.css";
import { supabase } from '../utils/supabase';
import VisitorCounter from "../components/VisitorCounter";

// Force this page to always fetch fresh data from Supabase (no caching)
export const dynamic = 'force-dynamic';

// Helper casing converters for Supabase columns
function mapMathadhishFromDb(m) {
  if (!m) return { name: "", phone: "", details: "", photoUrl: "" };
  return {
    name: m.name || "",
    phone: m.phone || "",
    details: m.details || "",
    photoUrl: m.photourl || m.photoUrl || ""
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

// Helper to read DB directly in Server Component
async function getTempleData() {
  let mathadhish = { name: "", phone: "", details: "", photoUrl: "" };
  let schedule = [];
  let donors = [];
  let gallery = [];

  // Always read local db.json as fallback source
  let localDb = { mathadhish, schedule, donors, gallery };
  try {
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    const fileContents = fs.readFileSync(dbPath, 'utf8');
    localDb = JSON.parse(fileContents);
  } catch (e) {}

  try {
    const { data: mathadhishData, error: mError } = await supabase
      .from('mathadhish')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (mError) throw mError;
    mathadhish = mathadhishData
      ? mapMathadhishFromDb(mathadhishData)
      : (localDb.mathadhish || mathadhish);

    const { data: scheduleData, error: sError } = await supabase
      .from('schedule')
      .select('*')
      .order('date', { ascending: true });

    if (sError) throw sError;
    schedule = (scheduleData && scheduleData.length > 0)
      ? scheduleData.map(mapScheduleFromDb)
      : (localDb.schedule || []);

    const { data: donorsData, error: dError } = await supabase
      .from('donors')
      .select('*');
    donors = (!dError && donorsData && donorsData.length > 0)
      ? donorsData
      : (localDb.donors || []);

    const { data: galleryData, error: gError } = await supabase
      .from('gallery')
      .select('*');
    gallery = (!gError && galleryData && galleryData.length > 0)
      ? galleryData.map(mapGalleryFromDb)
      : (localDb.gallery || []);

  } catch (error) {
    console.warn('Supabase fetch failed, using local db.json:', error.message);
    return {
      mathadhish: localDb.mathadhish || mathadhish,
      schedule: localDb.schedule || schedule,
      donors: localDb.donors || [],
      gallery: localDb.gallery || []
    };
  }

  return { mathadhish, schedule, donors, gallery };
}

export default async function Home() {
  const data = await getTempleData();

  // Show only featured items on homepage
  const displayGallery = data.gallery.filter(g => g.featured);
  const displaySchedule = data.schedule.filter(s => s.featured);
  const displayDonors = data.donors.filter(d => d.featured);

  return (
    <>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.nav}`}>
          <div className={styles.logoContainer}>
            <div className={styles.logoImage}>
              <Image 
                src="/images/shivaling_canopy.jpg" 
                alt="Temple Logo" 
                fill 
                className={styles.logoImg} 
                unoptimized 
              />
            </div>
            <div className={styles.logo}>Prachin Baurahwa<span> Mahadev</span></div>
          </div>
          <input type="checkbox" id="mobile-menu-toggle" className={styles.menuToggle} />
          <label htmlFor="mobile-menu-toggle" className={styles.hamburger}>
            <span></span>
            <span></span>
            <span></span>
          </label>
          <nav className={styles.menu}>
            <a href="#home" className={styles.menuLink}>Home</a>
            <a href="#about" className={styles.menuLink}>About</a>
            <a href="#gallery" className={styles.menuLink}>Gallery</a>
            <a href="#schedule" className={styles.menuLink}>Puja Schedule</a>
            <a href="#donors" className={styles.menuLink}>Contributors</a>
            <a href="/admin" className={styles.menuLink} style={{color: 'var(--primary-color)'}}>Admin</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section with Ambient Background & Featured Signboard */}
        <section id="home" className={styles.hero}>
          <div className={styles.heroBackground}>
            <Image 
              src="/images/temple_exterior.jpg" 
              alt="Temple Ambient Background" 
              fill
              priority
              className={styles.heroAmbientImage}
              unoptimized
            />
            <div className={styles.heroOverlay}></div>
          </div>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <span className={styles.templeTag}>Ancient Shiva Shrine</span>
                <h1 className={styles.title}>प्राचीन बउरहवाँ महादेव शिव मन्दिर</h1>
                <p className={styles.subtitle}>Welcome to the divine and ancient shrine in Gram Patharwa, Tarya Sujan, Kushinagar, Uttar Pradesh.</p>
                <div className={styles.heroActions}>
                  <a href="#about" className={styles.heroBtn}>Explore the Temple</a>
                  <a href="#schedule" className={styles.heroBtnOutline}>Puja Schedule</a>
                </div>
              </div>
              <div className={styles.heroFeaturedContainer}>
                <div className={styles.signboardFrame}>
                  <Image 
                    src="/images/signboard.jpg" 
                    alt="Prachin Baurahwa Mahadev Signboard" 
                    fill
                    className={styles.signboardImg}
                    priority
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className={`${styles.section}`}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Sacred & Historic</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoText}>
                <h3>प्राचीन बउरहवाँ महादेव शिव मन्दिर</h3>
                <p>
                  Prachin Baurahwa Mahadev Shiv Mandir is a prominent and highly revered Hindu shrine located in the village of Patharwa (Tarya Sujan), Kushinagar district of Uttar Pradesh. 
                </p>
                <p>
                  Known for its deep spiritual significance and serene environment, the temple attracts countless devotees seeking blessings, peace, and spiritual awakening from Lord Shiva.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h3 style={{ marginBottom: "1rem", color: "var(--primary-color)" }}>Temple Details</h3>
                <ul className={styles.infoList}>
                  <li>
                    <span className={styles.icon}>📍</span>
                    <span>Gram Patharwa, Tarya Sujan, Kushinagar</span>
                  </li>
                  <li>
                    <span className={styles.icon}>📮</span>
                    <span>Pin Code: 274409, Uttar Pradesh</span>
                  </li>
                  <li>
                    <span className={styles.icon}>🕉️</span>
                    <span>Deity: Lord Shiva (Mahadev)</span>
                  </li>
                  <li>
                    <span className={styles.icon}>🌅</span>
                    <span>Open for Devotees Daily</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Divine Gallery Section */}
        <section id="gallery" className={`${styles.section} ${styles.gallerySection}`}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Divine Gallery</h2>
            <p style={{textAlign: 'center', marginBottom: '3rem', color: '#666'}}>Darshan of Prachin Baurahwa Mahadev Shiv Mandir</p>
            <div className={styles.galleryGrid}>
              {displayGallery.length > 0 ? (
                displayGallery.map((item) => (
                  <div key={item.id} className={styles.galleryCard}>
                    <div className={styles.galleryImageContainer}>
                      <Image src={item.imageUrl} alt={item.title} fill className={styles.galleryImg} unoptimized />
                    </div>
                    <div className={styles.galleryInfo}>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{textAlign: 'center', width: '100%', color: '#888'}}>No gallery images added yet.</p>
              )}
            </div>
            <div style={{textAlign:'center', marginTop:'2.5rem'}}>
              <a href="/gallery" style={{display:'inline-block', padding:'0.75rem 2rem', background:'var(--primary-color)', color:'white', borderRadius:'8px', fontWeight:700, textDecoration:'none', fontSize:'1rem'}}>View All Photos →</a>
            </div>
          </div>
        </section>

        {/* Mathadhish Details with Aesthetic Background */}
        <section className={styles.mathadhishSection}>
          <div className={styles.mathadhishBg}>
            <Image 
              src="/images/temple_exterior.jpg" 
              alt="Temple Signboard Background" 
              fill
              className={styles.mathadhishImage}
              unoptimized
            />
          </div>
          <div className={styles.container}>
            <div className={styles.glassCard}>
              <h2 className={styles.sectionTitle}>Mathadhish (Chief Priest)</h2>
              {data.mathadhish ? (
                <div className={styles.mathadhishLayout}>
                  {data.mathadhish.photoUrl && (
                    <div className={styles.mPhotoContainer}>
                      <Image 
                        src={data.mathadhish.photoUrl} 
                        alt={data.mathadhish.name}
                        fill
                        className={styles.mPhoto}
                        unoptimized
                      />
                    </div>
                  )}
                  <div className={styles.mathadhishDetails}>
                    <h3>{data.mathadhish.name}</h3>
                    <p className={styles.mPhone}>📞 {data.mathadhish.phone}</p>
                    <p className={styles.mBio}>{data.mathadhish.details}</p>
                  </div>
                </div>
              ) : (
                <p style={{color:'white'}}>Details not available.</p>
              )}
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section id="schedule" className={`${styles.section} ${styles.scheduleSection}`}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Upcoming Puja Schedule</h2>
            <p style={{textAlign: 'center', marginBottom: '3rem', color: '#666'}}>Plan your visit according to the divine rituals conducted by our priests.</p>
            
            <div className={styles.scheduleGrid}>
              {displaySchedule.length > 0 ? (
                displaySchedule.map((puja) => (
                  <div key={puja.id} className={styles.scheduleCard}>
                    <div className={styles.sDate}>
                      <span className={styles.sDay}>{new Date(puja.date).getDate()}</span>
                      <span className={styles.sMonth}>{new Date(puja.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className={styles.sDetails}>
                      <h4>{puja.pujaName}</h4>
                      <p className={styles.sTime}>
                        ⏰ {puja.time}
                        {puja.toTime && puja.toTime !== puja.time && (
                          <> → {puja.toDate && puja.toDate !== puja.date ? `${puja.toDate} ` : ""}{puja.toTime}</>
                        )}
                      </p>
                      <p className={styles.sConductor}>🙏 Conducted by: <strong>{puja.conductor}</strong></p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{textAlign: 'center', width: '100%'}}>No upcoming pujas currently scheduled.</p>
              )}
            </div>
            <div style={{textAlign:'center', marginTop:'2.5rem'}}>
              <a href="/schedule" style={{display:'inline-block', padding:'0.75rem 2rem', background:'var(--primary-color)', color:'white', borderRadius:'8px', fontWeight:700, textDecoration:'none', fontSize:'1rem'}}>View Full Schedule →</a>
            </div>
          </div>
        </section>

        {/* Helpers & Donors Section */}
        <section id="donors" className={`${styles.section} ${styles.donorsSection}`}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Divine Sewadars & Contributors</h2>
            <p style={{textAlign: 'center', marginBottom: '3rem', color: '#666'}}>
              We express our deep gratitude to the devotees who have supported the temple through donations, services, and volunteering.
            </p>
            
            <div className={styles.donorGrid}>
              {displayDonors.length > 0 ? (
                displayDonors.map((donor) => (
                  <div key={donor.id} className={styles.donorCard}>
                    <div className={styles.donorHeader}>
                      <h4 className={styles.donorName}>{donor.name}</h4>
                      <span className={`${styles.donorBadge} ${donor.type === "Donation" ? styles.badgeDonation : donor.type === "Sewa (Service)" ? styles.badgeSewa : styles.badgeMaterial}`}>
                        {donor.type}
                      </span>
                    </div>
                    {donor.amount && <p className={styles.donorAmount}>Contribution: <strong>{donor.amount}</strong></p>}
                    {donor.details && <p className={styles.donorDetails}>{donor.details}</p>}
                  </div>
                ))
              ) : (
                <p style={{textAlign: 'center', width: '100%', color: '#888'}}>No contributors published yet.</p>
              )}
            </div>
            <div style={{textAlign:'center', marginTop:'2.5rem'}}>
              <a href="/contributors" style={{display:'inline-block', padding:'0.75rem 2rem', background:'var(--primary-color)', color:'white', borderRadius:'8px', fontWeight:700, textDecoration:'none', fontSize:'1rem'}}>View All Contributors →</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="visit" className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerLogo}>Prachin Baurahwa Mahadev Shiv Mandir</div>
          <p className={styles.footerText}>
            May Lord Shiva bless you with peace, prosperity, and happiness. Har Har Mahadev!
          </p>
          <div className={styles.copyright}>
            &copy; {new Date().getFullYear()} Prachin Baurahwa Mahadev Shiv Mandir, Kushinagar. All rights reserved.
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>Developed by</span>
              <a href="https://www.instagram.com/raj_patharwa/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
                <Image src="/images/developer.png" alt="Raj Singh" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)' }} unoptimized />
                Raj Singh
              </a>
            </div>
            <VisitorCounter />
          </div>
        </div>
      </footer>
    </>
  );
}
