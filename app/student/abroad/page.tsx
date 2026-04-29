"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { abroadTR } from "@/lib/translations";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import StudentProfileDropdown from "@/components/student-profile-dropdown";
import StudentSmartSearch from "@/components/student-smart-search";
import ThemeToggle from "@/components/theme-toggle";
import StudentNotificationBell from "@/components/student-notification-bell";
import { Globe, ArrowLeft, GraduationCap, ExternalLink, Search, X } from "lucide-react";

const CG: Record<string, string> = {
  usa:       "linear-gradient(135deg,#1d4ed8,#2563eb)",
  uk:        "linear-gradient(135deg,#dc2626,#b91c1c)",
  canada:    "linear-gradient(135deg,#dc2626,#991b1b)",
  australia: "linear-gradient(135deg,#d97706,#b45309)",
  germany:   "linear-gradient(135deg,#1a2744,#374151)",
};
const CTRY = [
  { id: "usa",       flag: "🇺🇸", name: "USA"       },
  { id: "uk",        flag: "🇬🇧", name: "UK"        },
  { id: "canada",    flag: "🇨🇦", name: "Canada"    },
  { id: "australia", flag: "🇦🇺", name: "Australia" },
  { id: "germany",   flag: "🇩🇪", name: "Germany"   },
];

