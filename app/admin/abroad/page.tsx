"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import AdminProfileDropdown from "@/components/admin-profile-dropdown";
import ThemeToggle from "@/components/theme-toggle";
import { Globe, ArrowLeft, Shield, ExternalLink, Pencil, Trash2, Plus, X, CheckCircle } from "lucide-react";
import { abroadTR } from "@/lib/translations";

interface S {
  _id: string; name: string; nameHi: string; nameGu: string;
  provider: string; country: string;
  amount: string; amountHi: string; amountGu: string;
  deadline: string; deadlineHi: string; deadlineGu: string;
  eligibility: string; eligibilityHi: string; eligibilityGu: string;
  fields: string; fieldsHi: string; fieldsGu: string;
  level: string; bond: string; applyLink: string;
  documents: string; documentsHi: string; documentsGu: string;
  tips: string; tipsHi: string; tipsGu: string;
  isActive: boolean;
}

const CG: Record<string, string> = {
  usa:       "linear-gradient(135deg,#1d4ed8,#2563eb)",
  uk:        "linear-gradient(135deg,#dc2626,#b91c1c)",
  canada:    "linear-gradient(135deg,#dc2626,#991b1b)",
  australia: "linear-gradient(135deg,#d97706,#b45309)",
  germany:   "linear-gradient(135deg,#1a2744,#374151)",
};
const CTRY = [
  { id: "usa",       flag: "\uD83C\uDDFA\uD83C\uDDF8", name: "USA"       },
  { id: "uk",        flag: "\uD83C\uDDEC\uD83C\uDDE7", name: "UK"        },
  { id: "canada",    flag: "\uD83C\uDDE8\uD83C\uDDE6", name: "Canada"    },
  { id: "australia", flag: "\uD83C\uDDE6\uD83C\uDDFA", name: "Australia" },
  { id: "germany",   flag: "\uD83C\uDDE9\uD83C\uDDEA", name: "Germany"   },
];
const LVL = ["Bachelor","Master","PhD","Master / PhD","PhD / Research","Any","Bachelor / Master"];
const BONDS = ["No bond","Must return to India after program","Must return to India for 2 years","Must return to home country"];

// Translations — proper Devanagari & Gujarati script from translations.ts
const TR = abroadTR;

