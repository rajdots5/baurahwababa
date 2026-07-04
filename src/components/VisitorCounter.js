"use client";

import { useState, useEffect } from 'react';

export default function VisitorCounter() {
  const [count, setCount] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only increment once per session to avoid overcounting on reloads
    const hasVisitedSession = sessionStorage.getItem('has_visited_temple');

    async function recordVisit() {
      try {
        const res = await fetch('/api/visit', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
          sessionStorage.setItem('has_visited_temple', 'true');
        }
      } catch (error) {
        console.error("Failed to record visit:", error);
      }
    }

    if (!hasVisitedSession && !hasFetched) {
      setHasFetched(true);
      recordVisit();
    }
  }, [hasFetched]);

  if (count === null) return null;

  return (
    <div style={{
      marginTop: '1.5rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '0.5rem 1rem',
      borderRadius: '50px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#fff'
    }}>
      <span style={{ fontSize: '1.1rem' }}>👁️</span>
      <span>{count.toLocaleString()} Devotees Visited</span>
    </div>
  );
}
