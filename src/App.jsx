// src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  HVAC FLOW — Full-Stack Version
//  Data is stored in Supabase and shared across all users visiting the URL.
//  Engineers, Projects and Project Members are each in their own table.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "./lib/supabaseClient.js";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:"#07090F", panel:"#0D1117", card:"#111827", border:"#1C2840",
  accent:"#00C2FF", gold:"#FFB300", green:"#00D68F", red:"#FF4757",
  orange:"#FF7F50", purple:"#A78BFA", pink:"#F472B6", teal:"#2DD4BF",
  text:"#DDE6F0", muted:"#4A5568", label:"#7A8FA8",
};
const LEADER_PALETTE = [C.accent,C.gold,C.purple,C.pink,C.teal,C.orange,"#34D399","#F87171"];
const BRANCHES     = ["HQ","SV","ALX","AST"];
const branchColors = { HQ:C.accent, SV:C.gold, ALX:C.purple, AST:C.teal };
const posColors    = { Junior:C.muted, Senior:C.accent, Principal:C.gold, "Section Head":C.purple, Draftsman:"#94A3B8" };
const scopeColors  = { Design:C.accent, "Design Review":C.purple, "Value Engineering":C.gold, "Shop DWG":"#FB923C", CFD:C.teal, Sustainability:C.green, Other:C.muted };
const statusColors = { "Not Started Yet":C.purple, Ongoing:C.accent, Urgent:C.red, "Near Completion":C.teal, Completed:C.green, Hold:C.orange, Other:C.muted };
const stageColors  = { Concept:C.muted, Schematic:C.purple, "Design Development":C.accent, "Detailed Design":C.gold, Tender:C.teal, IFC:C.green, Other:"#94A3B8" };

const TOOLTIP_STYLE       = { background:"#0D1117", border:"1px solid #1C2840", borderRadius:6, fontSize:12, color:"#DDE6F0", boxShadow:"0 4px 20px #00000099" };
const TOOLTIP_LABEL_STYLE = { color:"#00C2FF", fontWeight:700, marginBottom:4 };
const TOOLTIP_ITEM_STYLE  = { color:"#DDE6F0" };

// ─── SEED DATA (86 engineers from Engineers.xlsx) ─────────────────────────────
const SEED_ENGINEERS = [
  {id:"e_5288",serial:"5288",name:"Sheren Medhat Sayed",position:"Principal",option:"Team Leader",branch:"HQ",gradYear:2007,notes:""},
  {id:"e_5361",serial:"5361",name:"Ibrahim Mohamed Hamouda",position:"Principal",option:"Team Leader",branch:"HQ",gradYear:2011,notes:""},
  {id:"e_5120",serial:"5120",name:"Hassan Bahy Hassan Mohamed",position:"Principal",option:"Team Leader",branch:"HQ",gradYear:2009,notes:""},
  {id:"e_5632",serial:"5632",name:"Mohamed Gamal AbdelHAk",position:"Principal",option:"Team Leader",branch:"HQ",gradYear:2012,notes:""},
  {id:"e_5740",serial:"5740",name:"Mohamed Abd ElKareem",position:"Principal",option:"Team Leader",branch:"HQ",gradYear:2009,notes:""},
  {id:"e_5822",serial:"5822",name:"Amr Tarek Saleh Sirry",position:"Principal",option:"Team Leader",branch:"HQ",gradYear:2012,notes:""},
  {id:"e_A797",serial:"A797",name:"Norhan Khaled Ghareeb",position:"Senior",option:"Team Leader",branch:"HQ",gradYear:2017,notes:""},
  {id:"e_B817",serial:"B817",name:"Abdallah Saad ElSaied Saad",position:"Senior",option:"Team Leader",branch:"HQ",gradYear:2011,notes:""},
  {id:"e_B331",serial:"B331",name:"MenaTallah Saber Ibrahim Meligy",position:"Senior",option:"Team Member",branch:"HQ",gradYear:2016,notes:""},
  {id:"e_B562",serial:"B562",name:"Ahmed Osman Salem",position:"Senior",option:"Team Leader",branch:"HQ",gradYear:2019,notes:""},
  {id:"e_C740",serial:"C740",name:"Mohannad Eslam Ahmed Eid Shahin",position:"Senior",option:"Team Leader",branch:"HQ",gradYear:2018,notes:""},
  {id:"e_9969",serial:"9969",name:"Ahmed Samir Saadeldin Mahmoud Shalaby",position:"Junior",option:"Team Leader",branch:"HQ",gradYear:2020,notes:""},
  {id:"e_B302",serial:"B302",name:"Eslam Alaa Sayed Hassan",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2021,notes:""},
  {id:"e_B965",serial:"B965",name:"Mohaned Taha Salama Hussein",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2024,notes:""},
  {id:"e_A665",serial:"A665",name:"Amr Adel Aly Abdelsalam",position:"Junior",option:"Team Leader",branch:"HQ",gradYear:2018,notes:""},
  {id:"e_C409",serial:"C409",name:"Ahmed Hesham Fathi Mohamed",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2022,notes:""},
  {id:"e_C526",serial:"C526",name:"Mustafa Mohamed Mowafy",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2023,notes:""},
  {id:"e_C543",serial:"C543",name:"Farah Sayed Abdel Karim",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2024,notes:""},
  {id:"e_C585",serial:"C585",name:"Abdelulrahman Mohamed Fathy Hamed",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2023,notes:""},
  {id:"e_C600",serial:"C600",name:"Amr Mohamed Mohmed Ibrahim Attia",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2024,notes:""},
  {id:"e_C626",serial:"C626",name:"Moustafa Mohamed Hefzy Ahmed",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2025,notes:""},
  {id:"e_C629",serial:"C629",name:"Mostafa Mohamed Mohamed Ahmed",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2022,notes:""},
  {id:"e_C913",serial:"C913",name:"Shaaban Ebrahim Shaaban ElWehidy",position:"Junior",option:"Team Member",branch:"HQ",gradYear:2024,notes:""},
  {id:"e_2779",serial:"2779",name:"Osama Mohamed Aly Alkordi",position:"Draftsman",option:"Team Member",branch:"HQ",gradYear:1997,notes:""},
  {id:"e_3483",serial:"3483",name:"Mohamed Osman A. Wahman",position:"Draftsman",option:"Team Member",branch:"HQ",gradYear:1999,notes:""},
  {id:"e_3800",serial:"3800",name:"Mostafa Mahmoud Mobarak Saleh",position:"Draftsman",option:"Team Member",branch:"HQ",gradYear:2000,notes:""},
  {id:"e_B137",serial:"B137",name:"Amr Mohmed Gamal Gahlan",position:"Draftsman",option:"Team Member",branch:"HQ",gradYear:2011,notes:""},
  {id:"e_C256",serial:"C256",name:"Belal Moustafa Mahmoud",position:"Draftsman",option:"Team Member",branch:"HQ",gradYear:2022,notes:""},
  {id:"e_5118",serial:"5118",name:"Mohamed Alaa ElDin Mohamed Qenawi",position:"Section Head",option:"Team Leader",branch:"SV",gradYear:2005,notes:""},
  {id:"e_5443",serial:"5443",name:"Mahmoud Fouad Abdel Fattah Sabry",position:"Principal",option:"Team Leader",branch:"SV",gradYear:2012,notes:""},
  {id:"e_6843",serial:"6843",name:"Ahmed Kamel Mahmoud Kamel",position:"Principal",option:"Team Leader",branch:"SV",gradYear:2011,notes:""},
  {id:"e_6800",serial:"6800",name:"AbdelRahman Mostafa Mahmoud Mohamed Attia",position:"Principal",option:"Team Leader",branch:"SV",gradYear:2012,notes:""},
  {id:"e_6888",serial:"6888",name:"Mostafa Fathy Shalaqamy",position:"Senior",option:"Team Leader",branch:"SV",gradYear:2010,notes:""},
  {id:"e_A082",serial:"A082",name:"Othman Mohamed Othman Mostafa",position:"Senior",option:"Team Leader",branch:"SV",gradYear:2019,notes:""},
  {id:"e_B746",serial:"B746",name:"Ahmed Mohamed AbdelRahman Mohamed Phroh",position:"Senior",option:"Team Leader",branch:"SV",gradYear:2013,notes:""},
  {id:"e_B593",serial:"B593",name:"Asser Ahmed Saeed Khalil Alnaharawy",position:"Junior",option:"Team Member",branch:"SV",gradYear:2022,notes:""},
  {id:"e_B670",serial:"B670",name:"Peter Essam Sadek",position:"Junior",option:"Team Member",branch:"SV",gradYear:2022,notes:""},
  {id:"e_B832",serial:"B832",name:"Sarah Ahmed Shawky AbdelKhalek",position:"Junior",option:"Team Member",branch:"SV",gradYear:2024,notes:""},
  {id:"e_B974",serial:"B974",name:"Mohamed Ashraf Kamel Goma",position:"Junior",option:"Team Member",branch:"SV",gradYear:2024,notes:""},
  {id:"e_C345",serial:"C345",name:"Ahmed Ashraf Anwar Hamed",position:"Junior",option:"Team Member",branch:"SV",gradYear:2022,notes:""},
  {id:"e_C502",serial:"C502",name:"Mariam AbdelKhaliQ AbdelRahman",position:"Junior",option:"Team Member",branch:"SV",gradYear:2024,notes:""},
  {id:"e_C507",serial:"C507",name:"Abdul Rahman Gamal Ismail",position:"Junior",option:"Team Member",branch:"SV",gradYear:2023,notes:""},
  {id:"e_C616",serial:"C616",name:"Ahmed Saad Ahmed Abdel Khalek",position:"Junior",option:"Team Member",branch:"SV",gradYear:2025,notes:""},
  {id:"e_C666",serial:"C666",name:"Abdalla Wael Abdallah Hassan",position:"Junior",option:"Team Member",branch:"SV",gradYear:2024,notes:""},
  {id:"e_C687",serial:"C687",name:"Mamoun Fathi Mamoun Mohamed Ali",position:"Junior",option:"Team Member",branch:"SV",gradYear:2023,notes:""},
  {id:"e_3498",serial:"3498",name:"Shehabeldin Mohamed A. Elgendy",position:"Draftsman",option:"Team Member",branch:"SV",gradYear:2006,notes:""},
  {id:"e_6342",serial:"6342",name:"Ragy Mohamed Fathalah",position:"Draftsman",option:"Team Member",branch:"SV",gradYear:2008,notes:""},
  {id:"e_6788",serial:"6788",name:"Mahmoud Fouad Mahmoud ElQady",position:"Draftsman",option:"Team Member",branch:"SV",gradYear:1999,notes:""},
  {id:"e_B237",serial:"B237",name:"Hussein Mohamed Ahmed Saad",position:"Draftsman",option:"Team Member",branch:"SV",gradYear:1996,notes:""},
  {id:"e_6168",serial:"6168",name:"Ahmed Ashraf Moustafa",position:"Principal",option:"Team Leader",branch:"ALX",gradYear:2013,notes:""},
  {id:"e_C337",serial:"C337",name:"Elhussien Mohamed Shams Eldien",position:"Principal",option:"Team Leader",branch:"ALX",gradYear:2013,notes:""},
  {id:"e_9441",serial:"9441",name:"Mohamed Mahmoud Abbas Ashry",position:"Senior",option:"Team Leader",branch:"ALX",gradYear:2017,notes:""},
  {id:"e_A652",serial:"A652",name:"Mohamed Nabil Mohamed Anwar",position:"Senior",option:"Team Leader",branch:"ALX",gradYear:2019,notes:""},
  {id:"e_A894",serial:"A894",name:"Ahmed Adel Fathy Abbas",position:"Senior",option:"Team Leader",branch:"ALX",gradYear:2019,notes:""},
  {id:"e_A960",serial:"A960",name:"Amir El Sayed Abd elGhany",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2021,notes:""},
  {id:"e_B127",serial:"B127",name:"Mohamed Abd ElKader",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2022,notes:""},
  {id:"e_B261",serial:"B261",name:"El Sayed Ali Osman Tokishem",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2021,notes:""},
  {id:"e_B708",serial:"B708",name:"Ali Ahmed Ali Ahmed ElBouredy",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2022,notes:""},
  {id:"e_B716",serial:"B716",name:"AbdelRahman Essam Abdeen Ibrahim Kobeisy",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2023,notes:""},
  {id:"e_C377",serial:"C377",name:"Salma Abd ElMohsen Abd ElMohsen",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2021,notes:""},
  {id:"e_C347",serial:"C347",name:"Mayar Hany Atef Gaml ElDin",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2024,notes:""},
  {id:"e_B948",serial:"B948",name:"Karim Mohamed Ahmed AbdelHamid",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2021,notes:""},
  {id:"e_B285",serial:"B285",name:"Mohamed AbdElRaheem AbdelMoniem ElSafty",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2021,notes:""},
  {id:"e_B310",serial:"B310",name:"Mohamed Mohaseb Ibrahim Mohamed Ibrahim",position:"Junior",option:"Team Member",branch:"ALX",gradYear:2021,notes:""},
  {id:"e_6853",serial:"6853",name:"Mohamed Hamed Mabrouk Azab",position:"Draftsman",option:"Team Member",branch:"ALX",gradYear:2010,notes:""},
  {id:"e_7606",serial:"7606",name:"Ahmed Nader Mohamed Baz",position:"Draftsman",option:"Team Member",branch:"ALX",gradYear:2010,notes:""},
  {id:"e_C206",serial:"C206",name:"Adel Mostafa Abdelaleem Elhamashary",position:"Draftsman",option:"Team Member",branch:"ALX",gradYear:2019,notes:""},
  {id:"e_C646",serial:"C646",name:"Amr Essam Ali Mohamed Khalaf",position:"Draftsman",option:"Team Member",branch:"ALX",gradYear:2022,notes:""},
  {id:"e_C734",serial:"C734",name:"Marwan Ibrahim Abdelmonem Ali Kamel",position:"Draftsman",option:"Team Member",branch:"ALX",gradYear:2023,notes:""},
  {id:"e_8702",serial:"8702",name:"Mahmoud Zakria Abd el Aziz Ali",position:"Principal",option:"Team Leader",branch:"AST",gradYear:2012,notes:""},
  {id:"e_8654",serial:"8654",name:"Taha Abdel Razek Taha",position:"Principal",option:"Team Leader",branch:"AST",gradYear:2013,notes:""},
  {id:"e_A119",serial:"A119",name:"Mohammed Mahmoud Ahmed Ammar",position:"Senior",option:"Team Leader",branch:"AST",gradYear:2017,notes:""},
  {id:"e_B354",serial:"B354",name:"Alaa Gamal Ali Marzouk",position:"Senior",option:"Team Leader",branch:"AST",gradYear:2020,notes:""},
  {id:"e_B352",serial:"B352",name:"Hanafy Asharaf Hanafy Mohamed",position:"Junior",option:"Team Member",branch:"AST",gradYear:2021,notes:""},
  {id:"e_B353",serial:"B353",name:"AbdElHamed Gamal AbdElHamed Abeid",position:"Junior",option:"Team Member",branch:"AST",gradYear:2021,notes:""},
  {id:"e_B772",serial:"B772",name:"Mahmoud Naser Mohamed Yousif",position:"Junior",option:"Team Member",branch:"AST",gradYear:2022,notes:""},
  {id:"e_C339",serial:"C339",name:"Basel Mohamed Hussien Shehata",position:"Junior",option:"Team Member",branch:"AST",gradYear:2024,notes:""},
  {id:"e_B955",serial:"B955",name:"Hesham Ahmed AbdElgaber Ahmed",position:"Junior",option:"Team Member",branch:"AST",gradYear:2023,notes:""},
  {id:"e_C432",serial:"C432",name:"Haytham Safwet Mosa Diab",position:"Junior",option:"Team Member",branch:"AST",gradYear:2024,notes:""},
  {id:"e_C594",serial:"C594",name:"Hazem Mohamed Khalifa AbdelHamid",position:"Senior",option:"Team Member",branch:"AST",gradYear:2012,notes:""},
  {id:"e_C483",serial:"C483",name:"Kerillos Gevara Helal Nazir",position:"Junior",option:"Team Member",branch:"AST",gradYear:2023,notes:""},
  {id:"e_C636",serial:"C636",name:"Yasmen Mohamed Khaled Ragab Sayed",position:"Junior",option:"Team Member",branch:"AST",gradYear:2025,notes:""},
  {id:"e_C686",serial:"C686",name:"Waleed Mohamed Ahmed Mohamed",position:"Junior",option:"Team Member",branch:"AST",gradYear:2024,notes:""},
  {id:"e_C849",serial:"C849",name:"Mohamed Asem Youssef Mohamed",position:"Junior",option:"Team Member",branch:"AST",gradYear:2024,notes:""},
];

