import Image from "next/image";
import styles from "../page.module.css";
import { supabase } from "../../utils/supabase";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const metadata = { title: "Full Gallery | Prachin Baurahwa Mahadev Shiv Mandir" };

async function getAllGallery() {
  try {
    const { data, error } = await supabase.from("gallery").select("*");
    if (!error && data && data.length > 0)
      return data.map(g => ({ id: g.id, title: g.title, description: g.description, imageUrl: g.imageurl || g.imageUrl }));
  } catch (e) {}
  try {
    const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/db.json"), "utf8"));
    return db.gallery || [];
  } catch (e) { return []; }
}

export default async function GalleryPage() {
  const gallery = await getAllGallery();
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
            <a href="/#schedule" className={styles.menuLink}>Puja Schedule</a>
            <a href="/schedule" className={styles.menuLink}>All Schedules</a>
            <a href="/contributors" className={styles.menuLink}>Contributors</a>
          </nav>
        </div>
      </header>
      <main>
        <section className={`${styles.section} ${styles.gallerySection}`} style={{ paddingTop: "6rem" }}>
          <div className={styles.container}>
            <a href="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--primary-color)", fontWeight: 600, textDecoration: "none" }}>← Back to Home</a>
            <h1 className={styles.sectionTitle}>Complete Divine Gallery</h1>
            <p style={{ textAlign: "center", marginBottom: "3rem", color: "#666" }}>All darshan photos of Prachin Baurahwa Mahadev Shiv Mandir</p>
            <div className={styles.galleryGrid}>
              {gallery.length > 0 ? gallery.map(item => (
                <div key={item.id} className={styles.galleryCard}>
                  <div className={styles.galleryImageContainer}>
                    <Image src={item.imageUrl} alt={item.title} fill className={styles.galleryImg} unoptimized />
                  </div>
                  <div className={styles.galleryInfo}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              )) : <p style={{ textAlign: "center", width: "100%", color: "#888" }}>No gallery images yet.</p>}
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
