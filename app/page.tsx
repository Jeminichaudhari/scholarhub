"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const C = {
  navy:"#0f2044", navyMid:"#1a3360",
  blue:"#1d4ed8", indigo:"#4f46e5",
  cyan:"#0891b2",
  green:"#059669",
  recGreen:"#047857",
};

const T = {
  en: {
    tagline:"Find & Apply for Scholarships",
    studentIncome:"Student Income", totalScholarships:"Total Scholarships", recommended:"Recommended",
    studentProfile:"Student Profile", incomeField:"Annual Income (₹)", categoryField:"Category",
    courseField:"Level of Study", stateField:"State / UT", genderField:"Gender",
    updateProfile:"Find My Scholarships",
    scholarshipsRecommended:"scholarships match your profile",
    searchPlaceholder:"Search scholarships...", allCategories:"All Categories", allCourses:"All Courses",
    school:"School", engineering:"Engineering", medical:"Medical", arts:"Arts",
    commerce:"Commerce", science:"Science", allLevels:"All Types",
    central:"Central Govt", stateLvl:"State Govt", trust:"Trust / NGO",
    scholarships:"Scholarships", showing:"results",
    name:"Scholarship", level:"Type", courseCol:"Course", stateCol:"State", amount:"Amount",
    details:"Details", apply:"Apply",
    noResults:"No scholarships match your filters. Try adjusting your criteria.",
    recommended_badge:"Recommended",
    description:"About this Scholarship", eligibility:"Eligibility Criteria",
    documents:"Documents Required", applyNow:"Apply on Official Site →", howToFill:"▶ Watch Tutorial",
    lastDate:"Last Date", applyModal:"Apply for", lastDateLabel:"Application Deadline",
    stepsTitle:"Steps to Apply",
    steps:["Gather all required documents","Click Apply on Official Site below","Register / Login on portal","Fill personal & academic details","Upload scanned documents","Submit and save your application number"],
    applyOnSite:"Apply on Official Site →", watchVideo:"▶ Watch Tutorial",
    docVault:"My Document Vault", docVaultDesc:"Your documents are saved securely in your browser.",
    docName:"Document Name", docFile:"Upload File", addDocument:"Add Document",
    noDocuments:"No documents yet. Upload Aadhaar, marksheets, caste certificate etc.", remove:"Remove", docAdded:"Document saved!",
    anyOpt:"Any", profile:"My Profile", logout:"Logout",
    genderAny:"Any", genderMale:"Male", genderFemale:"Female",
    navHome:"Home", navScholarships:"Scholarships", navContact:"Contact Us",
    profileModal:"Student Profile",
    contactTitle:"Contact Us", contactSub:"We're here to help you find the right scholarship.",
    contactName:"Your Name", contactEmail:"Your Email", contactMsg:"Your Message", contactSend:"Send Message",
    contactSent:"✅ Message sent! We'll get back to you within 24 hours.",
    helpTitle:"Help & FAQ",
    secureNote:"🔒 Your documents are stored locally in your browser. They are never uploaded to any server.",
    s1:"National Merit Scholarship", s2:"Post Matric Scholarship SC/ST", s3:"Central Sector Scholarship",
    s4:"Pragati Scholarship for Girls", s5:"Saksham Scholarship (Divyang)",
    s7:"Inspire Scholarship (SHE)", s8:"KVPY Fellowship", s9:"NMMS Scholarship",
    s10:"Pre Matric Scholarship (Minorities)", s11:"Post Matric Scholarship (Minorities)",
    s12:"Merit-cum-Means Minority Scholarship", s13:"Maulana Azad National Fellowship",
    s14:"Rajiv Gandhi National Fellowship SC/ST", s15:"Top Class Education for SC",
    s16:"Top Class Education for ST", s17:"Pre Matric Scholarship for ST",
    s18:"Post Matric Scholarship for ST", s19:"NSP OBC Post Matric Scholarship",
    s20:"Begum Hazrat Mahal Scholarship", s21:"National Overseas Scholarship ST",
    s22:"Ambedkar Post-Matric Scholarship", s23:"MYSY Scholarship (Gujarat)",
    s24:"Swarnim Gujarat Scholarship (ST)", s25:"Vanvasi Kalyan Scholarship (Gujarat)",
    s26:"OBC Post-Matric Scholarship (Gujarat)", s27:"EBC Post-Matric Scholarship (Gujarat)",
    s28:"Kanya Kelavani Nidhi (Gujarat)", s29:"Vidhyadhan Scholarship (Gujarat SC)",
    s30:"Minority Post-Matric Scholarship (Gujarat)", s31:"Dr. Ambedkar Merit Scholarship (Gujarat)",
    s32:"Digital Gujarat Scholarship", s33:"Ganshaktiben Scholarship (Gujarat Girls)",
    s37:"Eklavya Model Residential School", s38:"Tata Capital Pankh Scholarship",
    s39:"Sitaram Jindal Foundation Scholarship", s40:"Vidyasaarathi Scholarship",
    s41:"Reliance Foundation Scholarship", s42:"Aditya Birla Scholarship",
  },
  hi: {
    tagline:"छात्रवृत्ति खोजें और आवेदन करें",
    studentIncome:"छात्र की आय", totalScholarships:"कुल छात्रवृत्तियाँ", recommended:"अनुशंसित",
    studentProfile:"छात्र प्रोफ़ाइल", incomeField:"वार्षिक आय (₹)", categoryField:"श्रेणी",
    courseField:"अध्ययन का स्तर", stateField:"राज्य / UT", genderField:"लिंग",
    updateProfile:"मेरी छात्रवृत्तियाँ खोजें",
    scholarshipsRecommended:"छात्रवृत्तियाँ मेल खाती हैं",
    searchPlaceholder:"छात्रवृत्ति खोजें...", allCategories:"सभी श्रेणियाँ", allCourses:"सभी कोर्स",
    school:"स्कूल", engineering:"इंजीनियरिंग", medical:"मेडिकल", arts:"आर्ट्स",
    commerce:"कॉमर्स", science:"साइंस", allLevels:"सभी प्रकार",
    central:"केंद्र सरकार", stateLvl:"राज्य सरकार", trust:"ट्रस्ट / NGO",
    scholarships:"छात्रवृत्तियाँ", showing:"परिणाम",
    name:"छात्रवृत्ति", level:"प्रकार", courseCol:"कोर्स", stateCol:"राज्य", amount:"राशि",
    details:"विवरण", apply:"आवेदन करें",
    noResults:"कोई छात्रवृत्ति नहीं मिली।",
    recommended_badge:"अनुशंसित",
    description:"इस छात्रवृत्ति के बारे में", eligibility:"पात्रता मानदंड",
    documents:"आवश्यक दस्तावेज़", applyNow:"आधिकारिक साइट पर आवेदन करें →", howToFill:"▶ ट्यूटोरियल देखें",
    lastDate:"अंतिम तिथि", applyModal:"आवेदन करें", lastDateLabel:"आवेदन की अंतिम तिथि",
    stepsTitle:"आवेदन के चरण",
    steps:["सभी दस्तावेज़ एकत्र करें","नीचे 'आधिकारिक साइट' पर क्लिक करें","पोर्टल पर रजिस्टर / लॉगिन करें","व्यक्तिगत और शैक्षणिक विवरण भरें","स्कैन किए दस्तावेज़ अपलोड करें","सबमिट करें और आवेदन नंबर नोट करें"],
    applyOnSite:"आधिकारिक साइट पर आवेदन करें →", watchVideo:"▶ ट्यूटोरियल देखें",
    docVault:"मेरा दस्तावेज़ वॉल्ट", docVaultDesc:"आपके दस्तावेज़ ब्राउज़र में सुरक्षित हैं।",
    docName:"दस्तावेज़ का नाम", docFile:"फ़ाइल अपलोड करें", addDocument:"दस्तावेज़ जोड़ें",
    noDocuments:"अभी तक कोई दस्तावेज़ नहीं।", remove:"हटाएं", docAdded:"दस्तावेज़ सहेजा!",
    anyOpt:"कोई भी", profile:"मेरी प्रोफ़ाइल", logout:"लॉगआउट",
    genderAny:"कोई भी", genderMale:"पुरुष", genderFemale:"महिला",
    navHome:"होम", navScholarships:"छात्रवृत्तियाँ", navContact:"संपर्क करें",
    profileModal:"छात्र प्रोफ़ाइल",
    contactTitle:"संपर्क करें", contactSub:"हम आपको सही छात्रवृत्ति खोजने में मदद करेंगे।",
    contactName:"आपका नाम", contactEmail:"आपका ईमेल", contactMsg:"आपका संदेश", contactSend:"संदेश भेजें",
    contactSent:"✅ संदेश भेजा गया!",
    helpTitle:"सहायता और FAQ",
    secureNote:"🔒 आपके दस्तावेज़ localStorage में सुरक्षित हैं।",
    s1:"राष्ट्रीय मेरिट छात्रवृत्ति", s2:"पोस्ट मैट्रिक SC/ST", s3:"केंद्रीय क्षेत्र छात्रवृत्ति",
    s4:"प्रगति छात्रवृत्ति (छात्राएं)", s5:"सक्षम छात्रवृत्ति (दिव्यांग)",
    s7:"इंस्पायर (SHE)", s8:"KVPY फेलोशिप", s9:"NMMS",
    s10:"अल्पसंख्यक प्री-मैट्रिक", s11:"अल्पसंख्यक पोस्ट-मैट्रिक",
    s12:"मेरिट-कम-मीन्स", s13:"मौलाना आज़ाद फेलोशिप",
    s14:"राजीव गांधी फेलोशिप SC/ST", s15:"SC टॉप क्लास",
    s16:"ST टॉप क्लास", s17:"ST प्री-मैट्रिक",
    s18:"ST पोस्ट-मैट्रिक", s19:"NSP OBC",
    s20:"बेगम हज़रत महल", s21:"राष्ट्रीय विदेश ST",
    s22:"अंबेडकर पोस्ट-मैट्रिक", s23:"MYSY (गुजरात)",
    s24:"स्वर्णिम गुजरात ST", s25:"वनवासी कल्याण",
    s26:"OBC (गुजरात)", s27:"EBC (गुजरात)",
    s28:"कन्या केळवणी निधि", s29:"विद्याधन SC",
    s30:"अल्पसंख्यक (गुजरात)", s31:"डॉ. अंबेडकर मेरिट",
    s32:"डिजिटल गुजरात", s33:"गणशक्तिबेन",
    s37:"एकलव्य आवासीय विद्यालय", s38:"टाटा पंख",
    s39:"सीताराम जिंदल", s40:"विद्यासारथी",
    s41:"रिलायंस फाउंडेशन", s42:"आदित्य बिड़ला",
  },
  gu: {
    tagline:"શિષ્યવૃત્તિ શોધો અને અરજી કરો",
    studentIncome:"વિદ્યાર્થીની આવક", totalScholarships:"કુલ શિષ્યવૃત્તિઓ", recommended:"ભલામણ",
    studentProfile:"વિદ્યાર્થી પ્રોફાઇલ", incomeField:"વાર્ષિક આવક (₹)", categoryField:"શ્રેણી",
    courseField:"અભ્યાસ સ્તર", stateField:"રાજ્ય / UT", genderField:"જાતિ",
    updateProfile:"મારી શિષ્યવૃત્તિ શોધો",
    scholarshipsRecommended:"શિષ્યવૃત્તિઓ મળે છે",
    searchPlaceholder:"શિષ્યવૃત્તિ શોધો...", allCategories:"બધી શ્રેણીઓ", allCourses:"બધા કોર્સ",
    school:"શાળા", engineering:"એન્જિનિયરિંગ", medical:"મેડિકલ", arts:"આર્ટ્સ",
    commerce:"કૉમર્સ", science:"સાયન્સ", allLevels:"બધા પ્રકાર",
    central:"કેન્દ્ર સરકાર", stateLvl:"રાજ્ય સરકાર", trust:"ટ્રસ્ટ / NGO",
    scholarships:"શિષ્યવૃત્તિઓ", showing:"પરિણામ",
    name:"શિષ્યવૃત્તિ", level:"પ્રકાર", courseCol:"કોર્સ", stateCol:"રાજ્ય", amount:"રકમ",
    details:"વિગત", apply:"અરજી",
    noResults:"કોઈ શિષ્યવૃત્તિ મળી નહીં.",
    recommended_badge:"ભલામણ",
    description:"આ શિષ્યવૃત્તિ વિશે", eligibility:"પાત્રતા માપદંડ",
    documents:"જરૂરી દસ્તાવેજો", applyNow:"સત્તાવાર સાઇટ પર અરજી →", howToFill:"▶ ટ્યુટોરિયલ જુઓ",
    lastDate:"છેલ્લી તારીખ", applyModal:"અરજી કરો", lastDateLabel:"અરજીની છેલ્લી તારીખ",
    stepsTitle:"અરજી ના પગલાં",
    steps:["બધા દસ્તાવેજ ભેગા કરો","'સત્તાવાર સાઇટ' ક્લિક કરો","પોર્ટલ પર નોંધણી / લૉગિન","વ્યક્તિગત અને શૈક્ષણિક માહિતી ભરો","સ્કૅન દસ્તાવેજ અપલોડ કરો","સબમિટ કરો અને અરજી નંબર નોંધો"],
    applyOnSite:"સત્તાવાર સાઇટ પર અરજી →", watchVideo:"▶ ટ્યુટોરિયલ જુઓ",
    docVault:"મારો દસ્તાવેજ વૉલ્ટ", docVaultDesc:"તમારા દસ્તાવેજ બ્રાઉઝ઼ρ localStorage માં સુરક્ષિત છે.",
    docName:"દસ્તાવેજ નું નામ", docFile:"ફાઇલ અપલોડ", addDocument:"દસ્તાવેજ ઉમેરો",
    noDocuments:"હજુ કોઈ દસ્તાવેજ નથી.", remove:"કાઢો", docAdded:"દસ્તાવેજ સચવાઈ!",
    anyOpt:"કોઈ પણ", profile:"મારી પ્રોફાઇલ", logout:"લૉગઆઉટ",
    genderAny:"કોઈ પણ", genderMale:"પુરુષ", genderFemale:"સ્ત્રી",
    navHome:"હોમ", navScholarships:"શિષ્યવૃત્તિઓ", navContact:"સંપર્ક",
    profileModal:"વિદ્યાર્થી પ્રોફાઇલ",
    contactTitle:"સંપર્ક કરો", contactSub:"અમે તમને સાચી શિષ્યવૃત્તિ શોધવામાં મદદ કરીશું.",
    contactName:"તમારું નામ", contactEmail:"તમારો ઇમેઇલ", contactMsg:"તમારો સંદેશ", contactSend:"સંદેશ મોકલો",
    contactSent:"✅ સંદેશ મોકલ્યો! 24 કલાકમાં જવાબ.",
    helpTitle:"સહાય અને FAQ",
    secureNote:"🔒 તમારા દસ્તાવેજ localStorage માં સુરક્ષિત છે.",
    s1:"રાષ્ટ્રીય મેરિટ", s2:"પોસ્ટ મેટ્રિક SC/ST", s3:"સેન્ટ્રલ સેક્ટર",
    s4:"પ્રગતિ (છોકરીઓ)", s5:"સક્ષમ (દિવ્યાંગ)",
    s7:"ઇન્સ્પાયર (SHE)", s8:"KVPY", s9:"NMMS",
    s10:"લઘુ. પ્રી-મેટ્રિક", s11:"લઘુ. પોસ્ટ-મેટ્રિક",
    s12:"મેરિટ-કમ-મીન્સ", s13:"મૌ. આઝાદ",
    s14:"રા. ગાં. SC/ST", s15:"SC ટોપ ક્લાસ",
    s16:"ST ટોપ ક્લાસ", s17:"ST પ્રી-મેટ્રિક",
    s18:"ST પોસ્ટ-મેટ્રિક", s19:"NSP OBC",
    s20:"બે. હ. મ.", s21:"રા. વ. ST",
    s22:"આં. પો.-મે.", s23:"MYSY (ગુ.)",
    s24:"સ્વ. ગુ. ST", s25:"વ. ક.",
    s26:"OBC (ગુ.)", s27:"EBC (ગુ.)",
    s28:"ક. કે. નિ.", s29:"વ. SC",
    s30:"લ. (ગુ.)", s31:"ડૉ. આ. મ.",
    s32:"ડિ. ગુ.", s33:"ગ. છો.",
    s37:"એ. આ. સ.", s38:"ટા. પ.",
    s39:"સી. જ. ફ.", s40:"વિ. સા.",
    s41:"રિ. ફ.", s42:"આ. બ.",
  },
};
type Lang = "en"|"hi"|"gu";