const DATA = [
  { _id:"s1",  name:"Fulbright-Nehru Master's Fellowships",          provider:"USIEF",                                country:"usa",       amount:"Full funding - tuition + living + airfare",        deadline:"July 15 every year",               eligibility:"Indian citizens, Bachelor's, min 55%, 3 yrs work exp",     level:"Master",               fields:"Arts, Humanities, STEM, Management",                    bond:"Must return to India after program", applyLink:"https://www.usief.org.in",          documents:"USIEF application, Transcripts, 3 references, SOP, TOEFL/IELTS", tips:"Apply early. Focus on community impact in SOP." },
  { _id:"s2",  name:"Fulbright-Nehru Doctoral Fellowships",          provider:"USIEF",                                country:"usa",       amount:"Full funding - tuition + stipend + airfare",       deadline:"July 15 every year",               eligibility:"Indian citizens, PhD enrolled, min 55%",                    level:"PhD",                  fields:"Any field",                                             bond:"Must return to India",               applyLink:"https://www.usief.org.in",          documents:"USIEF form, Research proposal, Transcripts, TOEFL",               tips:"Contact US faculty supervisor before applying." },
  { _id:"s3",  name:"Inlaks Shivdasani Foundation Scholarship",      provider:"Inlaks Foundation",                    country:"usa",       amount:"Up to $100,000 total",                             deadline:"April (varies)",                   eligibility:"Indian citizens under 30, top academic record",             level:"Master / PhD",         fields:"Arts, Humanities, Sciences",                            bond:"No bond",                            applyLink:"https://www.inlaksfoundation.org/scholarships/",    documents:"CV, Transcripts, 2 references, SOP, Admission letter",            tips:"Must have admission first. Very competitive." },
  { _id:"s4",  name:"Tata Scholarship for Cornell University",        provider:"Tata Education and Development Trust", country:"usa",       amount:"Full tuition + living expenses",                   deadline:"January (Cornell deadline)",       eligibility:"Indian citizens admitted to Cornell, financial need",       level:"Bachelor / Master",    fields:"Any Cornell program",                                   bond:"No bond",                            applyLink:"https://sfs.cornell.edu/aid/tata",                  documents:"Cornell application, Financial need docs, Transcripts",            tips:"Apply through Cornell financial aid - automatically considered." },
  { _id:"s5",  name:"AAUW International Fellowship",                 provider:"AAUW",                                 country:"usa",       amount:"$18,000-$30,000",                                  deadline:"November 15",                      eligibility:"Women, non-US citizens, enrolled full-time in US university",level:"Master / PhD",         fields:"Any",                                                   bond:"No bond",                            applyLink:"https://www.aauw.org",                               documents:"Online application, Transcripts, 2 references, SOP",               tips:"For women only. Focus on leadership in application." },
  { _id:"s6",  name:"Chevening Scholarships",                        provider:"UK FCDO",                              country:"uk",        amount:"Full funding - tuition + living + flights + visa", deadline:"November 5 every year",            eligibility:"Indian citizens, 2+ yrs work exp, Bachelor degree",         level:"Master",               fields:"Any - future leaders focus",                            bond:"Must return to India for 2 years",   applyLink:"https://www.chevening.org/scholarships/",           documents:"Chevening application, 2 references, Transcripts, IELTS 6.5+",    tips:"Leadership is key. Apply 3 years after graduation for best chance." },
  { _id:"s7",  name:"Gates Cambridge Scholarship",                   provider:"Bill and Melinda Gates Foundation",    country:"uk",        amount:"Full cost of study + maintenance + flights",       deadline:"October / December",               eligibility:"Non-UK citizens admitted to Cambridge",                     level:"Master / PhD",         fields:"Any Cambridge program",                                 bond:"No bond",                            applyLink:"https://www.gatescambridge.org/apply/",             documents:"Cambridge application, SOP, 3 references, IELTS",                  tips:"Apply to Cambridge first. Focus on social impact." },
  { _id:"s8",  name:"Commonwealth Scholarships UK",                  provider:"Commonwealth Scholarship Commission",  country:"uk",        amount:"Full funding - tuition + stipend + airfare",       deadline:"October-December",                 eligibility:"Indian citizens, good academics, financial need",           level:"Master / PhD",         fields:"Development-related fields",                            bond:"Must return to home country",        applyLink:"https://cscuk.fcdo.gov.uk/apply/",                  documents:"CSC application, Transcripts, References, IELTS",                  tips:"Strong development impact essay needed." },
  { _id:"s9",  name:"Felix Scholarship",                             provider:"Felix Foundation",                     country:"uk",        amount:"Full tuition + living expenses",                   deadline:"January",                          eligibility:"Indian citizens under 30, financial need, strong academics",level:"Master / DPhil",       fields:"Oxford, SOAS, Reading programs",                        bond:"No bond",                            applyLink:"https://www.felixscholarship.org/",                 documents:"University application, Financial need proof, IELTS",              tips:"Apply to university first. Need-based." },
  { _id:"s10", name:"Vanier Canada Graduate Scholarships",           provider:"Government of Canada",                 country:"canada",    amount:"CAD 50,000/year for 3 years",                      deadline:"November (nominated by university)",eligibility:"International PhD students at Canadian universities",        level:"PhD",                  fields:"Health, Natural Sciences, Engineering, Social Sciences",bond:"No bond",                            applyLink:"https://vanier.gc.ca",                               documents:"University nomination, Research proposal, Transcripts",            tips:"University must nominate you - contact faculty early." },
  { _id:"s11", name:"Ontario Graduate Scholarship",                  provider:"Province of Ontario",                  country:"canada",    amount:"CAD 10,000-15,000/year",                           deadline:"Varies by university (Jan-Feb)",    eligibility:"International students in Ontario universities",            level:"Master / PhD",         fields:"Any",                                                   bond:"No bond",                            applyLink:"https://osap.gov.on.ca",                            documents:"University portal application, Transcripts, Research proposal",    tips:"Apply through your Ontario university graduate office." },
  { _id:"s12", name:"Shastri Indo-Canadian Institute Fellowship",    provider:"Shastri Institute",                    country:"canada",    amount:"CAD 5,000-15,000",                                 deadline:"October-November",                 eligibility:"Indian citizens - researchers, faculty, PhD students",     level:"PhD / Research",       fields:"Any academic field",                                    bond:"No bond",                            applyLink:"https://www.shastriinstitute.org",                  documents:"Online application, Research proposal, CV, References",            tips:"India-Canada specific. Build connections with Canadian faculty first." },
  { _id:"s13", name:"Australia Awards Scholarships",                 provider:"Australian Government DFAT",           country:"australia", amount:"Full funding - tuition + living + airfare + insurance",deadline:"April 30 every year",           eligibility:"Indian citizens, Bachelors, 2 yrs work exp",               level:"Master / PhD",         fields:"Development-priority fields",                           bond:"Must return to India for 2 years",   applyLink:"https://www.australiaawardsindia.org/",             documents:"OASIS application, Transcripts, Work exp proof, IELTS 6.5+",       tips:"Strongest scholarship for India. Development impact essay is key." },
  { _id:"s14", name:"Research Training Program (RTP)",               provider:"Australian Government",                country:"australia", amount:"Full tuition + AUD 28,000/year stipend",            deadline:"Varies by university Oct-Dec",     eligibility:"International PhD/Research Masters students",              level:"PhD / Research Masters",fields:"Any research field",                                    bond:"No bond",                            applyLink:"https://www.education.gov.au",                      documents:"University research application, Research proposal, IELTS 6.5+",   tips:"Contact a supervisor first. Most universities use RTP for PhD." },
  { _id:"s15", name:"University of Melbourne Graduate Research Scholarship",provider:"University of Melbourne",       country:"australia", amount:"Full tuition + AUD 28,000/year",                    deadline:"October 31 Round 1",               eligibility:"International students applying for PhD/Research Masters",  level:"PhD / Research Masters",fields:"Any Melbourne program",                                 bond:"No bond",                            applyLink:"https://study.unimelb.edu.au",                      documents:"Melbourne graduate application, Research proposal, IELTS",         tips:"Get supervisor pre-approval before applying. Very competitive." },
  { _id:"s16", name:"DAAD Scholarships",                             provider:"DAAD Germany",                         country:"germany",   amount:"861-1200 EUR/month + travel allowance",            deadline:"October 15 for following year",    eligibility:"Indian citizens, Bachelors min 60%, IELTS 6.5 or German B2",level:"Master / PhD",         fields:"Engineering, Sciences, Agriculture, Social Sciences, Arts",bond:"No bond",                            applyLink:"https://www.daad.in/en/find-funding/scholarships-for-indians-to-study-in-germany/", documents:"DAAD portal application, Motivation letter, CV, Transcripts, References", tips:"Germany most prestigious scholarship. German language boosts chances." },
  { _id:"s17", name:"Deutschlandstipendium",                         provider:"German Federal Government",            country:"germany",   amount:"300 EUR/month tax-free",                           deadline:"Varies by university April-May",   eligibility:"Students at German universities, high academic performance",level:"Bachelor / Master",    fields:"Any",                                                   bond:"No bond",                            applyLink:"https://www.deutschlandstipendium.de/en/",          documents:"University portal application, Transcripts, CV, Motivation letter",tips:"Apply through your German university. Less competitive than DAAD." },
  { _id:"s18", name:"Konrad-Adenauer-Stiftung Scholarship",          provider:"Konrad-Adenauer Foundation",           country:"germany",   amount:"850-1200 EUR/month + book allowance",              deadline:"July 15 / January 15",             eligibility:"International students at German universities, high academics",level:"Master / PhD",       fields:"Social Sciences, Politics, Law, Economics",             bond:"No bond",                            applyLink:"https://www.kas.de/en/web/begabtenfoerderung-und-kultur/scholarships", documents:"Online application, Motivation letter, CV, Transcripts, 2 references", tips:"Focus on civic/democratic values. Need enrolled admission in Germany." },
];

