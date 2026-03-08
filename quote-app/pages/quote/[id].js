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
  const router  = useRouter();
  const { id }  = router.query;

  const [quote,      setQuote]   = useState(null);
  const [loading,    setLoading] = useState(true);
  const [step,       setStep]    = useState("view");   // view | confirm | done
  const [sigName,    setSig]     = useState("");
  const [submitting, setSub]     = useState(false);
  const [error,      setError]   = useState("");

  useEffect(() => {
    if (!id) return;
    loadQuote(id).then(q => { setQuote(q); setLoading(false); });
  }, [id]);

  async function handleAccept() {
    if (!sigName.trim()) return setError("Please enter your name to confirm.");
    setSub(true); setError("");
    try {
      await respondToQuote(id, "accepted", sigName.trim());

      // Send email notification
      const quoteLink = `${window.location.origin}/quote/${id}`;
      await sendAcceptanceEmail({
        clientName:  quote.clientName,
        quoteRef:    quote.quoteRef,
        acceptedBy:  sigName.trim(),
        acceptedAt:  Date.now(),
        quoteLink,
      });

      setQuote(prev => ({ ...prev, status:"accepted", acceptedByName: sigName.trim() }));
      setStep("done");
    } catch(e) {
      setError("Something went wrong: " + e.message);
    }
    setSub(false);
  }

  async function handleDecline() {
    setSub(true);
    try {
      await respondToQuote(id, "declined");
      setQuote(prev => ({ ...prev, status:"declined" }));
      setStep("done");
    } catch(e) {
      setError("Something went wrong: " + e.message);
    }
    setSub(false);
  }

  if (loading) return (
    <Screen title="Loading…">
      <div style={{ textAlign:"center", color:"#94A3B8", padding:80, fontSize:15 }}>
        Loading your quote…
      </div>
    </Screen>
  );

  if (!quote) return (
    <Screen title="Not Found">
      <div style={{ textAlign:"center", padding:80 }}>
        <div style={{ fontSize:48 }}>🔍</div>
        <h2 style={{ color:"#1E293B", marginTop:12 }}>Quote Not Found</h2>
        <p style={{ color:"#64748B" }}>This link may have expired or is incorrect.</p>
      </div>
    </Screen>
  );

  if (step === "done") return (
    <Screen title={quote.status === "accepted" ? "Quote Accepted!" : "Response Recorded"}>
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
    <Screen title={`Quote for ${quote.clientName}`}>
      {/* Quote header */}
      <div style={{ maxWidth:740, margin:"0 auto", padding:"32px 20px 100px" }}>
        <div style={{ marginBottom:24, paddingBottom:20, borderBottom:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase",
            letterSpacing:1.5, marginBottom:6 }}>
            Quote Prepared For
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, color:"#0F172A", margin:"0 0 6px",
            letterSpacing:"-0.5px" }}>
            {quote.clientName}
          </h1>
          <div style={{ fontSize:13, color:"#94A3B8" }}>
            Ref: <strong style={{ color:"#64748B" }}>{quote.quoteRef}</strong>
            &nbsp;·&nbsp;Issued {formatDate(quote.createdAt)}
          </div>
        </div>

        {/* Already responded */}
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

        {/* PDF embed */}
        <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid #E2E8F0",
          marginBottom:32, boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
          <iframe
            src={quote.pdfUrl}
            title="Quote PDF"
            style={{ width:"100%", height:640, border:"none", display:"block" }}
          />
        </div>

        {/* Action buttons */}
        {quote.status === "pending" && (
          step === "confirm" ? (
            <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0",
              borderRadius:14, padding:28 }}>
              <h3 style={{ fontWeight:800, color:"#065F46", margin:"0 0 8px", fontSize:17 }}>
                Confirm Your Acceptance
              </h3>
              <p style={{ fontSize:14, color:"#15803D", margin:"0 0 18px", lineHeight:1.5 }}>
                By entering your name below you confirm that you accept this quote and its terms.
              </p>
              <input
                value={sigName}
                onChange={e => setSig(e.target.value)}
                placeholder="Your full name"
                style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:"1px solid #BBF7D0",
                  fontSize:15, outline:"none", boxSizing:"border-box", marginBottom:14,
                  color:"#1E293B", background:"#fff" }}
              />
              {error && <div style={{ color:"#DC2626", fontSize:13, marginBottom:12 }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleAccept} disabled={!sigName.trim()||submitting} style={{
                  flex:1, padding:"13px", borderRadius:9, border:"none",
                  background: sigName.trim() ? "#10B981" : "#D1D5DB",
                  color:"#fff", fontWeight:700, fontSize:15,
                  cursor: sigName.trim() ? "pointer" : "not-allowed",
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
          ) : (
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={()=>setStep("confirm")} style={{
                flex:1, padding:"15px", borderRadius:10, border:"none",
                background:"#10B981", color:"#fff", fontWeight:800, fontSize:16, cursor:"pointer",
                boxShadow:"0 4px 14px rgba(16,185,129,.35)",
              }}>
                ✓ Accept Quote
              </button>
              <button onClick={handleDecline} disabled={submitting} style={{
                padding:"15px 24px", borderRadius:10,
                border:"1px solid #FECACA", background:"#fff",
                color:"#DC2626", fontWeight:700, fontSize:14, cursor:"pointer",
              }}>
                Decline
              </button>
            </div>
          )
        )}
      </div>
    </Screen>
  );
}

function Screen({ title, children }) {
  return (
    <>
      <Head>
        <title>{title} | QuoteShare</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily:"'DM Sans', sans-serif", minHeight:"100vh", background:"#F8FAFC" }}>
        <nav style={{ background:"#0F172A", padding:"0 24px", height:52,
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>📋</span>
          <span style={{ color:"#fff", fontWeight:800, fontSize:16 }}>QuoteShare</span>
        </nav>
        {children}
      </div>
    </>
  );
}
