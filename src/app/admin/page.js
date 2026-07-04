"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function AdminDashboard() {
  const [role, setRole] = useState(null); // 'admin', 'super_admin'
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [db, setDb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mathadhish State
  const [mName, setMName] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mDetails, setMDetails] = useState("");
  const [mPhoto, setMPhoto] = useState("");

  // New Puja State
  const [pFromDate, setPFromDate] = useState("");
  const [pFromTime, setPFromTime] = useState("");
  const [pToDate, setPToDate] = useState("");
  const [pToTime, setPToTime] = useState("");
  const [pName, setPName] = useState("");
  const [pConductor, setPConductor] = useState("");

  // Donors/Helpers State
  const [donors, setDonors] = useState([]);
  const [dName, setDName] = useState("");
  const [dType, setDType] = useState("Donation");
  const [dAmount, setDAmount] = useState("");
  const [dDetails, setDDetails] = useState("");

  // Gallery State
  const [gallery, setGallery] = useState([]);
  const [gTitle, setGTitle] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gUrl, setGUrl] = useState("");

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Check session storage first
    const savedRole = sessionStorage.getItem("admin_role");
    if (savedRole) {
      setRole(savedRole);
      setIsAuthorized(true);
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetch(`/api/db?t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          setDb(data);
          setMName(data.mathadhish.name);
          setMPhone(data.mathadhish.phone);
          setMDetails(data.mathadhish.details);
          setMPhoto(data.mathadhish.photoUrl || "");
          setDonors(data.donors || []);
          setGallery(data.gallery || []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error loading data:", err);
          setIsLoading(false);
        });
    }
  }, [isAuthorized]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inputUsername, password: inputPassword })
      });
      const data = await res.json();
      if (data.success) {
        setRole(data.role);
        setIsAuthorized(true);
        sessionStorage.setItem("admin_role", data.role);
        setLoginError("");
      } else {
        setLoginError(data.error || "Invalid username or password!");
      }
    } catch (err) {
      setLoginError("Cannot connect to server. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_role");
    setRole(null);
    setIsAuthorized(false);
    setInputUsername("");
    setInputPassword("");
  };

  const saveDatabase = async (newDb) => {
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDb)
    });
    setDb(newDb);
    alert("Saved Successfully!");
  };

  const handleSaveMathadhish = (e) => {
    e.preventDefault();
    if (role !== "super_admin") {
      alert("Unauthorized! Only Super Admin can modify Mathadhish details.");
      return;
    }
    const newDb = {
      ...db,
      mathadhish: { name: mName, phone: mPhone, details: mDetails, photoUrl: mPhoto }
    };
    saveDatabase(newDb);
  };

  const checkScheduleConflict = (fromDate, fromTime, toDate, toTime) => {
    const newStart = new Date(`${fromDate}T${fromTime}`);
    const newEnd   = new Date(`${toDate}T${toTime}`);
    return db.schedule.find(existing => {
      const exStart = new Date(`${existing.date}T${existing.time}`);
      const exEnd   = new Date(`${existing.toDate || existing.date}T${existing.toTime || existing.time}`);
      // Overlap: newStart < exEnd AND newEnd > exStart
      return newStart < exEnd && newEnd > exStart;
    }) || null;
  };

  const handleAddPuja = (e) => {
    e.preventDefault();

    // Validate: toDate+toTime must be after fromDate+fromTime
    const start = new Date(`${pFromDate}T${pFromTime}`);
    const end   = new Date(`${pToDate}T${pToTime}`);
    if (end <= start) {
      alert("⚠️ 'To' date/time must be after 'From' date/time.");
      return;
    }

    // Conflict check against existing schedules
    const conflict = checkScheduleConflict(pFromDate, pFromTime, pToDate, pToTime);
    if (conflict) {
      const confirmSave = window.confirm(
        `⚠️ Time Conflict Detected!\n\n` +
        `"${conflict.pujaName}" is already scheduled from ${conflict.date} ${conflict.time} to ${conflict.toDate || conflict.date} ${conflict.toTime || conflict.time}.\n\n` +
        `Do you still want to add this schedule?`
      );
      if (!confirmSave) return;
    }

    const newPuja = {
      id: Date.now().toString(),
      date: pFromDate,
      time: pFromTime,
      toDate: pToDate,
      toTime: pToTime,
      pujaName: pName,
      conductor: pConductor
    };
    const newDb = {
      ...db,
      schedule: [...db.schedule, newPuja]
    };
    saveDatabase(newDb);
    setPFromDate(""); setPFromTime(""); setPToDate(""); setPToTime(""); setPName(""); setPConductor("");
  };

  const handleDeletePuja = (id) => {
    const newDb = {
      ...db,
      schedule: db.schedule.filter(s => s.id !== id)
    };
    saveDatabase(newDb);
  };

  const handleAddDonor = (e) => {
    e.preventDefault();
    const newDonor = {
      id: Date.now().toString(),
      name: dName,
      type: dType,
      amount: dAmount,
      details: dDetails
    };
    const newDb = {
      ...db,
      donors: [...(db.donors || []), newDonor]
    };
    saveDatabase(newDb);
    setDonors(newDb.donors);
    setDName(""); setDAmount(""); setDDetails("");
  };

  const handleDeleteDonor = (id) => {
    const newDb = {
      ...db,
      donors: (db.donors || []).filter(d => d.id !== id)
    };
    saveDatabase(newDb);
    setDonors(newDb.donors);
  };

  const handleAddGallery = (e) => {
    e.preventDefault();
    const newGalleryItem = {
      id: Date.now().toString(),
      title: gTitle,
      description: gDesc,
      imageUrl: gUrl
    };
    const newDb = {
      ...db,
      gallery: [...(db.gallery || []), newGalleryItem]
    };
    saveDatabase(newDb);
    setGallery(newDb.gallery);
    setGTitle(""); setGDesc(""); setGUrl("");
  };

  const handleDeleteGallery = (id) => {
    const newDb = {
      ...db,
      gallery: (db.gallery || []).filter(g => g.id !== id)
    };
    saveDatabase(newDb);
    setGallery(newDb.gallery);
  };

  const handleToggleFeatured = async (table, id, currentFeatured) => {
    const newVal = !currentFeatured;
    try {
      const res = await fetch('/api/feature', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, featured: newVal })
      });
      const data = await res.json();
      if (!data.success) { alert('Failed: ' + (data.error || 'unknown error')); return; }
      // Optimistically update local state
      if (table === 'gallery') {
        setGallery(prev => prev.map(g => g.id === id ? { ...g, featured: newVal } : g));
      } else if (table === 'schedule') {
        setDb(prev => ({ ...prev, schedule: prev.schedule.map(s => s.id === id ? { ...s, featured: newVal } : s) }));
      } else if (table === 'donors') {
        setDonors(prev => prev.map(d => d.id === id ? { ...d, featured: newVal } : d));
      }
    } catch (err) {
      alert('Network error. Try again.');
    }
  };


  const handleUploadGalleryImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setGUrl(data.imageUrl);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadMathadhishImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setMPhoto(data.imageUrl);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  if (!authChecked) {
    return <div className={styles.loading}>Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginForm}>
          <h2>Temple Admin Portal</h2>
          
          <form onSubmit={handleLoginSubmit} className={styles.form}>
            <div className={styles.formGroup} style={{ textAlign: "left" }}>
              <label style={{ fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>Username</label>
              <input 
                type="text" 
                placeholder="Enter Username" 
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup} style={{ textAlign: "left" }}>
              <label style={{ fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>Password</label>
              <input 
                type="password" 
                placeholder="Enter Password" 
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className={styles.input}
                required
              />
              {loginError && <p style={{ color: "#dc2626", fontSize: "0.85rem", margin: "0.25rem 0", fontWeight: "600" }}>{loginError}</p>}
            </div>
            <button type="submit" className={styles.button} disabled={loginLoading}>
              {loginLoading ? "Verifying..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className={styles.loading}>Loading database...</div>;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>Temple Admin Portal</h1>
          <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.25rem" }}>
            Logged in as: <strong style={{ color: "var(--primary-color)" }}>{role === "super_admin" ? "Super Admin" : "Admin"}</strong>
          </p>
        </div>
        <button onClick={handleLogout} className={styles.buttonOutline}>Logout</button>
      </header>

      <div className={styles.grid}>
        <section className={styles.card} style={{ opacity: role === "admin" ? 0.75 : 1, position: "relative" }}>
          <h2>Update Mathadhish Details</h2>
          {role === "admin" && (
            <div className={styles.lockNotice}>
              🔒 Mathadhish profile updates are restricted to Super Admin role.
            </div>
          )}
          <form onSubmit={handleSaveMathadhish} className={styles.form}>
            <fieldset disabled={role === "admin"} style={{ border: "none", padding: 0, margin: 0 }}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input type="text" value={mPhone} onChange={(e) => setMPhone(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>Photo URL (or upload image below)</label>
                <input type="text" value={mPhoto} onChange={(e) => setMPhoto(e.target.value)} placeholder="e.g. /images/temple3.jpg" />
                <div style={{ marginTop: "0.5rem" }}>
                  <input type="file" accept="image/*" onChange={handleUploadMathadhishImage} style={{ fontSize: "0.85rem" }} />
                  {uploading && <span style={{ fontSize: "0.85rem", color: "var(--primary-color)", marginLeft: "0.5rem" }}>Uploading...</span>}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Details / Bio</label>
                <textarea rows={4} value={mDetails} onChange={(e) => setMDetails(e.target.value)} required />
              </div>
              <button type="submit" className={styles.button} style={{ display: role === "admin" ? "none" : "block" }}>Save Details</button>
            </fieldset>
          </form>
        </section>

        <section className={styles.card}>
          <h2>Add New Puja Schedule</h2>
          <form onSubmit={handleAddPuja} className={styles.form}>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "1rem", background: "#f9fafb", padding: "0.6rem 0.8rem", borderRadius: "6px", borderLeft: "3px solid var(--primary-color)" }}>
              ⚠️ A warning will appear if the selected time conflicts with an existing puja.
            </p>
            <div className={styles.fromToLabel}>From</div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>From Date</label>
                <input type="date" value={pFromDate} onChange={(e) => setPFromDate(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>From Time</label>
                <input type="time" value={pFromTime} onChange={(e) => setPFromTime(e.target.value)} required />
              </div>
            </div>
            <div className={styles.fromToLabel}>To</div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>To Date</label>
                <input type="date" value={pToDate} onChange={(e) => setPToDate(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>To Time</label>
                <input type="time" value={pToTime} onChange={(e) => setPToTime(e.target.value)} required />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Puja Name</label>
              <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Rudrabhishek" required />
            </div>
            <div className={styles.formGroup}>
              <label>Conductor (Who will perform)</label>
              <input type="text" value={pConductor} onChange={(e) => setPConductor(e.target.value)} placeholder="e.g. Pandit Ji" required />
            </div>
            <button type="submit" className={styles.button}>Add Schedule</button>
          </form>
        </section>

        <section className={`${styles.card} ${styles.fullWidth}`}>
          <h2>Current Puja Schedule</h2>
          {db.schedule.length === 0 ? (
            <p>No upcoming pujas scheduled.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>From Date</th>
                    <th>From Time</th>
                    <th>To Date</th>
                    <th>To Time</th>
                    <th>Puja Name</th>
                    <th>Conductor</th>
                    <th>Homepage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {db.schedule.map(puja => (
                    <tr key={puja.id}>
                      <td>{puja.date}</td>
                      <td>{puja.time}</td>
                      <td>{puja.toDate || puja.date}</td>
                      <td>{puja.toTime || puja.time}</td>
                      <td>{puja.pujaName}</td>
                      <td>{puja.conductor}</td>
                      <td>
                        <button
                          onClick={() => handleToggleFeatured('schedule', puja.id, puja.featured || false)}
                          className={puja.featured ? styles.featuredBtnOn : styles.featuredBtnOff}
                          title={puja.featured ? 'Remove from homepage' : 'Show on homepage'}
                        >{puja.featured ? '⭐ Shown' : '☆ Hidden'}</button>
                      </td>
                      <td>
                        <button onClick={() => handleDeletePuja(puja.id)} className={styles.deleteBtn}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Helpers & Donors Management Sections */}
        <section className={styles.card}>
          <h2>Add Helper / Donor</h2>
          <form onSubmit={handleAddDonor} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Name</label>
              <input type="text" value={dName} onChange={(e) => setDName(e.target.value)} placeholder="e.g. Shri Rajesh Singh" required />
            </div>
            <div className={styles.formGroup}>
              <label>Contribution Type</label>
              <select value={dType} onChange={(e) => setDType(e.target.value)} className={styles.input} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white" }}>
                <option value="Donation">Donation (Money)</option>
                <option value="Sewa (Service)">Sewa (Service)</option>
                <option value="Material / Goods">Material / Goods</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Amount / Value (Optional)</label>
              <input type="text" value={dAmount} onChange={(e) => setDAmount(e.target.value)} placeholder="e.g. ₹11,000 or 'Cement bags'" />
            </div>
            <div className={styles.formGroup}>
              <label>Details / Description (Optional)</label>
              <input type="text" value={dDetails} onChange={(e) => setDDetails(e.target.value)} placeholder="e.g. Assisted in main dome construction" />
            </div>
            <button type="submit" className={styles.button}>Add Contributor</button>
          </form>
        </section>

        <section className={`${styles.card} ${styles.fullWidth}`}>
          <h2>Current Helpers & Donors</h2>
          {donors.length === 0 ? (
            <p>No contributors published yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Amount / Value</th>
                    <th>Details</th>
                    <th>Homepage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map(donor => (
                    <tr key={donor.id}>
                      <td style={{ fontWeight: 600 }}>{donor.name}</td>
                      <td>
                        <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 600, backgroundColor: donor.type === "Donation" ? "#ecfdf5" : donor.type === "Sewa (Service)" ? "#eff6ff" : "#fff7ed", color: donor.type === "Donation" ? "#047857" : donor.type === "Sewa (Service)" ? "#1d4ed8" : "#c2410c" }}>
                          {donor.type}
                        </span>
                      </td>
                      <td style={{ color: "var(--primary-color)", fontWeight: "600" }}>{donor.amount || "-"}</td>
                      <td>{donor.details || "-"}</td>
                      <td>
                        <button
                          onClick={() => handleToggleFeatured('donors', donor.id, donor.featured || false)}
                          className={donor.featured ? styles.featuredBtnOn : styles.featuredBtnOff}
                          title={donor.featured ? 'Remove from homepage' : 'Show on homepage'}
                        >{donor.featured ? '⭐ Shown' : '☆ Hidden'}</button>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteDonor(donor.id)} className={styles.deleteBtn}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Dynamic Gallery Management Sections */}
        <section className={styles.card}>
          <h2>Add Gallery Image</h2>
          <form onSubmit={handleAddGallery} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Image Title</label>
              <input type="text" value={gTitle} onChange={(e) => setGTitle(e.target.value)} placeholder="e.g. Maha Shivratri Darshan" required />
            </div>
            <div className={styles.formGroup}>
              <label>Image URL (or upload image below)</label>
              <input type="text" value={gUrl} onChange={(e) => setGUrl(e.target.value)} placeholder="e.g. /images/temple_exterior.jpg" required />
              <div style={{ marginTop: "0.5rem" }}>
                <input type="file" accept="image/*" onChange={handleUploadGalleryImage} style={{ fontSize: "0.85rem" }} />
                {uploading && <span style={{ fontSize: "0.85rem", color: "var(--primary-color)", marginLeft: "0.5rem" }}>Uploading...</span>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description / Caption (Optional)</label>
              <input type="text" value={gDesc} onChange={(e) => setGDesc(e.target.value)} placeholder="e.g. Devotees offering prayer on Shravan Somvar" />
            </div>
            <button type="submit" className={styles.button}>Add Gallery Item</button>
          </form>
        </section>

        <section className={`${styles.card} ${styles.fullWidth}`}>
          <h2>Current Gallery Images</h2>
          {gallery.length === 0 ? (
            <div className={styles.emptyGallery}>
              <span style={{ fontSize: "3rem" }}>🖼️</span>
              <p>No gallery images added yet. Add one using the form above.</p>
            </div>
          ) : (
            <div className={styles.galleryAdminGrid}>
              {gallery.map(item => (
                <div key={item.id} className={styles.galleryAdminCard}>
                  <div className={styles.galleryAdminImgWrap}>
                    <img src={item.imageUrl} alt={item.title} className={styles.galleryAdminImg} />
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                          handleDeleteGallery(item.id);
                        }
                      }}
                      className={styles.galleryDeleteBtn}
                      title="Delete this image"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className={styles.galleryAdminInfo}>
                    <p className={styles.galleryAdminTitle}>{item.title}</p>
                    {item.description && <p className={styles.galleryAdminDesc}>{item.description}</p>}
                    <button
                      onClick={() => handleToggleFeatured('gallery', item.id, item.featured || false)}
                      className={item.featured ? styles.featuredBtnOn : styles.featuredBtnOff}
                      style={{ marginTop: '0.4rem', width: '100%' }}
                    >{item.featured ? '⭐ On Homepage' : '☆ Add to Homepage'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
