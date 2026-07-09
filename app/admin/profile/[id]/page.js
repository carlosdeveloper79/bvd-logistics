"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

const TOKEN_KEY = "bvd_admin_token";
const FIELD_LABELS = { licenseFront:"Driver's License (front)", licenseBack:"Driver's License (back)", ssnImage:"Social Security Card", headshot:"Headshot Photo" };
const ALL_FIELDS = ["licenseFront","licenseBack","ssnImage","headshot"];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function getToken() { return typeof window!=="undefined" ? localStorage.getItem(TOKEN_KEY)||"" : ""; }
function clearToken() { if(typeof window!=="undefined") localStorage.removeItem(TOKEN_KEY); }
async function apiFetch(path, token, options={}) {
  const res = await fetch(path, { headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, ...options });
  if(!res.ok){ const e=await res.json().catch(()=>{}); throw new Error(e?.error||"Request failed"); }
  return res.json();
}

function StatusBadge({status}) {
  const c = {invited:{bg:"#e8f1fa",color:"#1a4a72"},submitted:{bg:"#fff7e0",color:"#7a5500"},reviewed:{bg:"#e8f7ee",color:"#1a5c34"}}[status]||{bg:"#f0f0f0",color:"#333"};
  return <span style={{display:"inline-block",padding:"0.22rem 0.75rem",borderRadius:"999px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",background:c.bg,color:c.color}}>{status}</span>;
}

function InfoRow({label,children}){return(<div className="ef-info-row"><span className="ef-info-label">{label}</span><span className="ef-info-value">{children??"—"}</span></div>);}
function EditRow({label,children}){return(<div className="ef-info-row ef-edit-row"><span className="ef-info-label">{label}</span><span className="ef-info-edit">{children}</span></div>);}