const DATA: S[] = [
  { _id:"s1",  name:"Fulbright-Nehru Master's Fellowships",          nameHi:TR.s1.nameHi,  nameGu:TR.s1.nameGu,  provider:"USIEF",                                country:"usa",       amount:"Full funding - tuition + living + airfare",        deadline:"July 15 every year",               eligibility:"Indian citizens, Bachelor's, min 55%, 3 yrs work exp",     eligibilityHi:TR.s1.eligibilityHi,  eligibilityGu:TR.s1.eligibilityGu,  level:"Master",               fields:"Arts, Humanities, STEM, Management",                    bond:"Must return to India after program", applyLink:"https://www.usief.org.in",                                                          documents:"USIEF application, Transcripts, 3 references, SOP, TOEFL/IELTS", tips:"Apply early. Focus on community impact in SOP.",                    tipsHi:TR.s1.tipsHi,  tipsGu:TR.s1.tipsGu,  isActive:true },
  { _id:"s2",  name:"Fulbright-Nehru Doctoral Fellowships",          nameHi:TR.s2.nameHi,  nameGu:TR.s2.nameGu,  provider:"USIEF",                                country:"usa",       amount:"Full funding - tuition + stipend + airfare",       deadline:"July 15 every year",               eligibility:"Indian citizens, PhD enrolled, min 55%",                    eligibilityHi:TR.s2.eligibilityHi,  eligibilityGu:TR.s2.eligibilityGu,  level:"PhD",                  fields:"Any field",                                             bond:"Must return to India",               applyLink:"https://www.usief.org.in",                                                          documents:"USIEF form, Research proposal, Transcripts, TOEFL",               tips:"Contact US faculty supervisor before applying.",                    tipsHi:TR.s2.tipsHi,  tipsGu:TR.s2.tipsGu,  isActive:true },
  { _id:"s3",  name:"Inlaks Shivdasani Foundation Scholarship",      nameHi:TR.s3.nameHi,  nameGu:TR.s3.nameGu,  provider:"Inlaks Foundation",                    country:"usa",       amount:"Up to $100,000 total",                             deadline:"April (varies)",                   eligibility:"Indian citizens under 30, top academic record",             eligibilityHi:TR.s3.eligibilityHi,  eligibilityGu:TR.s3.eligibilityGu,  level:"Master / PhD",         fields:"Arts, Humanities, Sciences",                            bond:"No bond",                            applyLink:"https://www.inlaksfoundation.org/scholarships/",                                    documents:"CV, Transcripts, 2 references, SOP, Admission letter",            tips:"Must have admission first. Very competitive.",                      tipsHi:TR.s3.tipsHi,  tipsGu:TR.s3.tipsGu,  isActive:true },
  { _id:"s4",  name:"Tata Scholarship for Cornell University",        nameHi:TR.s4.nameHi,  nameGu:TR.s4.nameGu,  provider:"Tata Education and Development Trust", country:"usa",       amount:"Full tuition + living expenses",                   deadline:"January (Cornell deadline)",       eligibility:"Indian citizens admitted to Cornell, financial need",       eligibilityHi:TR.s4.eligibilityHi,  eligibilityGu:TR.s4.eligibilityGu,  level:"Bachelor / Master",    fields:"Any Cornell program",                                   bond:"No bond",                            applyLink:"https://sfs.cornell.edu/aid/tata",                                                  documents:"Cornell application, Financial need docs, Transcripts",            tips:"Apply through Cornell financial aid - automatically considered.",   tipsHi:TR.s4.tipsHi,  tipsGu:TR.s4.tipsGu,  isActive:true },
  { _id:"s5",  name:"AAUW International Fellowship",                 nameHi:TR.s5.nameHi,  nameGu:TR.s5.nameGu,  provider:"AAUW",                                 country:"usa",       amount:"$18,000-$30,000",                                  deadline:"November 15",                      eligibility:"Women, non-US citizens, enrolled full-time in US university",eligibilityHi:TR.s5.eligibilityHi,  eligibilityGu:TR.s5.eligibilityGu,  level:"Master / PhD",         fields:"Any",                                                   bond:"No bond",                            applyLink:"https://www.aauw.org",                                                              documents:"Online application, Transcripts, 2 references, SOP",               tips:"For women only. Focus on leadership in application.",               tipsHi:TR.s5.tipsHi,  tipsGu:TR.s5.tipsGu,  isActive:true },
  { _id:"s6",  name:"Chevening Scholarships",                        nameHi:TR.s6.nameHi,  nameGu:TR.s6.nameGu,  provider:"UK FCDO",                              country:"uk",        amount:"Full funding - tuition + living + flights + visa", deadline:"November 5 every year",            eligibility:"Indian citizens, 2+ yrs work exp, Bachelor degree",         eligibilityHi:TR.s6.eligibilityHi,  eligibilityGu:TR.s6.eligibilityGu,  level:"Master",               fields:"Any - future leaders focus",                            bond:"Must return to India for 2 years",   applyLink:"https://www.chevening.org/scholarships/",                                           documents:"Chevening application, 2 references, Transcripts, IELTS 6.5+",    tips:"Leadership is key. Apply 3 years after graduation for best chance.",tipsHi:TR.s6.tipsHi,  tipsGu:TR.s6.tipsGu,  isActive:true },
  { _id:"s7",  name:"Gates Cambridge Scholarship",                   nameHi:TR.s7.nameHi,  nameGu:TR.s7.nameGu,  provider:"Bill and Melinda Gates Foundation",    country:"uk",        amount:"Full cost of study + maintenance + flights",       deadline:"October / December",               eligibility:"Non-UK citizens admitted to Cambridge",                     eligibilityHi:TR.s7.eligibilityHi,  eligibilityGu:TR.s7.eligibilityGu,  level:"Master / PhD",         fields:"Any Cambridge program",                                 bond:"No bond",                            applyLink:"https://www.gatescambridge.org/apply/",                                             documents:"Cambridge application, SOP, 3 references, IELTS",                  tips:"Apply to Cambridge first. Focus on social impact.",                 tipsHi:TR.s7.tipsHi,  tipsGu:TR.s7.tipsGu,  isActive:true },
  { _id:"s8",  name:"Commonwealth Scholarships UK",                  nameHi:TR.s8.nameHi,  nameGu:TR.s8.nameGu,  provider:"Commonwealth Scholarship Commission",  country:"uk",        amount:"Full funding - tuition + stipend + airfare",       deadline:"October-December",                 eligibility:"Indian citizens, good academics, financial need",           eligibilityHi:TR.s8.eligibilityHi,  eligibilityGu:TR.s8.eligibilityGu,  level:"Master / PhD",         fields:"Development-related fields",                            bond:"Must return to home country",        applyLink:"https://cscuk.fcdo.gov.uk/apply/",                                                  documents:"CSC application, Transcripts, References, IELTS",                  tips:"Strong development impact essay needed.",                           tipsHi:TR.s8.tipsHi,  tipsGu:TR.s8.tipsGu,  isActive:true },
  { _id:"s9",  name:"Felix Scholarship",                             nameHi:TR.s9.nameHi,  nameGu:TR.s9.nameGu,  provider:"Felix Foundation",                     country:"uk",        amount:"Full tuition + living expenses",                   deadline:"January",                          eligibility:"Indian citizens under 30, financial need, strong academics",eligibilityHi:TR.s9.eligibilityHi,  eligibilityGu:TR.s9.eligibilityGu,  level:"Master / DPhil",       fields:"Oxford, SOAS, Reading programs",                        bond:"No bond",                            applyLink:"https://www.felixscholarship.org/",                                                 documents:"University application, Financial need proof, IELTS",              tips:"Apply to university first. Need-based - strong financial docs needed.",tipsHi:TR.s9.tipsHi,tipsGu:TR.s9.tipsGu,  isActive:true },
  { _id:"s10", name:"Vanier Canada Graduate Scholarships",           nameHi:TR.s10.nameHi, nameGu:TR.s10.nameGu, provider:"Government of Canada",                 country:"canada",    amount:"CAD 50,000/year for 3 years",                      deadline:"November (nominated by university)",eligibility:"International PhD students at Canadian universities",        eligibilityHi:TR.s10.eligibilityHi, eligibilityGu:TR.s10.eligibilityGu, level:"PhD",                  fields:"Health, Natural Sciences, Engineering, Social Sciences",bond:"No bond",                            applyLink:"https://vanier.gc.ca",                                                              documents:"University nomination, Research proposal, Transcripts",            tips:"University must nominate you - contact faculty early.",             tipsHi:TR.s10.tipsHi, tipsGu:TR.s10.tipsGu, isActive:true },
  { _id:"s11", name:"Ontario Graduate Scholarship",                  nameHi:TR.s11.nameHi, nameGu:TR.s11.nameGu, provider:"Province of Ontario",                  country:"canada",    amount:"CAD 10,000-15,000/year",                           deadline:"Varies by university (Jan-Feb)",    eligibility:"International students in Ontario universities",            eligibilityHi:TR.s11.eligibilityHi, eligibilityGu:TR.s11.eligibilityGu, level:"Master / PhD",         fields:"Any",                                                   bond:"No bond",                            applyLink:"https://osap.gov.on.ca",                                                            documents:"University portal application, Transcripts, Research proposal",    tips:"Apply through your Ontario university graduate office.",            tipsHi:TR.s11.tipsHi, tipsGu:TR.s11.tipsGu, isActive:true },
  { _id:"s12", name:"Shastri Indo-Canadian Institute Fellowship",    nameHi:TR.s12.nameHi, nameGu:TR.s12.nameGu, provider:"Shastri Institute",                    country:"canada",    amount:"CAD 5,000-15,000",                                 deadline:"October-November",                 eligibility:"Indian citizens - researchers, faculty, PhD students",     eligibilityHi:TR.s12.eligibilityHi, eligibilityGu:TR.s12.eligibilityGu, level:"PhD / Research",       fields:"Any academic field",                                    bond:"No bond",                            applyLink:"https://www.shastriinstitute.org",                                                  documents:"Online application, Research proposal, CV, References",            tips:"India-Canada specific. Build connections with Canadian faculty first.",tipsHi:TR.s12.tipsHi,tipsGu:TR.s12.tipsGu, isActive:true },
  { _id:"s13", name:"Australia Awards Scholarships",                 nameHi:TR.s13.nameHi, nameGu:TR.s13.nameGu, provider:"Australian Government DFAT",           country:"australia", amount:"Full funding - tuition + living + airfare + insurance",deadline:"April 30 every year",             eligibility:"Indian citizens, Bachelors, 2 yrs work exp",               eligibilityHi:TR.s13.eligibilityHi, eligibilityGu:TR.s13.eligibilityGu, level:"Master / PhD",         fields:"Development-priority fields",                           bond:"Must return to India for 2 years",   applyLink:"https://www.australiaawardsindia.org/",                                             documents:"OASIS application, Transcripts, Work exp proof, IELTS 6.5+",       tips:"Strongest scholarship for India. Development impact essay is key.", tipsHi:TR.s13.tipsHi, tipsGu:TR.s13.tipsGu, isActive:true },
  { _id:"s14", name:"Research Training Program (RTP)",               nameHi:TR.s14.nameHi, nameGu:TR.s14.nameGu, provider:"Australian Government",                country:"australia", amount:"Full tuition + AUD 28,000/year stipend",            deadline:"Varies by university Oct-Dec",     eligibility:"International PhD/Research Masters students",              eligibilityHi:TR.s14.eligibilityHi, eligibilityGu:TR.s14.eligibilityGu, level:"PhD / Research Masters",fields:"Any research field",                                    bond:"No bond",                            applyLink:"https://www.education.gov.au",                                                      documents:"University research application, Research proposal, IELTS 6.5+",   tips:"Contact a supervisor first. Most universities use RTP for PhD.",    tipsHi:TR.s14.tipsHi, tipsGu:TR.s14.tipsGu, isActive:true },
  { _id:"s15", name:"University of Melbourne Graduate Research Scholarship",nameHi:TR.s15.nameHi,nameGu:TR.s15.nameGu,provider:"University of Melbourne",         country:"australia", amount:"Full tuition + AUD 28,000/year",                    deadline:"October 31 Round 1",               eligibility:"International students applying for PhD/Research Masters",  eligibilityHi:TR.s15.eligibilityHi, eligibilityGu:TR.s15.eligibilityGu, level:"PhD / Research Masters",fields:"Any Melbourne program",                                 bond:"No bond",                            applyLink:"https://study.unimelb.edu.au",                                                      documents:"Melbourne graduate application, Research proposal, IELTS",         tips:"Get supervisor pre-approval before applying. Very competitive.",    tipsHi:TR.s15.tipsHi, tipsGu:TR.s15.tipsGu, isActive:true },
  { _id:"s16", name:"DAAD Scholarships",                             nameHi:TR.s16.nameHi, nameGu:TR.s16.nameGu, provider:"DAAD Germany",                         country:"germany",   amount:"861-1200 EUR/month + travel allowance",            deadline:"October 15 for following year",    eligibility:"Indian citizens, Bachelors min 60%, IELTS 6.5 or German B2",eligibilityHi:TR.s16.eligibilityHi, eligibilityGu:TR.s16.eligibilityGu, level:"Master / PhD",         fields:"Engineering, Sciences, Agriculture, Social Sciences, Arts",bond:"No bond",                            applyLink:"https://www.daad.in/en/find-funding/scholarships-for-indians-to-study-in-germany/", documents:"DAAD portal application, Motivation letter, CV, Transcripts, References",tips:"Germany most prestigious scholarship. German language boosts chances.",tipsHi:TR.s16.tipsHi,tipsGu:TR.s16.tipsGu, isActive:true },
  { _id:"s17", name:"Deutschlandstipendium",                         nameHi:TR.s17.nameHi, nameGu:TR.s17.nameGu, provider:"German Federal Government",            country:"germany",   amount:"300 EUR/month tax-free",                           deadline:"Varies by university April-May",   eligibility:"Students at German universities, high academic performance",eligibilityHi:TR.s17.eligibilityHi, eligibilityGu:TR.s17.eligibilityGu, level:"Bachelor / Master",    fields:"Any",                                                   bond:"No bond",                            applyLink:"https://www.deutschlandstipendium.de/en/",                                          documents:"University portal application, Transcripts, CV, Motivation letter",tips:"Apply through your German university. Less competitive than DAAD.",  tipsHi:TR.s17.tipsHi, tipsGu:TR.s17.tipsGu, isActive:true },
  { _id:"s18", name:"Konrad-Adenauer-Stiftung Scholarship",          nameHi:TR.s18.nameHi, nameGu:TR.s18.nameGu, provider:"Konrad-Adenauer Foundation",           country:"germany",   amount:"850-1200 EUR/month + book allowance",              deadline:"July 15 / January 15",             eligibility:"International students at German universities, high academics",eligibilityHi:TR.s18.eligibilityHi,eligibilityGu:TR.s18.eligibilityGu, level:"Master / PhD",         fields:"Social Sciences, Politics, Law, Economics",             bond:"No bond",                            applyLink:"https://www.kas.de/en/web/begabtenfoerderung-und-kultur/scholarships",              documents:"Online application, Motivation letter, CV, Transcripts, 2 references",tips:"Focus on civic/democratic values. Need enrolled admission in Germany.",tipsHi:TR.s18.tipsHi,tipsGu:TR.s18.tipsGu,isActive:true },
];

