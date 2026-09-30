/* =====================================================================
   CLINIC AI CHATBOT — niche configs (all businesses are fictional demos)
   ---------------------------------------------------------------------
   One entry per niche. Every niche is built by clinic(spec):
   - a shared clinic knowledge base (booking, hours, insurance, safety…)
   - plus the niche's own services (with prices) and Q&As, which
     override shared entries with the same id.
   New client? Copy one clinic({...}) block, change the id and the data.
   ===================================================================== */
(function () {
  const R = (window.ChatbotConfigs = window.ChatbotConfigs || {});

  /* ---------- helpers ---------- */
  const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const t12 = (hm, short) => {
    let [h, m] = hm.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return short && !m ? `${h} ${ap}` : `${h}:${String(m).padStart(2, "0")} ${ap}`;
  };
  const dayRange = (days) => {
    const s = days.slice().sort((a, b) => a - b);
    if (s.length === 1) return DAY[s[0]];
    const contiguous = s.every((d, i) => i === 0 || d === s[i - 1] + 1);
    return contiguous ? `${DAY[s[0]]} to ${DAY[s[s.length - 1]]}` : s.map((d) => DAY[d]).join(", ");
  };
  // hours({ week: [1,2,3,4,5], open: "08:00", close: "18:00", sat: ["09:00","14:00"] })
  function hours(h) {
    const days = {};
    h.week.forEach((d) => { days[d] = [h.open, h.close]; });
    if (h.sat) days[6] = h.sat;
    if (h.sun) days[0] = h.sun;
    const main = `${dayRange(h.week)}, ${t12(h.open)} – ${t12(h.close)}`;
    const mainShort = `${dayRange(h.week)}, ${t12(h.open, 1)} – ${t12(h.close, 1)}`;
    const sat = h.sat ? `; Saturday, ${t12(h.sat[0])} – ${t12(h.sat[1])}` : "";
    const satShort = h.sat ? `; Saturday, ${t12(h.sat[0], 1)} – ${t12(h.sat[1], 1)}` : "";
    const sun = h.sun ? `; Sunday, ${t12(h.sun[0])} – ${t12(h.sun[1])}` : "";
    const openDays = Object.keys(days).map(Number).sort();
    const closedList = [0, 6].filter((d) => !openDays.includes(d)).map((d) => DAY[d] + "s");
    return {
      openDays, days, open: h.open, close: h.close, lastSlotBeforeClose: 30,
      display: main + sat + sun, shortDisplay: mainShort + satShort + sun,
      daysText: dayRange(openDays),
      closedDisplay: closedList.length ? `We're closed on ${closedList.join(" and ")}.` : "",
      weekendText: (h.sat ? `On Saturdays we're open ${t12(h.sat[0])} – ${t12(h.sat[1])}` : "We're closed on Saturdays") +
        (h.sun ? `, and on Sundays ${t12(h.sun[0])} – ${t12(h.sun[1])}.` : ", and closed on Sundays.")
    };
  }
  // A service: id, label, price, minutes, match words (+ optional extra answer / qty words / from-price)
  const svc = (id, label, price, time, match, x = {}) => ({ id, label, price, time, match, ...x });

  const URGENT_BASE = ["severe bleeding", "bleeding heavily", "heavy bleeding", "bleeding a lot", "wont stop bleeding", "chest pain", "chest pains",
    "chest tightness", "trouble breathing", "difficulty breathing", "cant breathe", "hard to breathe", "shortness of breath", "short of breath",
    "head injury", "hit my head", "unconscious", "passed out", "fainted", "seizure", "stroke", "heart attack", "anaphylaxis", "throat swelling",
    "heavy swelling", "swelling and fever", "swollen and fever", "severe allergic reaction", "overdose", "poisoning", "choking"];
  const TOPIC_BASE = ["clinic", "doctor", "appointment", "visit", "treatment", "health", "patient", "checkup", "check up", "consultation", "insurance",
    "medical", "care", "pain", "specialist", "nurse", "exam", "test", "prescription", "symptom", "results", "hospital", "therapy", "procedure"];
  const OFFTOPIC = ["weather", "politics", "political", "election", "president", "government", "recipe", "recipes", "cook", "cooking", "pizza", "burger",
    "football", "soccer", "cricket", "basketball", "movie", "movies", "song", "music", "code", "coding", "python", "javascript", "programming", "bitcoin",
    "crypto", "stock", "stocks", "news", "joke", "poem", "game", "games", "restaurant", "hotel", "flight", "homework", "math", "car", "cars", "iphone",
    "netflix", "celebrity", "lottery", "casino", "dating", "vacation", "travel", "shopping", "fashion"];

  /* ---------- the shared clinic knowledge base ---------- */
  function baseFaq(S) {
    const who = S.staffPlural;
    return [
      { id: "reschedule", action: "reschedule",
        strong: ["reschedule", "cancel", "cancellation", "postpone", "change appointment", "move appointment", "change booking", "different date", "another date", "another time"], weak: [] },
      { id: "book", action: "book",
        strong: ["book", "booking", "reserve", "make appointment", "get appointment", "schedule", "set up appointment"],
        weak: ["appointment", "slot", "visit", "available", "availability", "come in", "see someone"] },
      // SAFETY — never recommend or dose medicine, never interpret symptoms or results
      { id: "medication", priority: 1,
        strong: ["medicine", "medicines", "medication", "medications", "painkiller", "painkillers", "antibiotic", "antibiotics", "ibuprofen", "paracetamol",
          "tylenol", "advil", "aspirin", "acetaminophen", "prescribe", "prescription", "pill", "pills", "tablet", "tablets", "dose", "dosage", "drug", "drugs",
          "what should i take", "what can i take", "cream should i use", "ointment", "supplement", "supplements", "refill"], weak: [],
        answer: `Your doctor will guide you on that during your visit — I'm not able to recommend or dose any medication. If you need help sooner, please call us at {phone}.`,
        chips: ["Book Appointment", "Call the clinic"] },
      { id: "safety", priority: 2,
        strong: S.safetyWords || ["pregnant", "pregnancy", "while pregnant", "during pregnancy", "breastfeeding", "nursing mother", "allergic", "allergy",
          "allergies", "latex", "side effect", "side effects", "safe for me", "blood thinner", "blood thinners"], weak: [],
        answer: `Your doctor will guide you on that during your visit, based on your health history. If you'd like to talk it through first, please call us at {phone}.`,
        chips: ["Book Appointment"] },
      { id: "diagnosis", priority: 3,
        strong: ["diagnose", "diagnosis", "what do i have", "whats wrong with me", "what is wrong with me", "is it serious", "is this serious",
          "should i be worried", "what could it be", "what causes", "is it cancer", "is this normal", "is that normal", "what does it mean"], weak: [],
        answer: `I'm not able to assess symptoms or give a diagnosis over chat — our ${who} will look into it properly at your visit. I can book the earliest available appointment, or you can call us at {phone}.`,
        chips: ["Book earliest appointment", "Call the clinic"] },
      { id: "resultsMeaning", priority: 3,
        strong: ["interpret", "explain my results", "results mean", "result mean", "what do my results", "what does my result", "is my result normal",
          "are my results normal", "normal range", "my report says", "read my report", "understand my results", "my levels", "is that bad", "is that good",
          "is it bad", "is that high", "is that low", "too high", "too low", "my cholesterol is", "my sugar is", "my blood sugar is", "my levels are",
          "my result is", "my results are", "my results say", "my test came back"], weak: [],
        answer: `I'm not able to interpret test results — your doctor will go through them with you and explain what they mean. You can call us at {phone} to arrange that.`,
        chips: ["Book Appointment"] },
      { id: "emergency",
        strong: ["emergency", "urgent", "urgently", "emergencies"], weak: ["immediately", "asap"],
        answer: `If it's a medical emergency, please call 911 or go to the nearest emergency room right away. For urgent but non-emergency concerns, call us at {emergency} and we'll see you as soon as we can.`,
        chips: ["Book earliest appointment", "Location"] },
      { id: "afterHours", strong: ["after hours", "out of hours", "night emergency", "weekend emergency", "sunday emergency", "when you are closed"], weak: [],
        answer: `Outside our opening hours, please call 911 or go to the nearest emergency room for anything serious. For urgent questions you can leave a message on {emergency}.`,
        chips: ["Timings"] },
      { id: "late", strong: ["late", "running late", "delayed", "arrive late", "miss my appointment", "stuck in traffic"], weak: [],
        answer: `No worries — please call us at {phone} if you're running late. We'll hold your slot for up to 15 minutes, or help you find a new time.`,
        chips: ["Location", "Parking"] },
      { id: "language", strong: ["spanish", "espanol", "french", "arabic", "urdu", "hindi", "german", "chinese", "mandarin", "portuguese", "italian", "russian",
          "language", "other language", "interpreter", "translator"], weak: ["speak"],
        answer: `I can only chat in English, but our team can arrange an interpreter for your visit — just call {phone}.` },
      { id: "duration", strong: ["how long", "duration", "how much time", "how many minutes", "how long does it take"], weak: ["take", "last", "long", "minute"],
        answer: S.durationText, chips: ["Book Appointment", "Prices"] },
      { id: "insurance", strong: ["insurance", "insured", "insurer", "coverage", "medicare", "medicaid", "aetna", "cigna", "humana", "blue cross",
          "bluecross", "united healthcare", "unitedhealthcare", "take my insurance", "in network", "vsp", "eyemed", "davis vision",
          "delta dental", "metlife", "guardian", "tricare", "kaiser", "anthem", "optum", "regence", "premera", "tenncare", "chip", "bcbs", "accept insurance"], weak: ["cover", "covered", "claim", "policy", "plan"],
        answer: S.insurance, chips: ["Payment options", "Book Appointment"] },
      { id: "selfPay", strong: ["no insurance", "without insurance", "uninsured", "self pay", "selfpay", "dont have insurance", "cash price"], weak: [],
        answer: `No insurance? No problem — you're very welcome as a self-pay patient, and our prices are listed upfront. Just ask me about any service.`,
        chips: ["Prices", "Payment options"] },
      { id: "payment", strong: ["payment", "pay", "cash", "card", "credit card", "debit card", "apple pay", "google pay", "visa", "mastercard", "amex",
          "payment methods"], weak: ["method"],
        answer: S.payment, chips: ["Insurance", "Prices"] },
      { id: "hsa", strong: ["hsa", "fsa", "health savings", "flexible spending"], weak: [],
        answer: `Yes, we accept HSA and FSA cards for eligible services.`, chips: ["Payment options"] },
      { id: "financing", strong: ["financing", "finance", "installment", "installments", "instalment", "payment plan", "monthly payments", "carecredit", "emi"], weak: [],
        answer: S.financing || `For larger treatments we offer monthly payment plans — our team can explain the options at your visit or on {phone}.`,
        chips: ["Prices", "Book Appointment"] },
      { id: "discount", strong: ["discount", "discounts", "offers", "special offer", "deal", "deals", "promo", "promotion", "coupon", "voucher", "sale"], weak: ["cheaper"],
        answer: `For current offers or discounts, please call us at {phone} — our team will happily check for you.`, chips: ["Prices", "Book Appointment"] },
      { id: "doctors", strong: ["doctor", "doctors", "dr", "specialist", "specialists", "who are", "your team", S.staffSingular, S.staffPlural], weak: ["experience", "experienced", "qualified", "team", "staff"],
        answer: `Our ${who} are experienced, board-certified and genuinely kind. We don't share individual schedules here, but you can request a specific ${S.staffSingular} when you book and our team will confirm it for you.`,
        chips: ["Book Appointment", "Services"] },
      { id: "weekends", strong: ["weekend", "weekends", "saturday", "sunday"], weak: [],
        answer: `${S.hours.weekendText}`, chips: ["Book Appointment", "Timings"] },
      { id: "timings", strong: ["timing", "timings", "hours", "opening hours", "working hours", "business hours", "what time"], weak: ["open", "close", "closing", "time", "when"],
        answer: `We're open {hours}. {closed}`, chips: ["Book Appointment", "Location"] },
      { id: "parking", strong: ["parking", "park", "car park", "garage", "validate parking"], weak: ["drive", "driving", "vehicle"],
        answer: S.parking, chips: ["Location", "Timings"] },
      { id: "transit", strong: ["bus", "subway", "train", "metro", "public transport", "public transit"], weak: [],
        answer: S.transit || `We're easy to reach by public transport — the nearest bus stop is just a two-minute walk away.`, chips: ["Location", "Parking"] },
      { id: "location", strong: ["location", "located", "address", "direction", "directions", "map", "google maps", "where are you", "how to reach", "how do i get", "find you"],
        weak: ["where", "near", "area", "city", "street"],
        answer: `You'll find us at <b>{address}</b>.<br>{mapsLink}`, chips: ["Timings", "Parking", "Book Appointment"] },
      { id: "email", strong: ["email", "e mail", "email address"], weak: [],
        answer: `You can email us at {email} — we reply within one business day.`, chips: ["Book Appointment"] },
      { id: "human", strong: ["real person", "human", "receptionist", "talk to someone", "speak to someone", "front desk", "phone number", "contact number",
          "call you", "representative", "call the clinic"], weak: ["talk", "call", "contact", "phone", "number"],
        answer: `You can call our front desk at {phone} during opening hours — they'll be happy to help.`, chips: ["Timings", "Book Appointment"] },
      { id: "prices", action: "prices", strong: ["price list", "prices", "rates", "charges", "fees", "pricing"], weak: ["price", "cost", "how much", "charge", "rate", "expensive", "cheap", "afford", "fee"] },
      { id: "services", action: "services", strong: ["services", "treatments", "what do you offer", "what do you do", "what do you treat"], weak: ["offer", "provide", "treat"] },
      { id: "newPatients", strong: ["new patients", "new patient", "accepting new patients", "taking new patients", "register", "sign up"], weak: [],
        answer: S.newPatients, chips: ["Book Appointment", "What to bring"] },
      { id: "firstVisit", strong: ["first visit", "first time", "what to expect", "first appointment", "what happens"], weak: ["expect"],
        answer: S.firstVisit, chips: ["Book Appointment", "What to bring"] },
      { id: "whatToBring", strong: ["what to bring", "what should i bring", "bring anything", "need to bring", "documents", "what do i need"], weak: ["bring"],
        answer: S.bring, chips: ["Book Appointment"] },
      { id: "forms", strong: ["forms", "paperwork", "intake form", "registration form", "fill out", "patient portal"], weak: ["form"],
        answer: `We'll text you a secure link to our intake forms before your visit, so you can fill them in from home. If not, just arrive 10 minutes early.`,
        chips: ["What to bring", "Book Appointment"] },
      { id: "records", strong: ["medical records", "records", "transfer records", "my file", "copy of my records", "x rays from", "previous records"], weak: [],
        answer: `We can request your previous records for you — just bring your old clinic's details, or call {phone} and we'll handle the rest.`,
        chips: ["What to bring"] },
      { id: "referral", strong: ["referral", "refer", "referred", "need a referral", "referral letter"], weak: [],
        answer: S.referral || `You don't need a referral to book with us. If your insurance plan requires one, please bring it along to your visit.`,
        chips: ["Insurance", "Book Appointment"] },
      { id: "cancelPolicy", strong: ["cancellation policy", "cancel policy", "cancellation fee", "no show", "no show fee", "late cancellation"], weak: [],
        answer: S.cancel, chips: ["Book Appointment"] },
      { id: "walkIn", strong: ["walk in", "walk ins", "walkin", "without appointment", "just come in", "drop in"], weak: [],
        answer: S.walkIn || `We work by appointment so you're never kept waiting — but we keep a few same-day slots, so booking here is the fastest way in.`,
        chips: ["Book earliest appointment"] },
      { id: "telehealth", strong: ["telehealth", "online consultation", "video call", "video consultation", "virtual visit", "virtual appointment", "online appointment", "zoom"], weak: ["online", "virtual"],
        answer: S.telehealth || `Some follow-ups can be done by video call — our team will let you know if it suits your visit. First visits are in person.`,
        chips: ["Book Appointment"] },
      { id: "accessibility", strong: ["wheelchair", "accessible", "accessibility", "disabled", "disability", "ramp", "elevator", "lift", "stairs"], weak: [],
        answer: `Yes, we're fully wheelchair accessible, with step-free entry, an elevator and accessible restrooms.`, chips: ["Location", "Parking"] },
      { id: "reminders", strong: ["reminder", "reminders", "remind me", "text reminder", "sms reminder"], weak: [],
        answer: `We'll send you a friendly reminder by text or email the day before your appointment. 😊`, chips: ["Book Appointment"] },
      { id: "waitTime", strong: ["wait time", "waiting time", "how long will i wait", "waiting room", "long wait"], weak: ["wait"],
        answer: `We work hard to run on time — most patients are seen within 10 minutes of their appointment time.`, chips: ["Book Appointment"] },
      { id: "privacy", strong: ["privacy", "private", "confidential", "confidentiality", "hipaa", "my data", "personal information"], weak: [],
        answer: `Your privacy matters to us — all your details and health information are kept strictly confidential and handled in line with HIPAA.`,
        chips: ["Book Appointment"] },
      { id: "hygiene", strong: ["sterile", "sterilized", "sterilised", "sterilization", "infection control", "covid", "mask", "masks", "hygiene standards", "sanitized"], weak: [],
        answer: `We follow strict infection-control standards — every room and instrument is cleaned and sterilized between patients.`, chips: ["Book Appointment"] },
      { id: "companion", strong: ["bring someone", "bring a friend", "bring my partner", "bring my husband", "bring my wife", "companion", "come with me", "family member with me"], weak: [],
        answer: `Of course — you're welcome to bring a family member or friend along for support.`, chips: ["Book Appointment"] },
      { id: "reviews", strong: ["reviews", "review", "ratings", "rating", "testimonials", "is it good", "reputation"], weak: [],
        answer: `We're proud of our patient reviews — people often mention how friendly and unhurried our team is. You can read them on our Google listing.`,
        chips: ["Location", "Book Appointment"] },
      { id: "greeting", strong: ["hi", "hello", "hey", "hiya", "good morning", "good afternoon", "good evening", "salam", "assalam", "howdy"], weak: [],
        answer: `Hello! 😊 How can I help you today?` },
      { id: "thanks", strong: ["thank", "thanks", "thx", "ty", "appreciate", "great", "perfect", "awesome"], weak: [],
        answer: `You're very welcome! Take care, and we look forward to seeing you soon. 😊` },
      { id: "bye", strong: ["bye", "goodbye", "see you", "good night", "cya"], weak: [],
        answer: `Thank you for chatting with us — take care and have a lovely day! 😊` }
    ];
  }

  // Cosmetic niches: consultation first, final prices after consultation, never guarantee results
  function cosmeticFaq(S) {
    return [
      { id: "outcome", priority: 4,
        strong: ["what results", "results will i get", "result will i get", "guarantee", "guaranteed", "guarantees", "how will i look", "will it work",
          "success rate", "how natural", "look natural", "before and after", "will i look", "expected results", "how good will"], weak: ["results"],
        answer: `Everyone's body is different, so we can't guarantee specific results. At your consultation, your ${S.staffSingular} will look at your goals and explain realistic, honest expectations for you.`,
        chips: ["Book consultation", "Prices"] },
      { id: "consultFirst", strong: ["consultation", "consult", "free consultation", "consultation fee", "assessment", "how does it work", "where do i start"], weak: ["first step"],
        answer: `Every treatment starts with ${S.consultPrice === "Free" ? "a free one-to-one consultation" : "a one-to-one consultation ({price:consultation})"}, where we talk through your goals, check you're a good candidate and give you your final price. There's no pressure to go ahead.`,
        chips: ["Book consultation", "Prices"] },
      { id: "finalPrice", strong: ["exact price", "final price", "total cost", "exact cost", "quote", "estimate", "all inclusive"], weak: [],
        answer: `The prices I share are starting prices — your final, all-inclusive price is confirmed at your consultation, once your ${S.staffSingular} has assessed what you need.`,
        chips: ["Book consultation", "Prices"] },
      { id: "downtime", strong: ["downtime", "recovery", "recover", "back to work", "healing time", "heal", "aftercare", "after care"], weak: ["rest"],
        answer: S.downtime, chips: ["Book consultation"] },
      { id: "candidate", strong: ["am i a candidate", "good candidate", "suitable for me", "right for me", "am i suitable", "too old", "too young", "age limit", "minimum age"], weak: [],
        answer: `The best way to know is a consultation — your ${S.staffSingular} will review your health and goals and tell you honestly what's right for you. You must be 18 or older for cosmetic treatments.`,
        chips: ["Book consultation"] },
      { id: "giftCards", strong: ["gift card", "gift cards", "gift voucher", "gift certificate"], weak: [],
        answer: `Yes, we offer gift cards for any amount — just call {phone} or ask at the front desk.`, chips: ["Prices"] }
    ];
  }

  /* ---------- builds one niche config ---------- */
  function clinic(S) {
    S.hours = hours(S.hoursSpec);
    const staffSingular = S.staffSingular || "doctor", staffPlural = S.staffPlural || staffSingular + "s";
    S.staffSingular = staffSingular; S.staffPlural = staffPlural;
    const services = S.services;
    const prices = {};
    services.forEach((s) => { prices[s.id] = { label: s.from ? `${s.label} (from)` : s.label, value: s.price }; });
    if (S.consultPrice && !prices.consultation) prices.consultation = { label: "Consultation", value: S.consultPrice };

    const cosmeticNote = S.cosmetic ? " Final pricing is confirmed at your consultation." : "";
    const svcAnswer = (s) => s.answer ||
      `Our <b>${s.label}</b> is ${s.from ? "from " : ""}<b>${s.price}</b>${s.time ? ` and takes about ${s.time}` : ""}.` +
      (s.extra ? " " + s.extra : "") + cosmeticNote;
    const serviceFaq = services.filter((s) => !s.noIntent).map((s) => ({
      id: s.id, strong: s.match.concat(s.strongOnly || []), weak: s.weak || [],
      answer: svcAnswer(s), chips: [S.cosmetic ? "Book consultation" : "Book Appointment", "Prices"]
    }));

    // shared entries, then cosmetic, then services, then the niche's own (later ids override earlier ones)
    const byId = new Map();
    [...baseFaq(S), ...(S.cosmetic ? cosmeticFaq(S) : []), ...serviceFaq, ...(S.faq || [])].forEach((f) => byId.set(f.id, { ...(byId.get(f.id) || {}), ...f }));
    (S.dropFaq || []).forEach((id) => byId.delete(id));
    Object.entries(S.dropWords || {}).forEach(([id, words]) => {           // e.g. eye care: "prescription" means glasses, not medicine
      const f = byId.get(id); if (f) byId.set(id, { ...f, strong: f.strong.filter((w) => !words.includes(w)) });
    });
    const faq = [...byId.values()];

    const bookWord = S.cosmetic ? "Book consultation" : "Book Appointment";
    const serviceField = {
      type: "choice", label: S.serviceLabel || "Service", words: "service|treatment|reason|services|visit", changeLabel: "the service", multi: true, allowOther: true,
      prompt: S.servicePrompt || `What's the <b>reason for your visit</b>? Tap a service below, or tell me in your own words.`,
      shortPrompt: S.servicePrompt || `What's the <b>reason for your visit</b>?`,
      chips: S.serviceChips || services.slice(0, 7).map((s) => s.chip || s.label),
      invalid: `Could you tell me briefly what the visit is for? You can tap a service below.`,
      shortErrors: ["What's the visit for? Tap an option below or type a few words.", "Just tap a service below, or type a short reason."],
      ack: "<b>{value}</b>",
      options: services.map((s) => ({
        id: s.id, label: s.label, match: s.match, note: s.note, generic: s.id === "consultation" || s.id === "followUp",
        info: svcAnswer(s), chips: [bookWord, "Prices"]
      }))
    };
    const fields = {
      patientType: {
        type: "choice", label: "Patient", words: "patient type|new or returning", changeLabel: "new or returning",
        prompt: `Are you a <b>new</b> or a <b>returning</b> patient with us?`, shortPrompt: `Are you a <b>new</b> or <b>returning</b> patient?`,
        chips: ["New patient", "Returning patient"],
        invalid: `Just let me know if you're a new or a returning patient — you can tap one below.`,
        shortErrors: ["New or returning? Tap one below.", "Just tap New or Returning below."],
        ack: "<b>{value}</b>",
        options: [
          { id: "new", label: "New patient", match: ["new", "new patient", "first time", "first visit", "never been", "im new", "new here"] },
          { id: "returning", label: "Returning patient", match: ["returning", "existing", "existing patient", "been before", "regular", "return", "old patient", "came before", "visited before", "returning patient"] }
        ]
      },
      service: serviceField,
      insurance: {
        type: "text", label: "Insurance", words: "insurance|insurer", changeLabel: "your insurance", optional: true, skipValue: "Not provided",
        prompt: `Last one (optional): which <b>insurance provider</b> do you have? You can also say “skip” or “self-pay”.`,
        shortPrompt: `Which <b>insurance provider</b> do you have? Or say “skip”.`,
        chips: ["Skip", "Self-pay", "Aetna", "Blue Cross", "Cigna", "UnitedHealthcare"],
        invalid: `Which insurance provider do you have? You can also tap “Skip”.`,
        ack: "insurance: <b>{value}</b>",
        // spotted anywhere in a message: "insurance Aetna", "I have Blue Cross", "I'm self-pay"
        extract: /\b(delta dental|blue cross(?: blue shield)?|bcbs|aetna|cigna|humana|medicare|medicaid|united ?healthcare|metlife|guardian|kaiser(?: permanente)?|anthem|vsp|eyemed|davis vision|spectera|tricare|optum|tenncare|regence|premera|providence|harvard pilgrim|tufts|self[ -]?pay|no insurance|uninsured)\b/,
        extractValue: (m) => (/self|no insurance|uninsured/.test(m[1]) ? "Self-pay" : m[1] === "bcbs" ? "Blue Cross Blue Shield" : m[1].replace(/\b\w/g, (c) => c.toUpperCase()).replace(/Vsp/, "VSP").replace(/Eyemed/, "EyeMed"))
      },
      ...(S.fields || {})
    };
    const steps = S.steps || ["name", "patientType", "service", "date", "time", "contact", "insurance"];
    return {
      id: S.id, industry: S.industry, tagline: S.tagline,
      business: S.business,
      theme: { icon: S.icon },
      hours: S.hours,
      prices,
      staff: null,
      services: S.serviceList || services.map((s) => s.list || s.label),
      booking: {
        noun: S.noun || "appointment", nounPlural: S.nounPlural || "appointments",
        steps, rescheduleSteps: ["name", "contact", "date", "time"],
        summary: S.summary || steps,
        closingLine: S.closingLine || "Your appointment for {service} is booked for {date} at {time}",
        duration: S.duration || 30, slotMinutes: S.slotMinutes || 30, takenPercent: 30,
        multiPerson: S.multiPerson !== false, maxDaysAhead: 90,
        groupShare: S.groupShare || ["service", "date"],
        fields
      },
      pricing: {
        intents: Object.fromEntries(services.filter((s) => !s.noIntent).map((s) => [s.id, s.id])),
        qty: services.filter((s) => s.qty).map((s) => ({ words: s.qty, key: s.id, name: s.qtyName, big: s.big })),
        qtyChips: [bookWord, "Payment options"], multiChips: [bookWord, "Payment options"]
      },
      fear: S.noFear ? undefined : {
        words: ["scared", "afraid", "nervous", "anxious", "fear", "terrified", "frightened", "worried", "phobia", "panic"],
        treatments: S.fearTreatments || [],
        serviceIntents: services.map((s) => s.id),
        chips: [bookWord, "First visit"]
      },
      urgentMedicineIntent: "medication",
      bot: {
        name: `${S.business.shortName} Assistant`,
        welcome: S.welcome,
        quickReplies: S.quickReplies || [bookWord, "Services & prices", "Insurance", "Timings"],
        tooltip: S.tooltip || "Questions? Chat with us!",
        showTooltipAfterMs: 2500,
        urgentChips: ["Book earliest appointment", "Location"],
        optionIntents: services.map((s) => s.id),
        overlaps: [["selfPay", "insurance"], ["financing", "payment"], ["hsa", "payment"], ["afterHours", "emergency"], ["afterHours", "timings"],
          ["whatToBring", "firstVisit"], ["whatToBring", "records"], ["forms", "whatToBring"], ["cancelPolicy", "reschedule"], ["walkIn", "book"], ["newPatients", "firstVisit"],
          ["outcome", "consultFirst"], ["finalPrice", "consultFirst"], ["financing", "discount"], ["resultsMeaning", "diagnosis"], ...(S.overlaps || [])],
        topicWords: TOPIC_BASE.concat(S.topicWords || []),
        offTopicWords: OFFTOPIC.filter((w) => !(S.topicWords || []).includes(w)),
        urgentWords: URGENT_BASE.concat(S.urgentWords || []),
        compareWords: ["better", "best", "compare", "comparison", "vs", "versus", "which one", "recommend", "prefer"],
        replies: {
          fearGeneral: S.fearText || `It's completely normal to feel nervous — you're not alone! Our ${staffPlural} are gentle and patient, they'll explain every step and go at your pace. 😊`,
          fearNumb: `It's completely normal to feel nervous — you're not alone! Modern {treatment} is done with local anesthesia, so it's usually very comfortable, and we'll explain every step and go at your pace. 😊`,
          fearGentle: `It's completely normal to feel nervous — you're not alone! Modern {treatment} is gentle and usually very comfortable, and we'll explain every step and go at your pace. 😊`,
          durationOther: S.durationText,
          pricesNote: S.pricesNote || (S.cosmetic ? "These are starting prices — your final price is confirmed at your consultation." : "Insurance may cover part of the cost — we'll confirm before any treatment."),
          servicesText: `We offer {list}. Would you like prices for any of these, or shall I book you in?`,
          closingExtra: S.closingExtra || "",
          ...(S.replies || {})
        }
      },
      faq
    };
  }
  const add = (spec) => { R[spec.id] = clinic(spec); };

  /* =====================================================================
     1. DENTAL — Bright Smile Dental
     ===================================================================== */
  add({
    id: "dental", industry: "Dental Clinic", icon: "tooth",
    tagline: "Books checkups, quotes treatment prices and calms nervous patients.",
    business: { name: "Bright Smile Dental", shortName: "Bright Smile", address: "240 Maple Avenue, Suite 3", city: "Austin, TX",
      phone: "+1 (555) 201-4400", emergencyPhone: "+1 (555) 201-4499", email: "hello@brightsmiledental.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:00", close: "18:00", sat: ["09:00", "14:00"] },
    staffSingular: "dentist",
    services: [
      svc("consultation", "Checkup & exam", "$75", "30 minutes", ["checkup", "check up", "checkups", "exam", "examination", "dental exam", "routine checkup"], { qty: "checkups?|exams?" }),
      svc("cleaning", "Teeth cleaning", "$95", "45 minutes", ["cleaning", "cleanings", "teeth cleaning", "scaling", "polishing", "plaque", "tartar", "deep clean", "hygienist"], { qty: "cleanings?" }),
      svc("filling", "Tooth-colored filling", "$150", "30–45 minutes", ["filling", "fillings", "cavity", "cavities", "tooth colored filling", "white filling"], { qty: "fillings?", qtyName: "fillings" }),
      svc("rootCanal", "Root canal", "$700–$1,100", "60–90 minutes", ["root canal", "root canals", "rct", "endodontic", "nerve treatment"], { qty: "root canals?", extra: "It's done under local anesthesia, so it feels much like a filling." }),
      svc("whitening", "Teeth whitening", "$299", "60 minutes", ["whitening", "whiten", "bleaching", "white teeth", "yellow teeth", "stained teeth", "stains"]),
      svc("extraction", "Tooth extraction", "$150–$300", "30–45 minutes", ["extraction", "extract", "pull tooth", "pull a tooth", "tooth removal", "pulled"], { qty: "extractions?" }),
      svc("wisdom", "Wisdom tooth removal", "$250–$450 per tooth", "45–60 minutes", ["wisdom tooth", "wisdom teeth", "wisdom"], { qty: "wisdom teeth|wisdom tooth removals?", qtyName: "wisdom teeth" }),
      svc("crown", "Crown", "$950", "2 visits", ["crown", "crowns", "tooth cap"], { qty: "crowns?" }),
      svc("implant", "Dental implant", "$2,800", "2–3 visits", ["implant", "implants", "missing tooth", "missing teeth", "replace tooth", "tooth replacement"], { from: true, qty: "implants?" }),
      svc("aligners", "Clear aligners / braces", "$3,500", "a consultation first", ["aligners", "invisalign", "braces", "straighten", "crooked teeth", "orthodontic", "orthodontics", "retainer"], { from: true }),
      svc("veneer", "Porcelain veneer", "$1,100 per tooth", "2 visits", ["veneer", "veneers", "smile makeover", "hollywood smile"], { qty: "veneers?" }),
      svc("dentures", "Dentures", "$1,500", "3–4 visits", ["denture", "dentures", "false teeth", "partial denture"], { from: true }),
      svc("kids", "Children's checkup", "$60", "30 minutes", ["kids checkup", "child checkup", "childrens checkup", "kids dentist", "pediatric dentistry", "childrens dentistry"]),
      svc("nightGuard", "Custom night guard", "$350", "2 visits", ["night guard", "mouth guard", "mouthguard", "grinding", "clenching"]),
      svc("emergencyVisit", "Emergency visit", "$120", "30 minutes", ["emergency visit", "emergency appointment", "toothache visit"], { noIntent: true })
    ],
    serviceChips: ["Checkup & exam", "Teeth cleaning", "Tooth-colored filling", "Teeth whitening", "Root canal", "Emergency visit", "Other"],
    fearTreatments: [
      { intent: "rootCanal", name: "root canal treatment", numb: true }, { intent: "wisdom", name: "wisdom tooth removal", numb: true },
      { intent: "extraction", name: "tooth extraction", numb: true }, { intent: "implant", name: "implant treatment", numb: true },
      { intent: "filling", name: "filling treatment", numb: true }, { intent: "crown", name: "crown treatment", numb: true },
      { intent: "cleaning", name: "teeth cleaning", numb: false }, { intent: "whitening", name: "teeth whitening", numb: false }
    ],
    fearText: "It's completely normal to feel nervous at the dentist — you're not alone! Our dentists are gentle, explain every step and use local anesthesia whenever it's needed, and we also offer laughing gas for anxious patients. 😊",
    insurance: "We accept most major dental plans, including Delta Dental, Aetna, Cigna, MetLife, Guardian and UnitedHealthcare. Bring your card and we'll check your benefits for you.",
    payment: "We accept cash, all major credit and debit cards, Apple Pay, Google Pay, and HSA/FSA cards. CareCredit financing is available for larger treatments.",
    newPatients: "Yes, we're happily welcoming new patients! Your first visit is a full checkup and exam, and you can book it right here in the chat.",
    firstVisit: "Your first visit includes a full exam, any X-rays you need and a friendly chat about your treatment plan — about 45 minutes. Please arrive 10 minutes early.",
    bring: "Just bring a photo ID, your dental insurance card if you have one, and a list of any medications you take. If you have recent X-rays, bring those too!",
    cancel: "We kindly ask for 24 hours' notice to cancel or reschedule. Late cancellations or missed visits may have a $40 fee.",
    parking: "Free parking is available in our lot right behind the building, including accessible spaces by the entrance.",
    durationText: "A checkup takes about 30 minutes and a cleaning about 45 minutes. Longer treatments like root canals take 60–90 minutes — your dentist will confirm at your visit.",
    welcome: "Hi there! 👋 Welcome to {business}. I can answer questions about treatments, prices and insurance, or book your appointment. How can I help?",
    closingLine: "Your appointment for {service} is booked for {date} at {time}",
    topicWords: ["tooth", "teeth", "dental", "dentist", "gum", "gums", "mouth", "jaw", "filling", "crown", "cavity", "smile", "braces", "enamel", "bite"],
    urgentWords: ["broken tooth", "broke my tooth", "broken", "knocked out", "cracked tooth", "swollen face", "face swelling", "facial swelling",
      "jaw swelling", "abscess", "severe toothache", "severe pain", "unbearable pain", "excruciating"],
    faq: [
      { id: "painQ", strong: ["toothache", "tooth pain", "tooth hurts", "teeth hurt", "sore tooth", "aching tooth"], weak: ["pain", "hurt", "ache"],
        answer: "I'm sorry you're in pain 😟. I can't assess symptoms over chat, but we keep same-day emergency slots — I can book the earliest one, or call us at {emergency}.",
        chips: ["Book earliest appointment", "Call the clinic"] },
      { id: "sensitivity", strong: ["sensitive teeth", "sensitivity", "cold hurts", "hot and cold"], weak: ["sensitive"],
        answer: "Our dentist can find out what's causing the sensitivity at a checkup ({price:consultation}) and talk you through the options.", chips: ["Book Appointment"] },
      { id: "gums", strong: ["gum disease", "gingivitis", "periodontal", "bleeding gums", "receding gums", "gums"], weak: ["gum"],
        answer: "Healthy gums matter! A checkup ({price:consultation}) is the best first step — we offer deep cleaning and gum treatments if you need them.", chips: ["Book Appointment", "Teeth cleaning"] },
      { id: "badBreath", strong: ["bad breath", "halitosis", "smelly breath"], weak: ["breath"],
        answer: "A professional cleaning and checkup usually helps a lot — our dentist will find the cause and advise you.", chips: ["Book Appointment"] },
      { id: "sedation", strong: ["sedation", "laughing gas", "nitrous", "sleep dentistry", "put me to sleep"], weak: [],
        answer: "For nervous patients we offer laughing gas for $75 — your dentist will check it's right for you at your visit.", chips: ["Book Appointment"] },
      { id: "checkupFrequency", strong: ["how often", "every 6 months", "every six months", "regular checkup"], weak: ["often"],
        answer: "We recommend a checkup and cleaning every 6 months — it keeps small problems from becoming big ones.", chips: ["Book Appointment", "Prices"] },
      { id: "kidsAge", strong: ["what age", "first dental visit", "baby teeth", "toddler", "kids", "children", "child"], weak: ["age"],
        answer: "We love seeing kids! We recommend a first visit by age 1 or when the first tooth appears. A children's checkup is {price:kids}.", chips: ["Book Appointment"] },
      { id: "xray", strong: ["x ray", "x rays", "xray", "xrays", "radiograph"], weak: [],
        answer: "We use low-dose digital X-rays ($60 for a full set), and only when your dentist needs them.", chips: ["Book Appointment"] },
      { id: "sameDayCrown", strong: ["same day crown", "one visit crown", "temporary crown"], weak: [],
        answer: "Most crowns take two visits — a temporary crown protects your tooth in between. Your dentist will confirm the plan for you.", chips: ["Book Appointment"] }
    ],
    overlaps: [["painQ", "emergency"], ["sensitivity", "painQ"], ["gums", "cleaning"], ["badBreath", "cleaning"], ["kidsAge", "kids"], ["sedation", "fear"]]
  });

  /* =====================================================================
     2. DERMATOLOGY — ClearSkin Dermatology
     ===================================================================== */
  add({
    id: "dermatology", industry: "Dermatology", icon: "drop",
    tagline: "Books skin checks and treatments, and answers insurance questions.",
    business: { name: "ClearSkin Dermatology", shortName: "ClearSkin", address: "88 Harbor Street, 2nd Floor", city: "San Diego, CA",
      phone: "+1 (555) 318-2200", emergencyPhone: "+1 (555) 318-2299", email: "care@clearskinderm.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:30", close: "17:30", sat: ["09:00", "13:00"] },
    staffSingular: "dermatologist",
    services: [
      svc("consultation", "Dermatology consultation", "$150", "30 minutes", ["consultation", "consult", "dermatologist visit", "skin consultation", "see a dermatologist", "skin problem"]),
      svc("skinCheck", "Full-body skin check", "$175", "30 minutes", ["skin check", "mole check", "full body check", "skin cancer screening", "skin screening", "mole", "moles"]),
      svc("acne", "Acne treatment plan", "$150", "30 minutes", ["acne", "pimples", "breakouts", "zits", "blackheads", "acne scars"]),
      svc("eczema", "Eczema & psoriasis care", "$150", "30 minutes", ["eczema", "psoriasis", "dermatitis", "itchy skin", "dry patches", "rash", "rashes"]),
      svc("moleRemoval", "Mole or skin tag removal", "$250", "30 minutes", ["mole removal", "remove a mole", "skin tag", "skin tags", "wart", "warts", "cyst"], { qty: "moles?|skin tags?|warts?", qtyName: "removals" }),
      svc("biopsy", "Skin biopsy", "$200", "20 minutes", ["biopsy", "biopsies"]),
      svc("chemPeel", "Chemical peel", "$180", "45 minutes", ["chemical peel", "peel", "peels"], { qty: "peels?|chemical peels?" }),
      svc("laser", "Laser skin resurfacing", "$450", "60 minutes", ["laser", "resurfacing", "laser treatment", "sun damage", "age spots", "pigmentation"], { from: true }),
      svc("rosacea", "Rosacea treatment", "$150", "30 minutes", ["rosacea", "redness", "flushing", "red face"]),
      svc("hairLoss", "Hair & scalp consultation", "$150", "30 minutes", ["hair loss", "thinning hair", "scalp", "dandruff", "alopecia"]),
      svc("nail", "Nail condition visit", "$150", "30 minutes", ["nail", "nails", "nail fungus", "ingrown nail"]),
      svc("botox", "Cosmetic Botox", "$12 per unit", "20 minutes", ["botox", "wrinkles", "fine lines", "frown lines"]),
      svc("followUp", "Follow-up visit", "$95", "20 minutes", ["follow up", "followup", "follow-up", "review visit"])
    ],
    insurance: "We're in network with Aetna, Blue Cross Blue Shield, Cigna, UnitedHealthcare, Humana and Medicare. Medical visits are usually covered; cosmetic treatments like peels, laser and Botox are self-pay.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay, cash, and HSA/FSA cards for medical visits.",
    newPatients: "Yes, we're accepting new patients! New patients start with a consultation ({price:consultation}) or a full-body skin check.",
    firstVisit: "Your dermatologist will go through your history and concerns, examine your skin and talk you through a plan — about 30 minutes. Please come with clean skin, no makeup on the area.",
    bring: "Please bring a photo ID, your insurance card, a list of the skin products and medications you use, and any previous biopsy reports.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule. Missed appointments or late cancellations have a $50 fee.",
    parking: "There's a parking garage under the building — we validate 2 hours of free parking at the front desk.",
    durationText: "Most dermatology visits take about 30 minutes; laser treatments and peels take 45–60 minutes.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about skin checks, treatments, prices or insurance — or I can book your visit.",
    topicWords: ["skin", "dermatology", "dermatologist", "acne", "mole", "rash", "eczema", "scar", "wrinkles", "face", "itch"],
    urgentWords: ["rapidly spreading rash", "face swelling", "lips swelling", "blistering all over", "severe burn"],
    faq: [
      { id: "skinCancer", strong: ["skin cancer", "melanoma", "changing mole", "mole changed", "new mole"], weak: [],
        answer: "Please don't wait on a changing mole — I can't assess it over chat, but a full-body skin check ({price:skinCheck}) lets our dermatologist look properly. Shall I book the earliest one?",
        chips: ["Book earliest appointment"] },
      { id: "cosmeticCover", strong: ["is botox covered", "cosmetic covered", "insurance cover botox", "insurance cover laser"], weak: [],
        answer: "Cosmetic treatments like Botox, peels and laser aren't covered by insurance, but medical skin conditions usually are.", chips: ["Prices"] },
      { id: "skinCheckFreq", strong: ["how often skin check", "yearly skin check", "annual skin check", "how often should i"], weak: ["often"],
        answer: "Most adults benefit from a skin check once a year — your dermatologist will tell you what's right for you.", chips: ["Book Appointment"] },
      { id: "makeup", strong: ["makeup", "make up", "wear makeup", "skincare routine"], weak: [],
        answer: "Please come with clean skin on the area being checked — it helps your dermatologist see everything clearly.", chips: ["What to bring"] },
      { id: "kidsDerm", strong: ["child", "children", "kids", "teen", "teenager", "baby"], weak: [],
        answer: "Yes, we see children and teens — a parent or guardian needs to come along for patients under 18.", chips: ["Book Appointment"] },
      { id: "biopsyResults", strong: ["biopsy results", "when results", "how long for results", "results back"], weak: [],
        answer: "Biopsy results usually come back within 7–10 days, and your dermatologist will call you to go through them.", chips: ["Book Appointment"] },
      { id: "sunscreen", strong: ["sunscreen", "spf", "sun protection", "which cream", "what cream", "which product"], weak: [],
        answer: "Your dermatologist will guide you on products that suit your skin during your visit.", chips: ["Book Appointment"] }
    ],
    overlaps: [["skinCancer", "skinCheck"], ["biopsyResults", "biopsy"], ["cosmeticCover", "insurance"], ["cosmeticCover", "botox"]]
  });

  /* =====================================================================
     3. PLASTIC SURGERY — Elite Aesthetic Surgery (cosmetic)
     ===================================================================== */
  add({
    id: "plasticsurgery", industry: "Plastic Surgery", icon: "scalpel", cosmetic: true,
    tagline: "Books consultations, shares starting prices and sets honest expectations.",
    business: { name: "Elite Aesthetic Surgery", shortName: "Elite Aesthetic", address: "1500 Ocean Drive, Suite 900", city: "Miami, FL",
      phone: "+1 (555) 407-9100", emergencyPhone: "+1 (555) 407-9199", email: "consult@eliteaestheticsurgery.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "09:00", close: "17:00", sat: ["10:00", "14:00"] },
    staffSingular: "surgeon", noun: "consultation", nounPlural: "consultations", duration: 45, slotMinutes: 45,
    consultPrice: "$150 (credited toward your procedure)",
    services: [
      svc("consultation", "Surgical consultation", "$150", "45 minutes", ["consultation", "consult", "surgical consultation", "meet the surgeon"], { noIntent: true }),
      svc("rhinoplasty", "Rhinoplasty (nose job)", "$8,500", "", ["rhinoplasty", "nose job", "nose surgery", "nose reshaping", "nose"], { from: true }),
      svc("breastAug", "Breast augmentation", "$7,500", "", ["breast augmentation", "breast implants", "boob job", "breast enlargement"], { from: true }),
      svc("breastLift", "Breast lift", "$8,000", "", ["breast lift", "mastopexy"], { from: true }),
      svc("breastReduction", "Breast reduction", "$8,500", "", ["breast reduction", "reduce breasts"], { from: true }),
      svc("lipo", "Liposuction", "$4,500 per area", "", ["liposuction", "lipo", "fat removal", "stubborn fat"], { from: true, qty: "areas?", qtyName: "areas of liposuction" }),
      svc("tummyTuck", "Tummy tuck", "$9,500", "", ["tummy tuck", "abdominoplasty", "loose skin", "belly"], { from: true }),
      svc("facelift", "Facelift", "$14,000", "", ["facelift", "face lift", "neck lift", "sagging skin"], { from: true }),
      svc("eyelid", "Eyelid surgery", "$5,000", "", ["eyelid", "eyelids", "blepharoplasty", "droopy eyelids", "eye bags"], { from: true }),
      svc("bbl", "Brazilian butt lift", "$11,000", "", ["bbl", "brazilian butt lift", "butt lift"], { from: true }),
      svc("mommyMakeover", "Mommy makeover", "$15,000", "", ["mommy makeover", "after pregnancy body", "post pregnancy"], { from: true }),
      svc("otoplasty", "Ear pinning (otoplasty)", "$5,500", "", ["otoplasty", "ear pinning", "ear surgery", "ears stick out"], { from: true }),
      svc("chin", "Chin augmentation", "$4,500", "", ["chin", "chin implant", "chin augmentation"], { from: true })
    ],
    serviceChips: ["Surgical consultation", "Rhinoplasty (nose job)", "Breast augmentation", "Liposuction", "Tummy tuck", "Facelift", "Other"],
    servicePrompt: "Which <b>procedure</b> would you like to discuss at your consultation?",
    serviceLabel: "Procedure",
    insurance: "Cosmetic procedures aren't covered by insurance. Some reconstructive procedures, like certain breast reductions, may be partly covered — we'll check with your insurer after your consultation.",
    payment: "We accept all major credit cards, cash, cashier's checks and wire transfer, and we offer financing through CareCredit and Alphaeon.",
    financing: "Yes — we offer monthly financing through CareCredit and Alphaeon, and our coordinator will walk you through the options after your consultation.",
    newPatients: "Yes, we welcome new patients! Everything starts with a private consultation ({price:consultation}) with one of our board-certified surgeons.",
    firstVisit: "Your consultation is a private, relaxed 45-minute meeting: your surgeon listens to your goals, examines the area, explains options and risks, and you get your final price. There's no pressure to book.",
    bring: "Bring a photo ID, a list of your medications and past surgeries, and any photos that show the look you'd like.",
    cancel: "Please give us 48 hours' notice to cancel or reschedule a consultation. Surgery dates have their own deposit policy, which we explain in writing.",
    parking: "Complimentary valet parking is available at the building entrance.",
    downtime: "Recovery depends on the procedure — often 1–2 weeks before returning to desk work. Your surgeon will give you a personal recovery plan at your consultation.",
    durationText: "Consultations take about 45 minutes. Surgery time depends on the procedure, and your surgeon will explain it at your consultation.",
    welcome: "Hello and welcome to {business}. 👋 I can answer questions about procedures and starting prices, or book your private consultation.",
    quickReplies: ["Book consultation", "Procedures & prices", "Financing", "Timings"],
    closingLine: "Your consultation for {service} is booked for {date} at {time}",
    topicWords: ["surgery", "surgeon", "plastic", "cosmetic", "procedure", "breast", "nose", "lipo", "body", "face"],
    faq: [
      { id: "boardCertified", strong: ["board certified", "certified", "qualified surgeon", "credentials"], weak: [],
        answer: "All our surgeons are board-certified plastic surgeons with many years of experience. You can request a specific surgeon when you book.", chips: ["Book consultation"] },
      { id: "anesthesia", strong: ["anesthesia", "anaesthesia", "general anesthesia", "put to sleep", "awake during"], weak: [],
        answer: "Most procedures use general anesthesia given by a board-certified anesthesiologist — your surgeon will explain exactly what applies to you.", chips: ["Book consultation"] },
      { id: "risks", strong: ["risks", "risk", "complications", "is it safe", "dangerous"], weak: ["safe"],
        answer: "Every surgery has some risks, and your surgeon will explain them honestly at your consultation so you can make a confident decision.", chips: ["Book consultation"] },
      { id: "scars", strong: ["scar", "scars", "scarring", "visible scar"], weak: [],
        answer: "Our surgeons place incisions as discreetly as possible — they'll show you where for your procedure at the consultation.", chips: ["Book consultation"] },
      { id: "virtualConsult", strong: ["virtual consultation", "online consultation", "video consultation", "out of town", "from another state"], weak: [],
        answer: "Yes — we offer virtual consultations for out-of-town patients, followed by an in-person visit before surgery.", chips: ["Book consultation"] },
      { id: "deposit", strong: ["deposit", "booking fee", "surgery deposit"], weak: [],
        answer: "Surgery dates are secured with a deposit, which is explained in writing after your consultation. The consultation fee is credited toward your procedure.", chips: ["Financing"] }
    ],
    overlaps: [["risks", "safety"]]
  });

  /* =====================================================================
     4. HAIR TRANSPLANT — RootRestore Hair Clinic (cosmetic)
     ===================================================================== */
  add({
    id: "hairtransplant", industry: "Hair Transplant", icon: "hair", cosmetic: true,
    tagline: "Books hair-loss consultations and explains FUE, FUT and PRP honestly.",
    business: { name: "RootRestore Hair Clinic", shortName: "RootRestore", address: "620 Peachtree Street NE, Suite 410", city: "Atlanta, GA",
      phone: "+1 (555) 404-7720", emergencyPhone: "+1 (555) 404-7729", email: "hello@rootrestorehair.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "09:00", close: "18:00", sat: ["09:00", "14:00"] },
    staffSingular: "hair restoration specialist", noun: "consultation", nounPlural: "consultations", duration: 45, slotMinutes: 45,
    consultPrice: "Free",
    services: [
      svc("consultation", "Hair-loss consultation", "Free", "45 minutes", ["consultation", "consult", "hair loss consultation", "assessment", "scalp analysis"], { noIntent: true }),
      svc("fue", "FUE hair transplant", "$4 per graft", "", ["fue", "hair transplant", "transplant", "follicular unit extraction", "grafts", "graft"], { from: true, qty: "grafts?", qtyName: "grafts", big: true }),
      svc("fut", "FUT (strip) hair transplant", "$3.50 per graft", "", ["fut", "strip method", "strip surgery", "follicular unit transplantation"], { from: true }),
      svc("beard", "Beard transplant", "$5,000", "", ["beard transplant", "beard", "facial hair"], { from: true }),
      svc("eyebrow", "Eyebrow transplant", "$3,500", "", ["eyebrow transplant", "eyebrows", "eyebrow"], { from: true }),
      svc("prp", "PRP scalp therapy", "$650 per session", "60 minutes", ["prp", "platelet rich plasma", "prp therapy", "prp injections"], { qty: "prp sessions?|sessions?", qtyName: "PRP sessions" }),
      svc("smp", "Scalp micropigmentation", "$2,500", "", ["scalp micropigmentation", "smp", "hair tattoo"], { from: true }),
      svc("laserCap", "Low-level laser therapy", "$95 per session", "30 minutes", ["laser therapy", "laser cap", "lllt", "red light"]),
      svc("crown", "Crown restoration", "$6,000", "", ["crown", "bald spot", "thinning crown", "top of head"], { from: true }),
      svc("hairline", "Hairline restoration", "$5,500", "", ["hairline", "receding hairline", "temples", "widow's peak"], { from: true }),
      svc("female", "Women's hair restoration", "$5,000", "", ["female hair loss", "women hair loss", "womens hair", "thinning part"], { from: true }),
      svc("repair", "Transplant repair", "$6,500", "", ["repair", "bad transplant", "corrective", "fix previous transplant"], { from: true })
    ],
    serviceChips: ["Hair-loss consultation", "FUE hair transplant", "PRP scalp therapy", "Beard transplant", "Hairline restoration", "Scalp micropigmentation", "Other"],
    servicePrompt: "What would you like to discuss at your consultation? Tap an option or tell me in your own words.",
    insurance: "Hair restoration is a cosmetic treatment, so it isn't covered by insurance — but we offer 0% financing options.",
    payment: "We accept all major credit and debit cards, cash and bank transfer, plus monthly financing through CareCredit and Prosper Healthcare Lending.",
    financing: "Yes — 0% financing for up to 12 months is available through CareCredit, and longer plans through Prosper. Our coordinator will explain after your consultation.",
    newPatients: "Yes! Every new patient starts with a free 45-minute consultation and scalp analysis.",
    firstVisit: "At your free consultation, our specialist examines your scalp, measures your donor area, explains which option suits you and gives your final price. No pressure at all.",
    bring: "Bring a photo ID, a list of your medications, and photos of your hair from a few years ago if you have them.",
    cancel: "Please give us 24 hours' notice to move a consultation, and 7 days for procedure dates — deposits are explained in writing.",
    parking: "Free parking is available in the Peachtree Center garage — we validate your ticket.",
    downtime: "Most patients return to desk work within 3–5 days after FUE. New hair usually starts growing around month 3–4, with fuller results over 12 months — but everyone is different.",
    durationText: "A consultation takes about 45 minutes. A transplant usually takes a full day, and our specialist will explain your plan at the consultation.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about FUE, PRP, prices or recovery — or I can book your free consultation.",
    quickReplies: ["Book consultation", "Treatments & prices", "Financing", "Recovery"],
    closingLine: "Your consultation for {service} is booked for {date} at {time}",
    topicWords: ["hair", "hairline", "bald", "balding", "scalp", "graft", "grafts", "transplant", "thinning", "beard"],
    faq: [
      { id: "howManyGrafts", strong: ["how many grafts", "number of grafts", "grafts do i need", "how many hairs"], weak: [],
        answer: "The number of grafts depends on your hair loss and donor area — typically 1,500 to 3,500. Our specialist will measure it at your free consultation.", chips: ["Book consultation"] },
      { id: "painTransplant", fearAnswer: true, strong: ["does it hurt", "is it painful", "painful", "hurt"], weak: [],
        answer: "The procedure is done under local anesthesia, so most patients feel very little and relax, watch TV or nap during it. 😊", chips: ["Book consultation"] },
      { id: "permanent", strong: ["permanent", "last forever", "will it fall out", "last long"], weak: [],
        answer: "Transplanted hair usually comes from areas resistant to hair loss, but everyone is different — our specialist will explain what to expect for you.", chips: ["Book consultation"] },
      { id: "fueVsFut", strong: ["fue vs fut", "fue or fut", "difference between fue", "which method", "fue versus fut"], weak: [],
        answer: "FUE takes individual follicles and leaves tiny dot scars; FUT removes a thin strip and leaves a fine line. Our specialist will recommend what suits you at your consultation.", chips: ["Book consultation"] },
      { id: "shaveHead", strong: ["shave", "shaved", "shave my head"], weak: [],
        answer: "For FUE, the donor area is usually trimmed short; some options allow unshaven FUE. We'll go over it at your consultation.", chips: ["Book consultation"] },
      { id: "ageHair", strong: ["what age", "too young", "how old", "age"], weak: [],
        answer: "Patients need to be at least 21 for a transplant, since hair loss needs to settle first. Younger patients can start with a consultation.", chips: ["Book consultation"] }
    ],
    overlaps: [["painTransplant", "fue"], ["howManyGrafts", "fue"], ["permanent", "outcome"], ["fueVsFut", "fue"], ["fueVsFut", "fut"]]
  });

  /* =====================================================================
     5. MEDSPA — Glow MedSpa (cosmetic)
     ===================================================================== */
  add({
    id: "medspa", industry: "Medical Spa", icon: "syringe", cosmetic: true,
    tagline: "Books Botox, filler and laser consultations with clear starting prices.",
    business: { name: "Glow MedSpa", shortName: "Glow MedSpa", address: "310 Scottsdale Road, Suite 120", city: "Scottsdale, AZ",
      phone: "+1 (555) 480-3300", emergencyPhone: "+1 (555) 480-3399", email: "hello@glowmedspa.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "10:00", close: "19:00", sat: ["09:00", "17:00"] },
    staffSingular: "provider", consultPrice: "Free",
    services: [
      svc("consultation", "Aesthetic consultation", "Free", "30 minutes", ["consultation", "consult", "skin consultation", "aesthetic consultation"], { noIntent: true }),
      svc("botox", "Botox", "$13 per unit", "20 minutes", ["botox", "dysport", "xeomin", "wrinkles", "forehead lines", "crows feet", "frown lines"], { qty: "units?", qtyName: "units of Botox" }),
      svc("filler", "Dermal filler", "$700 per syringe", "45 minutes", ["filler", "fillers", "dermal filler", "juvederm", "restylane", "cheek filler"], { qty: "syringes?|fillers?", qtyName: "syringes of filler" }),
      svc("lipFiller", "Lip filler", "$650", "30 minutes", ["lip filler", "lip fillers", "lips", "lip flip", "fuller lips"]),
      svc("hydrafacial", "HydraFacial", "$199", "45 minutes", ["hydrafacial", "hydra facial", "facial", "facials"], { qty: "facials?|hydrafacials?" }),
      svc("microneedling", "Microneedling", "$350", "60 minutes", ["microneedling", "micro needling", "collagen induction"], { qty: "microneedling sessions?" }),
      svc("laserHair", "Laser hair removal", "$150 per session", "30 minutes", ["laser hair removal", "hair removal", "laser"], { from: true }),
      svc("chemPeel", "Chemical peel", "$175", "45 minutes", ["chemical peel", "peel", "peels"]),
      svc("ipl", "IPL photofacial", "$350", "45 minutes", ["ipl", "photofacial", "sun spots", "brown spots"]),
      svc("kybella", "Kybella (double chin)", "$600 per vial", "30 minutes", ["kybella", "double chin"]),
      svc("ivDrip", "IV vitamin drip", "$175", "45 minutes", ["iv drip", "iv therapy", "vitamin drip", "iv"]),
      svc("prpFacial", "PRP facial", "$600", "75 minutes", ["prp facial", "vampire facial"]),
      svc("bodyContour", "Body contouring", "$750 per area", "60 minutes", ["body contouring", "coolsculpting", "fat freezing", "emsculpt"], { from: true })
    ],
    serviceChips: ["Botox", "Dermal filler", "Lip filler", "HydraFacial", "Microneedling", "Laser hair removal", "Other"],
    insurance: "MedSpa treatments are cosmetic, so they aren't covered by insurance. We keep our prices clear and upfront instead.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay and cash, and we offer financing through Cherry and CareCredit.",
    financing: "Yes — flexible monthly payments are available through Cherry and CareCredit, with quick approval at the front desk.",
    newPatients: "Yes, we'd love to meet you! New clients start with a free consultation so your provider can plan the right treatment.",
    firstVisit: "Your provider will talk through your goals, look at your skin and explain which treatments suit you and your final price. Many treatments can be done the same day.",
    bring: "Just bring a photo ID and a list of your medications and past treatments. Please come without makeup if you're having a facial treatment.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule — late cancellations have a $50 fee.",
    parking: "Free parking right in front of the spa, with shaded spots on the side.",
    downtime: "Most MedSpa treatments have little to no downtime — you may see some redness or small bruises for a day or two. Your provider will explain aftercare at your visit.",
    durationText: "Botox takes about 20 minutes, fillers about 45 minutes, and facials 45–60 minutes.",
    welcome: "Hi gorgeous! 👋 Welcome to {business}. Ask me about Botox, fillers, facials or prices — or I can book your free consultation.",
    quickReplies: ["Book consultation", "Treatments & prices", "Specials", "Timings"],
    closingLine: "Your appointment for {service} is booked for {date} at {time}",
    topicWords: ["spa", "medspa", "botox", "filler", "facial", "skin", "laser", "lips", "wrinkles", "glow"],
    faq: [
      { id: "botoxLast", strong: ["how long does botox last", "botox last", "filler last", "how long does filler last", "how long will it last"], weak: [],
        answer: "Botox typically lasts 3–4 months and fillers 6–18 months, but everyone is different — your provider will explain what to expect.", chips: ["Book consultation"] },
      { id: "botoxUnits", strong: ["how many units", "units do i need"], weak: [],
        answer: "It depends on the area and your goals — foreheads often need 10–20 units. Your provider will confirm at your consultation.", chips: ["Book consultation"] },
      { id: "painMedspa", fearAnswer: true, strong: ["does it hurt", "is it painful", "painful", "numbing"], weak: [],
        answer: "Most clients find it very tolerable — we use numbing cream and fine needles to keep you comfortable. 😊", chips: ["Book consultation"] },
      { id: "specials", strong: ["specials", "membership", "memberships", "loyalty", "packages", "package"], weak: [],
        answer: "We offer monthly memberships and treatment packages — ask our team at {phone} for this month's specials.", chips: ["Prices"] },
      { id: "whoInjects", strong: ["who injects", "nurse injector", "injector", "who does the botox", "licensed"], weak: [],
        answer: "All injectables are done by licensed nurse practitioners and physician assistants under our medical director.", chips: ["Book consultation"] },
      { id: "afterBotox", strong: ["after botox", "exercise after", "makeup after", "lie down after"], weak: [],
        answer: "Your provider will give you simple aftercare tips — usually no heavy exercise or lying flat for a few hours.", chips: ["Book consultation"] }
    ],
    overlaps: [["lipFiller", "filler"], ["prpFacial", "prp"], ["botoxLast", "duration"], ["botoxLast", "botox"], ["botoxLast", "filler"], ["botoxUnits", "botox"], ["painMedspa", "botox"], ["specials", "discount"]]
  });

  /* =====================================================================
     6. EYE CARE — VisionPlus Eye Care
     ===================================================================== */
  add({
    id: "eye", industry: "Eye Care", icon: "eye",
    tagline: "Books eye exams and contact-lens fittings, and answers vision-plan questions.",
    business: { name: "VisionPlus Eye Care", shortName: "VisionPlus", address: "455 Lakeshore Boulevard", city: "Chicago, IL",
      phone: "+1 (555) 312-6600", emergencyPhone: "+1 (555) 312-6699", email: "see@visionpluseyecare.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "09:00", close: "18:00", sat: ["09:00", "15:00"] },
    staffSingular: "eye doctor", staffPlural: "eye doctors",
    dropWords: { medication: ["prescription"] },
    services: [
      svc("eyeExam", "Comprehensive eye exam", "$120", "45 minutes", ["eye exam", "eye test", "eye check", "vision test", "sight test", "eye checkup", "check my eyes", "glasses prescription", "new glasses"], { qty: "eye exams?" }),
      svc("contacts", "Contact lens exam & fitting", "$160", "60 minutes", ["contact lens", "contact lenses", "contacts", "lens fitting"]),
      svc("kidsExam", "Children's eye exam", "$90", "30 minutes", ["childrens eye exam", "kids eye exam", "child eye exam", "school eye test"]),
      svc("dryEye", "Dry eye treatment", "$150", "45 minutes", ["dry eye", "dry eyes", "gritty eyes", "watery eyes"]),
      svc("lasikConsult", "LASIK consultation", "Free", "60 minutes", ["lasik", "laser eye surgery", "laser vision", "prk", "get rid of glasses"]),
      svc("glaucoma", "Glaucoma screening", "$95", "30 minutes", ["glaucoma", "eye pressure"]),
      svc("diabeticEye", "Diabetic eye exam", "$130", "45 minutes", ["diabetic eye exam", "diabetes eye", "retina check", "retinal exam"]),
      svc("cataract", "Cataract evaluation", "$150", "45 minutes", ["cataract", "cataracts", "cloudy vision"]),
      svc("pinkEye", "Red or irritated eye visit", "$110", "20 minutes", ["pink eye", "red eye", "itchy eyes", "eye infection", "stye", "irritated eye"]),
      svc("glasses", "Designer frames", "$149", "", ["frames", "designer frames", "eyeglass frames", "sunglasses", "spectacles"], { from: true }),
      svc("myopia", "Myopia control for kids", "$250", "45 minutes", ["myopia", "myopia control", "nearsighted child", "ortho k"], { from: true })
    ],
    serviceChips: ["Comprehensive eye exam", "Contact lens exam & fitting", "Children's eye exam", "Dry eye treatment", "LASIK consultation", "Red or irritated eye visit", "Other"],
    insurance: "We accept VSP, EyeMed, Davis Vision, Spectera and most medical plans for eye health visits. Bring your card and we'll check your benefits.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay, cash, and HSA/FSA cards — glasses and contacts are HSA-eligible too.",
    newPatients: "Yes, we're welcoming new patients of all ages! A comprehensive eye exam is the perfect first visit.",
    firstVisit: "Your eye exam checks your vision and your eye health, and may include dilating drops — plan for about 45 minutes and bring sunglasses in case your eyes are dilated.",
    bring: "Please bring your current glasses and contact lenses (or their boxes), a photo ID, your vision insurance card and a list of your medications.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule. Missed appointments may have a $35 fee.",
    parking: "Free 2-hour street parking on Lakeshore Boulevard, plus a public lot behind the building.",
    durationText: "A comprehensive eye exam takes about 45 minutes, and a contact lens fitting about an hour.",
    welcome: "Hi! 👋 Welcome to {business}. I can answer questions about eye exams, contacts, frames and vision plans — or book your appointment.",
    topicWords: ["eye", "eyes", "vision", "sight", "glasses", "contacts", "lens", "lenses", "optometrist", "blurry"],
    urgentWords: ["sudden vision loss", "lost vision", "cant see", "sudden blindness", "chemical in my eye", "something in my eye", "eye injury",
      "hit in the eye", "flashes and floaters", "curtain over my vision", "severe eye pain"],
    safetyWords: ["pregnant", "pregnancy", "breastfeeding", "allergic", "allergy", "allergies", "side effect", "side effects", "eye drops safe"],
    faq: [
      { id: "dilation", strong: ["dilate", "dilated", "dilation", "dilating drops", "can i drive after"], weak: [],
        answer: "Dilating drops can make your vision blurry and light-sensitive for 4–6 hours, so bring sunglasses — and it's best to have someone drive you.", chips: ["Book Appointment"] },
      { id: "examFrequency", strong: ["how often eye exam", "how often should i", "every year", "every two years"], weak: ["often"],
        answer: "Most adults should have an eye exam every 1–2 years, and children once a year — your eye doctor will advise you.", chips: ["Book Appointment"] },
      { id: "glassesReady", strong: ["how long for glasses", "glasses ready", "when will my glasses", "pick up glasses"], weak: [],
        answer: "Most glasses are ready in 7–10 days, and we'll text you when they're in.", chips: ["Timings"] },
      { id: "eyeDrops", strong: ["eye drops", "which drops", "what drops"], weak: [],
        answer: "Your eye doctor will guide you on that during your visit. If your eyes are bothering you now, please call us at {phone}.", chips: ["Book earliest appointment"] },
      { id: "blurry", strong: ["blurry vision", "blurry", "cant see well", "seeing double", "floaters"], weak: [],
        answer: "I'm not able to assess vision changes over chat — our eye doctors will check properly. If it came on suddenly, please call 911 or go to the ER; otherwise I can book the earliest exam.", chips: ["Book earliest appointment"] },
      { id: "screenTime", strong: ["screen time", "blue light", "computer glasses", "eye strain"], weak: [],
        answer: "We offer blue-light and computer lenses, and your eye doctor can check for eye strain at your exam.", chips: ["Book Appointment"] }
    ],
    overlaps: [["glassesReady", "glasses"], ["eyeDrops", "dryEye"], ["blurry", "eyeExam"]]
  });

  /* =====================================================================
     7. PHYSIOTHERAPY — MoveWell Physiotherapy
     ===================================================================== */
  add({
    id: "physio", industry: "Physiotherapy", icon: "walk",
    tagline: "Books assessments and rehab sessions, and explains insurance and packages.",
    business: { name: "MoveWell Physiotherapy", shortName: "MoveWell", address: "72 Riverside Drive", city: "Denver, CO",
      phone: "+1 (555) 720-5100", emergencyPhone: "+1 (555) 720-5199", email: "hello@movewellphysio.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "07:00", close: "19:00", sat: ["08:00", "13:00"] },
    staffSingular: "physiotherapist", duration: 45, slotMinutes: 45,
    services: [
      svc("assessment", "Initial assessment", "$120", "60 minutes", ["assessment", "initial assessment", "evaluation", "first session"]),
      svc("followUp", "Follow-up session", "$90", "45 minutes", ["follow up", "followup", "session", "treatment session"], { qty: "sessions?", qtyName: "sessions" }),
      svc("sports", "Sports injury rehab", "$95", "45 minutes", ["sports injury", "sprain", "sprained ankle", "acl", "hamstring", "runner", "tennis elbow"]),
      svc("back", "Back & neck pain therapy", "$95", "45 minutes", ["back pain", "neck pain", "lower back", "sciatica", "stiff neck", "posture"]),
      svc("postSurgery", "Post-surgery rehab", "$100", "45 minutes", ["post surgery", "after surgery", "knee replacement", "hip replacement", "rehab"]),
      svc("dryNeedling", "Dry needling", "$75", "30 minutes", ["dry needling", "needling", "trigger point"]),
      svc("massage", "Therapeutic massage", "$85", "45 minutes", ["massage", "sports massage", "deep tissue", "soft tissue"]),
      svc("pelvic", "Pelvic floor therapy", "$120", "60 minutes", ["pelvic floor", "pelvic", "incontinence", "postpartum"]),
      svc("vestibular", "Vertigo & balance therapy", "$110", "45 minutes", ["vertigo", "dizziness", "balance", "vestibular"]),
      svc("shoulder", "Shoulder & knee therapy", "$95", "45 minutes", ["shoulder", "frozen shoulder", "rotator cuff", "knee", "knee pain"]),
      svc("package", "6-session package", "$480", "", ["package", "packages", "bundle", "6 sessions"])
    ],
    serviceChips: ["Initial assessment", "Back & neck pain therapy", "Sports injury rehab", "Post-surgery rehab", "Therapeutic massage", "Follow-up session", "Other"],
    insurance: "We're in network with Aetna, Blue Cross Blue Shield, Cigna, UnitedHealthcare and Medicare, and we can bill auto-accident and workers' comp claims.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay, cash, and HSA/FSA cards.",
    newPatients: "Yes, we're welcoming new patients! Your first visit is a 60-minute assessment, and you don't need a doctor's referral.",
    firstVisit: "Your physiotherapist will ask about your history, assess how you move, explain what they find and start your first treatment — about 60 minutes. Please wear comfortable clothes.",
    bring: "Wear comfortable clothes you can move in, and bring a photo ID, your insurance card, any scans or surgery notes and a list of your medications.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule — late cancellations have a $40 fee.",
    parking: "Free parking in our own lot, with accessible spaces right by the door.",
    referral: "No referral needed — you can book directly with us. Some insurance plans (like Medicare) need a doctor's referral for coverage, so check your plan.",
    durationText: "Your first assessment takes about 60 minutes, and follow-up sessions about 45 minutes.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about treatments, prices or insurance — or I can book your assessment.",
    topicWords: ["physio", "physiotherapy", "physical therapy", "rehab", "injury", "back", "knee", "shoulder", "neck", "muscle", "joint", "stretch"],
    urgentWords: ["cant move my legs", "numbness in both legs", "lost bladder control", "sudden weakness"],
    faq: [
      { id: "howManySessions", strong: ["how many sessions", "how many visits", "how long until better", "how many treatments"], weak: [],
        answer: "It depends on you and your goals — many people feel a real difference within 4–6 sessions. Your physiotherapist will give you a clear plan after the assessment.", chips: ["Book Appointment"] },
      { id: "wear", strong: ["what to wear", "what should i wear", "clothes", "shorts"], weak: ["wear"],
        answer: "Please wear comfortable clothes you can move in — shorts are great for knee or hip problems.", chips: ["Book Appointment"] },
      { id: "exercises", strong: ["exercises", "home exercises", "stretches", "workout plan"], weak: [],
        answer: "Yes — your physiotherapist will give you a personal home exercise plan, with videos in our app.", chips: ["Book Appointment"] },
      { id: "painPhysio", strong: ["pain", "hurts", "sore", "aching", "injured"], weak: [],
        answer: "Sorry to hear that! I can't assess symptoms over chat, but an initial assessment ({price:assessment}) is the best place to start. Shall I book one?", chips: ["Book Appointment"] },
      { id: "carAccident", strong: ["car accident", "auto accident", "whiplash", "workers comp", "work injury"], weak: [],
        answer: "Yes, we treat car accident and work injuries, and can bill auto insurance or workers' comp directly.", chips: ["Book Appointment", "Insurance"] }
    ],
    overlaps: [["howManySessions", "followUp"], ["painPhysio", "diagnosis"]]
  });

  /* =====================================================================
     8. CHIROPRACTIC — AlignRight Chiropractic
     ===================================================================== */
  add({
    id: "chiro", industry: "Chiropractic", icon: "spine",
    tagline: "Books adjustments and new-patient exams, and explains care plans.",
    business: { name: "AlignRight Chiropractic", shortName: "AlignRight", address: "1900 Elm Street, Unit B", city: "Dallas, TX",
      phone: "+1 (555) 214-8800", emergencyPhone: "+1 (555) 214-8899", email: "front@alignrightchiro.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:00", close: "18:30", sat: ["09:00", "12:00"] },
    staffSingular: "chiropractor", duration: 30,
    services: [
      svc("newExam", "New patient exam & adjustment", "$89", "45 minutes", ["new patient exam", "exam", "evaluation", "first adjustment"]),
      svc("adjustment", "Chiropractic adjustment", "$65", "20 minutes", ["adjustment", "adjustments", "crack my back", "spinal adjustment", "alignment"], { qty: "adjustments?", qtyName: "adjustments" }),
      svc("xray", "Spinal X-rays", "$95", "15 minutes", ["x ray", "xray", "x rays", "spinal x ray"]),
      svc("massage", "Massage therapy", "$80", "45 minutes", ["massage", "deep tissue", "sports massage"]),
      svc("decompression", "Spinal decompression", "$75", "30 minutes", ["decompression", "spinal decompression", "herniated disc", "bulging disc", "disc"]),
      svc("sports", "Sports chiropractic", "$75", "30 minutes", ["sports chiropractic", "athlete", "sports injury"]),
      svc("prenatal", "Prenatal chiropractic", "$75", "30 minutes", ["prenatal chiropractic", "webster technique", "pregnancy back pain"]),
      svc("kids", "Pediatric chiropractic", "$55", "20 minutes", ["kids chiropractic", "pediatric chiropractic", "child adjustment"]),
      svc("headache", "Headache & neck care", "$65", "20 minutes", ["headache", "headaches", "migraine", "neck", "stiff neck", "tension"]),
      svc("backPain", "Back pain & sciatica care", "$65", "20 minutes", ["back pain", "lower back", "sciatica", "back"]),
      svc("plan", "10-visit care plan", "$550", "", ["care plan", "package", "10 visits", "membership"])
    ],
    serviceChips: ["New patient exam & adjustment", "Chiropractic adjustment", "Back pain & sciatica care", "Headache & neck care", "Massage therapy", "Spinal decompression", "Other"],
    insurance: "We accept Blue Cross Blue Shield, Aetna, Cigna, UnitedHealthcare and Medicare for chiropractic care, plus auto-accident claims. Bring your card and we'll check your coverage.",
    payment: "We accept all major credit and debit cards, Apple Pay, cash, and HSA/FSA cards.",
    newPatients: "Yes, we're welcoming new patients! Your first visit is an exam and adjustment for just {price:newExam}.",
    firstVisit: "Your chiropractor will go over your history, check your posture and movement, take X-rays only if needed, and usually give you your first adjustment — about 45 minutes.",
    bring: "Wear comfortable clothes, and bring a photo ID, your insurance card, any recent scans and a list of your medications.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule — missed visits may have a $30 fee.",
    parking: "Free parking right outside our door in the Elm Street plaza lot.",
    durationText: "A new patient visit takes about 45 minutes, and regular adjustments about 20 minutes.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about adjustments, prices or insurance — or I can book your visit.",
    topicWords: ["chiropractor", "chiropractic", "spine", "back", "neck", "adjustment", "posture", "alignment", "sciatica"],
    urgentWords: ["cant move my legs", "numbness in both legs", "lost bladder control", "sudden weakness", "worst headache of my life"],
    faq: [
      { id: "cracking", fearAnswer: true, strong: ["cracking sound", "popping sound", "does it hurt", "is it painful", "painful"], weak: [],
        answer: "Adjustments are usually comfortable — the popping sound is just gas releasing from the joint. Your chiropractor will always explain first and go at your pace. 😊", chips: ["Book Appointment"] },
      { id: "howOften", strong: ["how often", "how many visits", "how many adjustments do i need"], weak: ["often"],
        answer: "It depends on your goals — your chiropractor will suggest a clear plan after your first exam, and you're never locked in.", chips: ["Book Appointment"] },
      { id: "painChiro", strong: ["pain", "hurts", "sore", "aching"], weak: [],
        answer: "Sorry you're hurting! I can't assess symptoms over chat, but a new patient exam ({price:newExam}) is the best place to start.", chips: ["Book Appointment"] },
      { id: "wearChiro", strong: ["what to wear", "what should i wear", "clothes"], weak: ["wear"],
        answer: "Comfortable clothes you can move in are perfect — no need to change.", chips: ["Book Appointment"] },
      { id: "carAccident", strong: ["car accident", "auto accident", "whiplash"], weak: [],
        answer: "Yes, we treat car accident injuries like whiplash and can work with your auto insurance.", chips: ["Book Appointment"] }
    ],
    overlaps: [["painChiro", "diagnosis"], ["howOften", "adjustment"], ["cracking", "adjustment"]]
  });

  /* =====================================================================
     9. PEDIATRICS — Little Stars Pediatrics (parent + child booking)
     ===================================================================== */
  add({
    id: "pediatrics", industry: "Pediatrics", icon: "baby",
    tagline: "Books checkups and sick visits for kids, with the parent and child's details.",
    business: { name: "Little Stars Pediatrics", shortName: "Little Stars", address: "515 Sunflower Lane", city: "Phoenix, AZ",
      phone: "+1 (555) 602-4400", emergencyPhone: "+1 (555) 602-4499", email: "hello@littlestarspeds.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:00", close: "18:00", sat: ["09:00", "13:00"] },
    staffSingular: "pediatrician", multiPerson: false,
    steps: ["name", "childName", "childAge", "patientType", "service", "date", "time", "contact", "insurance"],
    summary: ["name", "childName", "childAge", "patientType", "service", "date", "time", "contact", "insurance"],
    fields: {
      childName: {
        type: "text", label: "Child", words: "child's name|childs name|kid's name", changeLabel: "your child's name", validate: "name",
        prompt: "Lovely! And what's your <b>child's name</b>?", shortPrompt: "What's your <b>child's name</b>?",
        invalid: "Could you share your child's first name (letters only)? For example <b>Emma</b>.",
        ack: "<b>{value}</b>",
        // "for my daughter Emma who is 6", "my son's name is Leo"
        extract: /\bmy (?:daughter|son|child|kid|baby|boy|girl|little one)(?:'?s name is| named| called|,)?\s+([a-z][a-z'-]{1,20})\b/,
        extractValue: (m) => (/^(is|has|needs|need|who|and|for|was|will|with|age|aged|to|a|an|the|she|he|they|years?|yo)$/.test(m[1]) ? null : m[1].charAt(0).toUpperCase() + m[1].slice(1))
      },
      childAge: {
        type: "number", label: "Age", words: "age|years old", changeLabel: "your child's age", min: 0, max: 18,
        units: "year old|years old|yr old|yrs old|yo|years|yrs|month old|months old",
        prompt: "How <b>old</b> is your child? (For babies under 1, just type 0.)", shortPrompt: "How <b>old</b> is your child?",
        chips: ["Under 1", "2", "5", "8", "12", "16"],
        invalid: "How old is your child? Just type a number between 0 and 18, like <b>6</b>.",
        tooBig: "We see children and teens up to age 18 — for adults, your family doctor is the best place to go.",
        shortErrors: ["How old is your child? A number from 0 to 18 works.", "Just type your child's age, like 4."],
        ack: "age <b>{value}</b>"
      }
    },
    replies: {
      askName: "Wonderful, let's get your little one booked in! 😊 May I have <b>your full name</b> (the parent or guardian)?",
      askNameShort: "May I have <b>your full name</b> (parent or guardian)?"
    },
    closingLine: "{childName}'s appointment for {service} is booked for {date} at {time}",
    services: [
      svc("wellChild", "Well-child checkup", "$140", "30 minutes", ["checkup", "check up", "well child", "well visit", "physical", "annual checkup", "school physical", "sports physical"]),
      svc("sick", "Sick visit", "$110", "20 minutes", ["sick visit", "sick", "fever", "cough", "cold", "ear ache", "earache", "sore throat", "flu", "rash", "vomiting"]),
      svc("vaccines", "Vaccinations", "$35 per vaccine", "15 minutes", ["vaccine", "vaccines", "vaccination", "vaccinations", "shots", "immunization", "immunizations", "flu shot"], { qty: "vaccines?|shots?", qtyName: "vaccines" }),
      svc("newborn", "Newborn visit", "$150", "45 minutes", ["newborn", "new baby", "baby checkup", "infant"]),
      svc("development", "Developmental screening", "$120", "45 minutes", ["developmental", "development", "milestones", "speech delay", "autism screening"]),
      svc("adhd", "ADHD evaluation", "$220", "60 minutes", ["adhd", "attention", "hyperactive", "focus problems"]),
      svc("asthma", "Asthma & allergy follow-up", "$110", "30 minutes", ["asthma", "wheezing", "inhaler check", "allergy follow up"]),
      svc("teen", "Teen health visit", "$130", "30 minutes", ["teen", "teenager", "adolescent"]),
      svc("lactation", "Lactation consultation", "$95", "45 minutes", ["lactation", "breastfeeding help", "latch", "nursing help"]),
      svc("hearingVision", "Hearing & vision screening", "$45", "15 minutes", ["hearing test", "vision screening", "hearing screening", "eye test"]),
      svc("followUp", "Follow-up visit", "$85", "15 minutes", ["follow up", "followup", "recheck"])
    ],
    serviceChips: ["Well-child checkup", "Sick visit", "Vaccinations", "Newborn visit", "Sports physical", "Follow-up visit", "Other"],
    insurance: "We accept Medicaid, CHIP, Aetna, Blue Cross Blue Shield, Cigna and UnitedHealthcare. Well-child visits and vaccines are usually fully covered.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay, cash, and HSA/FSA cards.",
    newPatients: "Yes, we're welcoming new families — from newborns to 18-year-olds! You can book your child's first visit right here.",
    firstVisit: "At your child's first visit, the pediatrician reviews their history, does a gentle head-to-toe check and answers all your questions — about 30 minutes, with stickers at the end! ⭐",
    bring: "Please bring your child's vaccination record, your insurance card, a photo ID for the parent or guardian, and any medications your child takes. A favorite toy helps too!",
    cancel: "Please give us 24 hours' notice to cancel or reschedule. We know kids get sick — just call {phone} and we'll help.",
    parking: "Free parking in our lot, with stroller-friendly ramps and family parking spots by the entrance.",
    walkIn: "We keep same-day sick visit slots every morning — booking here or calling {phone} is the quickest way in.",
    durationText: "Well-child checkups take about 30 minutes, sick visits about 20 minutes.",
    welcome: "Hi there! 👋 Welcome to {business}. I can answer questions about checkups, vaccines and insurance — or book a visit for your child.",
    topicWords: ["child", "children", "kid", "kids", "baby", "toddler", "son", "daughter", "pediatrician", "pediatric", "vaccine", "teen"],
    urgentWords: ["baby wont wake", "not breathing", "turning blue", "blue lips", "stiff neck and fever", "fever and rash", "fever over 104",
      "newborn fever", "swallowed", "dehydrated", "not peeing", "lethargic"],
    faq: [
      { id: "fever", strong: ["fever", "temperature", "high temperature", "hot to touch"], weak: [],
        answer: "I'm not able to assess symptoms over chat. If your child is under 3 months with a fever, or seems very unwell, please call 911 or go to the ER. Otherwise, call us at {phone} or I can book the earliest sick visit.",
        chips: ["Book earliest appointment", "Call the clinic"] },
      { id: "vaccineSchedule", strong: ["vaccine schedule", "which vaccines", "vaccines due", "shots due", "what shots"], weak: [],
        answer: "Your pediatrician will go through your child's vaccine schedule at their checkup and let you know what's due.", chips: ["Book Appointment"] },
      { id: "checkupAge", strong: ["how often checkup", "when is next checkup", "checkup schedule", "how often should"], weak: ["often"],
        answer: "Babies have frequent checkups in their first two years, then children have a yearly well-child visit — we'll remind you when it's due.", chips: ["Book Appointment"] },
      { id: "nurseLine", strong: ["nurse line", "talk to a nurse", "after hours nurse", "nurse advice"], weak: ["nurse"],
        answer: "Our nurse advice line is open 24/7 at {emergency} for urgent questions. For emergencies, call 911.", chips: ["Timings"] },
      { id: "siblings", strong: ["siblings", "both kids", "two kids", "my kids", "twins"], weak: [],
        answer: "Of course — I'll book each child one at a time, so they each get their own appointment. Just start with the first one!", chips: ["Book Appointment"] },
      { id: "waiting", strong: ["sick waiting room", "separate waiting", "well waiting room"], weak: [],
        answer: "Yes — we have separate waiting areas for sick and well visits, to keep little ones safe.", chips: ["Book Appointment"] }
    ],
    overlaps: [["fever", "sick"], ["vaccineSchedule", "vaccines"], ["checkupAge", "wellChild"], ["nurseLine", "afterHours"]]
  });

  /* =====================================================================
     10. FAMILY DOCTOR — CityCare Family Medicine
     ===================================================================== */
  add({
    id: "familydoctor", industry: "Family Medicine", icon: "stethoscope",
    tagline: "Books checkups, sick visits and physicals for the whole family.",
    business: { name: "CityCare Family Medicine", shortName: "CityCare", address: "300 Market Street, Suite 200", city: "Philadelphia, PA",
      phone: "+1 (555) 215-3000", emergencyPhone: "+1 (555) 215-3099", email: "care@citycarefamily.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:00", close: "19:00", sat: ["09:00", "13:00"] },
    staffSingular: "physician",
    services: [
      svc("annual", "Annual physical", "$180", "40 minutes", ["physical", "annual physical", "annual checkup", "checkup", "check up", "wellness exam", "yearly exam"]),
      svc("sick", "Sick visit", "$120", "20 minutes", ["sick visit", "sick", "cold", "flu", "cough", "sore throat", "sinus", "infection", "fever"]),
      svc("chronic", "Chronic care visit", "$140", "30 minutes", ["diabetes", "blood pressure", "hypertension", "cholesterol", "thyroid", "chronic"]),
      svc("vaccines", "Vaccines & flu shots", "$40", "15 minutes", ["vaccine", "vaccines", "flu shot", "shots", "immunization", "tetanus", "covid vaccine"], { qty: "vaccines?|shots?", qtyName: "vaccines" }),
      svc("labs", "Blood work", "$60", "15 minutes", ["blood work", "bloodwork", "blood test", "labs", "lab work"]),
      svc("employment", "Work, school & sports physical", "$90", "30 minutes", ["sports physical", "school physical", "work physical", "pre employment", "dot physical"]),
      svc("womens", "Women's health exam", "$160", "30 minutes", ["pap smear", "womens health", "well woman", "contraception", "birth control"]),
      svc("mental", "Mental health check-in", "$130", "30 minutes", ["stress", "anxiety", "depression", "mental health", "sleep problems", "insomnia"]),
      svc("minorProcedures", "Minor procedures", "$150", "30 minutes", ["stitches", "wart removal", "skin tag", "ear wax", "cyst", "minor procedure"], { from: true }),
      svc("travel", "Travel medicine visit", "$110", "30 minutes", ["travel vaccine", "travel medicine", "travel shots"]),
      svc("weight", "Weight management visit", "$130", "30 minutes", ["weight loss", "weight management", "weight"]),
      svc("telehealthVisit", "Telehealth visit", "$85", "15 minutes", ["telehealth visit", "video visit", "virtual visit"])
    ],
    serviceChips: ["Annual physical", "Sick visit", "Chronic care visit", "Vaccines & flu shots", "Blood work", "Telehealth visit", "Other"],
    insurance: "We accept Medicare, Medicaid, Aetna, Blue Cross Blue Shield, Cigna, Humana and UnitedHealthcare. Annual physicals are usually fully covered.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay, cash, and HSA/FSA cards.",
    newPatients: "Yes, we're accepting new patients of all ages! Most people start with an annual physical, but you can book a sick visit too.",
    firstVisit: "Your physician will get to know you, go over your health history and medications, and do a full check — about 40 minutes. Please arrive 15 minutes early for paperwork.",
    bring: "Bring a photo ID, your insurance card, a list of your current medications (or the bottles), and any recent test results from other doctors.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule — missed appointments may have a $35 fee.",
    parking: "Discounted parking in the Market Street garage next door — bring your ticket in for validation.",
    telehealth: "Yes! Telehealth video visits ({price:telehealthVisit}) are available for many concerns, like follow-ups, prescriptions reviews and minor illnesses.",
    walkIn: "We keep same-day sick slots every day — booking here or calling {phone} is the fastest way to be seen.",
    durationText: "An annual physical takes about 40 minutes, and a sick visit about 20 minutes.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about visits, prices and insurance, or I can book an appointment for you or your family.",
    topicWords: ["doctor", "physician", "family", "physical", "sick", "flu", "vaccine", "blood", "primary care", "gp"],
    faq: [
      { id: "sameDay", strong: ["same day", "today", "see a doctor today", "sick today"], weak: [],
        answer: "We keep same-day slots for sick visits — I can book the earliest one for you right now.", chips: ["Book earliest appointment"] },
      { id: "wholeFamily", strong: ["whole family", "my family", "kids and adults", "all ages"], weak: [],
        answer: "Yes — we care for the whole family, from children to seniors. I can book several family members, one after another.", chips: ["Book Appointment"] },
      { id: "fasting", strong: ["fast", "fasting", "fast before", "eat before"], weak: [],
        answer: "Some blood tests need fasting for 8–12 hours (water is fine). Your physician's team will tell you when you book your blood work.", chips: ["Book Appointment"] },
      { id: "sickNote", strong: ["sick note", "doctors note", "work note", "school note", "medical certificate"], weak: [],
        answer: "Yes, your physician can provide a work or school note at your visit if it's appropriate.", chips: ["Book Appointment"] },
      { id: "specialistReferral", strong: ["refer me", "specialist referral", "referral to specialist", "see a specialist"], weak: [],
        answer: "If you need a specialist, your physician will arrange the referral for you at your visit.", chips: ["Book Appointment"] }
    ],
    overlaps: [["sameDay", "book"], ["fasting", "labs"], ["specialistReferral", "referral"]]
  });

  /* =====================================================================
     11. ENT — ClearSound ENT Clinic
     ===================================================================== */
  add({
    id: "ent", industry: "ENT (Ear, Nose & Throat)", icon: "ear",
    tagline: "Books ENT visits, hearing tests and allergy testing.",
    business: { name: "ClearSound ENT Clinic", shortName: "ClearSound", address: "77 Beacon Street, 4th Floor", city: "Boston, MA",
      phone: "+1 (555) 617-2500", emergencyPhone: "+1 (555) 617-2599", email: "hello@clearsoundent.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:00", close: "17:00", sat: ["09:00", "12:00"] },
    staffSingular: "ENT specialist", staffPlural: "ENT specialists",
    safetyWords: ["pregnant", "pregnancy", "while pregnant", "breastfeeding", "allergic to", "allergic reaction to", "side effect", "side effects", "blood thinner"],
    services: [
      svc("consultation", "ENT consultation", "$165", "30 minutes", ["ent consultation", "consultation", "ent visit", "see an ent", "ear nose throat"]),
      svc("hearing", "Hearing test", "$95", "30 minutes", ["hearing test", "audiogram", "hearing check", "hearing loss", "cant hear well"]),
      svc("hearingAids", "Hearing aid fitting", "$1,200 per aid", "60 minutes", ["hearing aid", "hearing aids"], { from: true, qty: "hearing aids?" }),
      svc("earWax", "Ear wax removal", "$85", "20 minutes", ["ear wax", "earwax", "wax removal", "blocked ear", "ear cleaning", "clogged ear"]),
      svc("sinus", "Sinus evaluation", "$165", "30 minutes", ["sinus", "sinusitis", "sinuses", "blocked nose", "congestion", "stuffy nose"]),
      svc("allergyTest", "Allergy testing", "$250", "60 minutes", ["allergy test", "allergy testing", "allergies", "allergy", "hay fever", "skin prick"]),
      svc("tinnitus", "Tinnitus evaluation", "$165", "45 minutes", ["tinnitus", "ringing in ears", "ringing ears", "buzzing in ear"]),
      svc("throat", "Throat & voice evaluation", "$165", "30 minutes", ["throat", "hoarse", "hoarseness", "voice", "swallowing", "tonsils", "tonsillitis"]),
      svc("sleep", "Snoring & sleep apnea consult", "$165", "30 minutes", ["snoring", "snore", "sleep apnea", "apnea"]),
      svc("scope", "Nasal endoscopy", "$250", "20 minutes", ["endoscopy", "scope", "nasal endoscopy", "nasal scope"]),
      svc("kidsEnt", "Children's ENT visit", "$150", "30 minutes", ["ear infection", "ear infections", "ear tubes", "adenoids", "kids ent", "childs ears"]),
      svc("balloon", "Balloon sinuplasty consult", "$165", "30 minutes", ["balloon sinuplasty", "sinus surgery", "deviated septum", "septoplasty"])
    ],
    serviceChips: ["ENT consultation", "Hearing test", "Ear wax removal", "Sinus evaluation", "Allergy testing", "Throat & voice evaluation", "Other"],
    insurance: "We accept Medicare, Aetna, Blue Cross Blue Shield, Cigna, Harvard Pilgrim, Tufts and UnitedHealthcare. Hearing aids may be partly covered depending on your plan.",
    payment: "We accept all major credit and debit cards, Apple Pay, cash, and HSA/FSA cards — hearing aids can be paid in monthly installments.",
    newPatients: "Yes, we're welcoming new patients — adults and children! You can book an ENT consultation right here.",
    firstVisit: "Your ENT specialist will go over your symptoms and history, gently examine your ears, nose and throat, and explain next steps — about 30 minutes.",
    bring: "Please bring a photo ID, your insurance card, a list of your medications, and any previous hearing tests or scans.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule — missed visits may have a $40 fee.",
    parking: "Parking is available at the Boston Common Garage, a 3-minute walk away. We're also right by Park Street station.",
    transit: "We're a 3-minute walk from Park Street station (Red and Green lines).",
    durationText: "Most ENT visits take about 30 minutes; hearing tests about 30 minutes and allergy testing about an hour.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about hearing tests, sinus care, allergy testing or prices — or I can book your visit.",
    topicWords: ["ear", "ears", "nose", "throat", "ent", "hearing", "sinus", "tonsils", "voice", "snoring", "dizzy"],
    urgentWords: ["sudden hearing loss", "cant swallow", "throat closing", "severe nosebleed", "nosebleed wont stop", "object in ear", "something stuck in"],
    faq: [
      { id: "allergyPrep", strong: ["before allergy test", "prepare for allergy test", "stop antihistamines", "antihistamine before"], weak: [],
        answer: "Some medicines can affect allergy test results — our team will tell you exactly what to pause when you book. Your doctor will guide you on that, so please call {phone} if you're unsure.", chips: ["Book Appointment"] },
      { id: "dizzy", strong: ["dizzy", "dizziness", "vertigo", "spinning", "balance"], weak: [],
        answer: "I'm not able to assess symptoms over chat, but our ENT specialists do evaluate dizziness and balance problems. I can book a consultation for you.", chips: ["Book Appointment"] },
      { id: "earPain", strong: ["ear pain", "earache", "ear hurts", "ear ache"], weak: [],
        answer: "Sorry you're dealing with that! I can't assess symptoms over chat, but I can book the earliest ENT visit, or you can call us at {phone}.", chips: ["Book earliest appointment"] },
      { id: "hearingAidTrial", strong: ["hearing aid trial", "try hearing aids", "hearing aid brands", "rechargeable hearing aids"], weak: [],
        answer: "Yes — every hearing aid comes with a 45-day trial and follow-up adjustments, and we work with leading brands like Phonak, Oticon and ReSound.", chips: ["Book Appointment"] }
    ],
    overlaps: [["allergyPrep", "allergyTest"], ["hearingAidTrial", "hearingAids"], ["earPain", "diagnosis"]]
  });

  /* =====================================================================
     12. ORTHOPEDICS — Stride Orthopedics
     ===================================================================== */
  add({
    id: "ortho", industry: "Orthopedics", icon: "bone",
    tagline: "Books orthopedic consultations, fracture follow-ups and joint injections.",
    business: { name: "Stride Orthopedics", shortName: "Stride", address: "4100 Westheimer Road, Building C", city: "Houston, TX",
      phone: "+1 (555) 713-9000", emergencyPhone: "+1 (555) 713-9099", email: "appointments@strideortho.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:00", close: "17:00", sat: ["08:00", "12:00"] },
    staffSingular: "orthopedic specialist", staffPlural: "orthopedic specialists",
    services: [
      svc("consultation", "Orthopedic consultation", "$200", "30 minutes", ["orthopedic consultation", "consultation", "ortho consult", "see an orthopedic", "orthopedic surgeon"]),
      svc("knee", "Knee evaluation", "$200", "30 minutes", ["knee", "knees", "meniscus", "acl", "knee pain"]),
      svc("hip", "Hip evaluation", "$200", "30 minutes", ["hip", "hips", "hip pain", "hip replacement"]),
      svc("shoulder", "Shoulder evaluation", "$200", "30 minutes", ["shoulder", "rotator cuff", "frozen shoulder", "dislocated shoulder"]),
      svc("spine", "Spine evaluation", "$220", "30 minutes", ["spine", "back", "back pain", "herniated disc", "sciatica", "neck"]),
      svc("hand", "Hand & wrist evaluation", "$200", "30 minutes", ["hand", "wrist", "carpal tunnel", "trigger finger", "thumb"]),
      svc("foot", "Foot & ankle evaluation", "$200", "30 minutes", ["foot", "ankle", "sprained ankle", "plantar fasciitis", "heel", "bunion"]),
      svc("fracture", "Fracture care", "$250", "30 minutes", ["fracture", "broken bone", "broken arm", "broken wrist", "cast", "splint"]),
      svc("sports", "Sports medicine visit", "$200", "30 minutes", ["sports medicine", "sports injury", "athlete", "torn"]),
      svc("injection", "Joint injection", "$250", "20 minutes", ["joint injection", "cortisone", "steroid injection", "gel injection", "prp injection"], { qty: "injections?" }),
      svc("xray", "X-ray imaging", "$120", "15 minutes", ["x ray", "xray", "x rays", "imaging"]),
      svc("mri", "MRI", "$650", "45 minutes", ["mri", "mri scan", "scan"], { from: true }),
      svc("postOp", "Post-op follow-up", "$0 (included in surgery)", "20 minutes", ["post op", "after surgery", "post surgery", "surgery follow up"])
    ],
    serviceChips: ["Orthopedic consultation", "Knee evaluation", "Spine evaluation", "Shoulder evaluation", "Fracture care", "Sports medicine visit", "Other"],
    insurance: "We accept Medicare, Aetna, Blue Cross Blue Shield, Cigna, Humana, UnitedHealthcare and workers' comp. MRI may need prior authorization, which we handle for you.",
    payment: "We accept all major credit and debit cards, Apple Pay, cash, and HSA/FSA cards, with payment plans for surgery.",
    newPatients: "Yes, we're welcoming new patients — no referral needed for most plans. You can book a consultation right here.",
    firstVisit: "Your specialist will review your history and any imaging, examine the joint and explain options — often starting with non-surgical care. Plan for about 45 minutes, including X-rays if needed.",
    bring: "Bring a photo ID, your insurance card, a list of your medications, and any X-rays, MRI discs or reports you already have. Wear loose clothing so we can examine the area.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule — missed visits may have a $50 fee.",
    parking: "Free parking in the Building C lot, with accessible spaces and wheelchairs available at the entrance.",
    durationText: "A consultation takes about 30 minutes, plus 15 minutes if you need X-rays.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about joint care, sports injuries, prices or insurance — or I can book your consultation.",
    topicWords: ["orthopedic", "orthopedics", "bone", "bones", "joint", "joints", "knee", "hip", "shoulder", "spine", "fracture", "sports injury"],
    urgentWords: ["bone sticking out", "open fracture", "cant bear weight", "deformed", "numb and cold", "severe injury"],
    faq: [
      { id: "surgeryNeeded", strong: ["do i need surgery", "need surgery", "will i need surgery", "surgery or not"], weak: [],
        answer: "I can't say over chat — your specialist will examine you and explain all your options. Many problems improve without surgery.", chips: ["Book Appointment"] },
      { id: "injured", strong: ["injured", "twisted", "fell", "fell down", "hurt my", "sprain"], weak: [],
        answer: "Sorry to hear that! I can't assess injuries over chat. If it's severe, please call 911 or go to the ER — otherwise I can book the earliest visit for you.", chips: ["Book earliest appointment"] },
      { id: "walkInOrtho", strong: ["ortho urgent care", "walk in ortho", "same day ortho"], weak: [],
        answer: "We keep same-day slots for new injuries every weekday morning — I can book one for you now.", chips: ["Book earliest appointment"] },
      { id: "secondOpinion", strong: ["second opinion"], weak: [],
        answer: "Yes, we're happy to give second opinions — please bring your imaging and reports to your visit.", chips: ["Book Appointment"] }
    ],
    overlaps: [["injured", "diagnosis"], ["walkInOrtho", "walkIn"]]
  });

  /* =====================================================================
     13. WOMEN'S HEALTH — Bloom Women's Health
     ===================================================================== */
  add({
    id: "womenshealth", industry: "Women's Health (OB-GYN)", icon: "venus",
    tagline: "Books well-woman exams, prenatal visits and consultations, with care and privacy.",
    business: { name: "Bloom Women's Health", shortName: "Bloom", address: "260 Magnolia Avenue, Suite 5", city: "Nashville, TN",
      phone: "+1 (555) 615-7700", emergencyPhone: "+1 (555) 615-7799", email: "care@bloomwomenshealth.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "08:00", close: "17:30", sat: ["09:00", "12:00"] },
    staffSingular: "provider", multiPerson: false,
    safetyWords: ["while pregnant", "during pregnancy", "safe in pregnancy", "safe when pregnant", "safe while breastfeeding", "breastfeeding", "allergic", "allergy",
      "allergies", "side effect", "side effects"],
    services: [
      svc("wellWoman", "Well-woman exam", "$195", "30 minutes", ["well woman", "annual exam", "yearly exam", "gyn exam", "gynecology exam", "checkup", "check up", "pelvic exam"]),
      svc("pap", "Pap smear", "$120", "15 minutes", ["pap smear", "pap test", "pap", "cervical screening", "hpv test"]),
      svc("prenatal", "Prenatal visit", "$175", "30 minutes", ["prenatal", "pregnancy visit", "pregnant", "im pregnant", "expecting", "pregnancy", "obstetric", "ob visit"]),
      svc("ultrasound", "Pelvic or pregnancy ultrasound", "$250", "30 minutes", ["ultrasound", "sonogram", "scan", "baby scan"]),
      svc("contraception", "Birth control consultation", "$130", "20 minutes", ["birth control", "contraception", "iud", "the pill", "implant", "nexplanon"]),
      svc("fertility", "Fertility consultation", "$250", "45 minutes", ["fertility", "trying to conceive", "ttc", "infertility", "getting pregnant"]),
      svc("menopause", "Menopause care", "$175", "30 minutes", ["menopause", "perimenopause", "hot flashes", "hormones", "hrt"]),
      svc("period", "Period & PCOS visit", "$150", "30 minutes", ["period", "periods", "pcos", "irregular periods", "heavy periods", "endometriosis", "cramps"]),
      svc("breast", "Breast exam", "$120", "20 minutes", ["breast exam", "breast lump", "breast check", "mammogram"]),
      svc("sti", "STI testing", "$150", "20 minutes", ["sti", "std", "sti test", "std test", "sexual health"]),
      svc("postpartum", "Postpartum visit", "$150", "30 minutes", ["postpartum", "after birth", "after delivery", "post natal"]),
      svc("pelvicFloor", "Pelvic floor consultation", "$150", "30 minutes", ["pelvic floor", "incontinence", "bladder leaks"])
    ],
    serviceChips: ["Well-woman exam", "Pap smear", "Prenatal visit", "Birth control consultation", "Menopause care", "Period & PCOS visit", "Other"],
    insurance: "We accept Aetna, Blue Cross Blue Shield, Cigna, Humana, UnitedHealthcare, Medicaid and TennCare. Annual well-woman exams are usually fully covered.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay, cash, and HSA/FSA cards. Prenatal care can be paid in monthly installments.",
    newPatients: "Yes, we're welcoming new patients at every stage of life! Most start with a well-woman exam or a prenatal visit.",
    firstVisit: "Your provider will talk through your health history and any concerns in private, then do any exams you need — you're always in control and can ask to pause. About 30 minutes.",
    bring: "Bring a photo ID, your insurance card, a list of your medications, and the date of your last period. If you're pregnant, bring any earlier test or scan results.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule — missed visits may have a $40 fee.",
    parking: "Free parking in our private lot, with reserved spots for expectant mothers right by the entrance.",
    durationText: "Most visits take about 30 minutes; a pap smear alone takes about 15 minutes.",
    welcome: "Hi! 👋 Welcome to {business}. I can answer questions about exams, pregnancy care, prices and insurance — or book your visit. Everything here is private.",
    topicWords: ["women", "womens", "gynecologist", "gynecology", "obgyn", "ob gyn", "pregnancy", "period", "menopause", "pap", "prenatal"],
    urgentWords: ["heavy bleeding in pregnancy", "bleeding while pregnant", "baby not moving", "water broke", "severe cramping", "contractions", "severe abdominal pain"],
    faq: [
      { id: "femaleProvider", strong: ["female doctor", "female provider", "woman doctor", "female gynecologist"], weak: [],
        answer: "Of course — just mention it when you book and our team will confirm a female provider for you.", chips: ["Book Appointment"] },
      { id: "pregnancyTest", strong: ["pregnancy test", "am i pregnant", "positive test", "missed period"], weak: [],
        answer: "I can't tell over chat, but we can confirm a pregnancy at a visit — I can book the earliest one, or call us at {phone}.", chips: ["Book earliest appointment"] },
      { id: "firstPrenatal", strong: ["first prenatal", "when should i see", "how many weeks", "first pregnancy appointment"], weak: [],
        answer: "Most first prenatal visits are around 8 weeks of pregnancy — our team will help you pick the right time.", chips: ["Book Appointment"] },
      { id: "onPeriod", strong: ["on my period", "during my period", "period during appointment"], weak: [],
        answer: "Please call us at {phone} if your period falls on your visit — for many visits it's fine, and we'll let you know if it's better to move.", chips: ["Book Appointment"] },
      { id: "teens", strong: ["teen", "teenager", "daughter", "first gyn visit", "first gynecologist"], weak: [],
        answer: "We welcome teens for gentle, private first visits — often just a conversation. A parent can come along if she'd like.", chips: ["Book Appointment"] }
    ],
    overlaps: [["pregnancyTest", "prenatal"], ["firstPrenatal", "prenatal"], ["femaleProvider", "doctors"]]
  });

  /* =====================================================================
     14. DIAGNOSTIC LAB — QuickTest Diagnostic Lab (tests + fasting + home collection)
     ===================================================================== */
  const FAST_12 = "🍽️ <b>Fasting:</b> please don't eat for 10–12 hours before (water is fine).";
  const FAST_8 = "🍽️ <b>Fasting:</b> please don't eat for 8 hours before (water is fine).";
  add({
    id: "lab", industry: "Diagnostic Lab", icon: "flask",
    tagline: "Books blood tests with fasting instructions and home sample collection.",
    business: { name: "QuickTest Diagnostic Lab", shortName: "QuickTest", address: "900 Broadway, Suite 110", city: "Seattle, WA",
      phone: "+1 (555) 206-4100", emergencyPhone: "+1 (555) 206-4199", email: "tests@quicktestlab.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "07:00", close: "17:00", sat: ["07:00", "12:00"] },
    staffSingular: "technician", noun: "test appointment", nounPlural: "test appointments", duration: 15, slotMinutes: 15,
    dropWords: { medication: ["drug", "drugs"] },
    steps: ["name", "patientType", "service", "homeCollection", "date", "time", "contact", "insurance"],
    serviceLabel: "Test",
    servicePrompt: "Which <b>test</b> do you need? Tap one below or type the name — I'll show any fasting instructions automatically.",
    fields: {
      homeCollection: {
        type: "choice", label: "Collection", words: "collection|home collection|visit", changeLabel: "where we collect the sample",
        prompt: "Would you like to <b>visit the lab</b>, or have our technician come to you for <b>home sample collection</b> (+$35)?",
        shortPrompt: "<b>Visit the lab</b> or <b>home collection</b> (+$35)?",
        chips: ["Visit the lab", "Home collection (+$35)"],
        invalid: "Would you like to visit the lab or have a home collection? Just tap one below.",
        shortErrors: ["Lab visit or home collection? Tap one below.", "Just tap Visit the lab or Home collection."],
        ack: "<b>{value}</b>",
        options: [
          { id: "lab", label: "Visit the lab", match: ["visit the lab", "at the lab", "come in", "in person", "lab visit", "visit", "come to the lab"] },
          { id: "home", label: "Home collection (+$35)", match: ["home", "home collection", "at home", "house", "come to me", "my place", "my house", "home visit", "home service"] }
        ]
      }
    },
    closingLine: "Your {service} is booked for {date} at {time} — {homeCollection}",
    services: [
      svc("cbc", "Complete blood count (CBC)", "$25", "5 minutes", ["cbc", "complete blood count", "blood count"], { note: "No fasting needed for a CBC. 🙂" }),
      svc("lipid", "Lipid panel (cholesterol)", "$35", "5 minutes", ["lipid", "lipid panel", "cholesterol", "lipids", "triglycerides"], { note: FAST_12 }),
      svc("glucose", "Fasting blood sugar", "$20", "5 minutes", ["fasting glucose", "blood sugar", "glucose", "sugar test", "diabetes test"], { note: FAST_8 }),
      svc("a1c", "HbA1c", "$35", "5 minutes", ["a1c", "hba1c", "hemoglobin a1c"], { note: "No fasting needed for HbA1c. 🙂" }),
      svc("thyroid", "Thyroid panel (TSH, T3, T4)", "$45", "5 minutes", ["thyroid", "tsh", "t3", "t4", "thyroid panel"], { note: "No fasting needed for a thyroid panel — morning tests are best." }),
      svc("cmp", "Metabolic panel (CMP)", "$30", "5 minutes", ["cmp", "metabolic panel", "comprehensive metabolic", "liver function", "kidney function", "lft", "kft"], { note: FAST_12 }),
      svc("vitD", "Vitamin D", "$45", "5 minutes", ["vitamin d", "vit d", "vitamin d test"], { note: "No fasting needed for vitamin D. 🙂" }),
      svc("b12", "Vitamin B12 & iron", "$40", "5 minutes", ["b12", "vitamin b12", "iron", "ferritin", "anemia"], { note: "For iron tests, a morning test after 8 hours of fasting is best." }),
      svc("fullPanel", "Full health check panel", "$149", "10 minutes", ["full body checkup", "full panel", "health check", "full checkup", "executive panel", "full body"], { note: FAST_12 }),
      svc("urine", "Urinalysis", "$20", "5 minutes", ["urine", "urine test", "urinalysis"], { note: "No fasting needed — a first-morning urine sample is best." }),
      svc("covid", "COVID-19 & flu test", "$60", "10 minutes", ["covid test", "pcr", "rapid test", "flu test", "covid"], { note: "No fasting needed." }),
      svc("std", "STI panel", "$99", "5 minutes", ["sti", "std", "sti panel", "std panel", "hiv test"], { note: "No fasting needed." }),
      svc("drugScreen", "Drug screening", "$55", "10 minutes", ["drug test", "drug screen", "drug screening", "urine drug", "employment drug test"], { note: "No fasting needed — please bring a photo ID." }),
      svc("pregnancyTest", "Pregnancy (hCG) blood test", "$30", "5 minutes", ["hcg", "pregnancy test", "beta hcg"], { note: "No fasting needed." }),
      svc("psa", "PSA (prostate)", "$40", "5 minutes", ["psa", "prostate"], { note: "No fasting needed." })
    ],
    serviceChips: ["Complete blood count (CBC)", "Lipid panel (cholesterol)", "Fasting blood sugar", "Thyroid panel (TSH, T3, T4)", "Full health check panel", "Vitamin D", "Other"],
    insurance: "We accept most plans, including Aetna, Blue Cross Blue Shield, Cigna, Humana, Medicare, Premera and UnitedHealthcare. Many tests need a doctor's order for insurance to cover them.",
    payment: "We accept all major credit and debit cards, Apple Pay, Google Pay, cash, and HSA/FSA cards. Self-pay prices are shown upfront.",
    newPatients: "Yes, anyone can book with us — with a doctor's order or as a self-pay test. You can book right here.",
    firstVisit: "Check-in takes about 5 minutes, and most blood draws take under 5 minutes. Our phlebotomists are very gentle! 😊",
    bring: "Bring a photo ID, your insurance card and your doctor's test order if you have one. Drink water beforehand — it makes the draw easier.",
    cancel: "You can cancel or reschedule any time up to 2 hours before — no fee. Home collections need 12 hours' notice.",
    parking: "Free 30-minute parking right in front of the lab — perfect for a quick test.",
    referral: "No doctor's order is needed for self-pay tests. If you want insurance to cover it, most plans need your doctor's order.",
    walkIn: "Walk-ins are welcome, but booking a slot means you skip the queue — especially for early-morning fasting tests.",
    durationText: "Most blood draws take under 5 minutes, and a lab visit usually takes about 15 minutes in total.",
    welcome: "Hi! 👋 Welcome to {business}. Ask me about tests, fasting, prices or home collection — or I can book your test.",
    quickReplies: ["Book a test", "Tests & prices", "Fasting", "Home collection"],
    topicWords: ["test", "tests", "lab", "blood", "blood test", "sample", "fasting", "urine", "panel", "results", "collection"],
    faq: [
      { id: "fasting", priority: 5, strong: ["fast", "fasting", "need to fast", "eat before", "drink before", "coffee before", "empty stomach"], weak: [],
        answer: "It depends on the test: <b>lipid panel, fasting blood sugar, metabolic panel and the full health check</b> need 8–12 hours of fasting (water is fine). <b>CBC, HbA1c, thyroid, vitamin D</b> and most others don't. Tell me your test and I'll confirm!",
        chips: ["Book a test", "Tests & prices"] },
      { id: "homeService", strong: ["home collection", "home sample", "come to my home", "come to my house", "home visit", "at home test", "house call"], weak: [],
        answer: "Yes! Our technician can collect your sample at home for an extra $35, Monday to Saturday. Just choose home collection when you book.", chips: ["Book a test"] },
      { id: "resultsTime", strong: ["when will i get results", "how long for results", "results time", "results ready", "turnaround", "get my results", "results back"], weak: [],
        answer: "Most results are ready within 24–48 hours, and you'll get them securely by email or in our patient portal. Your doctor will explain what they mean.", chips: ["Book a test"] },
      { id: "doctorOrder", strong: ["doctor order", "doctors order", "prescription for test", "lab order", "requisition"], weak: [],
        answer: "No order is needed for self-pay tests. For insurance billing, please bring your doctor's order.", chips: ["Insurance"] },
      { id: "needleFear", fearAnswer: true, strong: ["needle", "needles", "faint", "blood draw hurt", "does it hurt"], weak: [],
        answer: "Totally understandable! Our phlebotomists are very gentle, and you can lie down for the draw if you prefer — just let them know. 😊", chips: ["Book a test"] },
      { id: "kidsLab", strong: ["child blood test", "kids blood test", "child", "kids", "baby"], weak: [],
        answer: "Yes, we test children from age 2 — a parent or guardian needs to come along.", chips: ["Book a test"] }
    ],
    overlaps: [["homeService", "walkIn"], ["resultsTime", "resultsMeaning"], ["fasting", "glucose"], ["doctorOrder", "referral"]]
  });

  /* =====================================================================
     15. COUNSELING — Calm Mind Counseling (crisis-safe)
     ===================================================================== */
  add({
    id: "counseling", industry: "Counseling & Therapy", icon: "heart",
    tagline: "Books therapy sessions warmly — and always shares the 988 Lifeline in a crisis.",
    business: { name: "Calm Mind Counseling", shortName: "Calm Mind", address: "45 Willow Court, Suite 2", city: "Portland, OR",
      phone: "+1 (555) 503-8800", emergencyPhone: "", email: "hello@calmmindcounseling.com" },
    hoursSpec: { week: [1, 2, 3, 4, 5], open: "09:00", close: "20:00", sat: ["10:00", "15:00"] },
    staffSingular: "therapist", noun: "session", nounPlural: "sessions", duration: 50, slotMinutes: 60, noFear: true, multiPerson: false,
    services: [
      svc("consultation", "Free 15-minute consultation call", "Free", "15 minutes", ["free consultation", "consultation call", "intro call", "consultation", "phone consultation"]),
      svc("individual", "Individual therapy", "$140", "50 minutes", ["individual therapy", "therapy", "counseling", "talk to someone", "one on one", "therapist session"], { qty: "sessions?", qtyName: "sessions" }),
      svc("couples", "Couples counseling", "$175", "60 minutes", ["couples", "couples counseling", "couples therapy", "marriage counseling", "relationship"]),
      svc("family", "Family therapy", "$175", "60 minutes", ["family therapy", "family counseling", "family"]),
      svc("teen", "Teen counseling", "$130", "50 minutes", ["teen", "teenager", "adolescent", "teen counseling"]),
      svc("anxiety", "Anxiety therapy", "$140", "50 minutes", ["anxiety", "anxious", "panic attacks", "worry", "stress"]),
      svc("depression", "Depression support", "$140", "50 minutes", ["depression", "depressed", "feeling low", "sad all the time"]),
      svc("trauma", "Trauma & PTSD therapy (EMDR)", "$160", "60 minutes", ["trauma", "ptsd", "emdr"]),
      svc("grief", "Grief counseling", "$140", "50 minutes", ["grief", "loss", "bereavement", "lost someone"]),
      svc("burnout", "Stress & burnout", "$140", "50 minutes", ["burnout", "burned out", "work stress", "overwhelmed"]),
      svc("online", "Online therapy session", "$130", "50 minutes", ["online therapy", "online session", "video therapy", "virtual therapy"])
    ],
    serviceChips: ["Individual therapy", "Couples counseling", "Anxiety therapy", "Depression support", "Online therapy session", "Free 15-minute consultation call", "Other"],
    servicePrompt: "What would you like support with? Tap an option or tell me in your own words — share only what you're comfortable with.",
    serviceLabel: "Session type",
    insurance: "We're in network with Aetna, Cigna, Optum, Providence, Regence and Kaiser Permanente. We can also give you a superbill for out-of-network reimbursement.",
    payment: "We accept all major credit and debit cards and HSA/FSA cards. We keep a few sliding-scale spots — ask our team about them.",
    newPatients: "Yes, we're welcoming new clients. Many people start with a free 15-minute call to find the right therapist — no pressure at all.",
    firstVisit: "Your first session is a relaxed conversation where your therapist gets to know you and what you'd like help with. You share only what you're comfortable with, at your own pace. 💙",
    bring: "Nothing special — just yourself. If you're using insurance, have your card handy, and we'll send a short intake form beforehand.",
    cancel: "Please give us 24 hours' notice to cancel or reschedule. Late cancellations may be charged the session fee, but we're always understanding about emergencies.",
    parking: "Free, quiet parking behind the building, with a private side entrance.",
    telehealth: "Yes — all our therapists offer secure video sessions, so you can join from home anywhere in Oregon.",
    walkIn: "We work by appointment only, so you always have a calm, private space. If you're in crisis, please call or text 988 any time.",
    durationText: "Individual sessions are 50 minutes, and couples or family sessions 60 minutes.",
    welcome: "Hi, and welcome to {business}. 💙 I can answer questions about therapy, prices and insurance, or help you book a session. Take your time.",
    tooltip: "Questions? We're here to help.",
    closingLine: "Your {service} is booked for {date} at {time}",
    topicWords: ["therapy", "therapist", "counseling", "counselor", "counsellor", "mental health", "anxiety", "depression", "stress", "session", "feelings", "emotional"],
    replies: {
      emergencyLineNoNumber: "If you're struggling, you can also call or text 988 any time.",
      closingExtra: " Reaching out takes courage — we're glad you did. 💙"
    },
    faq: [
      { id: "crisisInfo", priority: 1, strong: ["crisis", "crisis line", "hotline", "988", "suicide hotline"], weak: [],
        answer: "If you're in crisis, please call or text <b>988</b> (the 988 Suicide & Crisis Lifeline) — it's free and open 24/7. If you're in immediate danger, call <b>911</b>.",
        chips: [] },
      { id: "emergency", strong: ["emergency", "urgent", "urgently"], weak: [],
        answer: "If you're in crisis, please call or text <b>988</b> any time, or call <b>911</b> if you're in immediate danger. We're not an emergency service, but we can book your next session.",
        chips: ["Book Appointment"] },
      { id: "confidential", strong: ["confidential", "confidentiality", "private", "will anyone know", "tell my employer", "tell my parents"], weak: [],
        answer: "Yes — what you share in therapy is confidential. Your therapist will explain the few legal exceptions (like safety concerns) at your first session.", chips: ["Book Appointment"] },
      { id: "matchTherapist", strong: ["right therapist", "choose a therapist", "which therapist", "therapist match", "switch therapist"], weak: [],
        answer: "We'll match you with a therapist who suits your needs, and you're always welcome to switch — tell us your preferences when booking and our team will confirm.", chips: ["Book Appointment"] },
      { id: "medsCounseling", strong: ["antidepressant", "antidepressants", "psychiatrist", "meds", "ssri"], weak: [],
        answer: "Our therapists don't prescribe medication — your doctor will guide you on that during your visit. We can suggest trusted psychiatrists; call us at {phone}.", chips: ["Book Appointment"] },
      { id: "howManyTherapy", strong: ["how many sessions", "how long does therapy", "weekly", "how often"], weak: [],
        answer: "Most people start with weekly or every-other-week sessions, and you and your therapist decide together how long to continue.", chips: ["Book Appointment"] },
      { id: "slidingScale", strong: ["sliding scale", "cant afford", "affordable", "low cost", "reduced fee"], weak: [],
        answer: "We keep a few sliding-scale spots each month — please call {phone} and our team will talk it through with you privately.", chips: ["Payment options"] }
    ],
    dropFaq: ["afterHours", "hygiene", "companion"],
    overlaps: [["crisisInfo", "emergency"], ["medsCounseling", "medication"], ["confidential", "privacy"], ["slidingScale", "discount"]]
  });
})();
