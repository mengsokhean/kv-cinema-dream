import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Lang = "en" | "kh";

const translations = {
  en: {
    home: "Home",
    movies: "Movies",
    pricing: "Pricing",
    aboutUs: "About Us",
    contactUs: "Contact Us",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    profile: "Profile",
    watchlist: "Watchlist",
    admin: "Admin",
    premium: "Premium",
    // About page
    aboutTitle: "About Us",
    aboutSubtitle: "Your Premium Movie Streaming Destination",
    aboutDesc1: "KVMovies is Cambodia's leading online movie streaming platform, delivering high-quality entertainment to audiences across the Kingdom and beyond. We are passionate about bringing the best cinematic experiences directly to your screen.",
    aboutDesc2: "Our curated library features blockbusters, indie gems, local Cambodian films, and exclusive premium content — all available in stunning HD and 4K quality.",
    ourMission: "Our Mission",
    missionText: "To make world-class entertainment accessible to everyone in Cambodia, with a seamless, affordable, and enjoyable streaming experience.",
    ourVision: "Our Vision",
    visionText: "To become Southeast Asia's most trusted and beloved movie streaming platform, championing both international and local storytelling.",
    whyChooseUs: "Why Choose KVMovies?",
    reason1Title: "Premium Quality",
    reason1Desc: "Stream in HD and 4K with zero buffering on our optimized servers.",
    reason2Title: "Affordable Plans",
    reason2Desc: "Enjoy unlimited content starting at just $4.99/month.",
    reason3Title: "Local & Global",
    reason3Desc: "A curated mix of international blockbusters and Cambodian cinema.",
    reason4Title: "Secure Payments",
    reason4Desc: "Pay safely with ABA, ACLEDA, and more local payment methods.",
    // Contact page
    contactTitle: "Contact Us",
    contactSubtitle: "We're Here to Help",
    contactDesc: "Have a question, issue, or suggestion? Reach out to our team and we'll get back to you as soon as possible.",
    yourName: "Your Name",
    yourEmail: "Your Email",
    subject: "Subject",
    message: "Message",
    sendMessage: "Send Message",
    sending: "Sending...",
    messageSent: "Message sent successfully!",
    messageError: "Failed to send message. Please try again.",
    getInTouch: "Get in Touch",
    email: "Email",
    phone: "Phone",
    address: "Address",
    workingHours: "Working Hours",
    workingHoursValue: "Mon - Fri: 8:00 AM - 6:00 PM (ICT)",
    followUs: "Follow Us",
    faq: "Frequently Asked Questions",
    faq1Q: "How do I subscribe to Premium?",
    faq1A: "Go to the Pricing page, select your preferred plan, and complete payment via ABA or ACLEDA.",
    faq2Q: "Can I cancel my subscription?",
    faq2A: "Yes, you can cancel anytime from your Profile page. Your access continues until the end of the billing period.",
    faq3Q: "What devices are supported?",
    faq3A: "KVMovies works on any device with a modern web browser — phones, tablets, laptops, and smart TVs.",
    // Footer
    allRightsReserved: "All rights reserved.",
    // Theme
    lightMode: "Light",
    darkMode: "Dark",
    // Pricing page
    pricingBadge: "Premium Plans",
    pricingTitle: "Unlock",
    pricingTitleHighlight: "Everything",
    pricingSubtitle: "Choose your plan and enjoy unlimited premium content.",
    alreadyPremium: "You're already a Premium member!",
    expires: "Expires",
    planMonthly: "Monthly",
    planYearly: "Yearly",
    perMonth: "month",
    perYear: "year",
    mostPopular: "Most Popular",
    featureHD: "HD Streaming",
    feature4K: "4K Streaming",
    featureAllMovies: "All Movies",
    featureCancelAnytime: "Cancel Anytime",
    feature1Device: "1 Device",
    feature3Devices: "3 Devices",
    featurePrioritySupport: "Priority Support",
    payWith: "Pay with",
    abaKHQR: "ABA Pay (KHQR)",
    acledaBank: "ACLEDA Bank",
    abaBankTransfer: "ABA Pay (KHQR)",
    acledaBankTransfer: "ACLEDA Bank Transfer",
    scanQR: "Scan this QR code with your ABA Mobile app to complete payment",
    khqrPlaceholder: "KHQR Code Placeholder",
    bank: "Bank",
    account: "Account",
    name: "Name",
    amount: "Amount",
    transferInstructions: "Transfer the amount above and click \"Confirm Payment\"",
    iHavePaid: "I Have Paid",
    creatingPayment: "Creating Payment...",
    checkingPayment: "Checking Payment Status...",
    dontClose: "Listening for payment confirmation. Please don't close this window.",
    checkManually: "Check Manually",
    paymentSuccessful: "Payment Successful!",
    welcomePremium: "Welcome to KVMovies Premium 🎬",
    startWatching: "Start Watching",
    paymentFailed: "Payment Failed",
    paymentFailedDesc: "Something went wrong. Please try again.",
    cancel: "Cancel",
    tryAgain: "Try Again",
  },
  kh: {
    home: "ទំព័រដើម",
    movies: "ភាពយន្ត",
    pricing: "តម្លៃ",
    aboutUs: "អំពីយើង",
    contactUs: "ទំនាក់ទំនង",
    signIn: "ចូល",
    signUp: "ចុះឈ្មោះ",
    signOut: "ចាកចេញ",
    profile: "គណនី",
    watchlist: "បញ្ជីមើល",
    admin: "អ្នកគ្រប់គ្រង",
    premium: "ពិសេស",
    aboutTitle: "អំពីយើង",
    aboutSubtitle: "គោលដៅស្ទ្រីមភាពយន្តពិសេសរបស់អ្នក",
    aboutDesc1: "KVMovies គឺជាវេទិកាស្ទ្រីមភាពយន្តអនឡាញឈានមុខគេរបស់កម្ពុជា ដែលផ្តល់នូវកម្សាន្តគុណភាពខ្ពស់ដល់ទស្សនិកជនទូទាំងប្រទេស និងក្រៅប្រទេស។",
    aboutDesc2: "បណ្ណាល័យរបស់យើងមានភាពយន្តធំៗ ភាពយន្តកម្ពុជា និងមាតិកាពិសេស — ទាំងអស់មាននៅក្នុង HD និង 4K។",
    ourMission: "បេសកកម្មរបស់យើង",
    missionText: "ធ្វើឱ្យកម្សាន្តថ្នាក់ពិភពលោកអាចចូលដំណើរការបានសម្រាប់គ្រប់គ្នានៅក្នុងប្រទេសកម្ពុជា។",
    ourVision: "ចក្ខុវិស័យរបស់យើង",
    visionText: "ក្លាយជាវេទិកាស្ទ្រីមភាពយន្តដែលគួរឱ្យទុកចិត្ត និងពេញនិយមបំផុតនៅអាស៊ីអាគ្នេយ៍។",
    whyChooseUs: "ហេតុអ្វីជ្រើសរើស KVMovies?",
    reason1Title: "គុណភាពពិសេស",
    reason1Desc: "ស្ទ្រីមក្នុង HD និង 4K ដោយគ្មានការផ្អាកនៅលើម៉ាស៊ីនមេដែលបានធ្វើឱ្យប្រសើរឡើង។",
    reason2Title: "គម្រោងសមរម្យ",
    reason2Desc: "រីករាយជាមួយមាតិកាគ្មានដែនកំណត់ចាប់ពី $4.99/ខែ។",
    reason3Title: "មូលដ្ឋាន និង សកល",
    reason3Desc: "ការរួមបញ្ចូលភាពយន្តអន្តរជាតិ និងភាពយន្តកម្ពុជា។",
    reason4Title: "ការទូទាត់សុវត្ថិភាព",
    reason4Desc: "បង់ប្រាក់ដោយសុវត្ថិភាពជាមួយ ABA, ACLEDA និងវិធីបង់ប្រាក់មូលដ្ឋានផ្សេងទៀត។",
    contactTitle: "ទំនាក់ទំនងយើង",
    contactSubtitle: "យើងនៅទីនេះដើម្បីជួយ",
    contactDesc: "មានសំណួរ បញ្ហា ឬការផ្តល់យោបល់? ទាក់ទងក្រុមការងាររបស់យើង ហើយយើងនឹងឆ្លើយតបឱ្យបានឆាប់បំផុត។",
    yourName: "ឈ្មោះរបស់អ្នក",
    yourEmail: "អ៊ីមែលរបស់អ្នក",
    subject: "ប្រធានបទ",
    message: "សារ",
    sendMessage: "ផ្ញើសារ",
    sending: "កំពុងផ្ញើ...",
    messageSent: "សារត្រូវបានផ្ញើដោយជោគជ័យ!",
    messageError: "ផ្ញើសារមិនជោគជ័យ។ សូមព្យាយាមម្តងទៀត។",
    getInTouch: "ទាក់ទងមកយើង",
    email: "អ៊ីមែល",
    phone: "ទូរស័ព្ទ",
    address: "អាសយដ្ឋាន",
    workingHours: "ម៉ោងធ្វើការ",
    workingHoursValue: "ច័ន្ទ - សុក្រ: ម៉ោង 8:00 ព្រឹក - 6:00 ល្ងាច",
    followUs: "តាមដានយើង",
    faq: "សំណួរដែលសួរញឹកញាប់",
    faq1Q: "តើខ្ញុំជាវ Premium យ៉ាងដូចម្ដេច?",
    faq1A: "ទៅទំព័រតម្លៃ ជ្រើសរើសគម្រោង រួចបង់ប្រាក់តាម ABA ឬ ACLEDA។",
    faq2Q: "តើខ្ញុំអាចលុបចោលការជាវបានទេ?",
    faq2A: "បាន អ្នកអាចលុបចោលគ្រប់ពេលពីទំព័រគណនីរបស់អ្នក។",
    faq3Q: "តើឧបករណ៍អ្វីខ្លះដែលគាំទ្រ?",
    faq3A: "KVMovies ដំណើរការលើឧបករណ៍ណាមួយដែលមានកម្មវិធីរុករកទំនើប។",
    allRightsReserved: "រក្សាសិទ្ធិគ្រប់យ៉ាង។",
    lightMode: "ភ្លឺ",
    darkMode: "ងងឹត",
    // Pricing page
    pricingBadge: "គម្រោងពិសេស",
    pricingTitle: "ដោះសោ",
    pricingTitleHighlight: "ទាំងអស់",
    pricingSubtitle: "ជ្រើសរើសគម្រោងរបស់អ្នក រួចរីករាយជាមួយមាតិកាពិសេសគ្មានដែនកំណត់។",
    alreadyPremium: "អ្នកជាសមាជិកពិសេសរួចហើយ!",
    expires: "ផុតកំណត់",
    planMonthly: "ប្រចាំខែ",
    planYearly: "ប្រចាំឆ្នាំ",
    perMonth: "ខែ",
    perYear: "ឆ្នាំ",
    mostPopular: "ពេញនិយមបំផុត",
    featureHD: "ស្ទ្រីម HD",
    feature4K: "ស្ទ្រីម 4K",
    featureAllMovies: "ភាពយន្តទាំងអស់",
    featureCancelAnytime: "លុបចោលគ្រប់ពេល",
    feature1Device: "ឧបករណ៍ ១",
    feature3Devices: "ឧបករណ៍ ៣",
    featurePrioritySupport: "ជំនួយអាទិភាព",
    payWith: "បង់ប្រាក់តាម",
    abaKHQR: "ABA Pay (KHQR)",
    acledaBank: "ធនាគារ ACLEDA",
    abaBankTransfer: "ABA Pay (KHQR)",
    acledaBankTransfer: "ផ្ទេរប្រាក់ធនាគារ ACLEDA",
    scanQR: "ស្កេន QR កូដនេះជាមួយកម្មវិធី ABA Mobile របស់អ្នកដើម្បីបញ្ចប់ការទូទាត់",
    khqrPlaceholder: "កូដ KHQR",
    bank: "ធនាគារ",
    account: "គណនី",
    name: "ឈ្មោះ",
    amount: "ចំនួនទឹកប្រាក់",
    transferInstructions: "ផ្ទេរចំនួនទឹកប្រាក់ខាងលើ រួចចុច \"បញ្ជាក់ការទូទាត់\"",
    iHavePaid: "ខ្ញុំបានបង់ប្រាក់រួចហើយ",
    creatingPayment: "កំពុងបង្កើតការទូទាត់...",
    checkingPayment: "កំពុងពិនិត្យស្ថានភាពការទូទាត់...",
    dontClose: "កំពុងរង់ចាំការបញ្ជាក់ការទូទាត់។ សូមកុំបិទបង្អួចនេះ។",
    checkManually: "ពិនិត្យដោយដៃ",
    paymentSuccessful: "ការទូទាត់ជោគជ័យ!",
    welcomePremium: "សូមស្វាគមន៍មកកាន់ KVMovies Premium 🎬",
    startWatching: "ចាប់ផ្តើមមើល",
    paymentFailed: "ការទូទាត់បរាជ័យ",
    paymentFailedDesc: "មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។",
    cancel: "បោះបង់",
    tryAgain: "ព្យាយាមម្តងទៀត",
  },
};

type Translations = typeof translations.en;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("kv-lang");
    return (saved === "kh" ? "kh" : "en") as Lang;
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("kv-lang", newLang);
  }, []);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
