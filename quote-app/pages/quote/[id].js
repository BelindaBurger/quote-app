// pages/quote/[id].js  —  Client-facing quote view
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { loadQuote, respondToQuote } from "../../lib/firebase";
import { sendAcceptanceEmail } from "../../lib/email";
import Head from "next/head";

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-ZA", { day:"2-digit", month:"long", year:"numeric" });
}

export default function QuoteView() {
  const router = useRouter();
  const { id } = router.query;

  const [quote,      setQuote]  = useState(null);
  const [loading,    setLoading] = useState(true);
  const [step,       setStep]   = useState("view");
  const [sigName,    setSig]    = useState("");
  const [sigMobile,  setMobile] = useState("");
  const [sigEmail,   setEmail]  = useState("");
  const [submitting, setSub]    = useState(false);
  const [error,      setError]  = useState("");

  useEffect(() => {
    if (!id) return;
    loadQuote(id).then(q => { setQuote(q); setLoading(false); });
  }, [id]);

  function handleDownload() {
    if (!quote?.pdfData) return;
    const byteString = atob(quote.pdfData.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = quote.fileName || "quote.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleAccept() {
    if (!sigName.trim())   return setError("Please enter your full name.");
    if (!sigMobile.trim()) return setError("Please enter your mobile number.");
    if (!sigEmail.trim())  return setError("Please enter your email address.");
    if (!/\S+@\S+\.\S+/.test(sigEmail)) return setError("Please enter a valid email address.");
    setSub(true); setError("");
    try {
      await respondToQuote(id, "accepted", sigName.trim(), sigMobile.trim(), sigEmail.trim());
      const quoteLink = `${window.location.origin}/quote/${id}`;
      await sendAcceptanceEmail({
        clientName:   quote.clientName,
        quoteRef:     quote.quoteRef,
        acceptedBy:   sigName.trim(),
        acceptedAt:   Date.now(),
        quoteLink,
        clientMobile: sigMobile.trim(),
        clientEmail:  sigEmail.trim(),
        status:       "ACCEPTED",
      });
      setQuote(prev => ({ ...prev, status:"accepted", acceptedByName: sigName.trim() }));
      setStep("done");
    } catch(e) {
      setError("Something went wrong: " + e.message);
    }
    setSub(false);
  }

  async function handleDecline() {
    if (!sigName.trim())   return setError("Please enter your full name.");
    if (!sigMobile.trim()) return setError("Please enter your mobile number.");
    if (!sigEmail.trim())  return setError("Please enter your email address.");
    if (!/\S+@\S+\.\S+/.test(sigEmail)) return setError("Please enter a valid email address.");
    setSub(true); setError("");
    try {
      await respondToQuote(id, "declined", sigName.trim(), sigMobile.trim(), sigEmail.trim());
      const quoteLink = `${window.location.origin}/quote/${id}`;
      await sendAcceptanceEmail({
        clientName:   quote.clientName,
        quoteRef:     quote.quoteRef,
        acceptedBy:   sigName.trim(),
        acceptedAt:   Date.now(),
        quoteLink,
        clientMobile: sigMobile.trim(),
        clientEmail:  sigEmail.trim(),
        status:       "DECLINED",
      });
      setQuote(prev => ({ ...prev, status:"declined" }));
      setStep("done");
    } catch(e) {
      setError("Something went wrong: " + e.message);
    }
    setSub(false);
  }

  if (loading) return (
    <Screen>
      <div style={{ textAlign:"center", color:"#94A3B8", padding:80, fontSize:15 }}>
        Loading your quote…
      </div>
    </Screen>
  );

  if (!quote) return (
    <Screen>
      <div style={{ textAlign:"center", padding:80 }}>
        <div style={{ fontSize:48 }}>🔍</div>
        <h2 style={{ color:"#1E293B", marginTop:12 }}>Quote Not Found</h2>
        <p style={{ color:"#64748B" }}>This link may have expired or is incorrect.</p>
      </div>
    </Screen>
  );

  if (step === "done") return (
    <Screen>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"60vh" }}>
        <div style={{ textAlign:"center", maxWidth:420 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>
            {quote.status === "accepted" ? "🎉" : "👋"}
          </div>
          <h2 style={{ fontSize:26, fontWeight:800, color:"#1E293B", margin:"0 0 12px" }}>
            {quote.status === "accepted" ? "Quote Accepted!" : "Response Recorded"}
          </h2>
          <p style={{ color:"#64748B", lineHeight:1.6 }}>
            {quote.status === "accepted"
              ? `Thank you, ${quote.acceptedByName || quote.clientName}! We've received your acceptance and will be in touch shortly to get started.`
              : "Thanks for letting us know. We'll reach out if you have any questions."}
          </p>
        </div>
      </div>
    </Screen>
  );

  return (
    <Screen>
      <div style={{ maxWidth:740, margin:"0 auto", padding:"32px 20px 100px" }}>

        {/* Header */}
        <div style={{ marginBottom:24, paddingBottom:20, borderBottom:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase",
            letterSpacing:1.5, marginBottom:6 }}>
            Quote Prepared For
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, color:"#0F172A", margin:"0 0 6px", letterSpacing:"-0.5px" }}>
            {quote.clientName}
          </h1>
          <div style={{ fontSize:13, color:"#94A3B8" }}>
            Ref: <strong style={{ color:"#64748B" }}>{quote.quoteRef}</strong>
            &nbsp;·&nbsp;Issued {formatDate(quote.createdAt)}
          </div>
        </div>

        {/* Already responded banner */}
        {quote.status !== "pending" && (
          <div style={{
            background: quote.status==="accepted" ? "#D1FAE5" : "#FEE2E2",
            border: `1px solid ${quote.status==="accepted" ? "#6EE7B7" : "#FECACA"}`,
            borderRadius:10, padding:"14px 18px", marginBottom:24, fontSize:14,
            color: quote.status==="accepted" ? "#065F46" : "#991B1B", fontWeight:600,
          }}>
            {quote.status==="accepted"
              ? `✅ This quote was accepted${quote.acceptedByName ? ` by ${quote.acceptedByName}` : ""} on ${formatDate(quote.acceptedAt)}.`
              : "❌ This quote was declined."}
          </div>
        )}

        {/* Accept / Decline / Download row at TOP */}
        {quote.status === "pending" && (
          step === "confirm-accept" ? (
            <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0",
              borderRadius:14, padding:28, marginBottom:28 }}>
              <h3 style={{ fontWeight:800, color:"#065F46", margin:"0 0 8px", fontSize:17 }}>
                Confirm Your Acceptance
              </h3>
              <p style={{ fontSize:14, color:"#15803D", margin:"0 0 18px", lineHeight:1.5 }}>
                Please fill in your details to confirm you accept this quote.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:14 }}>
                <input value={sigName} onChange={e=>setSig(e.target.value)}
                  placeholder="Full name *" style={inputStyle} />
                <input value={sigMobile} onChange={e=>setMobile(e.target.value)}
                  placeholder="Mobile number *" type="tel" style={inputStyle} />
                <input value={sigEmail} onChange={e=>setEmail(e.target.value)}
                  placeholder="Email address *" type="email" style={inputStyle} />
              </div>
              {error && <div style={{ color:"#DC2626", fontSize:13, marginBottom:12 }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleAccept} disabled={submitting} style={{
                  flex:1, padding:"13px", borderRadius:9, border:"none",
                  background:"#10B981", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer",
                }}>
                  {submitting ? "Submitting…" : "✓ I Accept This Quote"}
                </button>
                <button onClick={()=>setStep("view")} style={{
                  padding:"13px 20px", borderRadius:9, border:"1px solid #CBD5E1",
                  background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600,
                }}>
                  Back
                </button>
              </div>
            </div>
          ) : step === "confirm-decline" ? (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA",
              borderRadius:14, padding:28, marginBottom:28 }}>
              <h3 style={{ fontWeight:800, color:"#991B1B", margin:"0 0 8px", fontSize:17 }}>
                Confirm Decline
              </h3>
              <p style={{ fontSize:14, color:"#B91C1C", margin:"0 0 18px", lineHeight:1.5 }}>
                Please fill in your details before declining.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:14 }}>
                <input value={sigName} onChange={e=>setSig(e.target.value)}
                  placeholder="Full name *" style={{...inputStyle, border:"1px solid #FECACA"}} />
                <input value={sigMobile} onChange={e=>setMobile(e.target.value)}
                  placeholder="Mobile number *" type="tel" style={{...inputStyle, border:"1px solid #FECACA"}} />
                <input value={sigEmail} onChange={e=>setEmail(e.target.value)}
                  placeholder="Email address *" type="email" style={{...inputStyle, border:"1px solid #FECACA"}} />
              </div>
              {error && <div style={{ color:"#DC2626", fontSize:13, marginBottom:12 }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleDecline} disabled={submitting} style={{
                  flex:1, padding:"13px", borderRadius:9, border:"none",
                  background:"#DC2626", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer",
                }}>
                  {submitting ? "Submitting…" : "✗ Decline This Quote"}
                </button>
                <button onClick={()=>setStep("view")} style={{
                  padding:"13px 20px", borderRadius:9, border:"1px solid #CBD5E1",
                  background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600,
                }}>
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", gap:12, marginBottom:28 }}>
              <button onClick={()=>setStep("confirm-accept")} style={{
                flex:1, padding:"15px", borderRadius:10, border:"none",
                background:"#10B981", color:"#fff", fontWeight:800, fontSize:16, cursor:"pointer",
                boxShadow:"0 4px 14px rgba(16,185,129,.35)",
              }}>
                ✓ Accept Quote
              </button>
              <button onClick={handleDownload} style={{
                padding:"15px 20px", borderRadius:10, border:"1px solid #E2E8F0",
                background:"#fff", color:"#374151", fontWeight:700, fontSize:14, cursor:"pointer",
              }}>
                ⬇ Download
              </button>
              <button onClick={()=>setStep("confirm-decline")} style={{
                padding:"15px 20px", borderRadius:10, border:"1px solid #FECACA",
                background:"#fff", color:"#DC2626", fontWeight:700, fontSize:14, cursor:"pointer",
              }}>
                Decline
              </button>
            </div>
          )
        )}

        {/* PDF embed */}
        <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid #E2E8F0",
          marginBottom:32, boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
          <iframe
            src={quote.pdfData}
            title="Quote PDF"
            style={{ width:"100%", height:640, border:"none", display:"block" }}
          />
        </div>

      </div>
    </Screen>
  );
}

const inputStyle = {
  width:"100%", padding:"12px 14px", borderRadius:8, border:"1px solid #BBF7D0",
  fontSize:15, outline:"none", boxSizing:"border-box", color:"#1E293B", background:"#fff",
};

function Screen({ children }) {
  return (
    <>
      <Head>
        <title>Your Quote from Alublack</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily:"'DM Sans', sans-serif", minHeight:"100vh", background:"#F8FAFC" }}>
        <nav style={{ background:"#0F172A", padding:"0 24px", height:52,
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>📋</span>
          <span style={{ color:"#fff", fontWeight:800, fontSize:16 }}>Alublack Quotes</span>
        </nav>
        {children}
      </div>
    </>
  );
}
