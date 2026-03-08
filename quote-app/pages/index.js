// pages/index.js  —  Admin dashboard & upload
import { useState, useEffect, useCallback } from "react";
import { saveQuote, listQuotes } from "../lib/firebase";
import Head from "next/head";

function generateId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatusBadge({ status }) {
  const cfg = {
    pending:  { bg: "#FEF3C7", color: "#92400E", label: "Awaiting Response" },
    accepted: { bg: "#D1FAE5", color: "#065F46", label: "✓ Accepted" },
    declined: { bg: "#FEE2E2", color: "#991B1B", label: "✗ Declined" },
  }[status] || { bg: "#F1F5F9", color: "#64748B", label: status };
  return (
    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Upload Screen ──────────────────────────────────────────────────────────
function UploadScreen({ onDone }) {
  const [file, setFile]         = useState(null);
  const [clientName, setClient] = useState("");
  const [quoteRef, setRef]      = useState("");
  const [dragOver, setDrag]     = useState(false);
  const [uploading, setUp]      = useState(false);
  const [error, setError]       = useState("");
  const [progress, setProgress] = useState("");

  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
    else setError("Please drop a PDF file.");
  }, []);

  async function handleUpload() {
    if (!file)             return setError("Please select a PDF.");
    if (!clientName.trim()) return setError("Please enter a client name.");
    setError(""); setUp(true);
    try {
      setProgress("Reading PDF…");
      const base64 = await fileToBase64(file);
      const id     = generateId();
      setProgress("Uploading to Firebase…");
      const pdfUrl = await saveQuote({
        id, clientName: clientName.trim(),
        quoteRef: quoteRef.trim() || `QTE-${id}`,
        fileName: file.name, pdfBase64: base64,
      });
      setProgress("Done!");
      onDone({ id, clientName: clientName.trim(), quoteRef: quoteRef.trim() || `QTE-${id}`, pdfUrl });
    } catch (e) {
      setError("Upload failed: " + e.message);
    }
    setUp(false); setProgress("");
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2 style={styles.h2}>New Quote</h2>
      <p style={styles.sub}>Upload a PDF — you'll get a shareable link for your client.</p>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById("pdf").click()}
        style={{ ...styles.dropzone, borderColor: dragOver ? "#2563EB" : file ? "#10B981" : "#CBD5E1",
          background: dragOver ? "#EFF6FF" : file ? "#F0FDF4" : "#F8FAFC" }}
      >
        <input id="pdf" type="file" accept="application/pdf" style={{ display:"none" }}
          onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
        <div style={{ fontSize: 36, marginBottom: 8 }}>{file ? "✅" : "📄"}</div>
        {file ? (
          <>
            <div style={{ fontWeight: 700, color: "#065F46" }}>{file.name}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
              {(file.size / 1024).toFixed(1)} KB · click to change
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, color: "#374151" }}>Drop PDF here or click to browse</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>PDF files only</div>
          </>
        )}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14, margin:"20px 0" }}>
        <div>
          <label style={styles.label}>Client Name *</label>
          <input value={clientName} onChange={e=>setClient(e.target.value)}
            placeholder="e.g. Acme Corp" style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Quote Reference (optional)</label>
          <input value={quoteRef} onChange={e=>setRef(e.target.value)}
            placeholder="e.g. QTE-2024-001" style={styles.input} />
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {progress && <div style={styles.infoBox}>⏳ {progress}</div>}

      <button onClick={handleUpload} disabled={uploading} style={{
        ...styles.btn, background: uploading ? "#93C5FD" : "#2563EB",
        cursor: uploading ? "not-allowed" : "pointer",
      }}>
        {uploading ? "Uploading…" : "Generate Shareable Link →"}
      </button>
    </div>
  );
}