// ─── CAIRO TIME HELPER ────────────────────────────────────────────────────────
function getCairoDateTime() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone:"Africa/Cairo",
    year:"numeric", month:"2-digit", day:"2-digit",
    hour:"2-digit", minute:"2-digit", hour12:false,
  }).formatToParts(d);
  const get = t => parts.find(p => p.type === t)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

// ─── AUTO-DETECT IDENTITY ─────────────────────────────────────────────────────
function detectIdentity() {
  const ua  = navigator.userAgent || "";
  let browser = "Browser";
  if (/Edg\//.test(ua))          browser = "Edge";
  else if (/Chrome\//.test(ua))  browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua))  browser = "Safari";
  const plat    = (navigator.platform || "").replace(/Win32|Win64/, "Windows").replace("MacIntel","Mac");
  const tzShort = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace(/_/g," ") || "";
  return [plat, browser, tzShort].filter(Boolean).join(" · ") || "HVAC Flow User";
}

// ─── DATA CONVERSION HELPERS ──────────────────────────────────────────────────
// DB row → app engineer object
function rowToEngineer(row) {
  return {
    id:       row.id,
    serial:   row.serial,
    name:     row.name,
    position: row.position,
    option:   row.option,
    branch:   row.branch,
    gradYear: row.grad_year,
    notes:    row.notes || "",
  };
}
// App engineer → DB row
function engineerToRow(e) {
  return {
    id:        e.id,
    serial:    e.serial,
    name:      e.name,
    position:  e.position,
    option:    e.option,
    branch:    e.branch,
    grad_year: Number(e.gradYear) || 2000,
    notes:     e.notes || "",
  };
}

// DB rows → app project object  (members injected separately)
function rowToProject(row, membersRows) {
  const myMembers = (membersRows || [])
    .filter(m => m.project_id === row.id)
    .map(m => ({ engId: m.eng_id, load: m.load }));
  return {
    id:               row.id,
    number:           row.number || "",
    name:             row.name,
    scope:            row.scope,
    status:           row.status,
    type:             row.type,
    stage:            row.stage,
    branch:           row.branch,
    submissionDate:   row.submission_date || "",
    finalizationDate: row.finalization_date || "",
    leaderId:         row.leader_id || "",
    leaderLoad:       row.leader_load || 0,
    notes:            row.notes || "",
    members:          myMembers,
  };
}
// App project → DB row  (members handled separately)
function projectToRow(p) {
  return {
    id:                p.id,
    number:            p.number || "",
    name:              p.name,
    scope:             p.scope,
    status:            p.status,
    type:              p.type,
    stage:             p.stage,
    branch:            p.branch,
    submission_date:   p.submissionDate || "",
    finalization_date: p.finalizationDate || "",
    leader_id:         p.leaderId || "",
    leader_load:       Number(p.leaderLoad) || 0,
    notes:             p.notes || "",
  };
}

// ─── STYLE HELPERS ─────────────────────────────────────────────────────────────
const sCard = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, ...x });
const sInp  = (x={}) => ({ width:"100%", background:"#060A12", border:`1px solid ${C.border}`, borderRadius:4, padding:"8px 11px", color:C.text, fontFamily:"inherit", fontSize:12, outline:"none", boxSizing:"border-box", ...x });
const sSel  = (x={}) => ({ ...sInp(), cursor:"pointer", ...x });
const sBtn  = (v="primary",x={}) => ({ background:v==="primary"?C.accent:v==="danger"?C.red:v==="success"?C.green:v==="save"?"#1B4332":"transparent", color:v==="primary"?"#000":v==="success"?"#000":v==="save"?C.green:C.text, border:v==="ghost"?`1px solid ${C.border}`:v==="save"?`1px solid ${C.green}55`:"none", borderRadius:4, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700, ...x });
const sTag  = c => ({ display:"inline-block", background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:3, padding:"2px 8px", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700 });
const sTH   = { textAlign:"left", padding:"8px 12px", color:C.muted, fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", borderBottom:`1px solid ${C.border}` };
const sTD   = { padding:"9px 12px", borderBottom:`1px solid ${C.border}22`, verticalAlign:"middle" };
const sNav  = a => ({ background:"none", border:"none", color:a?C.accent:C.muted, cursor:"pointer", padding:"0 15px", height:54, fontFamily:"inherit", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", borderBottom:a?`2px solid ${C.accent}`:"2px solid transparent", transition:"all 0.2s", fontWeight:a?700:400 });

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Tag   = ({color,children}) => <span style={sTag(color)}>{children}</span>;
const Field = ({label,children}) => (
  <div style={{marginBottom:14}}>
    <div style={{fontSize:10,color:C.label,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
    {children}
  </div>
);

function StatCard({label,value,sub,color=C.accent,icon}) {
  return (
    <div style={sCard({textAlign:"center",position:"relative",overflow:"hidden"})}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:color}}/>
      {icon && <div style={{fontSize:18,marginBottom:4}}>{icon}</div>}
      <div style={{fontSize:22,fontWeight:700,color,fontFamily:"inherit"}}>{value}</div>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginTop:3}}>{label}</div>
      {sub && <div style={{fontSize:10,color,marginTop:2,opacity:0.7}}>{sub}</div>}
    </div>
  );
}

function ProgressBar({value,max,color=C.accent,h=5}) {
  const pct = Math.min(100,Math.max(0,Math.round((value/Math.max(max,1))*100)));
  return (
    <div style={{background:C.border,borderRadius:h,height:h,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:h,transition:"width 0.4s"}}/>
    </div>
  );
}

let _uid = Date.now();
const uid = () => `id_${++_uid}`;

// ═══════════════════════════════════════════════════════════════════════════════
//  LOADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoadingScreen({message}) {
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{fontSize:32,color:C.accent,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:"0.2em"}}>⟨ HVAC_FLOW ⟩</div>
      <div style={{width:40,height:40,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:12,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{message||"Loading…"}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ENGINEERS MODULE
// ═══════════════════════════════════════════════════════════════════════════════
function EngineersModule({engineers,setEngineers,onMarkUnsaved}) {
  const blank = {id:"",serial:"",name:"",position:"Junior",option:"Team Member",branch:"HQ",gradYear:"",notes:""};
  const [form,setForm]     = useState(blank);
  const [editing,setEditing] = useState(null);
  const [showForm,setShowForm] = useState(false);
  const [filterBranch,setFilterBranch] = useState("All");

  const save = () => {
    if(!form.name.trim()) return;
    const e = { ...form, id: editing || `e_${uid()}`, gradYear: Number(form.gradYear)||new Date().getFullYear() };
    if(editing) setEngineers(p => p.map(x => x.id===editing ? e : x));
    else        setEngineers(p => [...p, e]);
    setForm(blank); setEditing(null); setShowForm(false);
    onMarkUnsaved();
  };
  const edit = eng => { setForm({...eng}); setEditing(eng.id); setShowForm(true); };
  const del  = id  => { setEngineers(p => p.filter(e => e.id!==id)); onMarkUnsaved(); };

  const filtered = filterBranch==="All" ? engineers : engineers.filter(e => e.branch===filterBranch);
  const leaders  = filtered.filter(e => e.option==="Team Leader");
  const members  = filtered.filter(e => e.option==="Team Member");

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Engineers</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>
            {engineers.length} registered · {engineers.filter(e=>e.option==="Team Leader").length} leaders · {engineers.filter(e=>e.option==="Team Member").length} members
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>Branch:</span>
            <select style={sSel({width:90})} value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
              <option>All</option>
              {BRANCHES.map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <button style={sBtn()} onClick={()=>{setForm(blank);setEditing(null);setShowForm(!showForm);}}>
            {showForm?"— Close":"+ Add Engineer"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{...sCard({borderColor:C.accent+"44",marginBottom:24})}}>
          <div style={{fontSize:11,color:C.accent,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:18,fontWeight:700}}>
            {editing?"Edit":"New"} Engineer
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            <Field label="Serial Number">
              <input style={sInp()} value={form.serial} onChange={e=>setForm(f=>({...f,serial:e.target.value}))} placeholder="e.g. 001"/>
            </Field>
            <Field label="Full Name">
              <input style={sInp()} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Engineer full name"/>
            </Field>
            <Field label="Graduation Year">
              <input style={sInp()} type="number" value={form.gradYear} onChange={e=>setForm(f=>({...f,gradYear:e.target.value}))} placeholder="e.g. 2015" min="1960" max="2030"/>
            </Field>
            <Field label="Position">
              <select style={sSel()} value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))}>
                {["Section Head","Principal","Senior","Junior","Draftsman"].map(p=><option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Option">
              <select style={sSel()} value={form.option} onChange={e=>setForm(f=>({...f,option:e.target.value}))}>
                <option>Team Leader</option>
                <option>Team Member</option>
              </select>
            </Field>
            <Field label="Branch">
              <select style={sSel()} value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                {BRANCHES.map(b=><option key={b}>{b}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <input style={sInp()} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional notes"/>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button style={sBtn()} onClick={save}>{editing?"Update":"Save"} Engineer</button>
            <button style={sBtn("ghost")} onClick={()=>{setForm(blank);setEditing(null);setShowForm(false);}}>Cancel</button>
          </div>
        </div>
      )}

      {engineers.length===0&&!showForm && (
        <div style={{...sCard({textAlign:"center",padding:48,borderStyle:"dashed"})}}>
          <div style={{fontSize:32,marginBottom:12}}>◉</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:18}}>No engineers yet. Click "+ Add Engineer" to get started.</div>
          <button style={sBtn()} onClick={()=>setShowForm(true)}>+ Add First Engineer</button>
        </div>
      )}

      {/* Branch pills */}
      {engineers.length>0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          {BRANCHES.map(b=>{
            const cnt=engineers.filter(e=>e.branch===b).length;
            if(!cnt) return null;
            return (
              <div key={b} onClick={()=>setFilterBranch(filterBranch===b?"All":b)}
                style={{padding:"5px 14px",borderRadius:20,background:filterBranch===b?branchColors[b]+"33":"#0A0E18",border:`1px solid ${branchColors[b]}${filterBranch===b?"99":"44"}`,cursor:"pointer",fontSize:11,color:filterBranch===b?branchColors[b]:C.muted,fontWeight:700,transition:"all 0.15s"}}>
                {b} · {cnt}
              </div>
            );
          })}
          {filterBranch!=="All"&&<div onClick={()=>setFilterBranch("All")} style={{padding:"5px 14px",borderRadius:20,background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted}}>Show All</div>}
        </div>
      )}

      {/* Leaders */}
      {leaders.length>0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.gold,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span>★</span> Team Leaders ({leaders.length})
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {leaders.map((eng,i)=>(
              <div key={eng.id} style={sCard({borderColor:LEADER_PALETTE[i%LEADER_PALETTE.length]+"44",borderLeftColor:LEADER_PALETTE[i%LEADER_PALETTE.length],borderLeftWidth:3})}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>#{eng.serial} · {eng.name}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>Graduated {eng.gradYear} · {new Date().getFullYear()-Number(eng.gradYear)} yrs exp</div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button style={sBtn("ghost",{padding:"3px 9px",fontSize:10})} onClick={()=>edit(eng)}>Edit</button>
                    <button style={sBtn("danger",{padding:"3px 9px",fontSize:10})} onClick={()=>del(eng.id)}>✕</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  <Tag color={posColors[eng.position]||C.muted}>{eng.position}</Tag>
                  <Tag color={C.gold}>★ Leader</Tag>
                  <Tag color={branchColors[eng.branch]||C.muted}>{eng.branch}</Tag>
                </div>
                {eng.notes&&<div style={{fontSize:10,color:C.muted,marginTop:8,fontStyle:"italic"}}>{eng.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members table */}
      {members.length>0 && (
        <div>
          <div style={{fontSize:11,color:C.accent,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12}}>Team Members ({members.length})</div>
          <div style={sCard({padding:0,overflow:"hidden"})}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>{["#","Serial","Name","Position","Branch","Grad Year","Notes",""].map(h=><th key={h} style={sTH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {members.map((eng,i)=>(
                  <tr key={eng.id} style={{background:i%2?"#0C1525":"#0F1B2E"}}>
                    <td style={sTD}><span style={{color:C.muted,fontSize:10}}>{i+1}</span></td>
                    <td style={sTD}><span style={{color:C.accent,fontWeight:700}}>#{eng.serial}</span></td>
                    <td style={sTD}><span style={{color:C.text,fontWeight:600}}>{eng.name}</span></td>
                    <td style={sTD}><Tag color={posColors[eng.position]||C.muted}>{eng.position}</Tag></td>
                    <td style={sTD}><Tag color={branchColors[eng.branch]||C.muted}>{eng.branch}</Tag></td>
                    <td style={{...sTD,color:C.label,textAlign:"center"}}>{eng.gradYear}</td>
                    <td style={{...sTD,color:C.muted,fontSize:11,fontStyle:"italic"}}>{eng.notes||"—"}</td>
                    <td style={sTD}>
                      <div style={{display:"flex",gap:5}}>
                        <button style={sBtn("ghost",{padding:"3px 9px",fontSize:10})} onClick={()=>edit(eng)}>Edit</button>
                        <button style={sBtn("danger",{padding:"3px 9px",fontSize:10})} onClick={()=>del(eng.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROJECTS MODULE
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectsModule({projects,setProjects,engineers,onMarkUnsaved}) {
  const leaders = engineers.filter(e=>e.option==="Team Leader");
  const blankProj = () => ({
    id:"",number:"",name:"",scope:"Design",status:"Not Started Yet",
    type:"Commercial",stage:"Concept",branch:"HQ",
    submissionDate:"",finalizationDate:"",
    leaderId:leaders[0]?.id||"",leaderLoad:0,members:[],notes:""
  });
  const [form,setForm]     = useState(blankProj());
  const [editing,setEditing] = useState(null);
  const [showForm,setShowForm] = useState(false);
  const [expandedId,setExpandedId] = useState(null);
  const [filterBranch,setFilterBranch] = useState("All");

  const addMember    = ()    => setForm(f=>({...f,members:[...f.members,{engId:engineers.find(e=>!f.members.find(m=>m.engId===e.id)&&e.id!==f.leaderId)?.id||"",load:0}]}));
  const removeMember = idx  => setForm(f=>({...f,members:f.members.filter((_,i)=>i!==idx)}));
  const updateMember = (idx,key,val) => setForm(f=>({...f,members:f.members.map((m,i)=>i===idx?{...m,[key]:val}:m)}));

  const usedMemberIds = new Set([form.leaderId,...form.members.map(m=>m.engId)]);
  const totalLoad = form.leaderLoad+form.members.reduce((s,m)=>s+m.load,0);

  const save = () => {
    if(!form.name.trim()) return;
    const entry = {...form,id:editing||`p_${uid()}`};
    if(editing) setProjects(p=>p.map(x=>x.id===editing?entry:x));
    else        setProjects(p=>[...p,entry]);
    setForm(blankProj()); setEditing(null); setShowForm(false);
    onMarkUnsaved();
  };
  const editProj = p => { setForm({...p,members:p.members.map(m=>({...m}))}); setEditing(p.id); setShowForm(true); };
  const delProj  = id => { setProjects(p=>p.filter(x=>x.id!==id)); onMarkUnsaved(); };

  const filtered = filterBranch==="All"?projects:projects.filter(p=>p.branch===filterBranch);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Projects</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>
            {projects.length} total · {projects.filter(p=>p.status==="Ongoing").length} ongoing · {projects.filter(p=>p.status==="Urgent").length} urgent
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <select style={sSel({width:90})} value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
            <option>All</option>
            {BRANCHES.map(b=><option key={b}>{b}</option>)}
          </select>
          <button style={sBtn()} onClick={()=>{setForm(blankProj());setEditing(null);setShowForm(!showForm);}}>
            {showForm?"— Close":"+ New Project"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{...sCard({borderColor:C.gold+"44",marginBottom:24})}}>
          <div style={{fontSize:11,color:C.gold,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:18,fontWeight:700}}>
            {editing?"Edit":"New"} Project
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr 1fr",gap:12,marginBottom:4}}>
            <Field label="Project Number"><input style={sInp()} value={form.number} onChange={e=>setForm(f=>({...f,number:e.target.value}))} placeholder="e.g. HVAC-2024-001"/></Field>
            <Field label="Project Name"><input style={sInp()} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Project name"/></Field>
            <Field label="Branch"><select style={sSel()} value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>{BRANCHES.map(b=><option key={b}>{b}</option>)}</select></Field>
            <Field label="Scope">
              <select style={sSel()} value={form.scope} onChange={e=>setForm(f=>({...f,scope:e.target.value}))}>
                {["Design","Design Review","Value Engineering","Shop DWG","CFD","Sustainability","Other"].map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={sSel()} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {["Not Started Yet","Ongoing","Urgent","Near Completion","Completed","Hold","Other"].map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
            <Field label="Project Type">
              <select style={sSel()} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                {["Commercial","Residential","Administrative","Mixed-use","Health care","Data Center","District Cooling","Infrastructure","Industrial","Other"].map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Current Stage">
              <select style={sSel()} value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))}>
                {["Concept","Schematic","Design Development","Detailed Design","Tender","IFC","Other"].map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Submission Date"><input style={sInp()} type="date" value={form.submissionDate} onChange={e=>setForm(f=>({...f,submissionDate:e.target.value}))}/></Field>
            <Field label="Finalization Date"><input style={sInp()} type="date" value={form.finalizationDate} onChange={e=>setForm(f=>({...f,finalizationDate:e.target.value}))}/></Field>
          </div>

          <div style={{background:"#080E1A",borderRadius:6,padding:14,marginBottom:12,border:`1px solid ${C.gold}33`}}>
            <div style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12,fontWeight:700}}>Team Leader & Workload</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 160px",gap:12,alignItems:"end"}}>
              <Field label="Assigned Team Leader">
                <select style={sSel()} value={form.leaderId} onChange={e=>setForm(f=>({...f,leaderId:e.target.value}))}>
                  {leaders.length===0&&<option value="">— No leaders defined yet —</option>}
                  {leaders.map(l=><option key={l.id} value={l.id}>{l.name} ({l.position} · {l.branch})</option>)}
                </select>
              </Field>
              <Field label="Leader Workload %">
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input style={sInp({width:80})} type="number" min="0" max="100" value={form.leaderLoad} onChange={e=>setForm(f=>({...f,leaderLoad:Number(e.target.value)}))} placeholder="0"/>
                  <span style={{color:C.muted,fontSize:12}}>%</span>
                </div>
              </Field>
            </div>
          </div>

          <div style={{background:"#080E1A",borderRadius:6,padding:14,marginBottom:14,border:`1px solid ${C.accent}33`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:10,color:C.accent,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Team Members</div>
              <button style={sBtn("ghost",{fontSize:10,padding:"5px 12px"})} onClick={addMember}>+ Add Team Member</button>
            </div>
            {form.members.length===0&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic",padding:"8px 0"}}>No team members yet.</div>}
            {form.members.map((m,idx)=>(
              <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 140px 40px",gap:10,marginBottom:8,alignItems:"end"}}>
                <Field label={`Team Member ${idx+1}`}>
                  <select style={sSel()} value={m.engId} onChange={e=>updateMember(idx,"engId",e.target.value)}>
                    <option value="">— Select Engineer —</option>
                    {engineers.filter(e=>e.id===m.engId||!usedMemberIds.has(e.id)).map(e=>(
                      <option key={e.id} value={e.id}>{e.name} ({e.position} · {e.branch})</option>
                    ))}
                  </select>
                </Field>
                <Field label="Workload %">
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input style={sInp({width:70})} type="number" min="0" max="100" value={m.load} onChange={e=>updateMember(idx,"load",Number(e.target.value))} placeholder="0"/>
                    <span style={{color:C.muted,fontSize:12}}>%</span>
                  </div>
                </Field>
                <div style={{paddingBottom:14}}>
                  <button style={sBtn("danger",{padding:"8px 10px",fontSize:12})} onClick={()=>removeMember(idx)}>✕</button>
                </div>
              </div>
            ))}
            {(form.members.length>0||form.leaderId)&&(
              <div style={{fontSize:11,marginTop:8,padding:"6px 10px",borderRadius:4,background:totalLoad===100?C.green+"11":C.orange+"11",border:`1px solid ${totalLoad===100?C.green:C.orange}33`}}>
                Total: <span style={{color:totalLoad===100?C.green:C.orange,fontWeight:700}}>{totalLoad}%</span>
                {totalLoad===100&&<span style={{color:C.green,marginLeft:8}}>✓ Balanced</span>}
              </div>
            )}
          </div>

          <Field label="Notes"><input style={sInp()} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional notes..."/></Field>
          <div style={{display:"flex",gap:10}}>
            <button style={sBtn()} onClick={save}>{editing?"Update":"Save"} Project</button>
            <button style={sBtn("ghost")} onClick={()=>{setForm(blankProj());setEditing(null);setShowForm(false);}}>Cancel</button>
          </div>
        </div>
      )}

      {projects.length===0&&!showForm&&(
        <div style={{...sCard({textAlign:"center",padding:48,borderStyle:"dashed"})}}>
          <div style={{fontSize:32,marginBottom:12}}>◧</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:18}}>No projects yet.</div>
          <button style={sBtn()} onClick={()=>setShowForm(true)}>+ Add First Project</button>
        </div>
      )}

      {/* Branch pills */}
      {projects.length>0&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
          {BRANCHES.map(b=>{const cnt=projects.filter(p=>p.branch===b).length;if(!cnt)return null;return(
            <div key={b} onClick={()=>setFilterBranch(filterBranch===b?"All":b)}
              style={{padding:"5px 14px",borderRadius:20,background:filterBranch===b?branchColors[b]+"33":"#0A0E18",border:`1px solid ${branchColors[b]}${filterBranch===b?"99":"44"}`,cursor:"pointer",fontSize:11,color:filterBranch===b?branchColors[b]:C.muted,fontWeight:700,transition:"all 0.15s"}}>
              {b} · {cnt}
            </div>
          );})}
          {filterBranch!=="All"&&<div onClick={()=>setFilterBranch("All")} style={{padding:"5px 14px",borderRadius:20,background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted}}>Show All</div>}
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map(proj=>{
          const leader     = engineers.find(e=>e.id===proj.leaderId);
          const memberEngs = proj.members.map(m=>({...m,eng:engineers.find(e=>e.id===m.engId)})).filter(m=>m.eng);
          const exp = expandedId===proj.id;
          const sc  = statusColors[proj.status]||C.muted;
          return (
            <div key={proj.id} style={sCard({borderColor:exp?sc+"66":C.border})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpandedId(exp?null:proj.id)}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:C.muted}}>#{proj.number}</span>
                    <span style={{fontSize:14,fontWeight:700,color:C.text}}>{proj.name}</span>
                    <Tag color={branchColors[proj.branch]||C.muted}>{proj.branch}</Tag>
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{proj.type} · {proj.scope} · Leader: {leader?.name||"—"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <Tag color={sc}>{proj.status}</Tag>
                  <Tag color={stageColors[proj.stage]||C.muted}>{proj.stage}</Tag>
                  <span style={{color:C.muted,fontSize:14}}>{exp?"▲":"▼"}</span>
                  <button style={sBtn("ghost",{padding:"4px 10px",fontSize:10})} onClick={e=>{e.stopPropagation();editProj(proj);}}>Edit</button>
                  <button style={sBtn("danger",{padding:"4px 10px",fontSize:10})} onClick={e=>{e.stopPropagation();delProj(proj.id);}}>✕</button>
                </div>
              </div>
              {exp&&(
                <div style={{marginTop:16}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
                    {[["Submission",proj.submissionDate||"—",C.orange],["Finalization",proj.finalizationDate||"—",C.green],["Stage",proj.stage,stageColors[proj.stage]||C.muted],["Team",`${1+proj.members.length} engineers`,C.accent]].map(([l,v,c])=>(
                      <div key={l} style={{background:"#060A12",borderRadius:5,padding:"10px 12px"}}>
                        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                        <div style={{fontSize:12,color:c,fontWeight:700}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr>{["Engineer","Role","Position","Branch","Workload %"].map(h=><th key={h} style={sTH}>{h}</th>)}</tr></thead>
                    <tbody>
                      <tr>
                        <td style={sTD}><span style={{color:C.gold,fontWeight:700}}>{leader?.name||"—"}</span></td>
                        <td style={sTD}><Tag color={C.gold}>★ Leader</Tag></td>
                        <td style={sTD}><Tag color={posColors[leader?.position]||C.muted}>{leader?.position||"—"}</Tag></td>
                        <td style={sTD}><Tag color={branchColors[leader?.branch]||C.muted}>{leader?.branch||"—"}</Tag></td>
                        <td style={{...sTD,color:C.accent,fontWeight:700}}>{proj.leaderLoad}%</td>
                      </tr>
                      {memberEngs.map((m,i)=>(
                        <tr key={i}>
                          <td style={sTD}>{m.eng.name}</td>
                          <td style={sTD}><Tag color={C.accent}>Member</Tag></td>
                          <td style={sTD}><Tag color={posColors[m.eng.position]||C.muted}>{m.eng.position}</Tag></td>
                          <td style={sTD}><Tag color={branchColors[m.eng.branch]||C.muted}>{m.eng.branch}</Tag></td>
                          <td style={{...sTD,color:C.accent,fontWeight:700}}>{m.load}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {proj.notes&&<div style={{marginTop:10,fontSize:11,color:C.muted,fontStyle:"italic",padding:"8px 12px",background:"#060A12",borderRadius:4}}>📝 {proj.notes}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({engineers,projects}) {
  const leaders = engineers.filter(e=>e.option==="Team Leader");
  const members = engineers.filter(e=>e.option==="Team Member");
  const today   = new Date();

  const branchProjData = BRANCHES.map(b=>({
    name:b, total:projects.filter(p=>p.branch===b).length,
    ongoing:projects.filter(p=>p.branch===b&&p.status==="Ongoing").length,
    urgent:projects.filter(p=>p.branch===b&&p.status==="Urgent").length,
    completed:projects.filter(p=>p.branch===b&&p.status==="Completed").length,
  })).filter(b=>b.total>0);

  const branchEngData = BRANCHES.map(b=>({
    name:b,
    leaders:engineers.filter(e=>e.branch===b&&e.option==="Team Leader").length,
    members:engineers.filter(e=>e.branch===b&&e.option==="Team Member").length,
  })).filter(b=>b.leaders+b.members>0);

  const statusCounts = ["Not Started Yet","Ongoing","Urgent","Near Completion","Completed","Hold","Other"]
    .map(s=>({name:s,value:projects.filter(p=>p.status===s).length,fill:statusColors[s]||C.muted}))
    .filter(x=>x.value>0);

  const upcoming = projects.filter(p=>{
    if(!p.submissionDate) return false;
    const diff=(new Date(p.submissionDate)-today)/(1000*60*60*24);
    return diff>=0&&diff<=90;
  }).sort((a,b)=>new Date(a.submissionDate)-new Date(b.submissionDate));

  if(engineers.length===0&&projects.length===0) return (
    <div style={{...sCard({textAlign:"center",padding:60,borderStyle:"dashed"})}}>
      <div style={{fontSize:40,marginBottom:16}}>◈</div>
      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>Welcome to HVAC Flow</div>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.7}}>Add engineers in the Engineers tab, then create projects.<br/>All data syncs to Supabase — everyone sees the same data.</div>
    </div>
  );

  return (
    <div>
      <div style={{fontSize:20,fontWeight:700,marginBottom:24}}>Dashboard</div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Engineers"    value={engineers.length}                                   color={C.accent} icon="◉"/>
        <StatCard label="Team Leaders" value={leaders.length}                                    color={C.gold}   icon="★"/>
        <StatCard label="Team Members" value={members.length}                                    color={C.purple} icon="◎"/>
        <StatCard label="Projects"     value={projects.length}                                   color={C.teal}   icon="◧"/>
        <StatCard label="Urgent"       value={projects.filter(p=>p.status==="Urgent").length}    color={C.red}    icon="⚠"
          sub={projects.filter(p=>p.status==="Ongoing").length+" ongoing"}/>
      </div>

      {/* Branch overview */}
      {branchProjData.length>0&&(
        <>
          <div style={{fontSize:11,color:C.gold,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>◈ Branch Overview</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            <div style={sCard()}>
              <div style={{fontSize:11,color:C.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Projects per Branch</div>
              <div style={{display:"flex",gap:14,marginBottom:12,flexWrap:"wrap"}}>
                {[["Total",C.accent],["Ongoing",C.teal],["Urgent",C.red],["Completed",C.green]].map(([lbl,col])=>(
                  <div key={lbl} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:12,height:12,borderRadius:2,background:col,flexShrink:0}}/><span style={{fontSize:11,color:col,fontWeight:600}}>{lbl}</span></div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={branchProjData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="name" tick={{fill:C.label,fontSize:11,fontWeight:600}}/>
                  <YAxis tick={{fill:C.label,fontSize:10}} allowDecimals={false}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}/>
                  <Bar dataKey="total"     name="Total"     fill={C.accent} radius={[3,3,0,0]}/>
                  <Bar dataKey="ongoing"   name="Ongoing"   fill={C.teal}   radius={[3,3,0,0]}/>
                  <Bar dataKey="urgent"    name="Urgent"    fill={C.red}    radius={[3,3,0,0]}/>
                  <Bar dataKey="completed" name="Completed" fill={C.green}  radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sCard()}>
              <div style={{fontSize:11,color:C.teal,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Team per Branch</div>
              <div style={{display:"flex",gap:14,marginBottom:12}}>
                {[["Leaders",C.gold],["Members",C.purple]].map(([lbl,col])=>(
                  <div key={lbl} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:12,height:12,borderRadius:2,background:col,flexShrink:0}}/><span style={{fontSize:11,color:col,fontWeight:600}}>{lbl}</span></div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={branchEngData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="name" tick={{fill:C.label,fontSize:11,fontWeight:600}}/>
                  <YAxis tick={{fill:C.label,fontSize:10}} allowDecimals={false}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}/>
                  <Bar dataKey="leaders" name="Leaders" fill={C.gold}   radius={[3,3,0,0]}/>
                  <Bar dataKey="members" name="Members" fill={C.purple} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Branch cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {BRANCHES.map(b=>{
              const bp=projects.filter(p=>p.branch===b);
              const be=engineers.filter(e=>e.branch===b);
              const color=branchColors[b];
              return (
                <div key={b} style={sCard({borderColor:color+"55",borderTopColor:color,borderTopWidth:2})}>
                  <div style={{fontSize:16,fontWeight:700,color,marginBottom:8}}>{b}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[["Projects",bp.length,C.teal],["Leaders",be.filter(e=>e.option==="Team Leader").length,C.gold],["Members",be.filter(e=>e.option==="Team Member").length,C.purple],["Urgent",bp.filter(p=>p.status==="Urgent").length,C.red]].map(([l,v,c])=>(
                      <div key={l} style={{background:"#060A12",borderRadius:4,padding:"6px 8px",textAlign:"center"}}>
                        <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Status pie */}
      {statusCounts.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <div style={sCard()}>
            <div style={{fontSize:11,color:C.accent,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>Project Status</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusCounts.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}/>
                <Legend formatter={v=><span style={{color:C.label,fontSize:11}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Upcoming deadlines */}
          <div style={sCard({borderColor:C.gold+"44"})}>
            <div style={{fontSize:11,color:C.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>📅 Upcoming Submissions (90d)</div>
            {upcoming.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>No upcoming deadlines.</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:180,overflowY:"auto"}}>
                {upcoming.map(p=>{
                  const days=Math.round((new Date(p.submissionDate)-today)/(1000*60*60*24));
                  const urgColor=days<=7?C.red:days<=30?C.orange:C.gold;
                  return (
                    <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:"#0A0E18",borderRadius:5,border:`1px solid ${urgColor}33`}}>
                      <div style={{fontSize:12,color:C.text,fontWeight:600}}>{p.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <span style={{color:urgColor,fontWeight:700,fontSize:11}}>{p.submissionDate}</span>
                        <span style={{color:urgColor,fontSize:10}}>({days}d)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Engineer KPI table */}
      {engineers.length>0&&(
        <div style={sCard()}>
          <div style={{fontSize:11,color:C.green,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>Engineer KPIs</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Engineer","Position","Role","Branch","# Projects","Exp (Yrs)"].map(h=><th key={h} style={sTH}>{h}</th>)}</tr></thead>
            <tbody>
              {engineers.map((eng,i)=>{
                const engProjs=projects.filter(p=>p.leaderId===eng.id||p.members.some(m=>m.engId===eng.id));
                const exp=new Date().getFullYear()-Number(eng.gradYear);
                const loadPct=Math.min(100,engProjs.length*20);
                return (
                  <tr key={eng.id} style={{background:i%2?"#0C1525":"#0F1B2E"}}>
                    <td style={sTD}><span style={{color:eng.option==="Team Leader"?C.gold:C.text,fontWeight:600}}>{eng.name}</span></td>
                    <td style={sTD}><Tag color={posColors[eng.position]||C.muted}>{eng.position}</Tag></td>
                    <td style={sTD}><Tag color={eng.option==="Team Leader"?C.gold:C.accent}>{eng.option==="Team Leader"?"★ Leader":"Member"}</Tag></td>
                    <td style={sTD}><Tag color={branchColors[eng.branch]||C.muted}>{eng.branch}</Tag></td>
                    <td style={{...sTD,textAlign:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <ProgressBar value={engProjs.length} max={5} color={loadPct>80?C.red:loadPct>60?C.orange:C.green} h={5}/>
                        <span style={{color:loadPct>80?C.red:loadPct>60?C.orange:C.green,fontWeight:700,fontSize:12,minWidth:16}}>{engProjs.length}</span>
                      </div>
                    </td>
                    <td style={{...sTD,color:C.accent,textAlign:"center",fontWeight:700}}>{exp>0?`${exp} yrs`:"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  IMPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ImportModal({onClose,onImport}) {
  const [dragOver,setDragOver]=useState(false);
  const [preview,setPreview]=useState(null);
  const [error,setError]=useState("");
  const fileRef=useRef(null);
  const parse=file=>{if(!file)return;const r=new FileReader();r.onload=e=>{try{const d=JSON.parse(e.target.result);if(!d.engineers||!d.projects)throw new Error("Missing engineers or projects.");setPreview(d);setError("");}catch(err){setError("Invalid file: "+err.message);setPreview(null);}};r.readAsText(file);};
  return (
    <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={sCard({width:500,maxWidth:"90vw",borderColor:C.accent+"66"})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div><div style={{fontSize:14,fontWeight:700,color:C.accent}}>Import JSON Backup</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Load a previously exported HVAC_FLOW file</div></div>
          <button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20}} onClick={onClose}>✕</button>
        </div>
        <div onDrop={e=>{e.preventDefault();setDragOver(false);parse(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${dragOver?C.accent:C.border}`,borderRadius:8,padding:"28px 20px",textAlign:"center",cursor:"pointer",marginBottom:16,background:dragOver?C.accent+"0A":"#060A12",transition:"all 0.2s"}}>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>parse(e.target.files[0])}/>
          <div style={{fontSize:28,marginBottom:8}}>📂</div>
          <div style={{color:C.accent,fontSize:13,fontWeight:600}}>Drop JSON file here or click to browse</div>
        </div>
        {error&&<div style={{background:C.red+"18",border:`1px solid ${C.red}44`,borderRadius:5,padding:"10px 14px",marginBottom:14,color:C.red,fontSize:12}}>✕ {error}</div>}
        {preview&&(
          <div style={{background:C.green+"0E",border:`1px solid ${C.green}44`,borderRadius:5,padding:"12px 14px",marginBottom:16}}>
            <div style={{color:C.green,fontWeight:700,fontSize:12,marginBottom:8}}>✓ File validated — ready to import</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              {[["Engineers",preview.engineers.length],["Projects",preview.projects.length],["Exported by",preview.exportedBy||"—"]].map(([l,v])=>(
                <div key={l} style={{background:"#060A12",borderRadius:4,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:C.orange,padding:"6px 10px",background:C.orange+"0E",borderRadius:4,border:`1px solid ${C.orange}33`}}>⚠ This will REPLACE your current Supabase data after you click Save.</div>
          </div>
        )}
        <div style={{display:"flex",gap:10}}>
          <button style={sBtn("primary",{opacity:preview?1:0.4,cursor:preview?"pointer":"not-allowed"})} onClick={()=>{if(preview){onImport(preview.engineers,preview.projects);onClose();}}} disabled={!preview}>Load Data</button>
          <button style={sBtn("ghost")} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── RESET MODAL ──────────────────────────────────────────────────────────────
function ResetModal({onClose,onConfirm}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={sCard({width:420,borderColor:C.red+"66"})}>
        <div style={{fontSize:14,fontWeight:700,color:C.red,marginBottom:8}}>Clear All Data?</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.7,marginBottom:20}}>
          This will permanently delete all engineers and projects <strong style={{color:C.text}}>from Supabase</strong>.<br/>
          <strong style={{color:C.orange}}>Every user visiting the URL will see an empty app. Export a backup first.</strong>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button style={sBtn("danger")} onClick={()=>{onConfirm();onClose();}}>Yes, Clear Everything</button>
          <button style={sBtn("ghost")} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  APP ROOT  ——  All Supabase logic lives here
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab,setTab] = useState("dashboard");

  // ── Local React state (mirrors Supabase) ──────────────────────────────────
  const [engineers,setEngineers] = useState([]);
  const [projects, setProjects]  = useState([]);

  // ── App lifecycle ─────────────────────────────────────────────────────────
  const [loading,setLoading]     = useState(true);
  const [loadMsg,setLoadMsg]     = useState("Connecting to Supabase…");
  const [saveStatus,setSaveStatus] = useState("saved"); // "saved"|"saving"|"unsaved"
  const [lastSaveInfo,setLastSaveInfo] = useState(null); // {by, at}
  const [dbError,setDbError]     = useState(null);

  // ── Identity: auto-detected, no input needed ──────────────────────────────
  const identity = useMemo(()=> detectIdentity(), []);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showImport,setShowImport] = useState(false);
  const [showReset, setShowReset]  = useState(false);

  // ── FETCH from Supabase on mount ──────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      try {
        setLoadMsg("Fetching engineers…");
        const { data: engRows, error: engErr } = await supabase
          .from("engineers").select("*").order("serial");
        if(engErr) throw engErr;

        setLoadMsg("Fetching projects…");
        const { data: projRows, error: projErr } = await supabase
          .from("projects").select("*").order("created_at");
        if(projErr) throw projErr;

        setLoadMsg("Fetching team assignments…");
        const { data: membersRows, error: memErr } = await supabase
          .from("project_members").select("*");
        if(memErr) throw memErr;

        setLoadMsg("Fetching save history…");
        const { data: stateRows } = await supabase
          .from("app_state").select("*").eq("id",1).single();

        // ── If DB is empty, seed with initial engineers ────────────────────
        if(engRows.length===0) {
          setLoadMsg("Seeding engineers (first run)…");
          const seedRows = SEED_ENGINEERS.map(engineerToRow);
          // Insert in chunks of 50 to stay under request size limits
          for(let i=0;i<seedRows.length;i+=50) {
            const { error: seedErr } = await supabase.from("engineers")
              .upsert(seedRows.slice(i,i+50), { onConflict:"id" });
            if(seedErr) throw seedErr;
          }
          setEngineers(SEED_ENGINEERS);
        } else {
          setEngineers(engRows.map(rowToEngineer));
        }

        setProjects((projRows||[]).map(row => rowToProject(row, membersRows)));

        if(stateRows?.saved_by) {
          setLastSaveInfo({ by: stateRows.saved_by, at: stateRows.saved_at });
        }

        setSaveStatus("saved");
      } catch(err) {
        console.error("Supabase load error:", err);
        setDbError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Mark unsaved whenever engineers or projects change ────────────────────
  const onMarkUnsaved = useCallback(()=> setSaveStatus("unsaved"), []);

  // ── SAVE to Supabase ───────────────────────────────────────────────────────
  // Strategy: full replace (delete all + re-insert).
  // This is simple and correct for a small dataset (< 200 rows).
  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      // 1. Delete all project_members first (FK constraint)
      const { error: delMemErr } = await supabase
        .from("project_members").delete().neq("id", 0);
      if(delMemErr) throw delMemErr;

      // 2. Delete all projects
      const { error: delProjErr } = await supabase
        .from("projects").delete().neq("id","");
      if(delProjErr) throw delProjErr;

      // 3. Delete all engineers
      const { error: delEngErr } = await supabase
        .from("engineers").delete().neq("id","");
      if(delEngErr) throw delEngErr;

      // 4. Re-insert engineers
      if(engineers.length>0) {
        const { error: insEngErr } = await supabase
          .from("engineers").insert(engineers.map(engineerToRow));
        if(insEngErr) throw insEngErr;
      }

      // 5. Re-insert projects
      if(projects.length>0) {
        const { error: insProjErr } = await supabase
          .from("projects").insert(projects.map(projectToRow));
        if(insProjErr) throw insProjErr;
      }

      // 6. Re-insert project_members (flatten members arrays)
      const memberRows = projects.flatMap(p =>
        p.members
          .filter(m => m.engId)
          .map(m => ({ project_id: p.id, eng_id: m.engId, load: m.load }))
      );
      if(memberRows.length>0) {
        const { error: insMemErr } = await supabase
          .from("project_members").insert(memberRows);
        if(insMemErr) throw insMemErr;
      }

      // 7. Update app_state
      const now = getCairoDateTime();
      await supabase.from("app_state").upsert({
        id:1, saved_by: identity, saved_at: now, app_version:"2.0.0"
      }, { onConflict:"id" });

      setLastSaveInfo({ by: identity, at: now });
      setSaveStatus("saved");
    } catch(err) {
      console.error("Save error:", err);
      setSaveStatus("unsaved");
      alert("Save failed: " + (err.message || String(err)));
    }
  };

  // ── EXPORT to JSON file ───────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const payload = {
        app:"HVAC_FLOW", version:"2.0.0",
        exportedAt: new Date().toISOString(),
        exportedBy: identity,
        engineers, projects,
      };
      const uri  = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload,null,2));
      const a    = document.createElement("a");
      a.setAttribute("href", uri);
      a.setAttribute("download", `hvacflow_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(a); a.click();
      setTimeout(()=>document.body.removeChild(a), 200);
    } catch(err) {
      alert("Export failed: " + err.message);
    }
  };

  // ── IMPORT from JSON ───────────────────────────────────────────────────────
  const handleImport = (engList, projList) => {
    setEngineers(engList);
    setProjects(projList);
    setSaveStatus("unsaved");
  };

  // ── RESET (clear Supabase) ────────────────────────────────────────────────
  const handleReset = async () => {
    setSaveStatus("saving");
    try {
      await supabase.from("project_members").delete().neq("id",0);
      await supabase.from("projects").delete().neq("id","");
      await supabase.from("engineers").delete().neq("id","");
      await supabase.from("app_state").upsert({ id:1, saved_by:identity, saved_at:getCairoDateTime(), app_version:"2.0.0" });
      setEngineers([]);
      setProjects([]);
      setLastSaveInfo(null);
      setSaveStatus("saved");
    } catch(err) {
      console.error("Reset error:", err);
      setSaveStatus("unsaved");
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  if(loading) return <LoadingScreen message={loadMsg}/>;

  if(dbError) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:40}}>
      <div style={{fontSize:32}}>⚠️</div>
      <div style={{fontSize:16,fontWeight:700,color:C.red}}>Supabase Connection Error</div>
      <div style={{fontSize:12,color:C.muted,maxWidth:500,textAlign:"center",lineHeight:1.7}}>{dbError}</div>
      <div style={{fontSize:11,color:C.label,maxWidth:500,textAlign:"center",lineHeight:1.8}}>
        Check that <code style={{color:C.accent}}>VITE_SUPABASE_URL</code> and <code style={{color:C.accent}}>VITE_SUPABASE_ANON_KEY</code> are set
        in your <code style={{color:C.gold}}>.env</code> file (local) or Vercel Environment Variables (production).
      </div>
      <button style={sBtn()} onClick={()=>window.location.reload()}>↺ Retry</button>
    </div>
  );

  const saveColor = saveStatus==="saved"?C.green:saveStatus==="saving"?C.gold:C.orange;
  const saveLabel = saveStatus==="saved"?"✓ Saved":saveStatus==="saving"?"Saving…":"● Unsaved";

  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"◈"},
    {id:"engineers",label:"Engineers",icon:"◉"},
    {id:"projects", label:"Projects", icon:"◧"},
    {id:"orgchart", label:"Org Chart",icon:"⟁"},
    {id:"outputs",  label:"Outputs",  icon:"⊞"},
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'IBM Plex Mono','Courier New',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#07090F;}
        ::-webkit-scrollbar-thumb{background:#1C2840;border-radius:3px;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.3;}
        select option{background:#0D1117;}
        button:hover{opacity:0.82;}
        input:focus,select:focus{border-color:#00C2FF88!important;box-shadow:0 0 0 2px #00C2FF18;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"0 18px",display:"flex",alignItems:"center",height:54,position:"sticky",top:0,zIndex:200}}>
        <div style={{color:C.accent,fontWeight:700,fontSize:13,letterSpacing:"0.18em",marginRight:24,textTransform:"uppercase",whiteSpace:"nowrap"}}>
          ⟨ HVAC_FLOW ⟩
        </div>
        {tabs.map(t=>(
          <button key={t.id} style={sNav(tab===t.id)} onClick={()=>setTab(t.id)}>
            <span style={{marginRight:5,opacity:0.65}}>{t.icon}</span>{t.label}
          </button>
        ))}

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",marginRight:4,whiteSpace:"nowrap"}}>
            {engineers.length} ENG · {projects.length} PROJ
          </div>
          <div style={{width:1,height:26,background:C.border}}/>

          {/* Last saved info — shows auto-detected identity, no manual input */}
          {lastSaveInfo&&(
            <div style={{fontSize:9,color:C.muted,whiteSpace:"nowrap",padding:"3px 10px",background:"#060A12",borderRadius:4,border:`1px solid ${C.border}`,maxWidth:320}}>
              Last saved by <span style={{color:C.accent,fontWeight:700}}>{lastSaveInfo.by}</span>
              {" "}· <span style={{color:C.label}}>{lastSaveInfo.at}</span>
              {" "}(Cairo)
            </div>
          )}

          {/* Save status badge */}
          <div style={{fontSize:10,color:saveColor,fontWeight:700,padding:"3px 8px",background:saveColor+"18",border:`1px solid ${saveColor}44`,borderRadius:4,whiteSpace:"nowrap"}}>
            {saveLabel}
          </div>

          {/* 💾 SAVE BUTTON — syncs to Supabase */}
          <button
            style={sBtn("save",{padding:"6px 14px",fontSize:11,display:"flex",alignItems:"center",gap:5,opacity:saveStatus==="saving"?0.6:1})}
            onClick={handleSave}
            disabled={saveStatus==="saving"}
            title="Save all data to Supabase (visible to everyone)">
            {saveStatus==="saving"?"…":"💾"} Save to Cloud
          </button>

          <div style={{width:1,height:26,background:C.border}}/>
          <button style={sBtn("ghost",{padding:"5px 10px",fontSize:10})} onClick={handleExport} title="Export backup JSON">↓ Export</button>
          <button style={sBtn("ghost",{padding:"5px 10px",fontSize:10})} onClick={()=>setShowImport(true)} title="Import from JSON backup">↑ Import</button>
          <button style={sBtn("danger",{padding:"5px 10px",fontSize:10})} onClick={()=>setShowReset(true)} title="Clear all data from Supabase">⟳ Clear</button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main style={{padding:"24px 28px",maxWidth:1480,margin:"0 auto"}}>
        {tab==="dashboard" && <Dashboard    engineers={engineers} projects={projects}/>}
        {tab==="engineers" && <EngineersModule engineers={engineers} setEngineers={setEngineers} onMarkUnsaved={onMarkUnsaved}/>}
        {tab==="projects"  && <ProjectsModule  projects={projects}  setProjects={setProjects} engineers={engineers} onMarkUnsaved={onMarkUnsaved}/>}
        {tab==="orgchart"  && <OrgChart        engineers={engineers} projects={projects}/>}
        {tab==="outputs"   && <OutputsTab      engineers={engineers} projects={projects}/>}
      </main>

      {/* ── MODALS ── */}
      {showImport&&<ImportModal onClose={()=>setShowImport(false)} onImport={handleImport}/>}
      {showReset &&<ResetModal  onClose={()=>setShowReset(false)}  onConfirm={handleReset}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ORG CHART  — SVG hierarchy + network diagram with branch filter
// ═══════════════════════════════════════════════════════════════════════════════
function OrgChart({engineers, projects}) {
  const [viewMode,   setViewMode]   = useState("hierarchy");
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId,  setHoveredId]  = useState(null);
  const [pan,        setPan]        = useState({x:0,y:0});
  const [zoom,       setZoom]       = useState(1);
  const [dragging,   setDragging]   = useState(false);
  const [dragStart,  setDragStart]  = useState(null);
  const [filterBranch, setFilterBranch] = useState("All");
  const svgRef = useRef(null);

  // ── Apply branch filter ─────────────────────────────────────────────────────
  // Rule: when a branch is selected, ONLY show engineers whose branch === selected.
  // Projects are shown only if their leader is in the filtered engineer set.
  // Members of a project are further filtered to only those in filteredEngineers.
  const filteredEngineers = useMemo(()=>
    filterBranch==="All"
      ? engineers
      : engineers.filter(e => e.branch===filterBranch)
  ,[engineers, filterBranch]);

  const filteredEngineerIds = useMemo(()=>
    new Set(filteredEngineers.map(e=>e.id))
  ,[filteredEngineers]);

  const filteredProjects = useMemo(()=>{
    if(filterBranch==="All") return projects;
    return projects
      // Keep only projects whose leader is in the filtered branch
      .filter(p => filteredEngineerIds.has(p.leaderId))
      // Strip members who are NOT in the filtered branch
      .map(p => ({
        ...p,
        members: p.members.filter(m => filteredEngineerIds.has(m.engId)),
      }));
  },[projects, filterBranch, filteredEngineerIds]);

  const leaders = useMemo(()=>
    filteredEngineers.filter(e => e.option==="Team Leader")
  ,[filteredEngineers]);

  // ── Colour map per leader ───────────────────────────────────────────────────
  const leaderColor = useMemo(()=>{
    const m={};
    leaders.forEach((l,i)=>{ m[l.id]=LEADER_PALETTE[i%LEADER_PALETTE.length]; });
    return m;
  },[leaders]);

  // ── Which members appear in 2+ leader teams ─────────────────────────────────
  const memberToLeaders = useMemo(()=>{
    const m={};
    filteredProjects.forEach(p=>{
      p.members
        .filter(({engId}) => filteredEngineerIds.has(engId))
        .forEach(({engId})=>{
          if(!m[engId]) m[engId]=new Set();
          m[engId].add(p.leaderId);
        });
    });
    return m;
  },[filteredProjects, filteredEngineerIds]);

  const sharedMap = useMemo(()=>{
    const s={};
    Object.entries(memberToLeaders).forEach(([eid,lids])=>{
      if(lids.size>1) s[eid]=[...lids];
    });
    return s;
  },[memberToLeaders]);

  // ── Project links (leader → member, with which projects connect them) ────────
  const projLinks = useMemo(()=>{
    const map={};
    filteredProjects.forEach(p=>{
      // Only draw edges to members who are in the filtered branch
      p.members
        .filter(({engId}) => filteredEngineerIds.has(engId))
        .forEach(({engId})=>{
          const k=`${p.leaderId}_${engId}`;
          if(!map[k]) map[k]={leaderId:p.leaderId,memberId:engId,projects:[]};
          map[k].projects.push(p);
        });
    });
    return Object.values(map);
  },[filteredProjects, filteredEngineerIds]);

  const W=960, H=520;

  // ── HIERARCHY layout ────────────────────────────────────────────────────────
  const hierarchyNodes = useMemo(()=>{
    const nodes=[];
    const colW = leaders.length>0 ? W/leaders.length : W;
    leaders.forEach((leader,li)=>{
      const lx = colW*li+colW/2;
      nodes.push({id:leader.id,x:lx,y:90,isLeader:true,eng:leader,color:leaderColor[leader.id],shared:false,sharedColors:[]});
      // Only include members who are in the filtered engineer set
      const ldrMembers=[...new Set(
        filteredProjects
          .filter(p=>p.leaderId===leader.id)
          .flatMap(p=>p.members.map(m=>m.engId))
          .filter(id => filteredEngineerIds.has(id))   // ← key guard
      )];
      const step   = Math.min(120, colW/(ldrMembers.length||1));
      const totalW = step*(ldrMembers.length-1);
      ldrMembers.forEach((mid,mi)=>{
        const mx   = lx-totalW/2+mi*step;
        const meng = filteredEngineers.find(e=>e.id===mid);
        if(!meng) return;                               // ← extra safety
        const existing = nodes.find(n=>n.id===mid);
        const shared   = !!sharedMap[mid];
        if(existing){
          existing.shared=true;
          existing.sharedColors=[...new Set([...existing.sharedColors,leaderColor[leader.id]])];
          existing.x=(existing.x+mx)/2;
        } else {
          nodes.push({
            id:mid,x:mx,y:280+(shared?-15:0),isLeader:false,eng:meng,
            color:leaderColor[leader.id]||C.muted,shared,
            sharedColors:shared?(sharedMap[mid]||[]).map(lid=>leaderColor[lid]):[],
          });
        }
      });
    });
    // Unassigned engineers in this branch (in filtered set but not on any project)
    const placed=new Set(nodes.map(n=>n.id));
    filteredEngineers.filter(e=>!placed.has(e.id)).forEach((e,i)=>{
      nodes.push({id:e.id,x:60+i*110,y:430,isLeader:false,eng:e,color:C.muted,shared:false,sharedColors:[],unassigned:true});
    });
    return nodes;
  },[filteredEngineers,filteredEngineerIds,leaders,leaderColor,sharedMap,filteredProjects]);

  const hierarchyEdges = useMemo(()=>
    projLinks.map(({leaderId,memberId,projects:projs})=>{
      const from=hierarchyNodes.find(n=>n.id===leaderId);
      const to  =hierarchyNodes.find(n=>n.id===memberId);
      if(!from||!to) return null;
      return {from,to,color:leaderColor[leaderId]||C.muted,shared:!!sharedMap[memberId],projects:projs};
    }).filter(Boolean)
  ,[hierarchyNodes,projLinks,leaderColor,sharedMap]);

  // ── NETWORK layout ──────────────────────────────────────────────────────────
  const networkNodes = useMemo(()=>{
    const cx=W/2, cy=H/2-20, nodes=[], lR=140;
    leaders.forEach((l,i)=>{
      const a=(2*Math.PI*i/leaders.length)-Math.PI/2;
      nodes.push({id:l.id,x:cx+lR*Math.cos(a),y:cy+lR*Math.sin(a),isLeader:true,eng:l,color:leaderColor[l.id],shared:false,sharedColors:[]});
    });
    // Only members who are in the filtered branch
    const mems=filteredEngineers.filter(e=>e.option==="Team Member");
    const mR=230;
    mems.forEach((m,i)=>{
      const a=(2*Math.PI*i/mems.length)-Math.PI/2;
      const shared=!!sharedMap[m.id];
      const primaryLeader=leaders.find(l=>
        filteredProjects.some(p=>p.leaderId===l.id&&p.members.some(x=>x.engId===m.id))
      );
      nodes.push({
        id:m.id,x:cx+mR*Math.cos(a),y:cy+mR*Math.sin(a),isLeader:false,eng:m,
        color:shared?C.pink:(leaderColor[primaryLeader?.id]||C.muted),
        shared,sharedColors:shared?(sharedMap[m.id]||[]).map(lid=>leaderColor[lid]):[],
      });
    });
    return nodes;
  },[filteredEngineers,leaders,leaderColor,sharedMap,filteredProjects]);

  const networkEdges = useMemo(()=>
    projLinks.map(({leaderId,memberId,projects:projs})=>{
      const from=networkNodes.find(n=>n.id===leaderId);
      const to  =networkNodes.find(n=>n.id===memberId);
      if(!from||!to) return null;
      return {from,to,color:leaderColor[leaderId]||C.muted,shared:!!sharedMap[memberId],projects:projs};
    }).filter(Boolean)
  ,[networkNodes,projLinks,leaderColor,sharedMap]);

  const nodes = viewMode==="hierarchy" ? hierarchyNodes : networkNodes;
  const edges = viewMode==="hierarchy" ? hierarchyEdges : networkEdges;

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const el=svgRef.current; if(!el) return;
    const h=e=>{e.preventDefault();setZoom(z=>Math.max(0.3,Math.min(3,z-e.deltaY*0.001)));};
    el.addEventListener("wheel",h,{passive:false});
    return ()=>el.removeEventListener("wheel",h);
  },[]);

  const onMouseDown = e=>{if(e.target.closest("[data-node]")) return;setDragging(true);setDragStart({x:e.clientX-pan.x,y:e.clientY-pan.y});};
  const onMouseMove = e=>{if(!dragging) return;setPan({x:e.clientX-dragStart.x,y:e.clientY-dragStart.y});};
  const onMouseUp   = ()=>setDragging(false);

  const selEng  = selectedId ? filteredEngineers.find(e=>e.id===selectedId) : null;
  const selProjs= selEng ? filteredProjects.filter(p=>p.leaderId===selEng.id||p.members.some(m=>m.engId===selEng.id)) : [];

  // ── Render edge (anti-overlap label layout) ──────────────────────────────
  const renderEdge=(edge,i)=>{
    const{from,to,color,shared,projects:projs}=edge;
    const isActive=selectedId&&(selectedId===from.id||selectedId===to.id);
    const isDimmed=selectedId&&!isActive;
    const mx=(from.x+to.x)/2, my=(from.y+to.y)/2-(viewMode==="hierarchy"?40:20);
    const lCount=projs.length;
    return (
      <g key={`e${i}`} opacity={isDimmed?0.06:isActive?1:0.4}>
        <path d={`M${from.x} ${from.y} Q${mx} ${my} ${to.x} ${to.y}`}
          fill="none" stroke={shared?C.pink:color}
          strokeWidth={shared?2.2:1.5} strokeDasharray={shared?"7 3":undefined}/>
        {isActive&&projs.map((p,pi)=>{
          const t=lCount===1?0.45:0.25+(pi*(0.4/Math.max(lCount-1,1)));
          const bx=(1-t)*(1-t)*from.x+2*(1-t)*t*mx+t*t*to.x;
          const by=(1-t)*(1-t)*from.y+2*(1-t)*t*my+t*t*to.y;
          const yOff=pi%2===0?-22:22;
          const lx=bx, ly=by+yOff, lw=92, lh=18;
          return (
            <g key={pi}>
              <line x1={bx} y1={by} x2={lx} y2={ly+lh/2*(yOff<0?1:-1)}
                stroke={color} strokeWidth={0.6} strokeDasharray="2 2" opacity={0.5}/>
              <rect x={lx-lw/2} y={ly-lh/2} width={lw} height={lh} rx={4}
                fill={C.panel} stroke={color} strokeWidth={0.9}/>
              <text x={lx} y={ly+1} textAnchor="middle" dominantBaseline="middle"
                style={{fontSize:8,fill:color,fontFamily:"inherit",pointerEvents:"none",fontWeight:600}}>
                {p.name.length>18?p.name.slice(0,17)+"…":p.name}
              </text>
            </g>
          );
        })}
        <circle cx={to.x} cy={to.y} r={2.5} fill={shared?C.pink:color} opacity={0.8}/>
      </g>
    );
  };

  // ── Render node ─────────────────────────────────────────────────────────────
  const renderNode=node=>{
    const{id,x,y,isLeader,eng,color,shared,sharedColors=[]}=node;
    const isSel=selectedId===id, isHov=hoveredId===id;
    const R=isLeader?40:26;
    return (
      <g key={id} data-node="1" style={{cursor:"pointer"}}
        onClick={()=>setSelectedId(isSel?null:id)}
        onMouseEnter={()=>setHoveredId(id)}
        onMouseLeave={()=>setHoveredId(null)}>
        {(isSel||isHov)&&<circle cx={x} cy={y} r={R+10} fill={color+"18"} stroke={color} strokeWidth={1} opacity={0.5}/>}
        {shared&&sharedColors.map((c,i)=><circle key={i} cx={x} cy={y} r={R+5+i*6} fill="none" stroke={c} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.55}/>)}
        <circle cx={x} cy={y} r={R} fill={`${color}15`} stroke={color} strokeWidth={isLeader?2.5:1.8}/>
        {isLeader&&<circle cx={x} cy={y} r={R-6} fill={`${color}10`}/>}
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          style={{fontSize:isLeader?13:11,fill:color,fontWeight:700,fontFamily:"inherit",pointerEvents:"none"}}>
          {eng.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
        </text>
        {isLeader&&<text x={x} y={y-R-6} textAnchor="middle" style={{fontSize:12,fill:color,pointerEvents:"none"}}>★</text>}
        {shared&&(
          <g>
            <circle cx={x+R-5} cy={y-R+5} r={9} fill={C.pink}/>
            <text x={x+R-5} y={y-R+5} textAnchor="middle" dominantBaseline="middle"
              style={{fontSize:8,fill:"#000",fontWeight:900,pointerEvents:"none"}}>S</text>
          </g>
        )}
        <text x={x} y={y+R+14} textAnchor="middle"
          style={{fontSize:10,fill:isSel?color:C.label,fontFamily:"inherit",pointerEvents:"none",fontWeight:isLeader?700:400}}>
          {eng.name.split(" ")[0]}
        </text>
        <text x={x} y={y+R+25} textAnchor="middle"
          style={{fontSize:8.5,fill:C.muted,fontFamily:"inherit",pointerEvents:"none"}}>
          {eng.position}
        </text>
      </g>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Org Structure & Relations</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>
            Team hierarchy · Shared engineers · Project relationship lines
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <select style={sSel({width:100,fontSize:10,padding:"5px 8px"})}
            value={filterBranch}
            onChange={e=>{setFilterBranch(e.target.value);setSelectedId(null);setPan({x:0,y:0});setZoom(1);}}>
            <option value="All">All Branches</option>
            {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
          {[["hierarchy","⟁ Hierarchy"],["network","⬡ Network"]].map(([v,l])=>(
            <button key={v}
              style={sBtn(viewMode===v?"primary":"ghost",{fontSize:11})}
              onClick={()=>{setViewMode(v);setPan({x:0,y:0});setZoom(1);setSelectedId(null);}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Legend bar */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14,padding:"10px 14px",background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,alignItems:"center"}}>
        <span style={{fontSize:9,color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginRight:4}}>LEGEND</span>
        {leaders.map((l,i)=>(
          <div key={l.id} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:LEADER_PALETTE[i%LEADER_PALETTE.length]}}/>
            <span style={{fontSize:11,color:C.label}}>{l.name.split(" ")[0]}</span>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:C.pink,boxShadow:`0 0 4px ${C.pink}`}}/>
          <span style={{fontSize:11,color:C.pink,fontWeight:700}}>Shared</span>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          <button style={sBtn("ghost",{padding:"4px 10px",fontSize:10})} onClick={()=>{setPan({x:0,y:0});setZoom(1);}}>Reset View</button>
          <span style={{fontSize:9,color:C.muted}}>Scroll = zoom · Drag = pan · Click = inspect</span>
        </div>
      </div>

      {/* Empty state */}
      {filteredEngineers.length===0 ? (
        <div style={{...sCard({textAlign:"center",padding:60,borderStyle:"dashed"})}}>
          <div style={{fontSize:32,marginBottom:12}}>⟁</div>
          <div style={{fontSize:14,color:C.muted}}>
            {filterBranch==="All"
              ? "Add engineers and create projects to see the org chart."
              : `No engineers found in branch ${filterBranch}.`}
          </div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>

          {/* SVG Canvas */}
          <div style={sCard({padding:0,overflow:"hidden",position:"relative"})}>
            <svg
              ref={svgRef}
              width="100%" height={550}
              viewBox={`0 0 ${W} ${H}`}
              style={{display:"block",cursor:dragging?"grabbing":"grab",
                background:`radial-gradient(ellipse at 50% 40%, #0A1628 0%, ${C.bg} 72%)`}}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
              <defs>
                <pattern id="dotg" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx={14} cy={14} r={0.7} fill={C.border}/>
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#dotg)"/>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {viewMode==="hierarchy"&&(
                  <>
                    <text x={12} y={58}  style={{fontSize:8,fill:C.muted,fontFamily:"inherit",letterSpacing:"0.15em",textTransform:"uppercase"}}>TEAM LEADERS</text>
                    <text x={12} y={240} style={{fontSize:8,fill:C.muted,fontFamily:"inherit",letterSpacing:"0.15em",textTransform:"uppercase"}}>TEAM MEMBERS</text>
                    {hierarchyNodes.some(n=>n.unassigned)&&(
                      <text x={12} y={400} style={{fontSize:8,fill:C.muted,fontFamily:"inherit",letterSpacing:"0.15em",textTransform:"uppercase"}}>UNASSIGNED</text>
                    )}
                    <line x1={0} y1={165} x2={W} y2={165} stroke={C.border} strokeWidth={0.6}/>
                    <line x1={0} y1={360} x2={W} y2={360} stroke={C.border} strokeWidth={0.6}/>
                  </>
                )}
                {edges.map((e,i)=>renderEdge(e,i))}
                {nodes.map(n=>renderNode(n))}
              </g>
            </svg>
            <div style={{position:"absolute",bottom:12,right:12,fontSize:9,color:C.muted,background:C.panel,padding:"4px 10px",borderRadius:4,border:`1px solid ${C.border}`}}>
              {Math.round(zoom*100)}%
            </div>
          </div>

          {/* Detail Panel */}
          <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:560,overflowY:"auto"}}>
            {selEng ? (
              <div style={sCard({borderColor:(sharedMap[selEng.id]?C.pink:leaderColor[selEng.id]||C.accent)+"66"})}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                  <span style={{fontSize:11,color:C.accent,letterSpacing:"0.1em",textTransform:"uppercase"}}>Engineer Detail</span>
                  <button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}} onClick={()=>setSelectedId(null)}>✕</button>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:sharedMap[selEng.id]?C.pink:leaderColor[selEng.id]||C.accent,marginBottom:8}}>
                  {selEng.name}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  <Tag color={posColors[selEng.position]||C.muted}>{selEng.position}</Tag>
                  {selEng.option==="Team Leader"&&<Tag color={C.gold}>★ Leader</Tag>}
                  {sharedMap[selEng.id]&&<Tag color={C.pink}>Shared</Tag>}
                  <Tag color={branchColors[selEng.branch]||C.muted}>{selEng.branch}</Tag>
                </div>
                {sharedMap[selEng.id]&&(
                  <div style={{background:C.pink+"11",border:`1px solid ${C.pink}33`,borderRadius:5,padding:"10px 12px",marginBottom:12}}>
                    <div style={{fontSize:9,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,fontWeight:700}}>
                      Shared Across {sharedMap[selEng.id].length} Leaders
                    </div>
                    {sharedMap[selEng.id].map(lid=>{
                      const ldr=filteredEngineers.find(e=>e.id===lid);
                      const lProjs=filteredProjects.filter(p=>p.leaderId===lid&&p.members.some(m=>m.engId===selEng.id));
                      return (
                        <div key={lid} style={{marginBottom:6}}>
                          <div style={{fontSize:11,color:leaderColor[lid],fontWeight:700,cursor:"pointer"}} onClick={()=>setSelectedId(lid)}>
                            ★ {ldr?.name}
                          </div>
                          {lProjs.map(p=>(
                            <div key={p.id} style={{fontSize:10,color:C.label,paddingLeft:12,marginTop:2}}>
                              ↳ {p.name} <Tag color={statusColors[p.status]||C.muted}>{p.status}</Tag>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
                  Projects ({selProjs.length})
                </div>
                {selProjs.length===0&&<div style={{fontSize:11,color:C.muted}}>Not assigned to any project.</div>}
                {selProjs.map(p=>{
                  const isLdr=p.leaderId===selEng.id;
                  const md=p.members.find(m=>m.engId===selEng.id);
                  const load=isLdr?p.leaderLoad:(md?.load||0);
                  return (
                    <div key={p.id} style={{background:"#060A12",borderRadius:5,padding:"8px 10px",marginBottom:6,border:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,color:C.text,fontWeight:600}}>{p.name}</span>
                        <Tag color={statusColors[p.status]||C.muted}>{p.status}</Tag>
                      </div>
                      <div style={{fontSize:10,color:C.muted}}>
                        {isLdr?"★ Leader":"Member"} · {load}% workload · {p.stage}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={sCard()}>
                <div style={{fontSize:11,color:C.accent,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Quick Overview</div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.8,marginBottom:16}}>
                  Click any node to inspect their team relationships and project assignments.
                </div>
                {Object.keys(sharedMap).length>0&&(
                  <>
                    <div style={{fontSize:9,color:C.pink,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontWeight:700}}>
                      ⚠ Shared Engineers ({Object.keys(sharedMap).length})
                    </div>
                    {Object.entries(sharedMap).map(([eid,lids])=>{
                      const eng=filteredEngineers.find(e=>e.id===eid);
                      return (
                        <div key={eid}
                          style={{background:C.pink+"0E",border:`1px solid ${C.pink}33`,borderRadius:5,padding:"10px 12px",marginBottom:8,cursor:"pointer"}}
                          onClick={()=>setSelectedId(eid)}>
                          <div style={{fontSize:12,color:C.pink,fontWeight:700,marginBottom:4}}>{eng?.name}</div>
                          <div style={{fontSize:10,color:C.label}}>Shared by {lids.length} leaders</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:5}}>
                            {lids.map(lid=>{
                              const l=filteredEngineers.find(e=>e.id===lid);
                              return (
                                <span key={lid} style={{fontSize:10,color:leaderColor[lid],background:leaderColor[lid]+"18",borderRadius:3,padding:"1px 7px"}}>
                                  ★ {l?.name?.split(" ")[0]}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Leaders list */}
            <div style={sCard()}>
              <div style={{fontSize:11,color:C.accent,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>
                Team Leaders {filterBranch!=="All"&&<Tag color={branchColors[filterBranch]}>{filterBranch}</Tag>}
              </div>
              {leaders.length===0&&<div style={{fontSize:11,color:C.muted}}>No leaders in this branch.</div>}
              {leaders.map((l,i)=>{
                const c=LEADER_PALETTE[i%LEADER_PALETTE.length];
                const lProjs=filteredProjects.filter(p=>p.leaderId===l.id);
                return (
                  <div key={l.id}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}22`,cursor:"pointer"}}
                    onClick={()=>setSelectedId(l.id)}>
                    <div style={{width:8,height:8,borderRadius:4,background:c,boxShadow:`0 0 6px ${c}`,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:C.text,fontWeight:600}}>{l.name}</div>
                      <div style={{fontSize:10,color:C.muted}}>{lProjs.length} projects · {l.position} · {l.branch}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════

function OutputsTab({engineers,projects}) {
  const [filterStatus,setFilterStatus]   = useState("All");
  const [filterBranch,setFilterBranch]   = useState("All");
  const [filterPosition,setFilterPosition] = useState("All");

  const sortedProjects = useMemo(()=>[...projects].sort((a,b)=>{
    if(!a.submissionDate) return 1;
    if(!b.submissionDate) return -1;
    return new Date(a.submissionDate)-new Date(b.submissionDate);
  }),[projects]);

  const dispProjects = sortedProjects.filter(p=>{
    if(filterStatus!=="All"&&p.status!==filterStatus) return false;
    if(filterBranch!=="All"&&p.branch!==filterBranch) return false;
    return true;
  });

  const dispEngineers = engineers.filter(e=>{
    if(filterBranch!=="All"&&e.branch!==filterBranch) return false;
    if(filterPosition!=="All"&&e.position!==filterPosition) return false;
    return true;
  });

  return (
    <div>
      <div style={{fontSize:20,fontWeight:700,marginBottom:20}}>Outputs — Engineer × Project Matrix</div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:16,padding:"12px 16px",background:C.panel,borderRadius:6,border:`1px solid ${C.border}`}}>
        <span style={{fontSize:10,color:C.accent,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginRight:4}}>Filters:</span>
        {[
          ["Branch", BRANCHES, filterBranch, setFilterBranch],
          ["Position", ["Section Head","Principal","Senior","Junior","Draftsman"], filterPosition, setFilterPosition],
          ["Status", ["Not Started Yet","Ongoing","Urgent","Near Completion","Completed","Hold","Other"], filterStatus, setFilterStatus],
        ].map(([label,opts,val,setter])=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:C.muted}}>{label}</span>
            <select style={sSel({width:130,fontSize:11,padding:"5px 8px"})} value={val} onChange={e=>setter(e.target.value)}>
              <option value="All">All</option>
              {opts.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {(filterBranch!=="All"||filterPosition!=="All"||filterStatus!=="All")&&(
          <button style={sBtn("ghost",{fontSize:10,padding:"5px 12px"})} onClick={()=>{setFilterBranch("All");setFilterPosition("All");setFilterStatus("All");}}>✕ Clear</button>
        )}
        <div style={{marginLeft:"auto",fontSize:10,color:C.muted}}>
          <span style={{color:C.accent,fontWeight:700}}>{dispEngineers.length}</span> engineers · <span style={{color:C.gold,fontWeight:700}}>{dispProjects.length}</span> projects
        </div>
      </div>

      {dispEngineers.length===0||dispProjects.length===0 ? (
        <div style={{...sCard({textAlign:"center",padding:48})}}>
          <div style={{fontSize:14,color:C.muted}}>No data matches the current filters.</div>
        </div>
      ) : (
        <div style={{overflowX:"auto",borderRadius:8,border:`1px solid ${C.border}`}}>
          <table style={{borderCollapse:"collapse",fontSize:11,minWidth:"100%"}}>
            <thead>
              <tr>
                <th style={{...sTH,background:C.panel,position:"sticky",left:0,zIndex:10,minWidth:180,borderRight:`1px solid ${C.border}`}}>Engineer</th>
                <th style={{...sTH,background:C.panel,minWidth:90,textAlign:"center"}}>Position</th>
                <th style={{...sTH,background:C.panel,minWidth:70,textAlign:"center"}}>Role</th>
                <th style={{...sTH,background:C.panel,minWidth:70,textAlign:"center"}}>Branch</th>
                {dispProjects.map(proj=>(
                  <th key={proj.id} style={{...sTH,background:C.panel,minWidth:110,textAlign:"center",padding:"8px 5px"}}>
                    <div style={{color:statusColors[proj.status]||C.muted,fontWeight:700,fontSize:9,marginBottom:2}}>{proj.number||proj.id}</div>
                    <div style={{color:C.text,fontSize:10,lineHeight:1.3}}>{proj.name.length>18?proj.name.slice(0,17)+"…":proj.name}</div>
                    <Tag color={statusColors[proj.status]||C.muted}>{proj.status}</Tag>
                    <div style={{fontSize:8,color:C.muted,marginTop:2}}>{proj.submissionDate||"—"}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispEngineers.map((eng,ei)=>(
                <tr key={eng.id} style={{background:ei%2?"#0C1525":"#0F1B2E"}}>
                  <td style={{...sTD,position:"sticky",left:0,background:ei%2?"#0C1525":"#0F1B2E",zIndex:5,borderRight:`1px solid ${C.border}`,minWidth:180}}>
                    <div style={{fontWeight:700,color:eng.option==="Team Leader"?C.gold:C.text}}>{eng.name}</div>
                    <div style={{fontSize:9,color:C.muted}}>#{eng.serial}</div>
                  </td>
                  <td style={{...sTD,textAlign:"center"}}><Tag color={posColors[eng.position]||C.muted}>{eng.position}</Tag></td>
                  <td style={{...sTD,textAlign:"center"}}><Tag color={eng.option==="Team Leader"?C.gold:C.accent}>{eng.option==="Team Leader"?"★":"◉"}</Tag></td>
                  <td style={{...sTD,textAlign:"center"}}><Tag color={branchColors[eng.branch]||C.muted}>{eng.branch}</Tag></td>
                  {dispProjects.map(proj=>{
                    const isLdr=proj.leaderId===eng.id;
                    const md=proj.members.find(m=>m.engId===eng.id);
                    const involved=isLdr||!!md;
                    const load=isLdr?proj.leaderLoad:(md?.load||0);
                    if(!involved) return <td key={proj.id} style={{...sTD,textAlign:"center"}}><span style={{color:C.border}}>·</span></td>;
                    return (
                      <td key={proj.id} style={{...sTD,textAlign:"center",padding:"5px"}}>
                        <div style={{padding:"4px 5px",borderRadius:5,background:isLdr?C.gold+"22":C.accent+"16",border:`1px solid ${isLdr?C.gold+"55":C.accent+"33"}`}}>
                          <div style={{fontSize:10,color:isLdr?C.gold:C.accent,fontWeight:isLdr?700:500}}>{isLdr?"★":"◉"}</div>
                          <div style={{fontSize:9,color:C.muted}}>{load}%</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