const SCHOLARSHIPS = [
  // ── CENTRAL GOVT ──
  { id:1,  name:"National Merit Scholarship",              gender:"Any",    category:"OBC",     course:"College", state:"Any",     level:"Central", income:800000,    amount:"₹12,000/yr",           lastDate:"31 March 2026",       applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=National+Merit+Scholarship+form+fill",               description:"Central government scholarship for meritorious OBC students pursuing higher education.",                eligibility:"OBC students with 60%+ in 10+2, annual family income ≤ ₹8 lakh.",                                      documents:"Income certificate, OBC certificate, marksheet, Aadhaar, bank passbook" },
  { id:2,  name:"Post Matric Scholarship SC/ST",           gender:"Any",    category:"SC",      course:"College", state:"Any",     level:"Central", income:250000,    amount:"₹15,000/yr",           lastDate:"15 October 2025",     applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Post+Matric+Scholarship+SC+ST+form+fill",            description:"Ministry of Social Justice scholarship for SC/ST students in post-matric courses.",                      eligibility:"SC/ST students, income ≤ ₹2.5 lakh.",                                                                  documents:"Caste certificate, income certificate, admission letter, Aadhaar, bank passbook" },
  { id:3,  name:"Central Sector Scholarship",              gender:"Any",    category:"General", course:"College", state:"Any",     level:"Central", income:450000,    amount:"₹10,000/yr",           lastDate:"31 October 2025",     applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Central+Sector+Scholarship+form+fill",               description:"For top 20 percentile of Class 12 students pursuing undergraduate studies.",                            eligibility:"Top 20 percentile in board, income ≤ ₹4.5 lakh.",                                                      documents:"Board marksheet, income certificate, Aadhaar, bank passbook, institution certificate" },
  { id:4,  name:"Pragati Scholarship for Girls",           gender:"Female", category:"General", course:"College", state:"Any",     level:"Central", income:800000,    amount:"₹50,000/yr",           lastDate:"30 November 2025",    applyLink:"https://www.aicte-india.org",                  youtubeLink:"https://youtube.com/results?search_query=Pragati+Scholarship+AICTE+form+fill",                description:"AICTE scholarship for girl students in technical education.",                                            eligibility:"Girl students in AICTE-approved programs, income ≤ ₹8 lakh.",                                          documents:"Income certificate, admission letter, Aadhaar, bank passbook, institute certificate" },
  { id:5,  name:"Saksham Scholarship (Divyang)",           gender:"Any",    category:"General", course:"College", state:"Any",     level:"Central", income:800000,    amount:"₹50,000/yr",           lastDate:"30 November 2025",    applyLink:"https://www.aicte-india.org",                  youtubeLink:"https://youtube.com/results?search_query=Saksham+Scholarship+AICTE+form+fill",                description:"AICTE scholarship for specially-abled students in technical education.",                                 eligibility:"Divyang students (40%+ disability) in AICTE programs, income ≤ ₹8 lakh.",                              documents:"Disability certificate, income certificate, Aadhaar, marksheet, bank passbook" },
  { id:7,  name:"Inspire Scholarship (SHE)",               gender:"Any",    category:"General", course:"College", state:"Any",     level:"Central", income:999999999, amount:"₹80,000/yr",           lastDate:"30 November 2025",    applyLink:"https://online-inspire.gov.in",                youtubeLink:"https://youtube.com/results?search_query=INSPIRE+SHE+Scholarship+form+fill",                  description:"DST scholarship for top students pursuing B.Sc/M.Sc in basic sciences.",                               eligibility:"Top 1% in Class 12 or KVPY/JEE/NEET holders, B.Sc/M.Sc.",                                              documents:"Board marksheet, rank proof, admission letter, Aadhaar, bank passbook" },
  { id:8,  name:"KVPY Fellowship",                         gender:"Any",    category:"General", course:"College", state:"Any",     level:"Central", income:999999999, amount:"₹5,000–7,000/mo",      lastDate:"Check official site", applyLink:"https://kvpy.iisc.ac.in",                     youtubeLink:"https://youtube.com/results?search_query=KVPY+Scholarship+form+fill",                         description:"IISc fellowship for students pursuing research in basic science.",                                      eligibility:"Class 11 to 1st year B.Sc, appear in aptitude test.",                                                   documents:"Marksheet, admission letter, Aadhaar, bank passbook" },
  { id:9,  name:"NMMS Scholarship",                        gender:"Any",    category:"General", course:"School",  state:"Any",     level:"Central", income:150000,    amount:"₹12,000/yr",           lastDate:"Check state portal",  applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=NMMS+Scholarship+form+fill",                         description:"National Means-cum-Merit for Class 9–12 from economically weaker sections.",                            eligibility:"Class 8 pass, 55%+ marks, income ≤ ₹1.5 lakh, qualify state exam.",                                    documents:"Class 8 marksheet, income certificate, Aadhaar, bank passbook" },
  { id:10, name:"Pre Matric Scholarship (Minorities)",     gender:"Any",    category:"Minority",course:"School",  state:"Any",     level:"Central", income:100000,    amount:"₹10,000/yr",           lastDate:"15 September 2025",   applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Pre+Matric+Minority+Scholarship+form+fill",          description:"Central scholarship for minority students in Class 1 to 10.",                                           eligibility:"Minority, class 1–10, 50%+ marks, income ≤ ₹1 lakh.",                                                  documents:"Minority certificate, income certificate, marksheet, Aadhaar" },
  { id:11, name:"Post Matric Scholarship (Minorities)",    gender:"Any",    category:"Minority",course:"College", state:"Any",     level:"Central", income:200000,    amount:"₹12,000/yr",           lastDate:"15 October 2025",     applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Post+Matric+Minority+Scholarship+form+fill",         description:"Central scholarship for minority post-matric students.",                                                 eligibility:"Minority, post-matric, 50%+, income ≤ ₹2 lakh.",                                                       documents:"Minority certificate, income certificate, admission proof, Aadhaar, bank passbook" },
  { id:12, name:"Merit-cum-Means Minority Scholarship",    gender:"Any",    category:"Minority",course:"College", state:"Any",     level:"Central", income:250000,    amount:"₹20,000/yr",           lastDate:"31 October 2025",     applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Merit+cum+Means+Minority+Scholarship+form+fill",     description:"For minority students in technical/professional courses.",                                               eligibility:"Minority, 50%+ in previous exam, income ≤ ₹2.5 lakh.",                                                 documents:"Minority certificate, income certificate, marksheet, admission letter, Aadhaar, bank passbook" },
  { id:13, name:"Maulana Azad National Fellowship",        gender:"Any",    category:"Minority",course:"College", state:"Any",     level:"Central", income:999999999, amount:"₹25,000–28,000/mo",    lastDate:"Check official site", applyLink:"https://maef.net.in",                          youtubeLink:"https://youtube.com/results?search_query=Maulana+Azad+National+Fellowship+form+fill",          description:"Fellowship for minority students pursuing M.Phil/Ph.D.",                                                eligibility:"Minority students admitted to M.Phil/Ph.D, UGC NET qualified.",                                         documents:"NET scorecard, admission letter, minority certificate, Aadhaar, bank passbook" },
  { id:14, name:"Rajiv Gandhi National Fellowship SC/ST",  gender:"Any",    category:"SC",      course:"College", state:"Any",     level:"Central", income:999999999, amount:"₹25,000–28,000/mo",    lastDate:"Check official site", applyLink:"https://ugc.ac.in",                            youtubeLink:"https://youtube.com/results?search_query=Rajiv+Gandhi+National+Fellowship+SC+ST",              description:"UGC fellowship for SC/ST students pursuing M.Phil/Ph.D research.",                                      eligibility:"SC/ST students admitted to M.Phil/Ph.D program.",                                                       documents:"Caste certificate, admission letter, Aadhaar, bank passbook, PhD enrollment proof" },
  { id:15, name:"Top Class Education for SC",              gender:"Any",    category:"SC",      course:"College", state:"Any",     level:"Central", income:600000,    amount:"Full tuition + ₹2,220/mo", lastDate:"Check official site", applyLink:"https://scholarships.gov.in",              youtubeLink:"https://youtube.com/results?search_query=Top+Class+Education+SC+Scholarship",                  description:"For SC students admitted to top notified institutions.",                                                eligibility:"SC students in notified top institutes, income ≤ ₹6 lakh.",                                             documents:"SC certificate, income certificate, admission letter, Aadhaar, bank passbook" },
  { id:16, name:"Top Class Education for ST",              gender:"Any",    category:"ST",      course:"College", state:"Any",     level:"Central", income:600000,    amount:"Full tuition + ₹2,220/mo", lastDate:"Check official site", applyLink:"https://scholarships.gov.in",              youtubeLink:"https://youtube.com/results?search_query=Top+Class+Education+ST+Scholarship",                  description:"For ST students admitted to top notified institutions.",                                                eligibility:"ST students in notified top institutes, income ≤ ₹6 lakh.",                                             documents:"ST certificate, income certificate, admission letter, Aadhaar, bank passbook" },
  { id:17, name:"Pre Matric Scholarship for ST",           gender:"Any",    category:"ST",      course:"School",  state:"Any",     level:"Central", income:200000,    amount:"₹150–350/mo",          lastDate:"30 September 2025",   applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Pre+Matric+ST+Scholarship+form+fill",                description:"For ST students studying in Class 9–10.",                                                               eligibility:"ST students in Class 9 or 10, income ≤ ₹2 lakh.",                                                      documents:"ST certificate, income certificate, school enrollment proof, Aadhaar" },
  { id:18, name:"Post Matric Scholarship for ST",          gender:"Any",    category:"ST",      course:"College", state:"Any",     level:"Central", income:250000,    amount:"₹15,000/yr",           lastDate:"15 October 2025",     applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Post+Matric+ST+Scholarship+form+fill",               description:"For ST students in post-matric (Class 11 onwards) courses.",                                            eligibility:"ST students, post-matric, income ≤ ₹2.5 lakh.",                                                        documents:"ST certificate, income certificate, admission proof, Aadhaar, bank passbook" },
  { id:19, name:"NSP OBC Post Matric Scholarship",         gender:"Any",    category:"OBC",     course:"College", state:"Any",     level:"Central", income:100000,    amount:"₹10,000/yr",           lastDate:"31 October 2025",     applyLink:"https://scholarships.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=NSP+OBC+Post+Matric+Scholarship+form+fill",           description:"National Scholarship Portal scholarship for OBC post-matric students.",                                  eligibility:"OBC students, post-matric, income ≤ ₹1 lakh.",                                                         documents:"OBC certificate, income certificate, admission proof, Aadhaar, bank passbook" },
  { id:20, name:"Begum Hazrat Mahal Scholarship",          gender:"Female", category:"Minority",course:"School",  state:"Any",     level:"Central", income:200000,    amount:"₹5,000–6,000/yr",      lastDate:"30 September 2025",   applyLink:"https://maef.net.in",                          youtubeLink:"https://youtube.com/results?search_query=Begum+Hazrat+Mahal+Scholarship+form+fill",             description:"For meritorious minority girl students studying in Class 9–12.",                                        eligibility:"Minority girls, Class 9–12, 50%+ marks, income ≤ ₹2 lakh.",                                            documents:"Minority certificate, income certificate, marksheet, Aadhaar, bank passbook" },
  { id:21, name:"National Overseas Scholarship ST",        gender:"Any",    category:"ST",      course:"College", state:"Any",     level:"Central", income:600000,    amount:"Full overseas expenses", lastDate:"Check official site", applyLink:"https://tribal.nic.in",                       youtubeLink:"https://youtube.com/results?search_query=National+Overseas+Scholarship+ST+form+fill",          description:"For ST students pursuing Masters/PhD abroad.",                                                          eligibility:"ST students selected for Masters/PhD in foreign universities, income ≤ ₹6 lakh.",                      documents:"ST certificate, income certificate, foreign university admission letter, Aadhaar, passport" },

  // ── GUJARAT STATE GOVT ──
  { id:22, name:"Ambedkar Post-Matric Scholarship",        gender:"Any",    category:"SC",      course:"College", state:"Gujarat", level:"State",   income:250000,    amount:"₹10,000–20,000/yr",    lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=Ambedkar+Scholarship+Gujarat+form+fill",             description:"Gujarat state scholarship for SC students in post-matric courses.",                                     eligibility:"SC domicile of Gujarat, post-matric, income ≤ ₹2.5 lakh.",                                             documents:"SC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar" },
  { id:23, name:"MYSY Scholarship (Gujarat)",              gender:"Any",    category:"General", course:"College", state:"Gujarat", level:"State",   income:600000,    amount:"₹10,000–50,000/yr",    lastDate:"30 September 2025",   applyLink:"https://mysy.guj.nic.in",                     youtubeLink:"https://youtube.com/results?search_query=MYSY+Scholarship+Gujarat+form+fill",                 description:"Mukhyamantri Yuva Swavalamban Yojana for meritorious Gujarat students.",                                eligibility:"Gujarat domicile, 80%+ in Class 10/12, income ≤ ₹6 lakh.",                                             documents:"Gujarat domicile, income certificate, marksheet, Aadhaar, admission letter" },
  { id:24, name:"Swarnim Gujarat Scholarship (ST)",        gender:"Any",    category:"ST",      course:"College", state:"Gujarat", level:"State",   income:250000,    amount:"₹15,000–25,000/yr",    lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=Swarnim+Gujarat+ST+Scholarship+form+fill",            description:"Gujarat state scholarship for ST students in higher education.",                                        eligibility:"ST domicile of Gujarat, post-matric, income ≤ ₹2.5 lakh.",                                             documents:"ST certificate, Gujarat domicile, income certificate, marksheet, Aadhaar, bank passbook" },
  { id:25, name:"Vanvasi Kalyan Scholarship (Gujarat)",    gender:"Any",    category:"ST",      course:"School",  state:"Gujarat", level:"State",   income:200000,    amount:"₹5,000–10,000/yr",     lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=Vanvasi+Kalyan+Scholarship+Gujarat",                 description:"Gujarat tribal welfare scholarship for ST students in school.",                                         eligibility:"ST students in school, Gujarat domicile, income ≤ ₹2 lakh.",                                           documents:"ST certificate, Gujarat domicile, school enrollment, income certificate, Aadhaar" },
  { id:26, name:"OBC Post-Matric Scholarship (Gujarat)",   gender:"Any",    category:"OBC",     course:"College", state:"Gujarat", level:"State",   income:150000,    amount:"₹10,000–15,000/yr",    lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=OBC+Post+Matric+Scholarship+Gujarat+form+fill",       description:"Gujarat state OBC post-matric scholarship.",                                                            eligibility:"OBC domicile of Gujarat, post-matric, income ≤ ₹1.5 lakh.",                                            documents:"OBC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar, bank passbook" },
  { id:27, name:"EBC Post-Matric Scholarship (Gujarat)",   gender:"Any",    category:"General", course:"College", state:"Gujarat", level:"State",   income:100000,    amount:"₹5,000–10,000/yr",     lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=EBC+Post+Matric+Scholarship+Gujarat+form+fill",       description:"For Economically Backward Class students in Gujarat.",                                                  eligibility:"EBC domicile of Gujarat, post-matric, income ≤ ₹1 lakh.",                                              documents:"EBC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar, bank passbook" },
  { id:28, name:"Kanya Kelavani Nidhi (Gujarat)",          gender:"Female", category:"General", course:"School",  state:"Gujarat", level:"State",   income:999999999, amount:"Free education support", lastDate:"Check official site", applyLink:"https://www.gujarat.gov.in",                  youtubeLink:"https://youtube.com/results?search_query=Kanya+Kelavani+Nidhi+Gujarat",                       description:"Gujarat government initiative for girl child education support.",                                        eligibility:"Girl students in Gujarat schools, especially rural areas.",                                              documents:"School enrollment, Gujarat domicile, Aadhaar, birth certificate" },
  { id:29, name:"Vidhyadhan Scholarship (Gujarat SC)",     gender:"Any",    category:"SC",      course:"College", state:"Gujarat", level:"State",   income:300000,    amount:"₹10,000–20,000/yr",    lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=Vidhyadhan+Scholarship+Gujarat+SC",                  description:"Gujarat scholarship for SC students in higher education.",                                              eligibility:"SC students, Gujarat domicile, post-matric, income ≤ ₹3 lakh.",                                        documents:"SC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar, bank passbook" },
  { id:30, name:"Minority Post-Matric Scholarship (Gujarat)", gender:"Any", category:"Minority",course:"College", state:"Gujarat", level:"State",   income:200000,    amount:"₹10,000–15,000/yr",    lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=Minority+Post+Matric+Scholarship+Gujarat",            description:"Gujarat state scholarship for minority post-matric students.",                                          eligibility:"Minority domicile of Gujarat, post-matric, income ≤ ₹2 lakh.",                                         documents:"Minority certificate, Gujarat domicile, income certificate, marksheet, Aadhaar, bank passbook" },
  { id:31, name:"Dr. Ambedkar Merit Scholarship (Gujarat)", gender:"Any",   category:"SC",      course:"College", state:"Gujarat", level:"State",   income:999999999, amount:"₹10,000–25,000/yr",    lastDate:"30 September 2025",   applyLink:"https://esamajkalyan.gujarat.gov.in",          youtubeLink:"https://youtube.com/results?search_query=Dr+Ambedkar+Merit+Scholarship+Gujarat",               description:"Merit-based scholarship for SC students in Gujarat.",                                                   eligibility:"SC students with 60%+ marks, Gujarat domicile.",                                                        documents:"SC certificate, Gujarat domicile, marksheet, Aadhaar, bank passbook, admission letter" },
  { id:32, name:"Digital Gujarat Scholarship",             gender:"Any",    category:"General", course:"College", state:"Gujarat", level:"State",   income:600000,    amount:"₹5,000–25,000/yr",     lastDate:"31 October 2025",     applyLink:"https://digitalgujarat.gov.in",                youtubeLink:"https://youtube.com/results?search_query=Digital+Gujarat+Scholarship+form+fill",              description:"Gujarat government online scholarship portal for SC/ST/OBC/EBC/Minority students.",                    eligibility:"Gujarat domicile, SC/ST/OBC/EBC/Minority, college enrolled, income ≤ ₹6 lakh.",                       documents:"Gujarat domicile, category certificate, income certificate, marksheet, Aadhaar, bank passbook, admission letter" },
  { id:33, name:"Ganshaktiben Scholarship (Gujarat Girls)", gender:"Female", category:"General", course:"College", state:"Gujarat", level:"State",   income:600000,    amount:"₹10,000–20,000/yr",    lastDate:"30 September 2025",   applyLink:"https://digitalgujarat.gov.in",                youtubeLink:"https://youtube.com/results?search_query=Ganshaktiben+Scholarship+Gujarat+Girls",              description:"Gujarat state scholarship for girl students in higher education.",                                      eligibility:"Girl students, Gujarat domicile, post-matric, income ≤ ₹6 lakh.",                                      documents:"Gujarat domicile, income certificate, marksheet, Aadhaar, bank passbook, admission letter" },
  { id:37, name:"Eklavya Model Residential School",        gender:"Any",    category:"ST",      course:"School",  state:"Gujarat", level:"State",   income:999999999, amount:"Free residential schooling", lastDate:"Check official site", applyLink:"https://tribal.nic.in",                    youtubeLink:"https://youtube.com/results?search_query=Eklavya+Model+Residential+School+admission",         description:"Free quality residential schooling for ST students in tribal areas.",                                   eligibility:"ST students in Class 6–12 in tribal areas of Gujarat.",                                                documents:"ST certificate, Gujarat domicile, birth certificate, Aadhaar, school transfer certificate" },

  // ── TRUST / NGO ──
  { id:38, name:"Tata Capital Pankh Scholarship",          gender:"Any",    category:"General", course:"College", state:"Any",     level:"Trust",   income:400000,    amount:"₹12,000/yr",           lastDate:"31 July 2025",        applyLink:"https://www.buddy4study.com/tata-capital-pankh-scholarship", youtubeLink:"https://youtube.com/results?search_query=Tata+Capital+Pankh+Scholarship+form+fill",  description:"Tata Capital scholarship for Class 11–graduation students from low-income families.",                  eligibility:"Class 11–graduation, 60%+ marks, income ≤ ₹4 lakh.",                                                  documents:"Income certificate, marksheet, admission proof, Aadhaar, bank passbook" },
  { id:39, name:"Sitaram Jindal Foundation Scholarship",   gender:"Any",    category:"General", course:"College", state:"Any",     level:"Trust",   income:250000,    amount:"₹1,000–2,000/mo",      lastDate:"30 April 2026",       applyLink:"https://sitaramjindalfoundation.org",          youtubeLink:"https://youtube.com/results?search_query=Sitaram+Jindal+Foundation+Scholarship+form+fill",    description:"Monthly scholarship for meritorious poor students in diploma/graduation.",                               eligibility:"Diploma/degree students, 55%+ marks, income ≤ ₹2.5 lakh.",                                             documents:"Income certificate, marksheet, admission proof, Aadhaar, bank passbook, photo" },
  { id:40, name:"Vidyasaarathi Scholarship",               gender:"Any",    category:"General", course:"College", state:"Any",     level:"Trust",   income:600000,    amount:"₹10,000–50,000/yr",    lastDate:"Check official site", applyLink:"https://www.vidyasaarathi.co.in",              youtubeLink:"https://youtube.com/results?search_query=Vidyasaarathi+Scholarship+form+fill",                description:"NSE Foundation scholarship platform for engineering/medical/law students.",                              eligibility:"Engineering/medical/law students, merit-cum-means basis, income ≤ ₹6 lakh.",                           documents:"Income certificate, marksheet, admission letter, Aadhaar, bank passbook" },
  { id:41, name:"Reliance Foundation Scholarship",         gender:"Any",    category:"General", course:"College", state:"Any",     level:"Trust",   income:600000,    amount:"Up to ₹4 lakh",        lastDate:"Check official site", applyLink:"https://reliancefoundation.org/scholarships",  youtubeLink:"https://youtube.com/results?search_query=Reliance+Foundation+Scholarship+form+fill",          description:"Reliance Foundation merit-cum-means scholarship for UG students.",                                      eligibility:"1st year UG, 60%+ in Class 12, income ≤ ₹6 lakh.",                                                    documents:"Income certificate, Class 12 marksheet, admission letter, Aadhaar, bank passbook" },
  { id:42, name:"Aditya Birla Scholarship",                gender:"Any",    category:"General", course:"College", state:"Any",     level:"Trust",   income:999999999, amount:"₹65,000/yr",           lastDate:"Check official site", applyLink:"https://www.adityabirlascholars.net",          youtubeLink:"https://youtube.com/results?search_query=Aditya+Birla+Scholarship+form+fill",                 description:"Prestigious merit-based scholarship for students in top colleges.",                                     eligibility:"Admitted to select top institutions, merit-based selection.",                                            documents:"Admission letter, Class 12 marksheet, Aadhaar, bank passbook" },
];

const CATEGORY_OPTIONS = ["All Categories","SC","ST","OBC","General","Minority"];
const CAST_OPTIONS     = ["SC","ST","OBC","General","Minority"];
const LEVEL_OPTIONS    = ["All Levels","Central","State","Trust"];
const STATES = ["Any","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"];

function toCourseKey(c:string):string { if(c==="Any") return "Any"; if(c==="School") return "School"; return "College"; }

interface Scholarship{id:number;name:string;gender:string;category:string;course:string;state:string;level:string;income:number;amount:string;lastDate:string;applyLink:string;youtubeLink:string;description:string;eligibility:string;documents:string;}
interface Profile{income:string;category:string;course:string;state:string;gender:string;}
interface DocEntry{id:string;name:string;fileName:string;dataUrl:string;}

function isRecommended(s:Scholarship,p:Profile|null):boolean{
  if(!p) return false;
  const inc=parseInt(p.income)||0;
  const gm=s.gender==="Any"||p.gender==="Any"||s.gender===p.gender;
  const ck=toCourseKey(p.course);
  return gm&&(inc===0||s.income>=inc)&&(s.category==="General"||s.category===p.category||p.category==="General")&&(ck==="Any"||s.course==="Any"||s.course===ck)&&(!p.state||p.state==="Any"||s.state==="Any"||s.state===p.state);
}
function catBadge(c:string){const m:Record<string,string>={SC:"bg-sky-50 text-sky-700 ring-1 ring-sky-200",ST:"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",OBC:"bg-orange-50 text-orange-700 ring-1 ring-orange-200",Minority:"bg-pink-50 text-pink-700 ring-1 ring-pink-200",General:"bg-slate-50 text-slate-600 ring-1 ring-slate-200"};return m[c]||"bg-gray-50 text-gray-600 ring-1 ring-gray-200";}
function lvlBadge(l:string){if(l==="Central")return"bg-blue-50 text-blue-700 ring-1 ring-blue-200";if(l==="State")return"bg-teal-50 text-teal-700 ring-1 ring-teal-200";return"bg-violet-50 text-violet-700 ring-1 ring-violet-200";}

export default function ScholarshipPage(){
  const { data: session } = useSession();
  const[lang,setLang]=useState<Lang>("en");
  const t=T[lang];
  const[langOpen,setLangOpen]=useState(false);
  const langRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    function handler(e:MouseEvent){ if(langRef.current&&!langRef.current.contains(e.target as Node)) setLangOpen(false); }
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  },[]);
  const[activeNav,setActiveNav]=useState<"home"|"scholarships"|"contact"|"help">("home");
  const[profile,setProfile]=useState<Profile>({income:"",category:"SC",course:"Any",state:"Any",gender:"Any"});
  const[savedProfile,setSavedProfile]=useState<Profile|null>(null);
  const[showResults,setShowResults]=useState(false);
  const[showProfile,setShowProfile]=useState(false);
  const[searchName,setSearchName]=useState("");
  const[searchCategory,setSearchCategory]=useState("All Categories");
  const[searchCourse,setSearchCourse]=useState("Any");
  const[searchLevel,setSearchLevel]=useState("All Levels");
  const[searchGender,setSearchGender]=useState("Any");
  const[searchState,setSearchState]=useState("Any");
  const[detailS,setDetailS]=useState<Scholarship|null>(null);
  const[applyS,setApplyS]=useState<Scholarship|null>(null);
  const[docs,setDocs]=useState<DocEntry[]>([]);
  const[docName,setDocName]=useState("");
  const[docToast,setDocToast]=useState(false);
  const[contactForm,setContactForm]=useState({name:"",email:"",msg:""});
  const[contactSent,setContactSent]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    try{
      const sp=localStorage.getItem("sh_profile"); if(sp) setSavedProfile(JSON.parse(sp));
      const pf=localStorage.getItem("sh_profileForm"); if(pf) setProfile(JSON.parse(pf));
      const dc=localStorage.getItem("sh_docs"); if(dc) setDocs(JSON.parse(dc));
      const lg=localStorage.getItem("sh_lang"); if(lg) setLang(lg as Lang);
    }catch{}
  },[]);
  useEffect(()=>{try{localStorage.setItem("sh_profileForm",JSON.stringify(profile));}catch{}},[profile]);
  useEffect(()=>{try{if(savedProfile)localStorage.setItem("sh_profile",JSON.stringify(savedProfile));}catch{}},[savedProfile]);
  useEffect(()=>{try{localStorage.setItem("sh_docs",JSON.stringify(docs));}catch{}},[docs]);
  useEffect(()=>{try{localStorage.setItem("sh_lang",lang);}catch{}},[lang]);

  const sName=(s:Scholarship)=>(t as Record<string,string>)[`s${s.id}`]||s.name;
  const recCount=SCHOLARSHIPS.filter(s=>isRecommended(s,savedProfile)).length;
  const hasFilters=searchCategory!=="All Categories"||searchCourse!=="Any"||searchGender!=="Any"||searchLevel!=="All Levels"||searchState!=="Any"||!!searchName;
  const clearFilters=()=>{setSearchCategory("All Categories");setSearchCourse("Any");setSearchGender("Any");setSearchLevel("All Levels");setSearchState("Any");setSearchName("");};

  const displayed=SCHOLARSHIPS
    .filter(s=>{
      const nm=sName(s).toLowerCase().includes(searchName.toLowerCase())||s.name.toLowerCase().includes(searchName.toLowerCase());
      const cat=searchCategory==="All Categories"||s.category===searchCategory;
      const ck=toCourseKey(searchCourse);
      const crs=ck==="Any"||s.course==="Any"||s.course===ck;
      const lvl=searchLevel==="All Levels"||s.level===searchLevel;
      const gdr=searchGender==="Any"||s.gender==="Any"||s.gender===searchGender;
      const st=searchState==="Any"||s.state==="Any"||s.state===searchState;
      return nm&&cat&&crs&&lvl&&gdr&&st;
    })
    .sort((a,b)=>(isRecommended(b,savedProfile)?1:0)-(isRecommended(a,savedProfile)?1:0));

  function handleDocAdd(){
    const file=fileRef.current?.files?.[0];
    if(!file||!docName.trim()) return;
    const reader=new FileReader();
    reader.onload=(e)=>{
      const newDoc={id:Date.now().toString(),name:docName.trim(),fileName:file.name,dataUrl:e.target?.result as string};
      setDocs(prev=>[...prev,newDoc]);
      setDocName(""); if(fileRef.current) fileRef.current.value="";
      setDocToast(true); setTimeout(()=>setDocToast(false),2500);
    };
    reader.readAsDataURL(file);
  }

  const sl="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";
  const il="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";
  const courseLabel=(c:string)=>c==="Any"?t.anyOpt:c==="School"?t.school:c==="Engineering"?t.engineering:c==="Medical"?t.medical:c==="Arts"?t.arts:c==="Commerce"?t.commerce:c==="Science"?t.science:c;

  return(
    <div className="min-h-screen bg-slate-50" style={{fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* ══ NAVBAR — Admin style dark navy ══ */}
      <header className="sticky top-0 z-40 w-full" style={{background:"linear-gradient(135deg,#0f2044 0%,#1a3360 100%)"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-3">

            {/* Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:"rgba(255,255,255,0.12)"}}>
                <span className="text-lg">🎓</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-white leading-none text-sm">ScholarHub</p>
                <p className="text-blue-300 text-[10px] leading-none mt-0.5 font-medium tracking-wide uppercase">{t.tagline}</p>
              </div>
              <p className="sm:hidden font-bold text-white text-sm">ScholarHub</p>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1 ml-2">
              {(["home","scholarships","contact","help"] as const).map(k=>{
                const labels:{[key:string]:string}={home:t.navHome,scholarships:t.navScholarships,contact:t.navContact,help:"Help"};
                const active=activeNav===k;
                return(
                  <button key={k} onClick={()=>setActiveNav(k)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${active?"text-white shadow-sm":"text-blue-200 hover:text-white hover:bg-white/10"}`}
                    style={active?{background:"rgba(255,255,255,0.18)"}:{}}>
                    {labels[k]}
                  </button>
                );
              })}
            </nav>

            {/* Search */}
            <div className="flex-1 mx-2 hidden lg:flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all"
              style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)"}}>
              <svg className="w-4 h-4 text-blue-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input value={searchName} onChange={e=>setSearchName(e.target.value)} placeholder={t.searchPlaceholder}
                className="bg-transparent outline-none text-sm text-white placeholder-blue-300 w-full"/>
              {searchName&&<button onClick={()=>setSearchName("")} className="text-blue-300 hover:text-white text-xs">✕</button>}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 ml-auto">

              {/* Language dropdown */}
              <div className="relative flex-shrink-0" ref={langRef}>
                <button onClick={()=>setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-80"
                  style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.18)"}}>
                  <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
                  <span>{lang==="en"?"English":lang==="hi"?"हिन्दी":"ગુજરાતી"}</span>
                  <svg className={`w-3.5 h-3.5 text-blue-300 transition-transform ${langOpen?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                {langOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                    {([["en","English","English"],["hi","हिन्दी","Hindi"],["gu","ગુજરાતી","Gujarati"]] as [Lang,string,string][]).map(([code,native,label])=>(
                      <button key={code} onClick={()=>{setLang(code);setLangOpen(false);localStorage.setItem("sh_lang",code);}}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${lang===code?"text-blue-600 font-semibold bg-blue-50/60":"text-gray-700"}`}>
                        <div className="text-left flex-1">
                          <p className="font-semibold leading-none">{native}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                        </div>
                        {lang===code && <span className="text-blue-500 text-xs font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Session buttons */}
              {session ? (
                <>
                  <button onClick={()=>setShowProfile(true)}
                    className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:opacity-80"
                    style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.18)"}}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{background:"linear-gradient(135deg,#1e6fff,#2563eb)"}}>
                      {session.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{session.user?.name?.split(" ")[0]}</span>
                  </button>
                  <button onClick={()=>signOut({callbackUrl:"/login"})}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:opacity-80"
                    style={{background:"rgba(239,68,68,0.25)",border:"1px solid rgba(239,68,68,0.4)"}}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    <span className="hidden sm:inline">{t.logout}</span>
                  </button>
                </>
              ) : (
                <Link href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl transition hover:opacity-90 flex-shrink-0"
                  style={{background:"linear-gradient(135deg,#1e6fff,#2563eb)"}}>
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile search */}
          <div className="lg:hidden pb-3">
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 transition-all"
              style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)"}}>
              <svg className="w-4 h-4 text-blue-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input value={searchName} onChange={e=>setSearchName(e.target.value)} placeholder={t.searchPlaceholder}
                className="bg-transparent outline-none text-sm text-white placeholder-blue-300 w-full"/>
            </div>
          </div>
        </div>
      </header>

      {/* ══ CONTACT PAGE ══ */}
      {activeNav==="contact"&&(
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button onClick={()=>setActiveNav("home")}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 mb-6 transition-colors">
            ← Back to Home
          </button>
          <div className="bg-white rounded-2xl border border-slate-200 p-8" style={{boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{t.contactTitle}</h2>
            <p className="text-sm text-slate-400 mb-6">{t.contactSub}</p>
            {contactSent?(
              <div className="text-center py-10 text-emerald-600 font-semibold text-base">{t.contactSent}</div>
            ):(
              <div className="space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t.contactName}</label><input value={contactForm.name} onChange={e=>setContactForm({...contactForm,name:e.target.value})} className={il} placeholder="Your name"/></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t.contactEmail}</label><input type="email" value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} className={il} placeholder="your@email.com"/></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t.contactMsg}</label><textarea value={contactForm.msg} onChange={e=>setContactForm({...contactForm,msg:e.target.value})} rows={5} className={`${il} resize-none`} placeholder="How can we help you?"/></div>
                <button onClick={()=>setContactSent(true)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{background:`linear-gradient(135deg,${C.blue},${C.indigo})`}}>{t.contactSend}</button>
              </div>
            )}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4 text-center text-xs text-slate-500">
              {[["📧","Email","support@scholarhub.in"],["📞","Phone","1800-XXX-XXXX"],["⏰","Hours","Mon–Sat 9am–6pm"]].map(([e,l,v])=>(<div key={l}><div className="text-xl mb-1">{e}</div><div className="font-bold text-slate-700">{l}</div><div>{v}</div></div>))}
            </div>
          </div>
        </div>
      )}

      {/* ══ HELP PAGE ══ */}
      {activeNav==="help"&&(
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button onClick={()=>setActiveNav("home")}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 mb-6 transition-colors">
            ← Back to Home
          </button>
          <div className="bg-white rounded-2xl border border-slate-200 p-8" style={{boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t.helpTitle}</h2>
            {[
              ["How does scholarship recommendation work?","Set your profile with income, category, course, gender and state. The system automatically matches and sorts scholarships that fit your profile to the top."],
              ["Are my documents safe?",t.secureNote],
              ["How do I apply for a scholarship?","Click the green 'Apply' button on any scholarship row. This opens the apply modal with step-by-step instructions and a direct link to the official portal."],
              ["What documents do I need?","Click 'Details' on any scholarship to see the exact list of required documents."],
              ["Can I use this in Hindi or Gujarati?","Yes! Use the EN / हिं / ગુ switcher in the top navbar."],
            ].map(([q,a],i)=>(
              <div key={i} className="mb-5 pb-5 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0">
                <p className="font-bold text-slate-800 text-sm mb-1.5">{q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{a as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ══ */}
      {(activeNav==="home"||activeNav==="scholarships")&&(<>

        {/* Stat Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {emoji:"💰",label:t.studentIncome,value:savedProfile?.income?`₹${parseInt(savedProfile.income).toLocaleString("en-IN")}`:"—",from:"#0f2044",to:"#1a3360",glow:"rgba(15,32,68,0.2)"},
              {emoji:"🎓",label:t.totalScholarships,value:String(SCHOLARSHIPS.length),from:"#1d4ed8",to:"#4f46e5",glow:"rgba(29,78,216,0.2)"},
              {emoji:"⭐",label:t.recommended,value:String(recCount),from:"#b45309",to:"#d97706",glow:"rgba(180,83,9,0.2)"},
            ].map(({emoji,label,value,from,to,glow})=>(
              <div key={label} className="rounded-2xl p-5 flex items-center gap-4" style={{background:`linear-gradient(135deg,${from},${to})`,boxShadow:`0 4px 20px ${glow}`}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:"rgba(255,255,255,0.15)"}}>{emoji}</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{color:"rgba(255,255,255,0.65)"}}>{label}</p>
                  <p className="text-3xl font-bold text-white leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Profile Form */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{background:"linear-gradient(to right,#f8fafc,#f1f5f9)"}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:`linear-gradient(135deg,${C.blue},${C.indigo})`}}>
                <span className="text-white text-sm">👤</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">{t.studentProfile}</h2>
                {session?.user?.name && (
                  <p className="text-xs text-blue-600 font-medium">Welcome, {session.user.name}!</p>
                )}
              </div>
              {savedProfile&&(
                <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  ✅ {recCount} {t.scholarshipsRecommended}
                </span>
              )}
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="lg:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.incomeField}</label>
                  <input type="number" placeholder="e.g. 250000" value={profile.income} onChange={e=>setProfile({...profile,income:e.target.value})} className={il}/>
                </div>
                {[
                  {lbl:t.categoryField,el:<select value={profile.category} onChange={e=>setProfile({...profile,category:e.target.value})} className={sl}>{CAST_OPTIONS.map(c=><option key={c}>{c}</option>)}</select>},
                  {lbl:t.courseField,el:<select value={profile.course} onChange={e=>setProfile({...profile,course:e.target.value})} className={sl}><option value="Any">{t.anyOpt}</option><option value="School">{t.school}</option><option value="Engineering">{t.engineering}</option><option value="Medical">{t.medical}</option><option value="Arts">{t.arts}</option><option value="Commerce">{t.commerce}</option><option value="Science">{t.science}</option></select>},
                  {lbl:t.genderField,el:<select value={profile.gender} onChange={e=>setProfile({...profile,gender:e.target.value})} className={sl}><option value="Any">{t.genderAny}</option><option value="Male">{t.genderMale}</option><option value="Female">{t.genderFemale}</option></select>},
                  {lbl:t.stateField,el:<select value={profile.state} onChange={e=>setProfile({...profile,state:e.target.value})} className={sl}>{STATES.map(s=><option key={s}>{s}</option>)}</select>},
                ].map(({lbl,el})=>(
                  <div key={lbl}><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{lbl}</label>{el}</div>
                ))}
                <div className="flex flex-col gap-2 items-stretch">
                  <button onClick={()=>{setSavedProfile({...profile});setShowResults(true);}}
                    className="w-full py-2 px-4 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{background:`linear-gradient(135deg,${C.blue},${C.indigo})`,boxShadow:"0 2px 8px rgba(29,78,216,0.3)"}}>
                    {t.updateProfile}
                  </button>
                  {savedProfile&&(
                    <button onClick={()=>{setSavedProfile(null);setProfile({income:"",category:"SC",course:"Any",state:"Any",gender:"Any"});}}
                      className="w-full py-2 px-4 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>
                      Clear All ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4" style={{boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
            <div className="grid grid-cols-5 gap-3">
              <select value={searchCategory} onChange={e=>setSearchCategory(e.target.value)} className={sl}>
                {CATEGORY_OPTIONS.map(c=><option key={c}>{c==="All Categories"?t.allCategories:c}</option>)}
              </select>
              <select value={searchCourse} onChange={e=>setSearchCourse(e.target.value)} className={sl}>
                <option value="Any">{t.allCourses}</option>
                <option value="School">{t.school}</option>
                <option value="Engineering">{t.engineering}</option>
                <option value="Medical">{t.medical}</option>
                <option value="Arts">{t.arts}</option>
                <option value="Commerce">{t.commerce}</option>
                <option value="Science">{t.science}</option>
              </select>
              <select value={searchGender} onChange={e=>setSearchGender(e.target.value)} className={sl}>
                <option value="Any">{t.genderField}: {t.genderAny}</option>
                <option value="Male">👨 {t.genderMale}</option>
                <option value="Female">👩 {t.genderFemale}</option>
              </select>
              <select value={searchLevel} onChange={e=>setSearchLevel(e.target.value)} className={sl}>
                {LEVEL_OPTIONS.map(l=><option key={l}>{l==="All Levels"?t.allLevels:l==="State"?t.stateLvl:l==="Central"?t.central:t.trust}</option>)}
              </select>
              <select value={searchState} onChange={e=>setSearchState(e.target.value)} className={sl}>
                <option value="Any">{t.stateField}: {t.anyOpt}</option>
                {STATES.filter(s=>s!=="Any").map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">{displayed.length} {t.showing}</span>
              <div className="flex items-center gap-2">
                {hasFilters&&(
                  <button onClick={()=>{clearFilters();setShowResults(false);}}
                    className="py-2 px-4 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>
                    Clear All ✕
                  </button>
                )}
                <button onClick={()=>setShowResults(true)}
                  className="py-2 px-5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{background:`linear-gradient(135deg,${C.blue},${C.indigo})`,boxShadow:"0 2px 8px rgba(29,78,216,0.25)"}}>
                  🔍 Apply Filter
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Table — only shown after clicking Find My Scholarships */}
        {!showResults ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center" style={{boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Fill your profile to find scholarships</h3>
              <p className="text-sm text-slate-400">Enter your income, category, course and state above, then click <b>"{t.updateProfile}"</b> to see matching scholarships.</p>
            </div>
          </section>
        ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{background:`linear-gradient(to right,${C.navy},${C.navyMid})`}}>
              <span className="text-lg">🏆</span>
              <h2 className="font-bold text-white text-base">{t.scholarships}</h2>
              <span className="ml-auto text-xs font-semibold text-white/60 bg-white/10 px-3 py-1 rounded-full">{displayed.length} {t.showing}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100" style={{background:"#f8fafc"}}>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.name}</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.level}</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.courseCol}</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.stateCol}</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.amount}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((s,i)=>{
                    const rec=isRecommended(s,savedProfile);
                    return(
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors"
                        style={{background:i%2===0?"#ffffff":"#fafafa",borderLeft:rec?"3px solid #2563eb":"3px solid transparent"}}>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1.5">
                            {rec&&<span className="inline-flex items-center self-start text-[11px] font-bold text-white px-2.5 py-0.5 rounded-md" style={{background:C.green}}>{t.recommended_badge}</span>}
                            <span className="font-semibold text-slate-800 text-sm leading-snug">{sName(s)}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catBadge(s.category)}`}>{s.category}</span>
                              {s.gender!=="Any"&&<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.gender==="Female"?"bg-pink-50 text-pink-700 ring-1 ring-pink-200":"bg-blue-50 text-blue-700 ring-1 ring-blue-200"}`}>{s.gender==="Female"?"👩 "+t.genderFemale:"👨 "+t.genderMale}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${lvlBadge(s.level)}`}>{s.level==="Central"?t.central:s.level==="State"?t.stateLvl:t.trust}</span></td>
                        <td className="px-4 py-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.course==="School"?"bg-sky-50 text-sky-700":"bg-violet-50 text-violet-700"}`}>{s.course==="School"?t.school:"College"}</span></td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">{s.state}</td>
                        <td className="px-4 py-3.5 text-emerald-700 font-bold text-xs">{s.amount}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={()=>setDetailS(s)} className="text-xs font-bold px-3.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90" style={{background:C.cyan}}>{t.details}</button>
                            <button onClick={()=>setApplyS(s)} className="text-xs font-bold px-3.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90" style={{background:C.green}}>{t.apply}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayed.length===0&&(
                    <tr><td colSpan={6} className="text-center py-16">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-slate-500 font-medium text-sm">{t.noResults}</p>
                      {hasFilters&&<button onClick={clearFilters} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">Clear all filters</button>}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}
      </>)}

      {/* ══ DETAILS MODAL ══ */}
      {detailS&&(
        <Modal onClose={()=>setDetailS(null)}>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:`linear-gradient(135deg,${C.blue},${C.indigo})`}}>🎓</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{sName(detailS)}</h3>
              <div className="flex gap-2 flex-wrap mt-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catBadge(detailS.category)}`}>{detailS.category}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lvlBadge(detailS.level)}`}>{detailS.level==="Central"?t.central:detailS.level==="State"?t.stateLvl:t.trust}</span>
                {isRecommended(detailS,savedProfile)&&<span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{background:C.green}}>{t.recommended_badge}</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[["💰 Amount",detailS.amount],[`📅 ${t.lastDate}`,detailS.lastDate],["📚 Course",detailS.course==="School"?t.school:"College"],["🗺️ State",detailS.state]].map(([l,v])=>(
              <div key={l} className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{l}</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          {[{title:t.description,content:detailS.description},{title:t.eligibility,content:detailS.eligibility},{title:t.documents,content:detailS.documents}].map(({title,content})=>(
            <div key={title} className="mb-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">{title}</p>
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 leading-relaxed">{content}</p>
            </div>
          ))}
          <div className="flex gap-3 mt-5 flex-wrap">
            <a href={detailS.applyLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-sm font-bold text-white py-2.5 rounded-xl transition-all hover:opacity-90" style={{background:`linear-gradient(135deg,${C.green},${C.recGreen})`}}>{t.applyNow}</a>
            <a href={detailS.youtubeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-white py-2.5 px-5 rounded-xl transition-all hover:opacity-90" style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>{t.howToFill}</a>
          </div>
        </Modal>
      )}

      {/* ══ APPLY MODAL ══ */}
      {applyS&&(
        <Modal onClose={()=>setApplyS(null)}>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:`linear-gradient(135deg,${C.green},${C.recGreen})`}}>📋</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{t.applyModal}</p>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{sName(applyS)}</h3>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">⏰</span>
            <div><p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">{t.lastDateLabel}</p><p className="font-bold text-red-700 text-base">{applyS.lastDate}</p></div>
          </div>
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">{t.documents}</p>
            <div className="space-y-1.5">
              {applyS.documents.split(",").map((doc,i)=>(
                <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <span className="text-blue-500 text-xs">📄</span>
                  <span className="text-sm text-slate-600">{doc.trim()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">{t.stepsTitle}</p>
            <ol className="space-y-2">
              {t.steps.map((step,i)=>(
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  <span className="text-sm text-amber-900">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href={applyS.applyLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-sm font-bold text-white py-2.5 rounded-xl hover:opacity-90 transition-all" style={{background:`linear-gradient(135deg,${C.green},${C.recGreen})`}}>{t.applyOnSite}</a>
            <a href={applyS.youtubeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-white py-2.5 px-5 rounded-xl hover:opacity-90 transition-all" style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>{t.watchVideo}</a>
          </div>
        </Modal>
      )}

      {/* ══ PROFILE MODAL ══ */}
      {showProfile&&(
        <Modal onClose={()=>setShowProfile(false)} wide>
          <div className="-mx-6 -mt-6 px-6 pt-6 pb-5 rounded-t-2xl mb-5" style={{background:`linear-gradient(135deg,${C.navy},${C.navyMid})`}}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{background:"rgba(255,255,255,0.12)"}}>👤</div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {session?.user?.name || t.profileModal}
                </h3>
                <p className="text-white/60 text-sm">
                  {session?.user?.email || (savedProfile?`${savedProfile.category} · ${savedProfile.state}`:"No profile saved yet")}
                </p>
              </div>
              {savedProfile&&<div className="ml-auto text-center bg-white/10 rounded-xl px-4 py-2"><p className="text-white/60 text-[10px] uppercase tracking-wide font-bold">Matched</p><p className="text-white font-bold text-2xl">{recCount}</p></div>}
            </div>
          </div>
          {savedProfile&&(
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[[`💰 ${t.incomeField}`,`₹${parseInt(savedProfile.income||"0").toLocaleString("en-IN")}`],[`🏷️ ${t.categoryField}`,savedProfile.category],[`📚 ${t.courseField}`,courseLabel(savedProfile.course)],[`🗺️ ${t.stateField}`,savedProfile.state],[`👤 ${t.genderField}`,savedProfile.gender==="Male"?t.genderMale:savedProfile.gender==="Female"?t.genderFemale:t.genderAny]].map(([l,v])=>(
                <div key={l} className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{l}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-700 font-medium flex items-start gap-2">
            <span className="flex-shrink-0">🔒</span>
            <span>{t.secureNote}</span>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <h4 className="font-bold text-slate-800 text-sm mb-1">{t.docVault}</h4>
            <p className="text-xs text-slate-400 mb-4">{t.docVaultDesc}</p>
            <div className="flex flex-wrap gap-3 mb-4 items-end">
              <div className="flex-1 min-w-[130px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">{t.docName}</label>
                <input type="text" placeholder="e.g. Aadhaar Card" value={docName} onChange={e=>setDocName(e.target.value)} className={il}/>
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">{t.docFile}</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"/>
              </div>
              <button onClick={handleDocAdd} className="text-sm font-bold text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all whitespace-nowrap" style={{background:`linear-gradient(135deg,${C.blue},${C.indigo})`}}>
                + {t.addDocument}
              </button>
            </div>
            {docToast&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl px-4 py-2 mb-3">✅ {t.docAdded}</div>}
            {docs.length===0
              ?<div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">📂 {t.noDocuments}</div>
              :<div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {docs.map(d=>(
                  <div key={d.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">{d.fileName.endsWith(".pdf")?"📄":"🖼️"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{d.name}</p>
                        <p className="text-xs text-slate-400 truncate">{d.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <a href={d.dataUrl} download={d.fileName} className="text-xs text-blue-600 hover:underline font-medium">↓ Download</a>
                      <button onClick={()=>setDocs(prev=>prev.filter(x=>x.id!==d.id))} className="text-xs text-red-500 hover:text-red-700 font-medium">{t.remove}</button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
          <button onClick={()=>setShowProfile(false)} className="mt-5 w-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium py-2.5 rounded-xl text-sm transition-colors">
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({children,onClose,wide}:{children:React.ReactNode;onClose:()=>void;wide?:boolean}){
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(15,23,42,0.5)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${wide?"max-w-xl":"max-w-lg"} w-full max-h-[90vh] overflow-y-auto p-6 relative`} style={{boxShadow:"0 24px 48px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold transition-colors">✕</button>
        {children}
      </div>
    </div>
  );
}
