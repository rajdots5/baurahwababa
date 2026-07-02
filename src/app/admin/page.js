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
  
  const [db, setDb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mathadhish State
  const [mName, setMName] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mDetails, setMDetails] = useState("");
  const [mPhoto, setMPhoto] = useState("");

  // New Puja State
  const [pDate, setPDate] = useState("");
  const [pTime, setPTime] = useState("");
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
      fetch("/api/db")
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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const adminUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin";
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
    const superAdminUser = process.env.NEXT_PUBLIC_SUPER_ADMIN_USERNAME || "superadmin";
    const superAdminPass = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD || "superadmin123";

    if (inputUsername === superAdminUser && inputPassword === superAdminPass) {
      setRole("super_admin");
      setIsAuthorized(true);
      sessionStorage.setItem("admin_role", "super_admin");
      setLoginError("");
    } else if (inputUsername === adminUser && inputPassword === adminPass) {
      setRole("admin");
      setIsAuthorized(true);
      sessionStorage.setItem("admin_role", "admin");
      setLoginError("");
    } else {
      setLoginError("Invalid username or password!");
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

  const handleAddPuja = (e) => {
    e.preventDefault();
    const newPuja = {
      id: Date.now().toString(),
      date: pDate,
      time: pTime,
      pujaName: pName,
      conductor: pConductor
    };
    const newDb = {
      ...db,
      schedule: [...db.schedule, newPuja]
    };
    saveDatabase(newDb);
    setPDate(""); setPTime(""); setPName(""); setPConductor("");
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
            <button type="submit" className={styles.button}>Login</button>
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
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date</label>
                <input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>Time</label>
                <input type="time" value={pTime} onChange={(e) => setPTime(e.target.value)} required />
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
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Puja Name</th>
                  <th>Conductor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {db.schedule.map(puja => (
                  <tr key={puja.id}>
                    <td>{puja.date}</td>
                    <td>{puja.time}</td>
                    <td>{puja.pujaName}</td>
                    <td>{puja.conductor}</td>
                    <td>
                      <button onClick={() => handleDeletePuja(puja.id)} className={styles.deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Amount / Value</th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.map(donor => (
                  <tr key={donor.id}>
                    <td style={{ fontWeight: 600 }}>{donor.name}</td>
                    <td>
                      <span style={{ 
                        display: "inline-block", 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "50px", 
                        fontSize: "0.8rem", 
                        fontWeight: 600,
                        backgroundColor: donor.type === "Donation" ? "#ecfdf5" : donor.type === "Sewa (Service)" ? "#eff6ff" : "#fff7ed",
                        color: donor.type === "Donation" ? "#047857" : donor.type === "Sewa (Service)" ? "#1d4ed8" : "#c2410c"
                      }}>
                        {donor.type}
                      </span>
                    </td>
                    <td style={{ color: "var(--primary-color)", fontWeight: "600" }}>{donor.amount || "-"}</td>
                    <td>{donor.details || "-"}</td>
                    <td>
                      <button onClick={() => handleDeleteDonor(donor.id)} className={styles.deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <h2>Current Gallery Items</h2>
          {gallery.length === 0 ? (
            <p>No gallery items published yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Title</th>
                  <th>Image URL</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {gallery.map(item => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.imageUrl} alt={item.title} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "monospace" }}>{item.imageUrl}</td>
                    <td>{item.description || "-"}</td>
                    <td>
                      <button onClick={() => handleDeleteGallery(item.id)} className={styles.deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
