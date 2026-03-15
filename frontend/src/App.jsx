import React, { useState, useEffect } from 'react';
import './index.css';
import ImageAnalysis from './components/ImageAnalysis';
import VideoForensics from './components/VideoForensics';
import WebcamScan from './components/WebcamScan';
import { Image, Film, Camera } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const MODES = [
  { id: 'image',   label: 'Image Analysis',   Icon: Image  },
  { id: 'video',   label: 'Video Forensics',   Icon: Film   },
  { id: 'webcam',  label: 'Live Surveillance', Icon: Camera },
];

export default function App() {
  const [mode, setMode] = useState('image');
  const [threshold, setThreshold] = useState(0.40);
  const [apiOnline, setApiOnline] = useState(null);

  // Health check
  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((d) => setApiOnline(d.model_loaded === true))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <>
      <div className="noise-overlay" />

      <div className="app">
        {/* ─── HEADER ─── */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16.5 5v8L9 17 1.5 13V5L9 1z" stroke="#00e5ff" strokeWidth="1.2" fill="none" />
                <path d="M9 5l4.5 2.5v5L9 15 4.5 12.5v-5L9 5z" fill="rgba(0,229,255,0.15)" stroke="#00e5ff" strokeWidth="0.8" />
              </svg>
            </div>
            <div>
              <div className="logo-text">
                <span>FACE</span>GUARD
              </div>
              <div className="logo-version">FORENSIC ENGINE v3.0 — NEURAL DEEPFAKE DETECTION</div>
            </div>
          </div>

          <div className="header-status">
            <div
              className="status-dot"
              style={{
                background: apiOnline === null ? '#ffab00' : apiOnline ? 'var(--green)' : 'var(--magenta)',
                boxShadow: `0 0 8px ${apiOnline === null ? '#ffab00' : apiOnline ? 'var(--green)' : 'var(--magenta)'}`,
              }}
            />
            {apiOnline === null ? 'CONNECTING...' : apiOnline ? 'NEURAL ENGINE ONLINE' : 'API OFFLINE'}
          </div>
        </header>

        {/* ─── MAIN ─── */}
        <main className="main">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-label">Mode Select</div>

            {MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-btn ${mode === id ? 'active' : ''}`}
                onClick={() => setMode(id)}
              >
                <Icon className="icon" size={16} />
                {label}
              </button>
            ))}

            <div className="sidebar-label">Settings</div>

            <div className="threshold-control">
              <div className="threshold-label">
                Confidence Threshold
                <span>{(threshold * 100).toFixed(0)}%</span>
              </div>
              <input
                className="threshold-slider"
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
            </div>

            {apiOnline === false && (
              <div className="alert error" style={{ marginTop: 16, fontSize: '0.62rem' }}>
                BACKEND OFFLINE
                <br />
                Start with:
                <br />
                <code>uvicorn main:app</code>
              </div>
            )}

            {/* Model info */}
            <div style={{ marginTop: 'auto', paddingTop: 32 }}>
              <div className="stat-row">
                <span className="stat-key">MODEL</span>
                <span className="stat-val" style={{ fontSize: '0.6rem' }}>MobileNetV2</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">DATASET</span>
                <span className="stat-val" style={{ fontSize: '0.6rem' }}>FF++</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">ACCURACY</span>
                <span className="stat-val highlight" style={{ fontSize: '0.6rem' }}>92.8%</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">INFERENCE</span>
                <span className="stat-val" style={{ fontSize: '0.6rem' }}>0.04s/frame</span>
              </div>
            </div>
          </aside>

          {/* Content */}
          <section className="content">
            {mode === 'image'  && <ImageAnalysis threshold={threshold} />}
            {mode === 'video'  && <VideoForensics threshold={threshold} />}
            {mode === 'webcam' && <WebcamScan threshold={threshold} />}
          </section>
        </main>
      </div>
    </>
  );
}