const EMPTY: S = { _id:"", name:"", nameHi:"", nameGu:"", provider:"", country:"usa", amount:"", amountHi:"", amountGu:"", deadline:"", deadlineHi:"", deadlineGu:"", eligibility:"", eligibilityHi:"", eligibilityGu:"", fields:"", fieldsHi:"", fieldsGu:"", level:"Master", bond:"No bond", applyLink:"", documents:"", documentsHi:"", documentsGu:"", tips:"", tipsHi:"", tipsGu:"", isActive:true };

export default function AbroadPage() {
  const { lang } = useLanguage();
  const [list, setList] = useState<S[]>(DATA);
  const [cf, setCf] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<S>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = useMemo(() => cf === "all" ? list : list.filter(s => s.country === cf), [list, cf]);

  const getName = (s: S) => lang === "hi" && s.nameHi ? s.nameHi : lang === "gu" && s.nameGu ? s.nameGu : s.name;
  const getEl   = (s: S) => lang === "hi" && s.eligibilityHi ? s.eligibilityHi : lang === "gu" && s.eligibilityGu ? s.eligibilityGu : s.eligibility;
  const getTip  = (s: S) => lang === "hi" && s.tipsHi ? s.tipsHi : lang === "gu" && s.tipsGu ? s.tipsGu : s.tips;
  const getAmt  = (s: S) => lang === "hi" && s.amountHi ? s.amountHi : lang === "gu" && s.amountGu ? s.amountGu : s.amount;
  const getDl   = (s: S) => lang === "hi" && s.deadlineHi ? s.deadlineHi : lang === "gu" && s.deadlineGu ? s.deadlineGu : s.deadline;
  const getFld  = (s: S) => lang === "hi" && s.fieldsHi ? s.fieldsHi : lang === "gu" && s.fieldsGu ? s.fieldsGu : s.fields;
  const getDoc  = (s: S) => lang === "hi" && s.documentsHi ? s.documentsHi : lang === "gu" && s.documentsGu ? s.documentsGu : s.documents;

  const L = {
    title:       lang === "hi" ? "विदेश छात्रवृत्तियाँ" : lang === "gu" ? "વિદેશ શિષ્યવૃત્તિઓ" : "Abroad Scholarships",
    subtitle:    lang === "hi" ? "भारतीय छात्रों के लिए अंतर्राष्ट्रीय छात्रवृत्तियाँ" : lang === "gu" ? "ભારતીય વિદ્યાર્થીઓ માટે આંતરરાષ્ટ્રીય શિષ્યવૃત્તિઓ" : "International scholarships for Indian students",
    add:         lang === "hi" ? "जोड़ें" : lang === "gu" ? "ઉમેરો" : "Add Scholarship",
    cancel:      lang === "hi" ? "रद्द करें" : lang === "gu" ? "રદ કરો" : "Cancel",
    all:         lang === "hi" ? "सभी देश" : lang === "gu" ? "બધા દેશ" : "All Countries",
    total:       lang === "hi" ? "कुल" : lang === "gu" ? "કુલ" : "Total",
    allSch:      lang === "hi" ? "सभी विदेश छात्रवृत्तियाँ" : lang === "gu" ? "બધી વિદેશ શિષ્યવૃત્તિઓ" : "All Abroad Scholarships",
    deadline:    lang === "hi" ? "अंतिम तिथि" : lang === "gu" ? "અંતિમ તારીખ" : "Deadline",
    fields:      lang === "hi" ? "क्षेत्र" : lang === "gu" ? "ક્ષેત્ર" : "Fields",
    eligibility: lang === "hi" ? "पात्रता" : lang === "gu" ? "પાત્રતા" : "Eligibility",
    documents:   lang === "hi" ? "दस्तावेज़" : lang === "gu" ? "દસ્તાવેજ" : "Documents",
    apply:       lang === "hi" ? "अभी आवेदन करें" : lang === "gu" ? "અરજી કરો" : "Apply Now",
    active:      lang === "hi" ? "सक्रिय" : lang === "gu" ? "સક્રિય" : "Active",
    off:         lang === "hi" ? "बंद" : lang === "gu" ? "બંધ" : "Off",
    bond:        lang === "hi" ? "वापसी बॉन्ड" : lang === "gu" ? "પરત બૉન્ડ" : "Return Bond",
    noFound:     lang === "hi" ? "कोई छात्रवृत्ति नहीं मिली" : lang === "gu" ? "કોઈ શિષ્યવૃત્તિ મળી નથી" : "No scholarships found.",
    edit:        lang === "hi" ? "संपादित करें" : lang === "gu" ? "સંપાદિત કરો" : "Edit Scholarship",
    addNew:      lang === "hi" ? "नई छात्रवृत्ति जोड़ें" : lang === "gu" ? "નવી શિષ્યવૃત્તિ ઉમેરો" : "Add New Abroad Scholarship",
    update:      lang === "hi" ? "अपडेट करें" : lang === "gu" ? "અપડેટ કરો" : "Update",
  };

  function handleEdit(s: S) { setForm({ ...s }); setEditId(s._id); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function handleDelete(id: string) { if (!confirm(lang === "hi" ? "हटाएं?" : lang === "gu" ? "કાઢી નાખો?" : "Delete?")) return; setList(p => p.filter(s => s._id !== id)); }
  function handleToggle(id: string) { setList(p => p.map(s => s._id === id ? { ...s, isActive: !s.isActive } : s)); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) { setList(p => p.map(s => s._id === editId ? { ...form, _id: editId } : s)); }
    else { setList(p => [{ ...form, _id: "u-" + Date.now() }, ...p]); }
    setForm(EMPTY); setEditId(null); setShowForm(false);
  }

  const inp = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-900";
  const lbl = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="w-full px-6 py-4 flex items-center gap-4" style={{ background: "linear-gradient(135deg,#1a2744 0%,#1e3a6e 100%)" }}>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <Shield size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-none">ScholarHub</p>
            <p className="text-blue-300 text-xs mt-0.5">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:opacity-80" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={15} /> {lang === "hi" ? "वापस" : lang === "gu" ? "પાછા" : "Back"}
          </Link>
          <AdminLangSwitcher /><ThemeToggle /><AdminProfileDropdown />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
              <Globe size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{L.title}</h1>
              <p className="text-sm text-muted-foreground">{L.subtitle}</p>
            </div>
          </div>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(v => !v); }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition shadow-sm"
            style={{ background: showForm ? "#6b7280" : "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            {showForm ? <><X size={14} />{L.cancel}</> : <><Plus size={14} />{L.add}</>}
          </button>
        </div>



        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-card rounded-2xl shadow-md overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-2" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
              <Globe size={15} className="text-purple-200" />
              <h2 className="text-sm font-bold text-white">{editId ? L.edit : L.addNew}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={lbl}>Name (English) *</label><input required className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className={lbl}>Name (Hindi)</label><input className={inp} value={form.nameHi} onChange={e => setForm({ ...form, nameHi: e.target.value })} /></div>
              <div><label className={lbl}>Name (Gujarati)</label><input className={inp} value={form.nameGu} onChange={e => setForm({ ...form, nameGu: e.target.value })} /></div>
              <div><label className={lbl}>Provider *</label><input required className={inp} value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} /></div>
              <div><label className={lbl}>Country *</label>
                <select required className={inp} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
                  {CTRY.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Amount *</label><input required className={inp} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><label className={lbl}>Deadline *</label><input required className={inp} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
              <div><label className={lbl}>Level *</label>
                <select required className={inp} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  {LVL.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Fields</label><input className={inp} value={form.fields} onChange={e => setForm({ ...form, fields: e.target.value })} /></div>
              <div><label className={lbl}>Bond</label>
                <select className={inp} value={form.bond} onChange={e => setForm({ ...form, bond: e.target.value })}>
                  {BONDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Apply Link *</label><input required type="url" className={inp} value={form.applyLink} onChange={e => setForm({ ...form, applyLink: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Eligibility (English) *</label><input required className={inp} value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} /></div>
              <div><label className={lbl}>Eligibility (Hindi)</label><input className={inp} value={form.eligibilityHi} onChange={e => setForm({ ...form, eligibilityHi: e.target.value })} /></div>
              <div><label className={lbl}>Eligibility (Gujarati)</label><input className={inp} value={form.eligibilityGu} onChange={e => setForm({ ...form, eligibilityGu: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Documents</label><textarea rows={2} className={inp + " resize-y"} value={form.documents} onChange={e => setForm({ ...form, documents: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Tip (English)</label><input className={inp} value={form.tips} onChange={e => setForm({ ...form, tips: e.target.value })} /></div>
              <div><label className={lbl}>Tip (Hindi)</label><input className={inp} value={form.tipsHi} onChange={e => setForm({ ...form, tipsHi: e.target.value })} /></div>
              <div><label className={lbl}>Tip (Gujarati)</label><input className={inp} value={form.tipsGu} onChange={e => setForm({ ...form, tipsGu: e.target.value })} /></div>
              <div className="sm:col-span-2 flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                  <CheckCircle size={14} />{editId ? L.update : L.add}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }} className="inline-flex items-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  {L.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-purple-200" />
              <h2 className="text-sm font-bold text-white">{L.allSch}</h2>
              <span className="text-xs text-purple-200 bg-white/10 px-2 py-0.5 rounded-full ml-1">
                {filtered.length}{cf !== "all" ? ` / ${list.length}` : ""}
              </span>
            </div>
          </div>

          {/* Country filter */}
          <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 bg-muted/30">
            <button onClick={() => setCf("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${cf === "all" ? "text-white border-transparent" : "text-gray-500 border-gray-200 bg-white hover:border-purple-300"}`}
              style={cf === "all" ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}>
              {L.all}
            </button>
            {CTRY.map(c => (
              <button key={c.id} onClick={() => setCf(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${cf === c.id ? "text-white border-transparent" : "text-gray-500 border-gray-200 bg-white hover:border-purple-300"}`}
                style={cf === c.id ? { background: CG[c.id] } : {}}>
                {c.flag} {c.name} ({list.filter(s => s.country === c.id).length})
              </button>
            ))}
          </div>

          <div className="p-5">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Globe size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">{L.noFound}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map(s => {
                  const ctry = CTRY.find(c => c.id === s.country);
                  return (
                    <div key={s._id} className={`rounded-2xl border overflow-hidden transition-all hover:shadow-md ${s.isActive ? "bg-card border-gray-200" : "bg-muted/30 border-gray-200 opacity-70"}`}>
                      <div className="px-4 py-3 flex items-center justify-between" style={{ background: CG[s.country] }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg flex-shrink-0">{ctry?.flag}</span>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm leading-snug">{getName(s)}</p>
                            <p className="text-white/70 text-xs mt-0.5">by {s.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <button onClick={() => handleToggle(s._id)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border transition ${s.isActive ? "bg-white/20 text-white border-white/30" : "bg-white/10 text-white/60 border-white/20"}`}>
                            {s.isActive ? L.active : L.off}
                          </button>
                          <button onClick={() => handleEdit(s)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/15 hover:bg-white/25 transition text-white"><Pencil size={12} /></button>
                          <button onClick={() => handleDelete(s._id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/15 hover:bg-red-500/40 transition text-white"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>{s.level}</span>
                          {s.bond !== "No bond" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{L.bond}</span>}
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{getAmt(s)}</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex gap-2"><span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.deadline}</span><span className="font-medium text-gray-700">{getDl(s)}</span></div>
                          {s.fields && <div className="flex gap-2"><span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.fields}</span><span>{getFld(s)}</span></div>}
                          <div className="flex gap-2"><span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.eligibility}</span><span className="line-clamp-2">{getEl(s)}</span></div>
                          {s.documents && <div className="flex gap-2"><span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.documents}</span><span className="text-gray-500 line-clamp-2">{getDoc(s)}</span></div>}
                          {getTip(s) && (
                            <div className="flex gap-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                              <span className="text-purple-400 flex-shrink-0">&#128161;</span>
                              <span className="text-purple-700 font-medium">{getTip(s)}</span>
                            </div>
                          )}
                        </div>
                        <a href={s.applyLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                          style={{ background: CG[s.country] }}>
                          {L.apply} <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