export default function StudentAbroadPage() {
  const { lang } = useLanguage();
  const [cf, setCf]     = useState("all");
  const [search, setSearch] = useState("");

  const getName = (s: typeof DATA[0]) => {
    const tr = abroadTR[s._id];
    return lang === "hi" && tr?.nameHi ? tr.nameHi : lang === "gu" && tr?.nameGu ? tr.nameGu : s.name;
  };
  const getEl = (s: typeof DATA[0]) => {
    const tr = abroadTR[s._id];
    return lang === "hi" && tr?.eligibilityHi ? tr.eligibilityHi : lang === "gu" && tr?.eligibilityGu ? tr.eligibilityGu : s.eligibility;
  };
  const getTip = (s: typeof DATA[0]) => {
    const tr = abroadTR[s._id];
    return lang === "hi" && tr?.tipsHi ? tr.tipsHi : lang === "gu" && tr?.tipsGu ? tr.tipsGu : s.tips;
  };
  const getAmt = (s: typeof DATA[0]) => {
    const tr = abroadTR[s._id];
    return lang === "hi" && tr?.amountHi ? tr.amountHi : lang === "gu" && tr?.amountGu ? tr.amountGu : s.amount;
  };
  const getDl = (s: typeof DATA[0]) => {
    const tr = abroadTR[s._id];
    return lang === "hi" && tr?.deadlineHi ? tr.deadlineHi : lang === "gu" && tr?.deadlineGu ? tr.deadlineGu : s.deadline;
  };

  const filtered = useMemo(() => DATA.filter(s => {
    const matchCountry = cf === "all" || s.country === cf;
    const q = search.toLowerCase();
    const matchSearch = !q || getName(s).toLowerCase().includes(q) || s.eligibility.toLowerCase().includes(q) || s.fields.toLowerCase().includes(q);
    return matchCountry && matchSearch;
  }), [cf, search, lang]);

  const L = {
    title:    lang === "hi" ? "विदेश छात्रवृत्तियाँ" : lang === "gu" ? "વિદેશ શિષ્યવૃત્તિઓ" : "Abroad Scholarships",
    subtitle: lang === "hi" ? "भारतीय छात्रों के लिए अंतर्राष्ट्रीय अवसर" : lang === "gu" ? "ભારતીય વિદ્યાર્થીઓ માટે આંતરરાષ્ટ્રીય તકો" : "International opportunities for Indian students",
    all:      lang === "hi" ? "सभी देश" : lang === "gu" ? "બધા દેશ" : "All Countries",
    deadline: lang === "hi" ? "अंतिम तिथि" : lang === "gu" ? "અંતિમ તારીખ" : "Deadline",
    fields:   lang === "hi" ? "क्षेत्र" : lang === "gu" ? "ક્ષેત્ર" : "Fields",
    elig:     lang === "hi" ? "पात्रता" : lang === "gu" ? "પાત્રતા" : "Eligibility",
    docs:     lang === "hi" ? "दस्तावेज़" : lang === "gu" ? "દસ્તાવેજ" : "Documents",
    apply:    lang === "hi" ? "अभी आवेदन करें" : lang === "gu" ? "અરજી કરો" : "Apply Now",
    bond:     lang === "hi" ? "वापसी बॉन्ड" : lang === "gu" ? "પરત બૉન્ડ" : "Return Bond",
    search:   lang === "hi" ? "छात्रवृत्ति खोजें..." : lang === "gu" ? "શિષ્યવૃત્તિ શોધો..." : "Search scholarships...",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="w-full px-6 py-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg,#1a2744 0%,#1e3a6e 100%)" }}>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-none">ScholarHub</p>
            <p className="text-blue-300 text-xs mt-0.5">Student Portal</p>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <StudentSmartSearch />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/student"
            className="inline-flex items-center rounded-xl px-2.5 py-2 text-white transition hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={15} />
          </Link>
          <AdminLangSwitcher /><ThemeToggle /><StudentNotificationBell /><StudentProfileDropdown />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{L.title}</h1>
            <p className="text-sm text-muted-foreground">{L.subtitle}</p>
          </div>
          <span className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            {filtered.length} / {DATA.length}
          </span>
        </div>

        {/* Search + Country filter */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={L.search}
              className="w-full pl-9 pr-9 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-background text-foreground" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCf("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${cf === "all" ? "text-white border-transparent" : "text-gray-500 border-gray-200 bg-white hover:border-purple-300"}`}
              style={cf === "all" ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}>
              🌍 {L.all}
            </button>
            {CTRY.map(c => (
              <button key={c.id} onClick={() => setCf(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${cf === c.id ? "text-white border-transparent" : "text-gray-500 border-gray-200 bg-white hover:border-purple-300"}`}
                style={cf === c.id ? { background: CG[c.id] } : {}}>
                {c.flag} {c.name} ({DATA.filter(s => s.country === c.id).length})
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-card rounded-2xl border border-border">
            <Globe size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No scholarships found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(s => {
              const ctry = CTRY.find(c => c.id === s.country);
              return (
                <div key={s._id} className="rounded-2xl border border-gray-200 overflow-hidden bg-card hover:shadow-md transition-all">
                  {/* Card header */}
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: CG[s.country] }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg flex-shrink-0">{ctry?.flag}</span>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm leading-snug">{getName(s)}</p>
                        <p className="text-white/70 text-xs mt-0.5">by {s.provider}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white flex-shrink-0 ml-2">
                      {s.level}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                        {getAmt(s)}
                      </span>
                      {s.bond !== "No bond" && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {L.bond}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex gap-2">
                        <span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.deadline}</span>
                        <span className="font-medium text-gray-700">{getDl(s)}</span>
                      </div>
                      {s.fields && (
                        <div className="flex gap-2">
                          <span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.fields}</span>
                          <span>{s.fields}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.elig}</span>
                        <span className="line-clamp-2">{getEl(s)}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-semibold text-gray-400 w-24 flex-shrink-0">{L.docs}</span>
                        <span className="text-gray-500 line-clamp-2">{s.documents}</span>
                      </div>
                      {getTip(s) && (
                        <div className="flex gap-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100 mt-1">
                          <span className="text-purple-400 flex-shrink-0">💡</span>
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
  );
}
