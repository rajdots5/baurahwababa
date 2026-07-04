import Image from "next/image";
import styles from "../page.module.css";
import { supabase } from "../../utils/supabase";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const metadata = { title: "Full Puja Schedule | Prachin Baurahwa Mahadev Shiv Mandir" };

async function getAllSchedule() {
  try {
    const { data, error } = await supabase.from("schedule").select("*").order("date", { ascending: true });
    if (!error && data && data.length > 0)
      return data.map(s => ({ id: s.id, date: s.date, time: s.time, toDate: s.todate || s.date, toTime: s.totime || s.time, pujaName: s.pujaname || s.pujaName, conductor: s.conductor }));
  } catch (e) {}
  try {
    const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/db.json"), "utf8"));
    return db.schedule || [];
  } catch (e) { return []; }
}

export default async function SchedulePage() {
  const schedule = await getAllSchedule();
  return (
    <>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.nav}`}>
          <div className={styles.logoContainer}>
            <div className={styles.logoImage}><Image src="/images/shivaling_canopy.jpg" alt="Temple Logo" fill className={styles.logoImg} unoptimized /></div>
            <div className={styles.logo}>Prachin Baurahwa<span> Mahadev</span></div>
          </div>
          <input type="checkbox" id="mobile-menu-toggle" className={styles.menuToggle} />
          <label htmlFor="mobile-menu-toggle" className={styles.hamburger}>
            <span></span>
            <span></span>
            <span></span>
          </label>
          <nav className={styles.menu}>
            <a href="/" className={styles.menuLink}>Home</a>
            <a href="/gallery" className={styles.menuLink}>Gallery</a>
            <a href="/contributors" className={styles.menuLink}>Contributors</a>
          </nav>
        </div>
      </header>
      <main>
        <section className={`${styles.section} ${styles.scheduleSection}`} style={{ paddingTop: "6rem" }}>
          <div className={styles.container}>
            <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--primary-color)", fontWeight: 600, textDecoration: "none" }}>← Back to Home</a>
            <h1 className={styles.sectionTitle}>Complete Puja Schedule</h1>
            <p style={{ textAlign: "center", marginBottom: "3rem", color: "#666" }}>All upcoming rituals and pujas at the temple</p>
            <div className={styles.scheduleGrid}>
              {schedule.length > 0 ? schedule.map(puja => (
                <div key={puja.id} className={styles.scheduleCard}>
                  <div className={styles.sDate}>
                    <span className={styles.sDay}>{new Date(puja.date).getDate()}</span>
                    <span className={styles.sMonth}>{new Date(puja.date).toLocaleString("default", { month: "short" })}</span>
                  </div>
                  <div className={styles.sDetails}>
                    <h4>{puja.pujaName}</h4>
                    <p className={styles.sTime}>
                      ⏰ {puja.time}
                      {puja.toTime && puja.toTime !== puja.time && <> → {puja.toDate !== puja.date ? `${puja.toDate} ` : ""}{puja.toTime}</>}
                    </p>
                    <p className={styles.sConductor}>🙏 Conducted by: <strong>{puja.conductor}</strong></p>
                  </div>
                </div>
              )) : <p style={{ textAlign: "center", width: "100%" }}>No pujas scheduled yet.</p>}
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerLogo}>Prachin Baurahwa Mahadev Shiv Mandir</div>
          <p className={styles.footerText}>May Lord Shiva bless you. Har Har Mahadev!</p>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} Prachin Baurahwa Mahadev Shiv Mandir, Kushinagar.
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>Developed by</span>
              <a href="https://www.instagram.com/raj_patharwa/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
                <Image src="/images/developer.png" alt="Raj Singh" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)' }} unoptimized />
                Raj Singh
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