const SVG_NAV = {
  dashboard:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  driver:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  helper:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  teams:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  status:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  logout:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

export default function EmployeeFilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [state, setState] = useState({ loading:true, error:null, profile:null, application:null, docPaths:{} });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [docState, setDocState] = useState({}); // { [field]: { loading, url, error, uploading, deleting } }
  const uploadRefs = useRef({});

  const load = useCallback(async () => {
    const token = getToken();
    if(!token){ router.replace("/admin"); return; }
    try {
      const { profile, application } = await apiFetch(`/api/admin/profiles/${id}`, token);
      let docPaths = {};
      if(application?.document_path){
        try{ docPaths = typeof application.document_path==="string" ? JSON.parse(application.document_path) : application.document_path; }catch(_){}
      }
      setState({ loading:false, error:null, profile, application, docPaths });
    } catch(err){
      if(err.message==="Unauthorized."){ router.replace("/admin"); return; }
      setState({ loading:false, error:err.message, profile:null, application:null, docPaths:{} });
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function startEdit() {
    const p = state.profile;
    const a = state.application;
    setForm({
      firstName:p.first_name, lastName:p.last_name, email:p.email, phone:p.phone, status:p.status,
      dob: a?.dob || "",
      addresses: a?.addresses ? JSON.parse(JSON.stringify(a.addresses)) : [],
    });
    setSaveMsg(null);
    setEditing(true);
  }

  function cancelEdit(){ setEditing(false); setSaveMsg(null); }

  const upd = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}));

  function addAddress() {
    setForm(f=>({...f, addresses:[...f.addresses,{street:"",city:"",state:"",zip:"",moveInDate:"",moveOutDate:"",current:false}]}));
  }
  function removeAddress(i) {
    setForm(f=>({...f, addresses:f.addresses.filter((_,idx)=>idx!==i)}));
  }
  function updAddr(i,k,val) {
    setForm(f=>{ const a=[...f.addresses]; a[i]={...a[i],[k]:val}; return {...f,addresses:a}; });
  }

  async function handleSave(e) {
    e.preventDefault();
    const token = getToken();
    setSaving(true); setSaveMsg(null);
    try {
      await apiFetch(`/api/admin/profiles/${id}`, token, {
        method:"PATCH", body:JSON.stringify({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:form.phone, status:form.status }),
      });
      if(state.application){
        await apiFetch(`/api/admin/applications/${state.application.id}`, token, {
          method:"PATCH", body:JSON.stringify({ dob:form.dob, addresses:form.addresses }),
        });
      }
      setEditing(false);
      setSaveMsg({ ok:true, text:"Changes saved." });
      await load();
    } catch(err){
      setSaveMsg({ ok:false, text:err.message||"Save failed." });
    } finally{ setSaving(false); }
  }

  // ── Document actions ──────────────────────────────────────
  async function viewDoc(field) {
    const token = getToken();
    setDocState(s=>({...s,[field]:{...s[field],loading:true,error:null}}));
    try {
      const { url } = await apiFetch(`/api/admin/applications/${state.application.id}/documents?field=${field}`, token);
      setDocState(s=>({...s,[field]:{...s[field],loading:false,url}}));
      window.open(url,"_blank","noopener,noreferrer");
    } catch(err){
      setDocState(s=>({...s,[field]:{...s[field],loading:false,error:err.message}}));
    }
  }

  async function deleteDoc(field) {
    if(!confirm(`Delete "${FIELD_LABELS[field]}"? This cannot be undone.`)) return;
    const token = getToken();
    setDocState(s=>({...s,[field]:{...s[field],deleting:true,error:null}}));
    try {
      await apiFetch(`/api/admin/applications/${state.application.id}/documents?field=${field}`, token, { method:"DELETE" });
      setState(s=>{ const d={...s.docPaths}; delete d[field]; return {...s,docPaths:d}; });
      setDocState(s=>({...s,[field]:{}}));
    } catch(err){
      setDocState(s=>({...s,[field]:{...s[field],deleting:false,error:err.message}}));
    }
  }

  async function uploadDoc(field, file) {
    if(!file) return;
    const token = getToken();
    setDocState(s=>({...s,[field]:{...s[field],uploading:true,error:null}}));
    try {
      const fd = new FormData(); fd.append("file",file);
      const res = await fetch(`/api/admin/applications/${state.application.id}/documents?field=${field}`,{
        method:"POST", headers:{Authorization:`Bearer ${token}`}, body:fd,
      });
      if(!res.ok){ const e=await res.json().catch(()=>{}); throw new Error(e?.error||"Upload failed"); }
      const { storagePath } = await res.json();
      setState(s=>({...s, docPaths:{...s.docPaths,[field]:storagePath}}));
      setDocState(s=>({...s,[field]:{uploading:false}}));
    } catch(err){
      setDocState(s=>({...s,[field]:{...s[field],uploading:false,error:err.message}}));
    }
  }

  const { loading, error, profile, application, docPaths } = state;
  const role = profile?.role||"driver";
  const roleView = role==="helper"?"helpers":"drivers";
  const roleLabel = role==="helper"?"Helpers":"Drivers";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "—";
  const addresses = application?.addresses||[];

  return (
    <div className="ap-shell">
      <aside className="ap-sidebar">
        <div className="ap-sidebar-brand"><span className="ap-sidebar-logo">BVD</span><span className="ap-sidebar-logo-sub">Admin</span></div>
        <nav className="ap-nav">
          <a href="/admin?view=dashboard" className="ap-nav-item">{SVG_NAV.dashboard} Dashboard</a>
          <a href="/admin?view=drivers" className={`ap-nav-item${role==="driver"?" is-active":""}`}>{SVG_NAV.driver} Drivers</a>
          <a href="/admin?view=helpers" className={`ap-nav-item${role==="helper"?" is-active":""}`}>{SVG_NAV.helper} Helpers</a>
          <a href="/admin?view=teams" className="ap-nav-item">{SVG_NAV.teams} Teams</a>
          <a href="/admin?view=status" className="ap-nav-item">{SVG_NAV.status} Onboarding</a>
        </nav>
        <button type="button" className="ap-logout-btn" onClick={()=>{clearToken();router.push("/admin");}}>{SVG_NAV.logout} Sign Out</button>
      </aside>

      <div className="ap-main">
        {loading && <div className="ef-loading-inner"><div style={{width:40,height:40,border:"3px solid #d5e1ec",borderTopColor:"#0c2d4a",borderRadius:"50%",animation:"ap-spin 0.75s linear infinite"}}/></div>}
        {error && !loading && <div className="ap-view"><div className="ap-card" style={{maxWidth:420}}><p style={{color:"#991b1b",fontWeight:600,marginBottom:"1rem"}}>{error}</p><a className="ap-btn-primary" href={`/admin?view=${roleView}`}>Go Back</a></div></div>}

        {profile && !loading && (
          <form onSubmit={handleSave} noValidate>
            <div className="ap-view ef-shell-view">

              <div className="ap-view-header ap-view-header-row">
                <div>
                  <p className="ef-breadcrumb">
                    <a href={`/admin?view=${roleView}`} className="ef-breadcrumb-link">{roleLabel}</a>
                    <span className="ef-breadcrumb-sep"> › </span>
                    <span>{editing ? `${form.firstName} ${form.lastName}` : `${profile.first_name} ${profile.last_name}`}</span>
                  </p>
                  <h2 style={{marginTop:"0.1rem"}}>Employee File</h2>
                </div>
                <div style={{display:"flex",gap:"0.65rem",alignItems:"center"}}>
                  {editing ? (
                    <><button type="button" className="ap-btn-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    <button type="submit" className="ap-btn-primary" disabled={saving}>{saving?"Saving…":"Save Changes"}</button></>
                  ) : (
                    <button type="button" className="ap-btn-primary" onClick={startEdit}>Edit</button>
                  )}
                </div>
              </div>

              {saveMsg && <div className={`ef-save-msg ${saveMsg.ok?"ef-save-ok":"ef-save-err"}`} style={{marginBottom:"1rem"}}>{saveMsg.text}</div>}

              {/* Hero */}
              <div className="ef-hero-card">
                <div className="ef-hero-avatar">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="ef-hero-info">
                  <h1 className="ef-hero-name">{editing?`${form.firstName} ${form.lastName}`:`${profile.first_name} ${profile.last_name}`}</h1>
                  <div className="ef-hero-meta">
                    <span className="ef-hero-role">{role}</span>
                    <StatusBadge status={editing?form.status:profile.status}/>
                  </div>
                </div>
              </div>

              <div className="ef-stack">
                {/* Contact */}
                <div className="ef-section">
                  <p className="ef-section-title">Contact Information</p>
                  <div className="ap-card ef-card">
                    {editing ? (<>
                      <EditRow label="First Name"><input className="ap-input ef-inline-input" value={form.firstName||""} onChange={upd("firstName")} required/></EditRow>
                      <EditRow label="Last Name"><input className="ap-input ef-inline-input" value={form.lastName||""} onChange={upd("lastName")} required/></EditRow>
                      <EditRow label="Email"><input className="ap-input ef-inline-input" type="email" value={form.email||""} onChange={upd("email")} required/></EditRow>
                      <EditRow label="Phone"><input className="ap-input ef-inline-input" type="tel" value={form.phone||""} onChange={upd("phone")} required/></EditRow>
                      <EditRow label="Status"><div className="ap-select-wrap" style={{maxWidth:220}}><select className="ap-select" value={form.status||""} onChange={upd("status")}><option value="invited">Invited</option><option value="submitted">Submitted</option><option value="reviewed">Reviewed</option></select></div></EditRow>
                      <InfoRow label="Role">{role}</InfoRow>
                      <InfoRow label="Profile Created">{fmtDate(profile.created_at)}</InfoRow>
                    </>) : (<>
                      <InfoRow label="Full Name">{profile.first_name} {profile.last_name}</InfoRow>
                      <InfoRow label="Email">{profile.email}</InfoRow>
                      <InfoRow label="Phone">{profile.phone}</InfoRow>
                      <InfoRow label="Role">{role}</InfoRow>
                      <InfoRow label="Status"><StatusBadge status={profile.status}/></InfoRow>
                      <InfoRow label="Profile Created">{fmtDate(profile.created_at)}</InfoRow>
                    </>)}
                  </div>
                </div>

                {/* Application */}
                {application ? (
                  <div className="ef-section">
                    <p className="ef-section-title">Application Details</p>
                    <div className="ap-card ef-card">
                      {editing ? (
                        <EditRow label="Date of Birth"><input className="ap-input ef-inline-input" type="date" value={form.dob||""} onChange={upd("dob")} required/></EditRow>
                      ) : (
                        <InfoRow label="Date of Birth">{fmtDate(application.dob)}</InfoRow>
                      )}
                      <InfoRow label="Submitted">{fmtDate(application.submitted_at)}</InfoRow>
                      <InfoRow label="Consent Name">{application.consent_name}</InfoRow>
                      <InfoRow label="Consent Date">{fmtDate(application.consent_date)}</InfoRow>
                    </div>
                  </div>
                ) : (
                  <div className="ef-section">
                    <p className="ef-section-title">Application Details</p>
                    <div className="ap-card ef-no-data ef-card">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <p>No application submitted yet.</p>
                    </div>
                  </div>
                )}

                {/* Addresses */}
                {(addresses.length>0 || editing) && (
                  <div className="ef-section">
                    <p className="ef-section-title">Address History <span className="ef-section-note">— sorted oldest first</span></p>
                    {editing ? (
                      <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                        {form.addresses.map((addr,i)=>(
                          <div key={i} className="ap-card ef-card" style={{position:"relative"}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.8rem",alignItems:"center"}}>
                              <span style={{fontFamily:"Sora,sans-serif",fontSize:"0.78rem",fontWeight:700,color:"#4a6478",textTransform:"uppercase",letterSpacing:"0.06em"}}>Address {i+1}</span>
                              <button type="button" onClick={()=>removeAddress(i)} style={{background:"#fff0f0",border:"1px solid #f5c5c5",borderRadius:"6px",color:"#c0392b",fontSize:"0.75rem",fontWeight:700,padding:"0.22rem 0.6rem",cursor:"pointer"}}>Remove</button>
                            </div>
                            <div className="ap-form-row">
                              <div className="ap-field" style={{flex:"1 1 100%"}}><label>Street</label><input className="ap-input" value={addr.street||""} onChange={e=>updAddr(i,"street",e.target.value)} placeholder="123 Main St"/></div>
                            </div>
                            <div className="ap-form-row">
                              <div className="ap-field"><label>City</label><input className="ap-input" value={addr.city||""} onChange={e=>updAddr(i,"city",e.target.value)} placeholder="City"/></div>
                              <div className="ap-field"><label>State</label><div className="ap-select-wrap"><select className="ap-select" value={addr.state||""} onChange={e=>updAddr(i,"state",e.target.value)}><option value="">Select</option>{US_STATES.map(s=><option key={s} value={s}>{s}</option>)}</select></div></div>
                              <div className="ap-field"><label>ZIP</label><input className="ap-input" value={addr.zip||""} onChange={e=>updAddr(i,"zip",e.target.value)} placeholder="00000"/></div>
                            </div>
                            <div className="ap-form-row">
                              <div className="ap-field"><label>Move-in</label><input className="ap-input" type="date" value={addr.moveInDate||""} onChange={e=>updAddr(i,"moveInDate",e.target.value)}/></div>
                              <div className="ap-field"><label>Move-out</label><input className="ap-input" type="date" value={addr.moveOutDate||""} onChange={e=>updAddr(i,"moveOutDate",e.target.value)} disabled={!!addr.current}/></div>
                              <div className="ap-field" style={{justifyContent:"flex-end",paddingBottom:"0.2rem"}}>
                                <label style={{display:"flex",alignItems:"center",gap:"0.45rem",fontSize:"0.82rem",fontWeight:600,cursor:"pointer",marginTop:"auto"}}>
                                  <input type="checkbox" checked={!!addr.current} onChange={e=>updAddr(i,"current",e.target.checked)} style={{width:16,height:16}}/>
                                  Current
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={addAddress} className="ob-add-btn" style={{alignSelf:"flex-start"}}>+ Add Address</button>
                      </div>
                    ) : (
                      <div className="ap-card" style={{padding:0,overflow:"hidden"}}>
                        <table className="ef-addr-table">
                          <thead><tr><th>Street</th><th>City / State / ZIP</th><th>Move-in</th><th>Move-out</th></tr></thead>
                          <tbody>
                            {[...addresses].sort((a,b)=>new Date(a.moveInDate)-new Date(b.moveInDate)).map((addr,i,sorted)=>{
                              const prev=sorted[i-1];
                              const prevEnd=prev?(prev.current?null:prev.moveOutDate):null;
                              const gap=prev&&prevEnd&&addr.moveInDate?Math.round((new Date(addr.moveInDate)-new Date(prevEnd))/(86400000)):null;
                              return (
                                <tr key={i} className={gap!==null&&gap>1?"ef-addr-row-gap":""}>
                                  <td className="ef-addr-street-cell">{addr.street}</td>
                                  <td>{addr.city}, {addr.state} {addr.zip}</td>
                                  <td className="ef-addr-date-cell">{fmtDate(addr.moveInDate)}</td>
                                  <td className="ef-addr-date-cell">{addr.current?<span className="ef-current-badge">Present</span>:fmtDate(addr.moveOutDate)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents table */}
                {application && (
                  <div className="ef-section">
                    <p className="ef-section-title">Documents <span className="ef-section-note">— click the eye icon to view securely</span></p>
                    <div className="ap-card" style={{padding:0,overflow:"hidden"}}>
                      <table className="ef-addr-table">
                        <thead><tr><th>Document</th><th>Status</th><th style={{textAlign:"right",width:96}}>Actions</th></tr></thead>
                        <tbody>
                          {ALL_FIELDS.map(field=>{
                            const exists = !!docPaths[field];
                            const ds = docState[field]||{};
                            const spinSvg = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"ap-spin 0.7s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
                            return (
                              <tr key={field}>
                                <td style={{fontWeight:600}}>{FIELD_LABELS[field]}</td>
                                <td>
                                  {exists
                                    ? <span style={{display:"inline-block",background:"#e8f7ee",color:"#1a5c34",borderRadius:"999px",padding:"0.15rem 0.6rem",fontSize:"0.72rem",fontWeight:700}}>Uploaded</span>
                                    : <span style={{display:"inline-block",background:"#f5f5f5",color:"#8fa4b6",borderRadius:"999px",padding:"0.15rem 0.6rem",fontSize:"0.72rem",fontWeight:700}}>Not uploaded</span>}
                                </td>
                                <td>
                                  <div style={{display:"flex",gap:"0.3rem",justifyContent:"flex-end",alignItems:"center"}}>
                                    {ds.error && <span style={{color:"#dc2626",fontSize:"0.7rem",marginRight:"0.2rem"}}>{ds.error}</span>}
                                    {/* View — always when uploaded */}
                                    {exists && (
                                      <button type="button" className="ef-doc-icon-btn" title="View document" onClick={()=>viewDoc(field)} disabled={ds.loading}>
                                        {ds.loading ? spinSvg : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                                      </button>
                                    )}
                                    {/* Upload / Replace — edit mode only */}
                                    {editing && (
                                      <label className="ef-doc-icon-btn ef-doc-icon-upload" title={exists?"Replace":"Upload"} style={{cursor:"pointer"}}>
                                        {ds.uploading ? spinSvg : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
                                        <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>uploadDoc(field,e.target.files[0])} disabled={ds.uploading}/>
                                      </label>
                                    )}
                                    {/* Delete — edit mode only when uploaded */}
                                    {editing && exists && (
                                      <button type="button" className="ef-doc-icon-btn ef-doc-icon-delete" title="Delete document" onClick={()=>deleteDoc(field)} disabled={ds.deleting}>
                                        {ds.deleting ? spinSvg : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