// ── Success Screen ─────────────────────────────────────────────────────────
function SuccessScreen({ quote, onBack }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/quote/${quote.id}`
    : `/quote/${quote.id}`;

  function copy() {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(()=>setCopied(false), 2000); });
  }

  const waText = encodeURIComponent(`Hi ${quote.clientName},\n\nPlease find your quote here:\n${link}\n\nYou can view and accept it directly from the link.`);

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign:"center" }}>
      <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
      <h2 style={styles.h2}>Quote is Live!</h2>
      <p style={styles.sub}>Share the link below with <strong>{quote.clientName}</strong>.</p>

      <div style={styles.linkBox}>
        <span style={{ flex:1, fontSize:13, color:"#334155", wordBreak:"break-all", textAlign:"left" }}>
          {link}
        </span>
        <button onClick={copy} style={{ ...styles.copyBtn, background: copied ? "#10B981" : "#2563EB" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" style={styles.waBtn}>
        <span style={{ fontSize:20 }}>💬</span> Share on WhatsApp
      </a>

      <div style={{ marginTop: 16, display:"flex", gap:10, justifyContent:"center" }}>
        <button onClick={onBack} style={styles.ghostBtn}>← Upload Another</button>
        <button onClick={() => window.open(link, "_blank")} style={styles.ghostBtn}>
          Preview Client View ↗
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardScreen({ onNew }) {
  const [quotes, setQuotes] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { listQuotes().then(setQuotes); }, []);

  const filtered = quotes ? quotes.filter(q => {
    const matchSearch = q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteRef.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || q.status === filter;
    return matchSearch && matchFilter;
  }) : [];

  const counts = quotes ? {
    total:    quotes.length,
    pending:  quotes.filter(q=>q.status==="pending").length,
    accepted: quotes.filter(q=>q.status==="accepted").length,
  } : null;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h2 style={styles.h2}>Dashboard</h2>
          <p style={styles.sub}>All your quotes in one place.</p>
        </div>
        <button onClick={onNew} style={{ ...styles.btn, width:"auto", padding:"10px 20px" }}>
          + New Quote
        </button>
      </div>

      {counts && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total Quotes",   value: counts.total,    color:"#2563EB", id:"all" },
            { label:"Awaiting",       value: counts.pending,  color:"#D97706", id:"pending" },
            { label:"Accepted",       value: counts.accepted, color:"#10B981", id:"accepted" },
          ].map(c => (
            <div key={c.label} onClick={() => setFilter(filter === c.id ? "all" : c.id)}
              style={{ background: filter===c.id ? "#F0F9FF" : "#fff",
                border: `1px solid ${filter===c.id ? "#2563EB" : "#E2E8F0"}`,
                borderRadius:10, padding:"16px 18px", cursor:"pointer", transition:"all .15s" }}>
              <div style={{ fontSize:26, fontWeight:800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client name or quote reference…"
          style={{ ...styles.input, paddingLeft:38, background:"#fff" }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:18 }}>
            ×
          </button>
        )}
      </div>

      {quotes === null ? (
        <div style={{ textAlign:"center", color:"#94A3B8", padding:40 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#94A3B8" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>{search ? "🔍" : "📋"}</div>
          <div>{search ? `No quotes found for "${search}"` : "No quotes yet. Upload your first one!"}</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(q => (
            <div key={q.id} style={styles.quoteRow}
              onClick={() => window.open(`/quote/${q.id}`, "_blank")}
              onMouseEnter={e => e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
            >
              <div>
                <div style={{ fontWeight:700, color:"#1E293B", fontSize:15 }}>{q.clientName}</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:3 }}>
                  {q.quoteRef} · {formatDate(q.createdAt)}
                  {q.acceptedAt && ` · Responded ${formatDate(q.acceptedAt)}`}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <StatusBadge status={q.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── App ────────────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState("dashboard");
  const [uploaded, setUploaded] = useState(null);

  return (
    <>
      <Head>
        <title>QuoteShare — Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily:"'DM Sans', sans-serif", minHeight:"100vh", background:"#F8FAFC" }}>
        {/* Nav */}
        <nav style={{ background:"#0F172A", padding:"0 28px", height:56,
          display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>📋</span>
          <span onClick={()=>setScreen("dashboard")}
            style={{ color:"#fff", fontWeight:800, fontSize:17, cursor:"pointer", letterSpacing:"-0.3px" }}>
            QuoteShare
          </span>
          <span style={{ color:"#475569", fontSize:13, marginLeft:4 }}>
            {screen==="upload" ? "/ New Quote" : screen==="success" ? "/ Link Ready" : "/ Dashboard"}
          </span>
        </nav>

        {/* Content */}
        <main style={{ padding:"40px 24px" }}>
          {screen==="dashboard" && <DashboardScreen onNew={()=>setScreen("upload")} />}
          {screen==="upload"    && <UploadScreen onDone={q=>{setUploaded(q);setScreen("success");}} />}
          {screen==="success"   && uploaded && <SuccessScreen quote={uploaded} onBack={()=>setScreen("upload")} />}
        </main>
      </div>
    </>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const styles = {
  h2:       { fontSize:22, fontWeight:800, color:"#1E293B", margin:"0 0 4px" },
  sub:      { color:"#64748B", fontSize:14, margin:"0 0 24px" },
  label:    { display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 },
  input:    { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #E2E8F0",
              fontSize:14, outline:"none", boxSizing:"border-box", color:"#1E293B" },
  dropzone: { border:"2px dashed", borderRadius:12, padding:"36px 24px", textAlign:"center",
              cursor:"pointer", transition:"all .2s", marginBottom:20 },
  btn:      { width:"100%", padding:"13px", borderRadius:10, border:"none",
              color:"#fff", fontWeight:700, fontSize:15, transition:"background .2s" },
  ghostBtn: { background:"none", border:"1px solid #CBD5E1", color:"#64748B",
              padding:"10px 20px", borderRadius:8, cursor:"pointer", fontSize:14 },
  errorBox: { background:"#FEF2F2", border:"1px solid #FECACA", color:"#B91C1C",
              padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:14 },
  infoBox:  { background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#1D4ED8",
              padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:14 },
  linkBox:  { background:"#F1F5F9", borderRadius:10, padding:"12px 16px",
              display:"flex", alignItems:"center", gap:10, marginBottom:14 },
  copyBtn:  { padding:"8px 16px", borderRadius:8, border:"none", color:"#fff",
              fontWeight:600, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" },
  waBtn:    { display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              padding:"14px", borderRadius:10, background:"#25D366", color:"#fff",
              fontWeight:700, fontSize:15, textDecoration:"none", width:"100%",
              boxSizing:"border-box" },
  quoteRow: { background:"#fff", border:"1px solid #E2E8F0", borderRadius:10,
              padding:"16px 18px", display:"flex", justifyContent:"space-between",
              alignItems:"center", cursor:"pointer", transition:"box-shadow .15s" },
};
