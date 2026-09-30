/*!
 * Clinic AI Chatbot engine — by Skyline Web Co
 * ---------------------------------------------------------
 * ONE engine, one config per medical niche (see niches.js).
 *
 * Install on ANY clinic website with one line (niches.js is loaded automatically):
 *     <script src="chatbot.js" data-niche="dental" data-name="Business Name"></script>
 * Optional: data-city="Austin" data-phone="+1 (512) 555-0100"
 *
 * New client? Copy a niche in niches.js (or just pass name/city/phone) — done.
 * The widget renders inside a Shadow DOM, so the host website's CSS can't
 * break it. No API key, no dependencies.
 */
(function () {
  "use strict";
  if (window.DemoChatbot) return;                                   // prevent double-loading
  const REGISTRY = (window.ChatbotConfigs = window.ChatbotConfigs || {});
  const SCRIPT = document.currentScript;

  /* =====================================================================
     DEFAULT TEXTS — any config can override these in bot.replies.
     {noun} = "appointment" / "reservation" / "viewing" …, {Noun} = capitalised.
     ===================================================================== */
  const DEFAULT_TEXT = {
    outOfScope: "Sorry, I can't help with that. Feel free to ask me anything about {business}! 😊",
    fallback: "That's a great question for our team. Please give us a call at {phone} and we'll be happy to help.",
    rephrase: "Sorry, I didn't quite catch that. Could you rephrase?",
    crisis: "I'm really sorry you're feeling this way, and I'm glad you reached out. 💙 Please call or text <b>988</b> to reach the 988 Suicide & Crisis Lifeline right now — it's free, confidential and available 24/7. If you're in immediate danger, please call <b>911</b>.",
    urgent: "Please call 911 or go to the nearest emergency room right away.",
    emergencyLine: "You can also reach our emergency line at {emergency}.",
    emergencyLineNoNumber: "You can also call us at {phone}.",
    urgentNoMedicine: "I'm not able to recommend any medication — your doctor will guide you on that during your visit.",
    urgentOffer: "Once you're safe, I can also book the earliest available appointment for you.",
    slotTaken: "Sorry, {time} is already booked — the nearest free times are {options}. Which one works for you?",
    requestNoted: "I've noted your request for {request} — our team will confirm it for you.",
    skipLabel: "Not provided",
    continueBooking: "Would you like to continue with your booking?",
    continueRequest: "Would you like to continue with your request?",
    stopped: "No problem, I've stopped the {what}. Is there anything else I can help with?",
    notBooked: "No problem, I haven't booked anything. Is there anything else I can help with?",
    editWhich: "Of course — what would you like to change?",
    thanksMidFlow: "You're very welcome! 😊",
    helloMidFlow: "Hello! 😊",
    yesIdle: "Great! How can I help you today?",
    noIdle: "No problem! Feel free to ask if you need anything. 😊",
    multiIntro: "Of course! Let's book them one at a time — first, your {noun}. ",
    multiNext: "Now let's book the {noun} for {who}.",
    multiAskName: "May I have {who}'s <b>full name</b>?",
    multiIntroN: "I'll happily book {count} {nouns} for you — let's start with the first one. ",
    multiNextItem: "Now let's book your next {noun}: <b>{item}</b>.",
    multiNextSame: "Now let's set up {item}.",
    askCount: "Of course! How many {nouns} would you like to book in total?",
    groupSaved: "✅ Got it — {noun} {i} of {n} is saved.",
    groupSummary: "Here's a summary of {all} {nouns}:",
    closingGroup: "You're all set, {first}! ✅ {All} {nouns} are booked. {contactLine}{extra} {signoff}",
    samePerson: "Same person",
    myBookings: "Here's what you've booked:",
    myBookingsNote: "Our team will call you to confirm.",
    noBooking: "I don't see a booking in this chat yet. Would you like to make one?",

    introBook: "Wonderful, let's get you booked in! 😊 ",
    introResched: "Of course, I can help with that. ",
    askName: "Wonderful, let's get you booked in! 😊 May I have your <b>full name</b>?",
    askNameResched: "Of course, I can help with that. May I have the <b>full name</b> the {noun} is under?",
    askNameShort: "May I have your <b>full name</b>?",
    askPhone: "Thank you, {first}! What's the best way to reach you: <b>phone number</b>, <b>email</b>, or both?",
    askPhoneResched: "Thank you, {first}. And which <b>phone number</b> was the {noun} booked with?",
    askPhoneShort: "What's the best <b>phone number</b> to reach you on?",
    askDate: "Which <b>date</b> suits you best? We're open {openDaysText} — you can type something like “tomorrow”, “next Monday” or “Oct 12”.",
    askDateStaff: "Which <b>date</b> suits you best? {short} is available {days}.",
    askDateShort: "Which <b>date</b> suits you best?",
    askDateResched: "What <b>new date</b> would suit you? If you'd simply like to cancel, just tap “Just cancel”.",
    askDateReschedShort: "What <b>new date</b> would suit you?",
    askTime: "Lovely. What <b>time</b> works best for you on {date}? We're open from {open} to {close}.",
    askTimeShort: "What <b>time</b> works best for you{onDate}?",
    askTimePart: "What <b>time</b> in the {part} works best for you?",
    askTimeStaff: "What <b>time</b> works best for you? {short} is available {range} on {dateShort}.",
    askTimeOption: "What <b>time</b> works best for you? {option} starts at {times}.",
    confirmQ: "Shall I confirm this {noun}?",
    summaryTitle: "{Noun} summary",
    anyStaff: "Any {staffSingular}",
    anyAvailable: "Any available",
    justCancel: "Just cancel",
    sentNew: "✅ Your {noun} request has been sent. Our team will call you to confirm.",
    sentCancel: "✅ Your cancellation request has been sent. Our team will call you shortly to confirm.",
    sentResched: "✅ Your request to move your {noun} to <b>{date}</b> at <b>{time}</b> has been sent. Our team will call you shortly to confirm.",
    anythingElse: "Is there anything else I can help you with?",
    updated: "No problem — I've updated {changes}.",
    thanksName: "Thank you, {first}! ",
    great: "Great! ",
    noted: "I've noted {items}. ",
    earliest: "The earliest available slot is <b>{date}</b>{at}{with}. ",
    sure: "Sure! ",
    havingTrouble: "Having trouble? You can also call us at {phone}.",
    pricesIntro: "Here's an overview of our main prices:",
    pricesNote: "",
    servicesText: "We offer {list}. Which one would you like to know more about?",
    together: " Together, that's <b>{total}</b>.",
    qtyLine: "{qty} {item} would be <b>{total}</b> ({each}).",
    recommendedTag: "Recommended",
    staffNotIn: "{staff} ({specialty}) isn't in that day — {short}'s next available day is <b>{next}</b>.",
    online: "Online",
    footer: "Demo assistant · runs entirely in your browser",
    placeholder: "Type your message…",
    todayLabel: "Today",
    switchIndustry: "Switch industry",

    availableOn: "On <b>{date}</b>, these {staffPlural} are available:",
    noStaff: "Sorry, no {staffPlural} are available on <b>{date}</b>. Which other day works for you?",
    staffYes: "Yes! {staff} is available on <b>{date}</b>, from {range}. Would you like to book?",
    staffNo: "{staff} isn't available on {weekday}. {short}'s next available day is <b>{next}</b> ({range}).",
    staffGeneral: "{staff} ({specialty}) is available {days}, {range}. The next opening is <b>{next}</b>.",
    staffUnavailable: "{staff} isn't available on {weekday}. {short}'s next available day is <b>{next}</b> ({range}) — or, on <b>{date}</b>, these {staffPlural} are available:",
    staffUnavailableOnly: "{staff} isn't available on {weekday}. {short}'s next available day is <b>{next}</b> ({range}).",
    specialist: "For {service}, you'll see <b>{staff}</b>, our {specialty}. {short} is available {days}, {range} — the next opening is <b>{next}</b>. Would you like to book?",
    recommend: "For this visit, I'd recommend <b>{staff}</b>, our {specialty} — good news, {short} is available on {weekday} ({range}).",
    recommendOther: "For this visit, I'd recommend <b>{staff}</b>, our {specialty}, who is available {days}.",
    staffInvalid: "Please choose one of the {staffPlural} above, or tap “{anyStaff}” and I'll pick the best match.",
    timeStaff: "{staff} works {range} on {weekday}. Please choose a time in that range.",
    staffTimeClash: "{staff} is available on {date}, but works {range}, so {time} won't work. Please choose a time within those hours.",
    staffFees: "",
    compareStaff: "All our {staffPlural} are highly experienced in their specialties: {staffShortList}. You're in great hands with any of them!",
    optionDay: "{option} runs on {days}. The next one is <b>{next}</b>.",
    optionTime: "{option} starts at {times}. Please pick one of those times.",
    openOn: "Yes, we're open on <b>{date}</b> from {openShort} to {closeShort}. Would you like to book?",
    closedOn: "Sorry, we're closed on {weekday}. We're open {hoursShort}.",

    nameInvalid: "Could you please share your <b>full name</b> (letters only)? You can also type “cancel” to stop.",
    phoneInvalid: "Hmm, that doesn't look like a valid phone number. Could you enter it with digits, like <b>+1 555 123 4567</b>?",
    confirmInvalid: "Just reply <b>Yes</b> to confirm, or <b>Edit</b> if anything needs changing.",
    askContact: "Thank you, {first}! What's the best way to reach you: <b>phone number</b>, <b>email</b>, or both?",
    askContactShort: "What's the best way to reach you: <b>phone number</b>, <b>email</b>, or both?",
    askContactResched: "Thank you, {first}. What phone number or email was the {noun} booked with?",
    askPhoneOnly: "Sure — what's the best <b>phone number</b> to reach you on?",
    askEmailOnly: "Of course — what's your <b>email address</b>?",
    askBoth: "Perfect — what are your <b>phone number</b> and <b>email address</b>?",
    askOtherEmail: "And what's your <b>email address</b>?",
    askOtherPhone: "And what's the best <b>phone number</b> for you?",
    ackPhone: "Perfect, I've got your number.",
    ackEmail: "Got it, I've noted your email.",
    ackBoth: "Great, I've got both your number and email.",
    contactInvalid: "I didn't quite catch a phone number or email there — could you share one? For example <b>+1 555 123 4567</b> or <b>name@example.com</b>.",
    emailInvalid: "Hmm, that email doesn't look quite right — could you double-check it? It should look like <b>name@example.com</b>.",
    hiName: "Hi {first}! 😊 ",
    bookFor: "I'd love to help you book for {when}. ",
    notedWhen: "I've noted {when}. ",
    alsoNoted: "I've also noted {items}. ",
    closing: "You're all set, {first}! ✅ {summary}. {contactLine}{extra} {signoff}",
    closingLine: "Your {noun}{staffWith} is booked for {date} at {time}",
    contactLinePhone: "{team} will call you on your number to confirm.",
    contactLineEmail: "{team} will reach out to you by email to confirm.",
    contactLineBoth: "{team} will contact you by phone or email to confirm.",
    team: "Our team",
    closingExtra: "",
    calendarButton: "📅 Add to Calendar",
    signoffPhone: "Have a wonderful day! 😊",
    signoffEmail: "Have a great day! 😊",
    signoffBoth: "Have a lovely day! 😊",
    anythingElseOnce: "Is there anything else I can help you with?",
    yesAfter: "Of course! What else can I help you with?",
    goodbyes: "Take care, {first}! See you soon. 👋|It was a pleasure, {first}! Have a wonderful day. 👋|You're very welcome, {first}! See you soon. 👋",
    goodbyeNoName: "Take care! See you soon. 👋",
    welcomeBack: "You're welcome! 👋",
    dateImpossible: "That date doesn't exist on the calendar. Could you pick another one — for example “next Monday” or “Oct 12”?",
    datePast: "That date has already passed. Could you choose an upcoming day — for example “tomorrow” or “next Friday”?",
    dateClosed: "Sorry, we're closed on {weekday}. We're open {hoursShort}. Which other day works for you?",
    dateFar: "We take bookings up to 3 months ahead. Could you choose an earlier date?",
    dateTodayLate: "We're fully booked for the rest of today. Which other day works for you?",
    dateUnclear: "Sorry, I didn't quite catch that date. Could you try something like “tomorrow”, “next Monday” or “Oct 12”?",
    timeRange: "That's outside our hours — we're open {openShort} to {closeShort} that day. Could you choose a time in that range, like “11 AM”?",
    timeLate: "Our last {noun} starts at {lastShort}. Could you choose a time between {openShort} and {lastShort}, like “2 PM”?",
    timePast: "That time has already passed today. Could you choose a later time?",
    timeUnclear: "Sorry, I didn't quite catch the time. Could you enter something like <b>11:00 AM</b> or <b>5:30 PM</b>?",
    timeAlso: "Also, {time} is outside our hours ({openShort} – {closeShort}), so we'll choose a time next."
  };

  // Rotating short messages for the 2nd+ wrong attempt in a row (never the same line twice in a row)
  const DEFAULT_SHORT_ERRORS = {
    name: ["Hmm, that doesn't look like a name — could you type your full name?", "Sorry, I didn't catch your name. What should I call you?", "Could you share your first and last name, using letters only?"],
    contact: ["Hmm, that doesn't look quite right — could you share a phone number or an email address?", "Sorry, I couldn't read that. A number like +1 555 123 4567 or an email like name@example.com works perfectly.", "Could you double-check your phone number or email for me?"],
    email: ["That email still doesn't look quite right — could you check the spelling?", "Hmm, I can't read that email address. Something like name@example.com works.", "Could you type your email once more? It needs an @ and a domain, like .com."],
    date: ["Hmm, that date doesn't work for us — could you pick one of the days below?", "Sorry, I couldn't use that date. Which other day suits you ({openDaysText})?", "Could you try another date, like “tomorrow” or “next Friday”?"],
    time: ["Hmm, that time doesn't quite work — could you choose one of the times below?", "Sorry, that time won't work. Anything between {openShort} and {lastShort} is fine.", "Could you pick another time, like “3:30 PM”?"],
    staff: ["Which of our {staffPlural} would you like? Just tap one above.", "Tap one of the {staffPlural} above, or “{anyStaff}” and I'll pick for you."],
    confirm: ["Shall I go ahead and confirm it? Just reply yes, or tap “Edit details” to change anything.", "No problem — tap “Yes, confirm” to book, or “Edit details” to make changes."],
    field: ["Could you choose one of the options below?", "Just tap one of the options below, or type a short answer."]
  };

  /* Words that clearly belong to OTHER industries. A bot treats these as
     off-topic unless its own config uses them (e.g. "menu" for a restaurant). */
  const INDUSTRY_WORDS = [
    "tooth", "teeth", "dentist", "dental", "braces", "filling", "fillings", "cavity", "root canal", "gum", "gums", "orthodontist",
    "menu", "dish", "dishes", "biryani", "curry", "naan", "pizza", "burger", "pasta", "sushi", "dessert", "restaurant", "dine", "dinner", "lunch", "breakfast", "takeaway", "chef", "wine", "cocktail",
    "property", "properties", "apartment", "house", "villa", "condo", "rent", "rental", "lease", "mortgage", "realtor", "listing", "listings", "bedroom", "bedrooms", "landlord", "tenant", "plot",
    "haircut", "hairstyle", "hair", "stylist", "salon", "facial", "manicure", "pedicure", "nails", "makeup", "bridal", "waxing", "blowdry", "eyebrows", "lashes",
    "gym", "workout", "fitness", "membership", "trainer", "yoga", "zumba", "crossfit", "weights", "cardio", "treadmill", "protein", "muscle", "exercise", "bodybuilding"
  ];

  /* =====================================================================
     STYLES (scoped inside the Shadow DOM) — accent colours come from the config theme
     ===================================================================== */
  const CSS_TEMPLATE = (t) => `
  :host{all:initial}
  .bs-root{
    --amber:${t.a1}; --red:${t.a2}; --mint:#3CCFB4;
    --grad:linear-gradient(135deg,${t.a1} 0%,${t.a2} 100%);
    --bg:#0B1220; --bubble:#152238; --field:#0F1A2C; --bar:#0E1726;
    --text:#EAF2F8; --muted:#94A3B8; --line:rgba(255,255,255,.08);
    --amber-line:rgba(${t.a1rgb},.32); --amber-soft:rgba(${t.a1rgb},.12);
    --bubble-shadow:0 4px 14px -6px rgba(0,0,0,.6);
    --win-shadow:0 30px 70px -18px rgba(0,0,0,.8),0 0 0 1px rgba(${t.a1rgb},.12),0 0 40px -10px rgba(${t.g2rgb},.18);
    color-scheme:dark;
    font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    font-weight:300;color:var(--text);line-height:1.5;-webkit-font-smoothing:antialiased;font-size:16px;text-align:left;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  svg{display:block}
  button,input{font-family:inherit}
  b,strong{font-weight:500}

  /* ---------- Floating button + tooltip ---------- */
  .chat-launcher{position:fixed;right:24px;bottom:24px;width:62px;height:62px;border-radius:50%;border:0;cursor:pointer;z-index:2147483001;color:#04131C;
    background:var(--grad);display:grid;place-items:center;transition:transform .25s,opacity .25s;
    animation:bsPulse 2.8s ease-out infinite}
  .chat-launcher:hover{transform:scale(1.06)}
  .open .chat-launcher{animation:none;box-shadow:0 10px 26px -8px rgba(${t.a2rgb},.6),0 0 22px rgba(${t.g1rgb},.35)}
  @keyframes bsPulse{
    0%{box-shadow:0 10px 26px -8px rgba(${t.a2rgb},.6),0 0 22px rgba(${t.g1rgb},.4),0 0 0 0 rgba(${t.a1rgb},.5)}
    70%{box-shadow:0 10px 26px -8px rgba(${t.a2rgb},.6),0 0 22px rgba(${t.g1rgb},.4),0 0 0 16px rgba(${t.a1rgb},0)}
    100%{box-shadow:0 10px 26px -8px rgba(${t.a2rgb},.6),0 0 22px rgba(${t.g1rgb},.4),0 0 0 0 rgba(${t.a1rgb},0)}
  }
  .chat-launcher .ico{position:absolute;display:grid;place-items:center;transition:transform .3s,opacity .3s}
  .chat-launcher .i-close{opacity:0;transform:rotate(-90deg) scale(.6)}
  .open .chat-launcher .i-chat{opacity:0;transform:rotate(90deg) scale(.6)}
  .open .chat-launcher .i-close{opacity:1;transform:none}
  .unread{position:absolute;top:-2px;right:-2px;min-width:22px;height:22px;border-radius:11px;background:var(--mint);color:#062B25;font-size:12px;font-weight:500;display:none;place-items:center;padding:0 6px;border:2px solid #04131C;line-height:1}
  .unread.show{display:grid}

  .chat-tooltip{position:fixed;right:98px;bottom:37px;z-index:2147483000;background:var(--bubble);color:var(--text);font-size:14px;font-weight:500;
    padding:10px 16px;border-radius:14px;border:1px solid var(--amber-line);box-shadow:0 12px 28px -10px rgba(0,0,0,.7);white-space:nowrap;cursor:pointer;
    opacity:0;transform:translateX(8px);pointer-events:none;transition:opacity .25s,transform .25s}
  .chat-tooltip::after{content:"";position:absolute;right:-6px;top:50%;width:10px;height:10px;background:var(--bubble);border-top:1px solid var(--amber-line);border-right:1px solid var(--amber-line);transform:translateY(-50%) rotate(45deg);border-radius:0 2px 0 0}
  .chat-tooltip.show{opacity:1;transform:none;pointer-events:auto}
  .open .chat-tooltip{opacity:0;pointer-events:none}

  /* ---------- Window (calm navy with soft teal / sky glows + a faint grid) ---------- */
  .chat-window{position:fixed;right:24px;bottom:100px;z-index:2147483000;width:384px;height:min(640px,calc(100vh - 128px));border-radius:26px;box-shadow:var(--win-shadow);
    background:
      radial-gradient(260px 220px at 8% 22%,rgba(${t.a1rgb},.12),transparent 70%),
      radial-gradient(280px 240px at 96% 62%,rgba(${t.blobrgb},.11),transparent 70%),
      radial-gradient(200px 180px at 30% 95%,rgba(${t.g2rgb},.07),transparent 70%),
      linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px) 0 0/22px 22px,
      linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px) 0 0/22px 22px,
      var(--bg);
    display:flex;flex-direction:column;overflow:hidden;
    transform-origin:bottom right;transform:translateY(16px) scale(.92);opacity:0;visibility:hidden;pointer-events:none;
    transition:transform .34s cubic-bezier(.2,.9,.3,1.1),opacity .22s ease,visibility 0s linear .34s}
  .open .chat-window{transform:none;opacity:1;visibility:visible;pointer-events:auto;transition:transform .34s cubic-bezier(.2,.9,.3,1.1),opacity .22s ease,visibility 0s}

  /* Dark glassy header with a thin gold line — messages scroll softly underneath it */
  .chat-head{position:absolute;top:0;left:0;right:0;z-index:2;color:var(--text);padding:14px 14px 14px 16px;display:flex;align-items:center;gap:12px;
    background:rgba(11,18,32,.68);
    backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);
    border-bottom:1px solid var(--amber);box-shadow:0 8px 24px -14px rgba(${t.a1rgb},.35)}
  .bot-avatar{width:42px;height:42px;border-radius:50%;background:var(--amber-soft);border:1px solid var(--amber-line);color:var(--amber);display:grid;place-items:center;flex-shrink:0}
  .chat-head .who{flex:1;min-width:0;line-height:1.3}
  .chat-head .who .name{display:block;font-size:16px;font-weight:500;letter-spacing:.1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .status{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;color:var(--mint)}
  .status i{width:8px;height:8px;border-radius:50%;background:var(--mint);box-shadow:0 0 0 3px rgba(60,207,180,.2),0 0 8px rgba(60,207,180,.8)}
  .head-btn{width:34px;height:34px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--text);cursor:pointer;display:grid;place-items:center;transition:background .2s,color .2s,border-color .2s}
  .head-btn:hover{background:var(--amber-soft);border-color:var(--amber-line);color:var(--amber)}

  /* ---------- Messages ---------- */
  .chat-body{flex:1;overflow-y:auto;padding:88px 14px 8px;background:transparent;scroll-behavior:smooth}
  .chat-body::-webkit-scrollbar{width:6px}
  .chat-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}
  .day-sep{text-align:center;font-size:11.5px;color:var(--muted);margin:4px 0 14px}
  .msg{display:flex;gap:8px;margin-bottom:14px;animation:bsIn .38s cubic-bezier(.2,.8,.2,1) both}
  @keyframes bsIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  .msg .mini-av{width:28px;height:28px;border-radius:50%;background:var(--amber-soft);border:1px solid var(--amber-line);color:var(--amber);display:grid;place-items:center;flex-shrink:0;align-self:flex-end;margin-bottom:19px}
  .msg .col{display:flex;flex-direction:column;max-width:80%;min-width:0}
  .msg.user{justify-content:flex-end}
  .msg.user .col{align-items:flex-end}
  .bubble{padding:10px 14px;font-size:14.5px;line-height:1.5;font-weight:300;overflow-wrap:anywhere}
  .msg.bot .bubble{background:var(--bubble);color:var(--text);border:1px solid var(--amber-line);border-radius:18px 18px 18px 4px;box-shadow:var(--bubble-shadow)}
  .msg.user .bubble{background:var(--grad);color:#04131C;font-weight:400;border-radius:18px 18px 4px 18px;box-shadow:0 6px 18px -8px rgba(${t.a2rgb},.6)}
  .bubble a{color:var(--amber);font-weight:500;text-decoration:underline;text-decoration-color:rgba(${t.a1rgb},.4);text-underline-offset:2px}
  .msg.user .bubble a{color:#04131C}
  .msg time{font-size:11px;color:var(--muted);margin-top:5px;padding:0 4px}
  .bubble a.map-btn{display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:var(--amber-soft);border:1px solid var(--amber-line);padding:7px 12px;border-radius:12px;text-decoration:none;font-size:13.5px}
  .bubble a.map-btn:hover{background:rgba(${t.a1rgb},.2)}

  .bubble .cal-btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:var(--amber-soft);border:1px solid var(--amber-line);color:var(--amber);font:500 13.5px/1 inherit;font-family:inherit;padding:10px 14px;border-radius:12px;cursor:pointer;min-height:40px;transition:background .2s}
  .bubble .cal-btn:hover{background:rgba(${t.a1rgb},.22)}
  .msg.user time .seen{color:var(--mint)}
  .typing .bubble{display:flex;gap:5px;align-items:center;padding:14px 16px}
  .typing .bubble span{width:7px;height:7px;border-radius:50%;background:var(--amber);animation:bsDot 1.2s infinite ease-in-out}
  .typing .bubble span:nth-child(2){animation-delay:.15s}
  .typing .bubble span:nth-child(3){animation-delay:.3s}
  @keyframes bsDot{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-5px);opacity:1}}

  .price-list{margin-top:4px;min-width:220px}
  .price-list .pl-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.1);font-size:13.5px}
  .price-list .pl-row:last-child{border-bottom:0}
  .price-list .pl-row span:last-child{font-weight:500;color:var(--amber);text-align:right}
  .pl-note{font-size:12.5px;color:var(--muted);margin-top:6px}

  .summary{border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:2px 0 10px;min-width:230px;background:rgba(0,0,0,.18)}
  .summary-head{background:var(--amber-soft);color:var(--amber);font-weight:500;font-size:13px;padding:8px 12px;display:flex;align-items:center;gap:6px}
  .summary-row{display:grid;grid-template-columns:78px 1fr;gap:8px;padding:7px 12px;font-size:13.5px;border-top:1px solid var(--line)}
  .summary-row span:first-child{color:var(--muted)}
  .summary-row span:last-child{font-weight:500;overflow-wrap:anywhere}

  /* ---------- Quick replies ---------- */
  .chips{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px 4px;background:transparent}
  .chips:empty{display:none}
  .chip{border:1px solid var(--amber);background:transparent;color:var(--amber);font-weight:500;font-size:13.5px;line-height:1;padding:9px 15px;border-radius:999px;cursor:pointer;
    transition:background .2s,border-color .2s,color .2s,transform .15s,box-shadow .2s;animation:bsIn .35s ease both}
  .chip:hover{background:var(--amber);color:#04131C;box-shadow:0 0 16px -4px rgba(${t.a1rgb},.6)}
  .chip:active{transform:scale(.96)}
  .chip:focus-visible,.send-btn:focus-visible,.head-btn:focus-visible,.chat-launcher:focus-visible{outline:2px solid var(--amber);outline-offset:2px}

  /* ---------- Input ---------- */
  .chat-input{display:flex;gap:8px;padding:12px 14px;border-top:1px solid var(--line);background:rgba(14,23,38,.92);flex-shrink:0}
  .chat-input input{flex:1;min-width:0;border:1px solid var(--line);border-radius:999px;padding:12px 16px;font-size:15px;font-weight:300;color:var(--text);outline:none;caret-color:var(--amber);
    transition:border-color .2s,box-shadow .2s;background:var(--field);height:auto;width:auto;box-shadow:none}
  .chat-input input::placeholder{color:#7C8BA1}
  .chat-input input:focus{border-color:var(--amber);box-shadow:0 0 0 4px rgba(${t.a1rgb},.14)}
  .send-btn{width:46px;height:46px;border-radius:50%;border:0;background:var(--grad);color:#04131C;cursor:pointer;display:grid;place-items:center;flex-shrink:0;
    transition:transform .15s,box-shadow .2s,filter .2s;box-shadow:0 8px 18px -8px rgba(${t.a2rgb},.8)}
  .send-btn:hover{filter:brightness(1.08);box-shadow:0 0 18px rgba(${t.g1rgb},.45)}
  .send-btn:active{transform:scale(.93)}
  .send-btn svg{transition:transform .25s ease}
  .send-btn:hover svg{transform:rotate(-14deg)}
  .send-btn.fly svg{animation:bsFly .65s cubic-bezier(.3,.7,.4,1)}
  @keyframes bsFly{0%{transform:rotate(-14deg)}40%{transform:translate(14px,-14px) rotate(-24deg);opacity:0}41%{transform:translate(-12px,12px);opacity:0}100%{transform:none;opacity:1}}
  .chat-foot{text-align:center;font-size:11px;color:var(--muted);padding:0 0 10px;background:rgba(14,23,38,.92)}

  /* ---------- Doctor cards ---------- */
  .doc-list{display:flex;flex-direction:column;gap:8px;margin:10px 0 2px}
  .doc-card{display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;background:rgba(0,0,0,.22);border:1px solid var(--amber-line);border-radius:14px;padding:9px 12px;
    color:var(--text);font-family:inherit;font-weight:300;cursor:pointer;transition:background .2s,border-color .2s,transform .15s}
  .doc-card:hover{background:var(--amber-soft);border-color:var(--amber)}
  .doc-card:active{transform:scale(.98)}
  .doc-card:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
  .doc-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .doc-name{font-weight:500;font-size:14px}
  .doc-tag{font-size:10.5px;font-weight:500;color:#04131C;background:var(--grad);padding:2px 8px;border-radius:999px;white-space:nowrap}
  .doc-spec{font-size:12.5px;color:var(--muted)}
  .doc-hours{font-size:12.5px;color:var(--amber)}

  /* ---------- Phones: full-screen chat that follows the on-screen keyboard ---------- */
  @media (max-width:560px){
    .chat-window{top:0;left:0;right:0;bottom:auto;width:100%;max-width:100vw;height:100%;height:var(--bs-vh,100dvh);border-radius:0;transform-origin:bottom center}
    .open .chat-window{transform:translateY(var(--bs-top,0px))}
    .open .chat-launcher{opacity:0;pointer-events:none}
    .chat-launcher{right:16px;bottom:calc(16px + env(safe-area-inset-bottom));width:60px;height:60px}
    .chat-tooltip{right:86px;bottom:calc(28px + env(safe-area-inset-bottom));max-width:calc(100vw - 110px);white-space:normal}
    .chat-head{padding-top:calc(12px + env(safe-area-inset-top));padding-left:calc(14px + env(safe-area-inset-left));padding-right:calc(12px + env(safe-area-inset-right))}
    .head-btn{width:44px;height:44px}
    .chat-body{padding-top:calc(90px + env(safe-area-inset-top));overflow-x:hidden;overscroll-behavior:contain}
    .msg .col{max-width:calc(100% - 36px)}
    .price-list,.summary{min-width:0}
    .chips{padding-left:12px;padding-right:12px}
    .chip{min-height:44px;padding:0 16px;display:inline-flex;align-items:center;max-width:100%;white-space:normal;text-align:left}
    .doc-card{min-height:44px}
    .chat-input{padding-bottom:calc(12px + env(safe-area-inset-bottom))}
    .chat-input input{font-size:16px;min-height:46px}
  }
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;

  /* =====================================================================
     ICONS
     ===================================================================== */
  const ICONS = {
    tooth: '<path d="M12 5.5C10.3 4.3 8.9 3.5 7.2 3.5 4.8 3.5 3 5.5 3 8c0 2.4 1 3.9 1.6 6 .6 2.3.8 4.6 1.6 6.3.5 1 1.8.9 2.1-.2l1.1-4.2c.6-1.4 4.6-1.4 5.2 0l1.1 4.2c.3 1.1 1.6 1.2 2.1.2.8-1.7 1-4 1.6-6.3.6-2.1 1.6-3.6 1.6-6 0-2.5-1.8-4.5-4.2-4.5-1.7 0-3.1.8-4.8 2z"/>',
    dish: '<path d="M4 3v7a3 3 0 0 0 3 3v8M7 3v6M10 3v7a3 3 0 0 1-3 3"/><path d="M17 21V3c-2.2 0-4 2.5-4 6.5 0 2.3 1.2 3.5 4 3.5"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1L20 20M8.1 15.9L20 4M13.5 12l1 0"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    cross: '<path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    drop: '<path d="M12 3s6.5 6.6 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z"/><path d="M9 14.5a3 3 0 0 0 3 3"/>',
    scalpel: '<path d="M3 21l7.5-7.5"/><path d="M10.5 13.5l8.3-8.3a2.1 2.1 0 1 1 3 3L13.5 16.5z"/>',
    hair: '<path d="M7 21c0-6 2.2-9.5 5-12.5M12 21c0-5 1.6-8 3.6-10.5M17 21c0-3.6 1-6 2.4-7.6M5 8.5C6.6 5 9.6 3 13 3c3 0 5.5 1.4 7 3.6"/>',
    syringe: '<path d="M18 2l4 4M16 4l4 4M18 6l-9.5 9.5-3-3L15 3M8.5 12.5l3 3M3 21l3.5-3.5M6.5 15l2.5 2.5"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M9 21l2.2-6.2L14 17v4M8 11.5l3-3.5 3.2 2 2.3 3.2M11 8l-1.2 5.4"/>',
    spine: '<rect x="9" y="2.5" width="6" height="4" rx="1.6"/><rect x="9" y="10" width="6" height="4" rx="1.6"/><rect x="9" y="17.5" width="6" height="4" rx="1.6"/><path d="M5.5 4.5H9M15 4.5h3.5M5.5 12H9M15 12h3.5M5.5 19.5H9M15 19.5h3.5"/>',
    baby: '<circle cx="12" cy="9" r="5"/><path d="M10 8.5h.01M14 8.5h.01M10.4 11c.9.8 2.3.8 3.2 0M6.5 21c0-3 2.4-5 5.5-5s5.5 2 5.5 5"/>',
    stethoscope: '<path d="M5 3v6a4 4 0 0 0 8 0V3"/><path d="M9 13v3a5 5 0 0 0 10 0v-2.5"/><circle cx="19" cy="11.5" r="2"/>',
    ear: '<path d="M6 8.5a6 6 0 1 1 12 0c0 3-2 4-3 5.5s-1 3-1.5 5a3 3 0 0 1-5.5-.5"/><path d="M9 9a3 3 0 0 1 6 0c0 2-2 2.2-2 4"/>',
    bone: '<path d="M8.2 4.2a2.4 2.4 0 1 0-3.4 3.1L6 8.6l9.4 9.4 1.3 1.2a2.4 2.4 0 1 0 3.1-3.4 2.4 2.4 0 1 0-3.4-3.1L7.1 3.4"/>',
    venus: '<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5v7M8.5 18h7"/>',
    flask: '<path d="M9 3h6M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M7.4 15h9.2"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chatFill: '<path fill="currentColor" stroke="none" d="M12 3a9 9 0 0 0-7.9 13.3L3 21l4.8-1.1A9 9 0 1 0 12 3z"/><circle cx="8" cy="12" r="1.2" fill="__A1__" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="__A1__" stroke="none"/><circle cx="16" cy="12" r="1.2" fill="__A1__" stroke="none"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>'
  };
  const icon = (name, size = 20) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const hexRgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
  function themeOf(t = {}) {
    // "Calm Clinical Dark": teal → sky accents by default
    const a1 = t.accent || "#14B8A6", a2 = t.accent2 || "#38BDF8";
    return { a1, a2, a1rgb: hexRgb(a1), a2rgb: hexRgb(a2), g1rgb: t.glow || "20,184,166", g2rgb: t.glow2 || "56,189,248", blobrgb: t.blob || "56,189,248", icon: t.icon || "cross" };
  }

  /* =====================================================================
     SHARED TEXT HELPERS
     ===================================================================== */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const telHref = (p) => "tel:" + p.replace(/[^\d+]/g, "");
  const hmToMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
  const minToLabel = (min) => { const h = Math.floor(min / 60), m = min % 60; const h12 = ((h + 11) % 12) + 1; return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
  const minToShort = (min) => minToLabel(min).replace(":00", "");                 // "10 AM", "7:30 PM"
  const timeLabel = (min) => minToLabel(min) + (min === 720 ? " (noon)" : "");
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };          // the device's real current date
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmtDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const fmtShort = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const relDate = (d) => (sameDay(d, today()) ? "today, " : sameDay(d, addDays(today(), 1)) ? "tomorrow, " : "") + fmtDate(d);
  const weekdayPlural = (d) => d.toLocaleDateString("en-US", { weekday: "long" }) + "s";
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const clockNow = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const joinAnd = (list) => (list.length <= 1 ? list[0] || "" : list.slice(0, -1).join(", ") + " and " + list[list.length - 1]);
  const titleCase = (s) => s.toLowerCase().replace(/(^|[\s'-])([a-zà-ɏ])/g, (m, p, c) => p + c.toUpperCase());
  const firstName = (name) => name.split(" ")[0];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const money = (n) => "$" + n.toLocaleString("en-US");

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const stem = (w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
  const tokenize = (s) => norm(s).split(" ").filter(Boolean).map(stem);

  // Optimal-string-alignment distance (handles swapped letters like "tiemngs")
  function editDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }
  function wordMatch(tok, kw) {
    if (tok === kw) return true;
    if (kw.length >= 4 && tok.startsWith(kw) && tok.length - kw.length <= 4) return true;   // "whiten" → "whitening"
    const max = kw.length >= 9 ? 2 : kw.length >= 6 ? 1 : 0;                              // short words must be exact
    return max > 0 && Math.abs(tok.length - kw.length) <= max && editDistance(tok, kw) <= max;
  }
  // Multi-word keywords match in order, allowing up to 2 filler words between ("change MY appointment")
  function phraseMatch(tokens, words) {
    for (let i = 0; i < tokens.length; i++) {
      if (!wordMatch(tokens[i], words[0])) continue;
      let j = 1, pos = i + 1, gap = 0;
      while (j < words.length && pos < tokens.length && gap <= 2) {
        if (wordMatch(tokens[pos], words[j])) { j++; gap = 0; } else gap++;
        pos++;
      }
      if (j === words.length) return true;
    }
    return false;
  }
  const kwList = (arr) => (arr || []).map(tokenize).filter((w) => w.length);
  const hasAny = (tokens, list) => list.some((w) => (w.length > 1 ? phraseMatch(tokens, w) : tokens.some((t) => wordMatch(t, w[0]))));

  // Shared regular expressions
  const Q_START = /^(what|whats|how|hows|when|where|wheres|who|whos|which|why|is|are|do|does|did|can|could|will|would|should|may|have|has)\b/;
  const INJECTION_RE = /\b(ignore|disregard|forget|override|bypass)\b[^.?!]{0,40}\b(instructions?|rules|prompts?|guidelines|directions|programming|system)\b|\bsystem prompt\b|\byou are now\b|\bpretend (to be|you are|you're)\b|\bact as (a|an)\b|\bjailbreak\b|\bdeveloper mode\b|\bnew instructions\b/i;
  // Self-harm / suicide → caring reply with the 988 Suicide & Crisis Lifeline before anything else
  const CRISIS_RE = /\b(suicid\w*|kill myself|killing myself|hurt myself|hurting myself|harm myself|harming myself|self harm|selfharm|end my life|ending my life|end it all|want to die|wanna die|dont want to live|dont want to be alive|no reason to live|better off dead|take my own life|take my life)\b/;
  const KEYBOARD_RE = /(qwer|wert|erty|rtyu|tyui|yuio|uiop|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm)/;
  const isGibberishWord = (w) => /^[a-z]{3,}$/.test(w) &&
    (!/[aeiouy]/.test(w) || /[^aeiouy]{5,}/.test(w) || KEYBOARD_RE.test(w) || /(.)\1\1/.test(w));
  function isGibberish(n) {
    const words = n.split(" ").filter((w) => /^[a-z]+$/.test(w));
    return words.length > 0 && words.filter(isGibberishWord).length >= Math.ceil(words.length / 2);
  }
  const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/i;
  const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b|\+\d[\d\s().-]{6,}\d|\b\d{7,15}\b/;
  const EARLIEST_RE = /\b(earliest|soonest|asap|as soon as possible|first available|next available)\b/;
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const MON = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";
  const ORD = "(?:st|nd|rd|th)?";
  const DAY_NUM = { sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6 };
  const WEEKDAY_RE = /\b(?:(next|this|coming)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat)\b/;
  const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, couple: 2, "a couple": 2, "a couple of": 2 };
  const NUM = "(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a couple of|a couple|couple)";
  const toNum = (s) => (/^\d+$/.test(s) ? +s : NUM_WORDS[s] || null);
  const MY_BOOKING_RE = /\b(what (did|have) i (book|booked|schedule|scheduled|reserve|reserved)|my (booking|appointment|reservation|viewing|class) (details|summary|info)|(show|see|check|view|remind me of) (me )?my (booking|appointment|bookings|appointments|reservation|viewing|class)|when is my (appointment|booking|reservation|viewing|class)|what time is my (appointment|booking|reservation|viewing|class)|whats my (booking|appointment|reservation|viewing))\b/;
  const ABORT_RE = /^(?:(?:please|ok|okay|actually|oh|no|um|hmm)\s+)*(stop|cancel|cancel (?:it|this|that|booking|the booking|my booking|request|the request|please)|never ?mind|forget (?:it|about it)|start over|exit|quit|i changed my mind|i dont want (?:it|to|this)|no thanks|no thank you)(?:\s+(?:please|thanks|thank you))?$/;
  const YES_RE = /\b(yes|yeah|yep|yup|sure|confirm|confirmed|ok|okay|correct|go ahead|y|please do)\b/;
  const NO_RE = /\b(no|nope|nah|cancel|dont|stop)\b/;
  const EDIT_RE = /\b(edit|change|modify|wrong|fix)\b/;
  const FEE_RE = /\b(cheap|cheaper|cheapest|cost|costs|price|prices|fee|fees|charge|charges|expensive|affordable)\b/;
  const AVAIL_WORDS_RE = /\b(available|availability|free|working|work|works|in on|there|when|days?|schedule|hours)\b/;

  const NAME_INTRO_RE = /\b(my name is|my name's|name is|name's|name:|this is|call me|i am|i'm|im|it's|its|name to)[ \t]+([a-zÀ-ɏ][a-zÀ-ɏ'.-]*(?:[ \t]+[a-zÀ-ɏ][a-zÀ-ɏ'.-]*){0,3})/i;   // a name never runs onto the next line
  const WEAK_INTRO = new Set(["this is", "i am", "i'm", "im", "it's", "its"]);
  const NAME_STOP = new Set(("and my phone number num mobile cell contact is at on for by of tomorrow today tonight morning afternoon evening next this " +
    "i want need would like please the a an to book booking appointment from with calling here but so can could also or dr doctor " +
    "monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december").split(" "));
  const NOT_NAME_START = new Set(("scared afraid nervous worried anxious in having looking not sure fine good ok okay available free busy new interested " +
    "calling trying going here sorry confused feeling getting very really so just still also back a an the currently done ready bleeding " +
    "hurting asking wondering planning coming booking thinking glad happy sad tired late on at from with your pain pregnant vegetarian vegan allergic hungry").split(" "));
  const NOT_A_NAME = new Set(("yes yeah yep no nope ok okay hello hi hey thanks thank test testing name idk none nothing nobody anonymous what why how who " +
    "book booking appointment dentist doctor please sure cancel stop help lol hmm maybe unknown user patient me myself my is the a an and " +
    "number phone at on for to in of it its i im any anyone same free want need like wanna would could should maybe around something anything please pls too also just really yeah sure okay booking book hello thanks cool great nice good fine").split(" "));

  /* =====================================================================
     createBot — builds one chatbot from one config
     ===================================================================== */
  function createBot(CONFIG, opts = {}) {
    // Personalisation (?name=&city=&phone= or data-name / data-city / data-phone) replaces the defaults everywhere
    const OV = Object.fromEntries(Object.entries(opts.overrides || {}).filter(([, v]) => v && String(v).trim()).map(([k, v]) => [k, String(v).trim().slice(0, 80)]));
    const B = { ...CONFIG.business, ...(OV.name ? { name: OV.name, shortName: OV.name } : {}), ...(OV.city ? { city: OV.city } : {}),
      ...(OV.phone ? { phone: OV.phone, whatsapp: OV.phone } : {}) };
    const BK = CONFIG.booking || {}, ST = CONFIG.staff || null;
    const BOT = { ...CONFIG.bot, name: OV.name ? `${OV.name} Assistant` : CONFIG.bot.name };
    const WELCOME = (CONFIG.bot.welcome || "").replace(/\{business\}/g, B.name);
    const T = { ...DEFAULT_TEXT, ...(BOT.replies || {}) };
    const SHORT_ERRORS = { ...DEFAULT_SHORT_ERRORS, ...(BOT.shortErrors || {}) };
    const TH = themeOf(CONFIG.theme);
    const noun = BK.noun || "appointment";
    const STAFF = ST ? ST.list : [];
    const FIELDS = BK.fields || {};
    const toContact = (k) => (k === "phone" ? "contact" : k);
    const BOOK_STEPS = (BK.steps || ["name", "contact", "date", "time"]).map(toContact);
    const RESCHED_STEPS = (BK.rescheduleSteps || ["name", "contact", "date", "time"]).map(toContact);

    /* ---------- Opening hours (per weekday) ---------- */
    const H = CONFIG.hours;
    const DAYS = {};
    if (H.days) for (const [k, v] of Object.entries(H.days)) DAYS[k] = { open: hmToMin(v[0]), close: hmToMin(v[1]) };
    else H.openDays.forEach((dn) => { DAYS[dn] = { open: hmToMin(H.open), close: hmToMin(H.close) }; });
    const LAST_GAP = H.lastSlot && H.close ? hmToMin(H.close) - hmToMin(H.lastSlot) : (H.lastSlotBeforeClose ?? 15);
    Object.values(DAYS).forEach((x) => { x.last = x.close - LAST_GAP; });
    const OPEN_MIN = Math.min(...Object.values(DAYS).map((x) => x.open));
    const CLOSE_MIN = Math.max(...Object.values(DAYS).map((x) => x.close));
    const LAST_MIN = Math.max(...Object.values(DAYS).map((x) => x.last));
    const dayInfo = (d) => DAYS[d.getDay()] || null;
    const isOpenDay = (d) => !!dayInfo(d);
    const hoursTokens = (d) => {
      const x = d && dayInfo(d);
      const o = x ? x.open : OPEN_MIN, c = x ? x.close : CLOSE_MIN, l = x ? x.last : LAST_MIN;
      return { open: minToLabel(o), close: minToLabel(c), openShort: minToShort(o), closeShort: minToShort(c), lastShort: minToShort(l) };
    };

    /* ---------- Staff (doctors / stylists / agents / trainers) ---------- */
    const STAFF_LIST = STAFF.map((d) => {
      const parts = d.name.replace(new RegExp(`^(${(ST.titles || ["dr"]).join("|")})\\.?\\s*`, "i"), "").split(/\s+/);
      const fromMin = hmToMin(d.from), toMin = hmToMin(d.to);
      return { ...d, first: parts[0].toLowerCase(), last: parts[parts.length - 1].toLowerCase(),
        short: d.short || (ST.shortPrefix != null ? ST.shortPrefix : "Dr. ") + parts[0], fromMin, toMin };
    });
    const staffLast = (s, date) => Math.min(s.toMin - 15, date && dayInfo(date) ? dayInfo(date).last : LAST_MIN);
    const rangeText = (s) => `${minToShort(s.fromMin)} – ${minToShort(s.toMin)}`;
    const daysText = (s) => joinAnd(s.days.map((i) => DAY_SHORT[i]));
    const worksOn = (s, date) => s.days.includes(date.getDay());
    const staffText = () => joinAnd(STAFF_LIST.map((d) => `<b>${d.name}</b> (${d.specialty})`));
    const staffShortList = () => joinAnd(STAFF_LIST.map((d) => `${d.name} (${d.specialty})`));
    const specialistText = (topic) => { const d = STAFF_LIST.find((x) => (x.treats || []).includes(topic)); return d ? `<b>${d.name}</b>, our ${d.specialty}` : `our ${ST ? ST.plural : "team"}`; };
    const staffVals = (s) => ({ staff: s.name, short: s.short, specialty: s.specialty, range: rangeText(s), days: daysText(s) });

    // Replaces {tokens} in config texts with live values / links.
    function fill(text, extra = {}) {
      const c = B;
      const tokens = {
        business: esc(B.name), noun, Noun: cap(noun),
        phone: `<a href="${telHref(c.phone)}">${c.phone}</a>`,
        whatsapp: c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/\D/g, "")}" target="_blank" rel="noopener">${c.whatsapp}</a>` : "",
        email: c.email ? `<a href="mailto:${c.email}">${c.email}</a>` : "",
        emergency: c.emergencyPhone ? `<a href="${telHref(c.emergencyPhone)}">${c.emergencyPhone}</a>` : "",
        address: esc(`${c.address}, ${c.city}`),
        mapsLink: `<a class="map-btn" href="${"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${c.name}, ${c.address}, ${c.city}`)}" target="_blank" rel="noopener">📍 View on Google Maps</a>`,
        hours: H.display, hoursShort: H.shortDisplay || H.display, closed: H.closedDisplay || "", openDaysText: H.daysText || "",
        ...hoursTokens(null),
        doctors: staffText(), staffList: staffText(), staffShortList: staffShortList(),
        staffSingular: ST ? ST.singular : "", staffPlural: ST ? ST.plural : "",
        anyStaff: ST ? T.anyStaff.replace("{staffSingular}", ST.singular) : "",
        ...extra
      };
      return String(text).replace(/\{(\w+)(?::(\w+))?\}/g, (m, key, arg) =>
        key === "price" ? (CONFIG.prices && CONFIG.prices[arg] ? CONFIG.prices[arg].value : m)
          : key === "specialist" ? specialistText(arg)
          : (tokens[key] ?? m));
    }
    const tx = (key, extra) => fill(T[key], extra);

    /* ---------- Intents ---------- */
    const staffFaq = ST && CONFIG.faq.find((f) => f.id === ST.intent);
    if (staffFaq) STAFF_LIST.forEach((d) => staffFaq.strong.push(d.first, d.last));
    const INTENTS = CONFIG.faq.map((f) => ({
      ...f,
      kws: [...(f.strong || []).map((k) => ({ w: tokenize(k), pts: 3 })), ...(f.weak || []).map((k) => ({ w: tokenize(k), pts: 1 }))]
    }));
    const intentById = Object.fromEntries(INTENTS.map((i) => [i.id, i]));
    const TOPIC = kwList(BOT.topicWords);
    const URGENT = kwList(BOT.urgentWords);
    const FEAR = kwList(CONFIG.fear ? CONFIG.fear.words : []);
    const COMPARE = kwList(BOT.compareWords || ["better", "best", "compare", "vs", "versus", "which one", "who should", "recommend", "prefer", "more experienced", "good"]);
    // Own vocabulary (so another industry's words only count as off-topic when this bot doesn't use them)
    const OWN = new Set();
    INTENTS.forEach((i) => i.kws.forEach((k) => k.w.forEach((w) => OWN.add(w))));
    TOPIC.forEach((w) => w.forEach((x) => OWN.add(x)));
    Object.values(FIELDS).forEach((f) => (f.options || []).forEach((o) => [o.label, ...(o.match || [])].forEach((p) => tokenize(p).forEach((w) => OWN.add(w)))));
    const OFFTOPIC = new Set((BOT.offTopicWords || []).map(stem));
    INDUSTRY_WORDS.forEach((w) => { const t = tokenize(w); if (t.length === 1 && !OWN.has(t[0])) OFFTOPIC.add(t[0]); });
    const OFFTOPIC_PHRASES = kwList(INDUSTRY_WORDS.filter((w) => w.includes(" ") && !tokenize(w).every((x) => OWN.has(x))));
    // Vocabulary that can never be a person's name: every keyword this bot knows (except staff names),
    // other industries' words and common request words
    const STAFF_NAMES = new Set(STAFF_LIST.flatMap((s) => [s.first, s.last]));
    const FUNCTION_WORDS = new Set("a an the is are am be do does did i me my you your we our to of in on at for and or with it this that what how when where who why can could would should will have has".split(" "));
    const VOCAB = new Set([...OWN, ...INDUSTRY_WORDS.flatMap(tokenize),
      ..."appointment appointments booking bookings book service services surgery surgical operation treatment session visit consult checkup please thanks".split(" ").map(stem)]
      .filter((w) => w.length > 2 && !STAFF_NAMES.has(w) && !FUNCTION_WORDS.has(w)));
    const isVocab = (t) => VOCAB.has(t) || VOCAB.has(stem(t));
    const NON_ANSWER = new Set(["book", "reschedule", "greeting", "thanks", "bye"]);
    const PRIORITY = INTENTS.filter((i) => i.priority).sort((a, b) => a.priority - b.priority);

    function scoreIntent(tokens, intent) {
      let score = 0;
      const perToken = new Map();                    // each word contributes once per intent
      for (const k of intent.kws) {
        if (k.w.length > 1) { if (phraseMatch(tokens, k.w)) score += k.pts; continue; }
        tokens.forEach((t, i) => { if (wordMatch(t, k.w[0])) perToken.set(i, Math.max(perToken.get(i) || 0, k.pts)); });
      }
      perToken.forEach((v) => (score += v));
      return score;
    }
    const sc = (a, id) => a.scores[id] || 0;

    // Which treatment a fear/duration question is about (dental: numb = done under local anesthesia)
    function treatmentOf(a) {
      if (!CONFIG.fear) return null;
      for (const t of CONFIG.fear.treatments) {
        if ((t.intent && sc(a, t.intent) >= 3) || (t.re && t.re.test(a.n))) return t;
      }
      return null;
    }

    // Scores a message against every intent and flags special situations.
    function analyze(text) {
      const n = norm(text), tokens = tokenize(text), scores = {};
      INTENTS.forEach((i) => { scores[i.id] = tokens.length ? scoreIntent(tokens, i) : 0; });
      const a = {
        text, n, tokens, scores,
        question: text.includes("?") || Q_START.test(n),
        injection: INJECTION_RE.test(text),
        crisis: CRISIS_RE.test(n),
        urgent: URGENT.length > 0 && hasAny(tokens, URGENT),
        compare: hasAny(tokens, COMPARE),
        offTopic: tokens.some((t) => OFFTOPIC.has(t)) || hasAny(tokens, OFFTOPIC_PHRASES),
        onTopic: hasAny(tokens, TOPIC),
        gibberish: isGibberish(n)
      };
      a.treatment = treatmentOf(a);
      a.fear = !!CONFIG.fear && (hasAny(tokens, FEAR) ||
        (/\b(is|does|will|would|do|can)\b.*\b(painful|hurt|hurts|pain)\b/.test(n) && (a.treatment !== null || /\b(it|procedure|treatment)\b/.test(n))));
      return a;
    }
    const maxAnswerScore = (a) => Math.max(0, ...INTENTS.filter((i) => !NON_ANSWER.has(i.id)).map((i) => a.scores[i.id]));

    // Specialist for the topics in a message
    function specialistFor(scores) {
      if (!ST) return null;
      for (const id of ST.priority || []) {
        if ((scores[id] || 0) >= 3) { const doc = STAFF_LIST.find((d) => (d.treats || []).includes(id)); if (doc) return { doc, id }; }
      }
      return null;
    }

    /* =====================================================================
       ENTITY EXTRACTION — name, phone, date, time, staff and custom fields
       ===================================================================== */
    function makeDate(match, y, m, d) {
      if (m < 0 || m > 11 || d < 1 || d > 31) return { match, error: "impossible" };
      const t = today(), explicitYear = y != null;
      const yy = explicitYear ? (y < 100 ? 2000 + y : y) : t.getFullYear();
      let dt = new Date(yy, m, d);
      if (dt.getMonth() !== m) return { match, error: "impossible" };
      if (dt < t) {
        if (explicitYear || t - dt <= 60 * 864e5) return { match, error: "past" };   // recently passed → past
        dt = new Date(yy + 1, m, d);                                              // e.g. "Jan 5" → next January
        if (dt.getMonth() !== m) return { match, error: "impossible" };
      }
      return { match, date: dt };
    }
    function dayOnlyDate(match, d) {                                             // "on the 5th" → the next 5th
      if (d < 1 || d > 31) return { match, error: "impossible" };
      const t = today();
      for (let i = 0; i < 3; i++) {
        const dt = new Date(t.getFullYear(), t.getMonth() + i, d);
        if (dt.getDate() === d && dt >= t) return { match, date: dt };
      }
      return { match, error: "impossible" };
    }
    function findDate(s) {
      const t = today();
      let m;
      if ((m = s.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/))) return makeDate(m[0], +m[1], +m[2] - 1, +m[3]);
      if ((m = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)) || (m = s.match(/\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/)))
        return makeDate(m[0], m[3] ? +m[3] : null, +m[1] - 1, +m[2]);                                  // US order: MM/DD
      if ((m = s.match(new RegExp(`\\b${MON}\\s+(\\d{1,2})${ORD}\\b(?:,?\\s+(\\d{4}))?`))))
        return makeDate(m[0], m[3] ? +m[3] : null, MONTHS.indexOf(m[1]), +m[2]);                       // "Feb 31", "October 3rd"
      if ((m = s.match(new RegExp(`\\b(\\d{1,2})${ORD}\\s+(?:of\\s+)?${MON}(?:,?\\s+(\\d{4}))?`))))
        return makeDate(m[0], m[3] ? +m[3] : null, MONTHS.indexOf(m[2]), +m[1]);                       // "31st February"
      if ((m = s.match(/\b(?:on\s+)?the\s+(\d{1,2})(?:st|nd|rd|th)\b/)) || (m = s.match(/\bon\s+the\s+(\d{1,2})\b/)))
        return dayOnlyDate(m[0], +m[1]);                                                                 // "on the 32nd"
      if ((m = s.match(/\bday after tomorrow\b/))) return { match: m[0], date: addDays(t, 2) };
      if ((m = s.match(/\b(tomorrow|tmrw|tmr|tomorow|tommorow|tommorrow|tomorro|2morrow)\b/))) return { match: m[0], date: addDays(t, 1) };
      if ((m = s.match(/\b(today|tonight)\b/))) return { match: m[0], date: t };
      if ((m = s.match(/\b(this|next|coming)?\s*weekend\b/))) {             // "this weekend" → the next open Saturday/Sunday
        const skip = m[1] === "next" && (t.getDay() === 6 || t.getDay() === 0) ? 2 : 0;
        for (let i = skip; i < 14; i++) { const d = addDays(t, i); if ((d.getDay() === 6 || d.getDay() === 0) && isOpenDay(d)) return { match: m[0], date: d }; }
      }
      if ((m = s.match(/\b(yesterday|day before yesterday|last (?:week|month|sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/))) return { match: m[0], error: "past" };
      if ((m = s.match(WEEKDAY_RE))) {
        let diff = (DAY_NUM[m[2]] - t.getDay() + 7) % 7;
        if (m[1] === "next" && diff === 0) diff = 7;
        return { match: m[0], date: addDays(t, diff) };
      }
      return null;
    }
    function dateIssue(d) {
      const t = today();
      if (d < t) return "past";
      if (!isOpenDay(d)) return "closed";
      if (d > addDays(t, BK.maxDaysAhead || 90)) return "far";
      if (sameDay(d, t) && nowMin() >= dayInfo(d).last - 30) return "todayLate";
      return null;
    }

    function findTime(s, lenient) {
      const hint = /\b(afternoon|evening|tonight|night)\b/.test(s) ? "p" : /\bmorning\b/.test(s) ? "a" : null;
      const within = (min) => min >= OPEN_MIN && min < CLOSE_MIN;
      const build = (match, h, mm, ap) => {
        h = +h; mm = mm ? +mm : 0;
        if (h > 23 || mm > 59) return { match, error: "unclear" };
        ap = ap || hint;
        if (ap === "p" && h < 12) h += 12;
        else if (ap === "a" && h === 12) h = 0;
        else if (!ap && h >= 1 && h <= 11) {
          const amOk = within(h * 60 + mm), pmOk = within((h + 12) * 60 + mm);
          if (pmOk && !amOk) h += 12;                                // e.g. restaurant "at 8" → 8 PM
          else if (!(amOk && !pmOk) && h <= 7) h += 12;              // "at 3" → 3 PM (both or neither fit)
        }
        return { match, min: h * 60 + mm };
      };
      let m;
      if ((m = s.match(/\b(12\s*noon|noon|midday)\b/))) return { match: m[0], min: 720 };
      if ((m = s.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?)(?![a-z])/))) return build(m[0], m[1], m[2], m[3][0]);
      if ((m = s.match(/\b(\d{1,2}):(\d{2})\b/))) return build(m[0], m[1], m[2], null);
      if ((m = s.match(/\b(?:at|around|by|to|make it|say)\s+(\d{1,2})(?:\.(\d{2}))?(?![\d\/-])\b(?!\s*(?:people|persons|guests|pax|adults|of us))/))) return build(m[0], m[1], m[2], null);
      if (lenient && (m = s.trim().match(/^(\d{1,2})(?:\.(\d{2}))?$/))) return build(m[0], m[1], m[2], null);
      if ((m = s.match(/\b(morning|afternoon|evening|tonight|night)\b/)) && !/\bgood (morning|afternoon|evening|night)\b/.test(s))
        return { match: m[0], part: m[1] === "tonight" || m[1] === "night" ? "evening" : m[1] };
      return null;
    }
    // Checks a time against the day's hours, the chosen staff member's hours, and "now" (for today).
    function timeIssue(min, date, staff) {
      const x = date && dayInfo(date);
      const open = x ? x.open : OPEN_MIN, close = x ? x.close : CLOSE_MIN, last = x ? x.last : LAST_MIN;
      if (min < open || min >= close) return "range";
      if (min > last) return "late";
      if (staff && (min < staff.fromMin || min > staffLast(staff, date))) return "staffHours";
      if (date && sameDay(date, today()) && min < nowMin() + 30) return "past";
      return null;
    }

    // "Dr. Emily", "with Ali", "Emily Carter" (or just "Emily" when choosing)
    const STAFF_PREFIX = ST ? `(?:${[...(ST.titles || []).map((t) => t + "\\.?"), ST.singular, ...(ST.words || [])].join("|")}|with|see)` : "";
    function findStaff(s, lenient) {
      for (const doc of STAFF_LIST) {
        const names = `(?:${doc.first}|${doc.last})`;
        const re = new RegExp(`\\b${STAFF_PREFIX}\\s+(?:to\\s+|is\\s+)?${names}\\b|\\b${doc.first}\\s+${doc.last}\\b` + (lenient ? `|\\b${names}\\b` : ""));
        const m = s.match(re);
        if (m) return { doc, match: m[0] };
      }
      return null;
    }
    const ANY_STAFF_RE = new RegExp(`\\b(any ${ST ? ST.singular : "one"}|any ${ST ? (ST.words || [])[1] || ST.singular : "one"}|anyone|any one|no preference|doesn'?t matter|don'?t mind|whoever|either one|any of them)\\b`);

    // Custom booking fields (guests, property, service, class…)
    function findChoice(field, tokens, low, lenient) {
      let best = null, bestScore = 0;
      const hits = [];
      (field.options || []).forEach((o, i) => {
        let score = 0;
        // single words: exact / prefix / one typo only ("something" must not become "smoothing")
        const strictMatch = (t, kw) => t === kw || (kw.length >= 4 && t.startsWith(kw) && t.length - kw.length <= 3) || (kw.length >= 6 && Math.abs(t.length - kw.length) <= 1 && editDistance(t, kw) <= 1);
        const idx = new Set(), phr = new Set();                  // which words of the message this option used
        [o.label, ...(o.match || [])].forEach((p) => {
          const w = tokenize(p);
          if (!w.length || !(w.length > 1 ? phraseMatch(tokens, w) : tokens.some((t) => strictMatch(t, w[0])))) return;
          score += w.length;
          for (let s = 0; s + w.length <= tokens.length; s++) {
            if (w.every((k, j) => strictMatch(tokens[s + j], k))) for (let j = 0; j < w.length; j++) { idx.add(s + j); if (w.length > 1) phr.add(s + j); }
          }
        });
        if (lenient && new RegExp(`^\\s*${i + 1}\\s*$`).test(low)) score += 5;
        if (score > 0) hits.push({ o, idx, phr });
        if (score > bestScore) { best = o; bestScore = score; }
      });
      // Fields that allow several choices (salon services, several properties / classes) return them all,
      // in the order the customer mentioned them — but a word that is only part of another option's phrase
      // doesn't count on its own ("couples counseling" is not also "counseling")
      if (field.multi && hits.length > 1) {
        let kept = hits.filter((h) => !(h.idx.size && [...h.idx].every((ix) => hits.some((g) => g !== h && g.phr.has(ix))))).map((h) => h.o);
        if (kept.some((o) => !o.generic)) kept = kept.filter((o) => !o.generic);   // "rhinoplasty consultation" → just rhinoplasty
        if (kept.length === 1) return kept[0];
        const pos = (o) => Math.min(...[o.label, ...(o.match || [])].map((p) => { const i = low.indexOf(p.toLowerCase()); return i < 0 ? 1e9 : i; }));
        if (kept.length > 1) return kept.sort((x, y) => pos(x) - pos(y));
      }
      return best;
    }
    function findNumber(field, s, lenient) {
      const units = field.units || "people|persons|person|guests|pax|adults|of us|ppl";
      let m = s.match(new RegExp(`\\b${NUM}\\s*(?:${units})\\b`)) ||
              s.match(new RegExp(`\\b(?:table|party|group|reservation|booking)\\s+(?:for|of)\\s+${NUM}\\b`)) ||
              (field.allowFor && s.match(new RegExp(`\\bfor\\s+${NUM}\\b(?!\\s*(?:am|pm|a\\.m|p\\.m|:|st|nd|rd|th|\\/|-|\\d))`)));
      if (!m && lenient) m = s.trim().match(new RegExp(`^${NUM}$`));
      if (!m) return null;
      return { match: m[0], value: toNum(m[1]) };
    }

    function nameValid(s) {
      const clean = s.replace(/\s+/g, " ").trim();
      if (!/^[a-zA-ZÀ-ɏ][a-zA-ZÀ-ɏ .'-]{1,59}$/.test(clean)) return false;
      const words = clean.toLowerCase().split(" ");
      if (words.length > 4) return false;
      for (const w of words) {
        const letters = w.replace(/[.'-]/g, "");
        if (!letters || (letters.length === 1 && words.length === 1)) return false;
        if (NOT_A_NAME.has(letters) || isGibberishWord(letters)) return false;
      }
      const tokens = tokenize(clean);
      if (hasAny(tokens, URGENT) || hasAny(tokens, FEAR) || hasAny(tokens, TOPIC)) return false;
      // Service / request words ("appointment", "cleaning", "surgery", "haircut"…) are never a name,
      // and a name can't start with one ("And Surgery", "Cleaning Please")
      if (isVocab(tokens[0]) || (tokens.length === 1 && isVocab(tokens[0]))) return false;
      const isTopic = (toks, min) => INTENTS.some((i) => i.id !== (ST && ST.intent) && scoreIntent(toks, i) >= min);
      if (!isTopic(tokens, 3)) return true;
      // A surname may match a topic ("Lina Park", "Omar Khan") — accept if the first name itself is clearly not a topic
      return tokens.length >= 2 && !isTopic(tokens.slice(0, 1), 1);
    }
    const stripIntro = (s) => s.replace(/^\s*(hi|hello|hey)\b[,!.\s]*/i, "")
      .replace(/^\s*(my name is|my name's|name is|name:|this is|it's|its|i am|i'm|im|call me)\s+/i, "")
      .replace(/[.,!]+$/, "").trim();
    function findName(text) {
      const m = text.replace(/’/g, "'").match(NAME_INTRO_RE);
      if (!m) return null;
      const words = [];
      for (const w of m[2].split(/\s+/)) { if (NAME_STOP.has(w.toLowerCase().replace(/\.$/, ""))) break; words.push(w); }
      if (!words.length) return null;
      if (WEAK_INTRO.has(m[1].toLowerCase()) && NOT_NAME_START.has(words[0].toLowerCase())) return null;
      const name = words.join(" ");
      return nameValid(name) ? titleCase(name) : null;
    }

    // Pulls every piece of booking data out of one message.
    function extractEntities(text, step) {
      let rest = " " + text.toLowerCase().replace(/’/g, "'") + " ";
      const e = { fields: {} };
      const cut = (m) => { rest = rest.replace(m, " "); };

      // Contact: email and/or phone (either can come first, both can be in one message)
      const em = rest.match(EMAIL_RE);
      if (em) { e.email = em[0]; cut(em[0]); }
      else if (/[^\s@]+@\S*/.test(rest) || (step === "contact" && (/\b[a-z0-9._-]+\.(com|net|org|co|io|edu)\b/.test(rest) ||
        /^\s*[a-z0-9._-]+\s+at\s+[a-z0-9.-]+(\s+dot\s+[a-z]+)?\s*$/.test(rest)))) e.emailError = true;                  // "omar at mail"
      const pm = rest.match(PHONE_RE);
      if (pm) { e.phone = pm[0].trim().replace(/^\((?=[^)]*$)/, ""); cut(pm[0]); }
      else if (step === "contact") {
        const digits = rest.replace(/\D/g, "");
        if (digits.length >= 7 && digits.length <= 15 && !/[a-z]{3,}/i.test(rest)) { e.phone = rest.trim().replace(/^[^\d+(]+|[^\d)]+$/g, ""); rest = " "; }
        else if (digits.length >= 3 && !e.email && !/\b(am|pm|guests?|people)\b/.test(rest)) e.phoneError = true;
      }
      if (/\b(use|prefer|only|just)\b[^.\n]*\be ?mail\b|\be ?mail instead\b|\binstead\b[^.\n]*\be ?mail\b|\b(contact|reach) me (by|via|on) e ?mail\b/.test(rest)) e.contactPref = "email";
      else if (/\b(use|prefer|only|just)\b[^.\n]*\b(phone|number|mobile|cell)\b|\b(phone|number) instead\b|\binstead\b[^.\n]*\b(phone|number)\b|\bcall me instead\b/.test(rest)) e.contactPref = "phone";
      // Number fields first ("table for 4") so the number isn't mistaken for a date or time
      for (const [id, f] of Object.entries(FIELDS)) {
        if (f.type !== "number") continue;
        const r = findNumber(f, rest, step === id);
        if (r) { e.fields[id] = r.value; cut(r.match); }
      }
      const dm = findDate(rest);
      if (dm) {
        cut(dm.match);
        if (dm.error) e.dateError = dm.error;
        else { const issue = dateIssue(dm.date); if (issue) { e.dateError = issue; e.dateRaw = dm.date; } else e.date = dm.date; }
        if (dm.match.includes("tonight")) e.part = "evening";
      } else if (EARLIEST_RE.test(rest)) e.earliest = true;

      if (ST) {
        const dr = findStaff(rest, step === "staff");
        if (dr) { e.staff = dr.doc; e.staffMatch = dr.match; cut(dr.match); }
        if (ANY_STAFF_RE.test(rest) || (step === "staff" && /^\s*any\s*$/.test(rest))) e.anyStaff = true;
      } else {
        // No staff lists: a requested doctor is noted for the team to confirm ("with Dr. Patel", "a female doctor")
        const dm2 = rest.match(/\b(?:dr\.?|doctor)\s+(?!who|is|are|available|please|near|appointment)([a-z][a-z'-]{1,20})\b/) || rest.match(/\b(female|male|woman|lady) (doctor|dentist|physician|surgeon|therapist|provider)\b/);
        if (dm2) { e.request = dm2[2] ? `a ${dm2[1]} ${dm2[2]}` : `Dr. ${cap(dm2[1])}`; cut(dm2[0]); }
      }

      const tm = findTime(rest, step === "time");
      if (tm) {
        cut(tm.match);
        if (tm.error) e.timeError = "unclear";
        else if (tm.part) e.part = e.part || tm.part;
        else e.time = tm.min;
      }

      const toks = tokenize(rest);
      for (const [id, f] of Object.entries(FIELDS)) {
        if (f.type !== "choice") continue;
        const o = findChoice(f, toks, rest, step === id);
        if (o) e.fields[id] = o;
      }

      // Free-text fields a config knows how to spot (e.g. "insurance Aetna", "I'm self-pay")
      for (const [id, f] of Object.entries(FIELDS)) {
        if (f.type !== "text" || !f.extract) continue;
        const m = rest.match(f.extract);
        const v = m && (f.extractValue ? f.extractValue(m) : titleCase((m[1] || m[0]).trim()));
        if (v && (f.validate !== "name" || nameValid(v))) { e.fields[id] = v; cut(m[0]); }
      }

      let nm = findName(text);
      // A name split over quick messages ("my name" / "is Lily Tan") — contact details are already removed from `rest`
      if (!nm && text.includes("\n")) nm = findName(rest.replace(/\s+/g, " "));
      // Several quick messages: a line that is just a name ("humayun") is the name — service words never are
      if (!nm && text.includes("\n")) {
        for (const line of text.split("\n")) {
          const l = stripIntro(line.trim());
          if (l && l.split(/\s+/).length <= 3 && !/[\d@?]/.test(l) && !findDate(" " + l.toLowerCase() + " ") && nameValid(l)) { nm = titleCase(l); break; }
        }
      }
      if (nm) {
        e.name = nm;
        // "My name is Sarah Khan" is the customer, not the staff member
        if (e.staff && !new RegExp(`^${STAFF_PREFIX}\\b`).test(e.staffMatch.trim()) && nm.toLowerCase().includes(e.staff.first)) delete e.staff;
      }
      e.rest = rest.replace(/[^a-zÀ-ɏ' .-]/gi, " ").replace(/\s+/g, " ").trim();
      return e;
    }
    const hasFields = (e) => Object.keys(e.fields || {}).length > 0;
    const hasCore = (e) => !!(e.request || e.name || e.phone || e.email || e.emailError || e.phoneError || e.contactPref || e.date || e.dateError || e.time != null || e.timeError || e.staff || e.anyStaff || e.earliest || hasFields(e));
    const hasData = (e) => hasCore(e) || !!e.part;

    // Free-text field filled from the topic of a message (dental: "book a cleaning" → reason "Teeth cleaning")
    function textFieldFrom(a) {
      const out = {};
      for (const [id, f] of Object.entries(FIELDS)) {
        if (f.type !== "text" || !f.fromIntents) continue;
        // every service mentioned counts: "cleaning and surgery" → "Teeth cleaning + Oral surgery"
        const all = [...new Set(f.fromIntents.filter(([iid]) => sc(a, iid) >= 3).map(([, label]) => label))];
        const found = all.length ? all.join(" + ") : null;
        if (f.childIntent && sc(a, f.childIntent) >= 3) out[id] = found && found !== f.childDefaultFrom ? `${found} (child)` : f.childLabel;
        else if (found) out[id] = found;
      }
      return out;
    }

    // Multi-person bookings: "me and my wife", "my husband and I", "both of us"
    // Returns { count, who: [labels for booking 2, 3, …] } — count null means "ask how many".
    const ORDINALS = ["second", "third", "fourth", "fifth", "sixth"];
    const ORDINAL_WHO = BK.multiPerson === false ? ORDINALS.map((o) => `your ${o} ${noun}`) : ORDINALS.map((o) => `the ${o} person`);
    function multiInfo(n) {
      const rel = BK.multiPerson !== false && (
        n.match(/\b(?:me and my|myself and my|for my|and my)\s+(wife|husband|partner|son|daughter|kid|child|mother|mom|mum|father|dad|brother|sister|friend|colleague)\b/) ||
        n.match(/\bmy\s+(wife|husband|partner|son|daughter|mother|mom|mum|father|dad|brother|sister|friend)\s+and\s+(?:me|i|myself)\b/));
      const units = BK.multiUnits || "appointments|bookings|slots|people|persons|of us|friends|kids|children";
      const m = n.match(new RegExp(`\\b${NUM}\\s+(?:${units})\\b`)) || (BK.multiPerson !== false && n.match(new RegExp(`\\b(?:book|for)\\s+${NUM}\\s+(?:people|persons)\\b`)));
      const count = m ? Math.min(toNum(m[1]) || 0, 6) : 0;
      if (count >= 2) return { count, who: ORDINAL_WHO.slice(0, count - 1).map((w, i) => (i === 0 && rel ? "your " + rel[1] : w)) };
      if (rel) return { count: 2, who: ["your " + rel[1]] };
      if (BK.multiPerson !== false && /\b(both of us|two of us|for us both)\b/.test(n)) return { count: 2, who: ["the second person"] };
      if (BK.multiPerson !== false && /\b(me and my family|for my family|for the family|whole family|family booking|group booking|for a few people|several people|multiple appointments|more than one)\b/.test(n)) return { count: null, who: [] };
      return null;
    }
    const multiPerson = (n) => multiInfo(n);

    /* =====================================================================
       AVAILABILITY
       ===================================================================== */
    function availableStaff(date, time) {
      if (!date || dateIssue(date)) return [];
      const isToday = sameDay(date, today());
      const on = STAFF_LIST.filter((s) => worksOn(s, date) && (!isToday || staffLast(s, date) >= nowMin() + 30));
      if (time == null) return on;
      const fit = on.filter((s) => time >= s.fromMin && time <= staffLast(s, date));
      return fit.length ? fit : on;
    }
    function nextDateFor(s, from) {
      let d = from && from > today() ? new Date(from) : today();
      for (let i = 0; i < 35; i++, d = addDays(d, 1)) {
        if (!s.days.includes(d.getDay()) || dateIssue(d)) continue;
        if (s.fromMin != null && sameDay(d, today()) && staffLast(s, d) < nowMin() + 30) continue;
        return d;
      }
      return null;
    }
    function firstOpenDate() {
      let d = today();
      if (!(isOpenDay(d) && nowMin() < dayInfo(d).last - 30)) d = addDays(d, 1);
      while (!isOpenDay(d)) d = addDays(d, 1);
      return d;
    }
    function earliestSlot(pref) {
      const t = today();
      for (let i = 0; i <= 28; i++) {
        const date = addDays(t, i);
        if (dateIssue(date)) continue;
        const x = dayInfo(date);
        let start0 = x.open;
        if (i === 0) start0 = Math.max(start0, Math.ceil((nowMin() + 30) / 30) * 30);
        if (!ST) {                                                     // first free (not already booked) slot
          for (let m = Math.ceil(start0 / SLOT) * SLOT; m <= x.last; m += SLOT) if (!slotTaken(date, m)) return { date, time: m };
          continue;
        }
        let best = null;
        for (const s of pref ? [pref] : STAFF_LIST) {
          if (!worksOn(s, date)) continue;
          const start = Math.max(s.fromMin, start0);
          if (start <= staffLast(s, date) && (!best || start < best.time)) best = { date, time: start, staff: s };
        }
        if (best) return best;
      }
      return null;
    }
    function staffCards(list, rec, sendFor) {
      const sorted = rec && list.includes(rec) ? [rec, ...list.filter((x) => x !== rec)] : list;
      return `<div class="doc-list">` + sorted.map((s) =>
        `<button type="button" class="doc-card" data-send="${esc(sendFor(s))}">` +
          `<span class="doc-top"><span class="doc-name">${esc(s.name)}</span>${s === rec ? `<span class="doc-tag">${esc(T.recommendedTag)}</span>` : ""}</span>` +
          `<span class="doc-spec">${esc(s.specialty)}</span><span class="doc-hours">${rangeText(s)}</span></button>`).join("") + `</div>`;
    }

    /* =====================================================================
       BUILD THE WIDGET (Shadow DOM)
       ===================================================================== */
    if (!document.querySelector("link[data-bs-chat-font]")) {
      const font = document.createElement("link");          // web fonts must be registered on the main document
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500&display=swap";
      font.setAttribute("data-bs-chat-font", "");
      document.head.appendChild(font);
    }
    const host = document.createElement("div");
    host.id = "demo-chatbot";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>${CSS_TEMPLATE(TH)}</style>
      <div class="bs-root">
        <div class="chat-tooltip" role="button" tabindex="-1">${esc(BOT.tooltip)}</div>
        <button class="chat-launcher" aria-label="Open chat" aria-expanded="false">
          <span class="ico i-chat">${icon("chatFill", 28).replace(/__A1__/g, TH.a1)}</span>
          <span class="ico i-close">${icon("close", 26)}</span>
          <span class="unread">1</span>
        </button>
        <section class="chat-window" role="dialog" aria-label="Chat with ${esc(B.name)}">
          <div class="chat-head">
            <div class="bot-avatar">${icon(TH.icon, 23)}</div>
            <div class="who"><span class="name">${esc(BOT.name)}</span><span class="status"><i></i>${esc(T.online)}</span></div>
            ${opts.onSwitch ? `<button class="head-btn switch" title="${esc(T.switchIndustry)}" aria-label="${esc(T.switchIndustry)}">${icon("grid", 17)}</button>` : ""}
            <button class="head-btn restart" title="Start new chat" aria-label="Start new chat">${icon("refresh", 17)}</button>
            <button class="head-btn close" title="Close" aria-label="Close chat">${icon("close", 18)}</button>
          </div>
          <div class="chat-body" aria-live="polite"></div>
          <div class="chips"></div>
          <form class="chat-input" autocomplete="off">
            <input type="text" placeholder="${esc(T.placeholder)}" aria-label="Type your message" maxlength="300">
            <button class="send-btn" type="submit" aria-label="Send">${icon("send", 19)}</button>
          </form>
          <div class="chat-foot">${esc(T.footer)}</div>
        </section>
      </div>`;

    const $ = (s) => shadow.querySelector(s);
    const root = $(".bs-root"), chatBody = $(".chat-body"), chipsEl = $(".chips"), input = $(".chat-input input");
    const launcher = $(".chat-launcher"), tooltip = $(".chat-tooltip"), unreadEl = $(".unread");
    let started = false, unread = 0, queue = Promise.resolve(), session = 0, destroyed = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!destroyed) fn(); }, ms); timers.push(id); return id; };
    const isOpen = () => root.classList.contains("open");
    const isMobile = () => window.matchMedia("(max-width: 560px)").matches;

    /* =====================================================================
       CHAT UI
       ===================================================================== */
    const TEST = { speed: 1, batchMs: BK.batchMs || 4000, tapMs: 1200 };  // wait after the last message / keystroke (tunable for tests)
    function scrollDown() { chatBody.scrollTop = chatBody.scrollHeight; }
    function addMessage(role, html) {
      const row = document.createElement("div");
      row.className = "msg " + role;
      row.innerHTML = (role === "bot" ? `<div class="mini-av">${icon(TH.icon, 15)}</div>` : "") +
        `<div class="col"><div class="bubble">${html}</div><time>${clockNow()}</time></div>`;
      chatBody.appendChild(row);
      scrollDown();
      if (role === "bot" && !isOpen()) setUnread(unread + 1);
      saveState();
      return row;
    }
    function setChips(list = []) {
      chipsEl.innerHTML = "";
      list.forEach((label) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.textContent = label;
        b.onclick = () => sendUser(label, true);
        chipsEl.appendChild(b);
      });
      scrollDown();
      saveState();
    }
    // Cards and buttons inside messages are clickable
    chatBody.addEventListener("click", (ev) => {
      const cal = ev.target.closest("[data-ics]");
      if (cal) return downloadIcs(cal.getAttribute("data-ics"));
      const el = ev.target.closest("[data-send]");
      if (el) sendUser(el.getAttribute("data-send"), true);
    });

    // Queue bot replies so they appear one after another with a typing indicator.
    function bot(html, chips) {
      const mySession = session;
      queue = queue.then(() => new Promise((resolve) => {
        if (mySession !== session || destroyed) return resolve();
        const t = document.createElement("div");
        t.className = "msg bot typing";
        t.innerHTML = `<div class="mini-av">${icon(TH.icon, 15)}</div><div class="col"><div class="bubble"><span></span><span></span><span></span></div></div>`;
        chatBody.appendChild(t); scrollDown();
        const plain = html.replace(/<[^>]+>/g, "");
        const delay = (450 + Math.min(plain.length * 9, 1000) + Math.random() * 250) * TEST.speed;
        setTimeout(() => {
          t.remove();
          if (mySession === session && !destroyed) { addMessage("bot", html); if (chips) setChips(chips); }
          resolve();
        }, delay);
      }));
      return queue;
    }

    /* ---------- Several messages in a row → ONE combined reply ----------
       Every message (and every keystroke) restarts a short wait; when the
       customer pauses, all their messages are answered together. */
    let pending = [], batchTimer = null;
    const pendingRows = [];
    function sendUser(text, immediate) {
      text = String(text).trim();
      if (!text) return;
      pendingRows.push(addMessage("user", esc(text)));
      pending.push(text);
      setChips([]);
      input.value = "";
      scheduleFlush(immediate ? TEST.tapMs : TEST.batchMs);    // never reply instantly: wait until the customer pauses
    }
    function scheduleFlush(ms) {
      clearTimeout(batchTimer);
      batchTimer = setTimeout(() => { if (!destroyed) flush(); }, ms);
      saveState();
    }
    function flush() {
      if (!pending.length) return;
      const combined = normalizeSlang(pending.join("\n"));
      pending = [];
      pendingRows.splice(0).forEach((row) => {           // small "Seen" tick under the customer's messages
        const t = row.querySelector("time");
        if (t && !t.querySelector(".seen")) t.insertAdjacentHTML("beforeend", ` · <span class="seen">Seen ✓</span>`);
      });
      if (Flow.active) handleFlow(combined); else respond(combined);
      saveState();
    }
    // Still typing → keep waiting (every keystroke restarts the timer)
    ["input", "keydown", "compositionupdate"].forEach((ev) => input.addEventListener(ev, () => { if (pending.length) scheduleFlush(TEST.batchMs); }));

    // Slang & short forms → plain English before understanding the message
    const SLANG = [
      [/\b(tmrw|tmr|tmrrw|tmrow|2moro|2morrow|tomoz|tommorow|tomorow)\b/gi, "tomorrow"], [/\btdy\b/gi, "today"], [/\b(pls|plz|plse|pleeze)\b/gi, "please"],
      [/\bu\b/gi, "you"], [/\bur\b/gi, "your"], [/\br\b/gi, "are"], [/\b(appt|apptmt|appnt)\b/gi, "appointment"], [/\beve\b/gi, "evening"],
      [/\bnite\b/gi, "night"], [/\b(thx|thnx|thanx|tnx|ty)\b/gi, "thanks"], [/\bwanna\b/gi, "want to"], [/\bgonna\b/gi, "going to"],
      [/\bgimme\b/gi, "give me"], [/\babt\b/gi, "about"], [/\bhrs\b/gi, "hours"], [/\bmins\b/gi, "minutes"], [/\bppl\b/gi, "people"],
      [/\b(wknd|wkend)\b/gi, "weekend"], [/\bhv\b/gi, "have"], [/\bbday\b/gi, "birthday"], [/\b(rsvp|rez|resv)\b/gi, "reservation"],
      [/\bw\/\s*/gi, "with "], [/\bdr\b(?!\.)/gi, "Dr"], [/\bnxt\b/gi, "next"], [/\bmrng\b/gi, "morning"], [/\baftn\b/gi, "afternoon"], [/\bidk\b/gi, "I don't know"]
    ];
    const normalizeSlang = (s) => SLANG.reduce((acc, [re, to]) => acc.replace(re, to), s);

    /* ---------- "Add to Calendar" (.ics download) ---------- */
    function downloadIcs(id) {
      const rec = SESSION.bookings.find((r) => String(r.id) === String(id));
      if (!rec || !rec.ics) return;
      const pad = (n) => String(n).padStart(2, "0");
      const [y, mo, da] = rec.ics.date.split("-").map(Number);
      const start = new Date(y, mo - 1, da, Math.floor(rec.ics.time / 60), rec.ics.time % 60);
      const end = new Date(start.getTime() + (rec.ics.duration || 60) * 60000);
      const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
      const clean = (s) => String(s).replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Demo Chatbot//EN", "BEGIN:VEVENT",
        `UID:${rec.id}@demo-chatbot`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
        `SUMMARY:${clean(rec.ics.title)}`, `LOCATION:${clean(rec.ics.location)}`, `DESCRIPTION:${clean(rec.ics.description)}`,
        "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = `${B.name.replace(/[^a-z0-9]+/gi, "-")}-${rec.ics.date}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    /* ---------- Chat saved for the visit (survives a page refresh) ---------- */
    const SAVE_KEY = "clinicbot_chat_" + (CONFIG.id || "default") + "_" + B.name.replace(/\W+/g, "");
    let restoring = false;
    function serData(d) {
      const out = {};
      for (const [k, v] of Object.entries(d)) {
        if (v instanceof Date) out[k] = { __d: v.toISOString() };
        else if (k === "staff" && v) out[k] = { __s: v.id };
        else if (FIELDS[k] && Array.isArray(v)) out[k] = { __oa: v.map((o) => o.id) };
        else if (FIELDS[k] && v && typeof v === "object") out[k] = { __o: v.id };
        else out[k] = v;
      }
      return out;
    }
    function deserData(d) {
      const out = {};
      for (const [k, v] of Object.entries(d || {})) {
        if (v && v.__d) out[k] = new Date(v.__d);
        else if (v && v.__s) out[k] = STAFF_LIST.find((s) => s.id === v.__s) || null;
        else if (v && v.__o) out[k] = (FIELDS[k].options || []).find((o) => o.id === v.__o) || null;
        else if (v && v.__oa) out[k] = v.__oa.map((id) => (FIELDS[k].options || []).find((o) => o.id === id)).filter(Boolean);
        else out[k] = v;
      }
      return out;
    }
    function saveState() {
      if (restoring || destroyed) return;
      try {                                              // (also guards the very first calls, before the booking state exists)
        const html = [...chatBody.children].filter((el) => !el.classList.contains("typing")).map((el) => el.outerHTML).join("");
        sessionStorage.setItem(SAVE_KEY, JSON.stringify({
          html, chips: [...chipsEl.children].map((b) => b.textContent), open: isOpen(), started, pending,
          flow: { ...Flow, data: serData(Flow.data), asked: [...Flow.asked] }, session: SESSION
        }));
      } catch (err) { /* storage unavailable — ignore */ }
    }
    function restoreState() {
      let s;
      try { s = JSON.parse(sessionStorage.getItem(SAVE_KEY)); } catch (err) { s = null; }
      if (!s || !s.started || !s.html) return false;
      restoring = true;
      chatBody.innerHTML = s.html;
      setChips(s.chips || []);
      Object.assign(Flow, s.flow, { data: deserData(s.flow.data), asked: new Set(s.flow.asked || []) });
      Object.assign(SESSION, s.session || {});
      started = true;
      restoring = false;
      if (s.pending && s.pending.length) { pending = s.pending; scheduleFlush(300); }
      return s.open ? "open" : "closed";
    }
    function clearState() { try { sessionStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ } }

    /* =====================================================================
       ANSWERS — priority: urgent → priority topics (medical…) → fear →
       staff → availability → specialist → prices → hours → FAQ
       ===================================================================== */
    const P = CONFIG.pricing || {};
    const PRICE_INTENTS = P.intents || {};
    const SERVICE_IDS = CONFIG.fear ? CONFIG.fear.serviceIntents || [] : [];
    const URGENT_CHIPS = BOT.urgentChips || ["Book earliest appointment", "Location"];
    const DO_YOU_RE = /\b(do you (do|offer|provide|have|perform)|can you (do|remove)|how much|price|cost)\b/;
    const staffWords = ST ? [ST.singular, ...(ST.words || [])].map((w) => w + "s?").join("|") : "";
    const AVAIL_RE = ST ? new RegExp(`\\b(who|which (?:${staffWords})|what (?:${staffWords})|any (?:${staffWords})|(?:${staffWords}))\\b[^?]*\\b(available|free|working|on duty)\\b|\\bwhos (available|working|in|on)\\b`) : null;
    const SPECIALIST_Q = ST ? new RegExp(`\\b(which|what|who)\\b[^.]*\\b(${staffWords}|specialist)\\b|\\bwho (does|do|handles|treats|can|should)\\b|\\bwhen\\b`) : null;
    const QTY = (P.qty || []).map((q) => ({ ...q, re: new RegExp(`\\b${q.big ? "(\\d{1,2},\\d{3}|\\d{1,5})" : NUM}\\s+(${q.words})\\b`, "g") }));   // big: "2,000 grafts"
    const priceNums = (p) => (p.value.match(/\d[\d,]*/g) || []).map((x) => +x.replace(/,/g, ""));

    function pricesHtml() {
      const rows = Object.values(CONFIG.prices || {}).map((p) => `<div class="pl-row"><span>${esc(p.label)}</span><span>${esc(p.value)}</span></div>`).join("");
      return `${fill(T.pricesIntro)}<div class="price-list">${rows}</div>` + (T.pricesNote ? `<div class="pl-note">${fill(T.pricesNote)}</div>` : "");
    }
    function servicesHtml() { return tx("servicesText", { list: joinAnd((CONFIG.services || []).map((s) => s.toLowerCase())) }); }

    // "cleaning and whitening together" → each price + the total
    function multiPriceHtml(ids) {
      let min = 0, max = 0, from = false, priced = 0;
      const parts = ids.map((id) => {
        const p = CONFIG.prices[PRICE_INTENTS[id]];
        const isFrom = /\(from\)/i.test(p.label);
        const label = p.label.replace(/\s*\(from\)\s*/i, "").toLowerCase();
        const nums = priceNums(p);
        if (!nums.length) return `${label} ${/&|s$/.test(label) ? "are" : "is"} priced ${p.value.toLowerCase()}`;
        if (/\bper\b/i.test(p.value)) return `${label} is ${isFrom ? "from " : ""}${p.value}`;   // "$13 per unit" can't be added to a total
        priced++; min += nums[0]; max += nums[nums.length - 1]; if (isFrom) from = true;
        return isFrom ? `a ${label} starts from ${p.value}` : `${label} is ${p.value}`;
      });
      let html = cap(joinAnd(parts)) + ".";
      if (priced >= 2) html += fill(T.together, { total: from ? "from " + money(min) : min === max ? money(min) : money(min) + "–" + money(max) });
      return html;
    }
    // "How much for 3 fillings?" → $360 · "2 butter chicken and 3 naan" → itemised total
    function quantityHtml(n) {
      const found = [];
      QTY.forEach((q) => {                          // config order = most specific first ("garlic naan" before "naan")
        q.re.lastIndex = 0; let m;
        while ((m = q.re.exec(n))) {
          const at = m.index, end = at + m[0].length;
          if (!found.some((f) => at < f.end && end > f.at)) found.push({ q, qty: toNum(m[1].replace(/,/g, "")), word: m[2], at, end });
        }
      });
      if (!found.length) return null;
      found.sort((x, y) => x.at - y.at);
      const lines = [];
      let lo = 0, hi = 0, from = false;
      for (const f of found) {
        const p = CONFIG.prices[f.q.key];
        const nums = p ? priceNums(p) : [];
        if (!nums.length || !f.qty) continue;
        const isFrom = /\(from\)/i.test(p.label);
        const l = nums[0] * f.qty, h = nums[nums.length - 1] * f.qty;
        lo += l; hi += h; if (isFrom) from = true;
        const total = isFrom ? "from " + money(l) : l === h ? money(l) : money(l) + "–" + money(h);
        const each = /per /.test(p.value) ? p.value : p.value + " each";
        lines.push({ qty: f.qty, item: f.q.name || f.word, total, each });
      }
      if (!lines.length || (lines.length === 1 && lines[0].qty < 2)) return null;
      if (lines.length === 1) return tx("qtyLine", lines[0]);
      const sum = from ? "from " + money(lo) : lo === hi ? money(lo) : money(lo) + "–" + money(hi);
      return lines.map((x) => `${x.qty} × ${esc(x.item)} (${x.each}) = ${x.total}`).join("<br>") + `<br>Total: <b>${sum}</b>.`;
    }

    function urgentHtml(a) {
      const med = CONFIG.urgentMedicineIntent && sc(a, CONFIG.urgentMedicineIntent) >= 3;
      const line = B.emergencyPhone ? fill(T.emergencyLine) : fill(T.emergencyLineNoNumber);
      return tx("urgent") + " " + line + (med ? " " + T.urgentNoMedicine : "") + " " + T.urgentOffer;
    }
    function fearHtml(a) {
      const t = a.treatment;
      if (!t) return tx("fearGeneral");
      return fill(t.numb ? T.fearNumb : T.fearGentle, { treatment: t.name });
    }
    function openOnHtml(e) {
      if (e.dateError === "closed") return tx("closedOn", { weekday: weekdayPlural(e.dateRaw) });
      if (e.date) return tx("openOn", { date: fmtDate(e.date), ...hoursTokens(e.date) });
      return null;
    }
    function answerHtml(id) {
      const it = intentById[id];
      if (it.action === "prices") return pricesHtml();
      if (it.action === "services") return servicesHtml();
      return fill(typeof it.answer === "function" ? it.answer() : it.answer);
    }
    function availabilityAnswer(e, inFlow) {
      if (e.dateError) return { html: errorText({ field: "date", code: e.dateError, date: e.dateRaw }), chips: [], info: true };
      let date = e.date || today();
      if (!e.date && availableStaff(date).length === 0) date = firstOpenDate();
      const list = availableStaff(date, null);
      if (!list.length) return { html: tx("noStaff", { date: fmtDate(date) }), chips: [], info: true };
      const send = (s) => (inFlow ? `${s.name} on ${fmtShort(date)}` : `Book with ${s.name} on ${fmtShort(date)}`);
      return { html: tx("availableOn", { date: fmtDate(date) }) + staffCards(list, null, send), chips: [], info: true };
    }
    function staffAvailabilityAnswer(s, e) {
      if (e.dateError) return { html: errorText({ field: "date", code: e.dateError, date: e.dateRaw }), chips: [], info: true };
      const vals = staffVals(s);
      if (!e.date) {
        const next = nextDateFor(s);
        return { html: tx("staffGeneral", { ...vals, next: next ? relDate(next) : "—" }), chips: next ? [`Book with ${s.short} on ${fmtShort(next)}`] : [], info: true };
      }
      if (worksOn(s, e.date)) return { html: tx("staffYes", { ...vals, date: fmtDate(e.date) }), chips: [`Book with ${s.short} on ${fmtShort(e.date)}`], info: true };
      const next = nextDateFor(s, e.date);
      return { html: tx("staffNo", { ...vals, weekday: weekdayPlural(e.date), next: next ? relDate(next) : "—" }), chips: next ? [`Book with ${s.short} on ${fmtShort(next)}`] : [], info: true };
    }
    function specialistAnswer(spec) {
      const s = spec.doc, next = nextDateFor(s);
      return { html: tx("specialist", { ...staffVals(s), service: (ST.serviceLabels || {})[spec.id] || "this", next: next ? relDate(next) : "—" }), chips: [`Book with ${s.short}`] };
    }

    function buildAnswer(a, e, inFlow) {
      const s = a.scores, n = a.n;
      if (a.urgent) return { html: urgentHtml(a), chips: URGENT_CHIPS };
      for (const it of PRIORITY) if (s[it.id] >= 3) return { html: answerHtml(it.id), chips: it.chips || [] };
      const painQ = INTENTS.find((i) => i.fearAnswer && s[i.id] >= 3);     // a niche's own "does it hurt?" answer
      if (a.fear && painQ) return { html: answerHtml(painQ.id), chips: painQ.chips || [] };
      if (a.fear) {
        const svc = SERVICE_IDS.filter((id) => (s[id] || 0) >= 3);
        const lead = svc.length && DO_YOU_RE.test(n) ? answerHtml(svc[0]) + "<br><br>" : "";   // "do you do X and does it hurt?"
        return { html: lead + fearHtml(a), chips: CONFIG.fear.chips || [] };
      }
      const qtyFirst = quantityHtml(n);                      // "how much for 3 fillings?" → the total, not one filling's details
      if (qtyFirst) return { html: qtyFirst, chips: P.qtyChips || [BOT.quickReplies[0], "Payment options"] };
      let optLead = "";
      // A question about one specific option (a property, class or service) → that option's details
      // (unless it's really about the staff: "which trainer is best for boxing?")
      const opt = Object.values(e.fields || {}).find((v) => v && typeof v === "object" && v.info);
      if (opt && a.question && !(ST && ((s[ST.intent] || 0) >= 3 || (/\bwho\b/.test(n) && specialistFor(s))))) {
        const others = INTENTS.filter((i) => !NON_ANSWER.has(i.id) && !(BOT.optionIntents || []).includes(i.id) && s[i.id] >= 3);
        if (!others.length) return { html: fill(opt.info), chips: opt.chips || [BOT.quickReplies[0]] };
        if (DO_YOU_RE.test(n)) optLead = fill(opt.info) + "<br><br>";   // "do you do X, and …?" → details first, then the other answer
      }
      if (ST) {
        const staffScore = s[ST.intent] || 0;
        if (staffScore >= 3 && FEE_RE.test(n) && T.staffFees) return { html: tx("staffFees"), chips: ST.feeChips || [] };
        const spec = specialistFor(s);
        const specQ = spec && spec.id !== "pain" && SPECIALIST_Q.test(n);
        if (staffScore >= 3 && a.compare && !(specQ && !e.staff)) return { html: tx("compareStaff"), chips: [BOT.quickReplies[0]] };   // "who's best for boxing?" → the specialist
        if (e.staff && a.question && (e.date || e.dateError || AVAIL_WORDS_RE.test(n))) return staffAvailabilityAnswer(e.staff, e);
        if (AVAIL_RE.test(n)) return availabilityAnswer(e, inFlow);
        if (specQ) return specialistAnswer(spec);
      }
      const qty = quantityHtml(n);
      if (qty) return { html: qty, chips: P.qtyChips || [BOT.quickReplies[0], "Payment options"] };
      if (CONFIG.fear && (s.duration || 0) >= 3 && a.treatment && !((s.consultation || 0) >= 3)) return { html: tx("durationOther"), chips: [BOT.quickReplies[0]] };

      let priced = Object.keys(PRICE_INTENTS).filter((id) => (s[id] || 0) >= 3);
      (BOT.overlaps || []).forEach(([keep, drop]) => { if (priced.includes(keep)) priced = priced.filter((id) => id !== drop); });   // "lip filler" isn't also "filler"
      if (priced.length >= 2) return { html: multiPriceHtml(priced), chips: P.multiChips || [BOT.quickReplies[0], "Payment options"] };

      if (((s.timings || 0) >= 1 || (s.weekends || 0) >= 1) && a.question) {
        const h = openOnHtml(e);
        if (h) return { html: h, chips: [BOT.quickReplies[0], "Location"], info: true };
      }

      const candidates = INTENTS.filter((i) => !NON_ANSWER.has(i.id));
      let ids = candidates.filter((i) => s[i.id] >= 3).sort((x, y) => s[y.id] - s[x.id]).map((i) => i.id);
      if (!ids.length) {
        const top = candidates.slice().sort((x, y) => s[y.id] - s[x.id])[0];
        const need = inFlow ? (a.question ? 2 : Infinity) : 1;
        if (top && s[top.id] >= need) ids = [top.id];
      }
      if (!ids.length) return null;
      // Avoid overlapping answers to the same question
      if (ids.length > 1) ids = ids.filter((id) => !["prices", "services"].includes(intentById[id].action) && id !== (ST && ST.intent));
      if (ids.includes("weekends")) ids = ids.filter((id) => id !== "timings");
      if (ids.includes("pain")) ids = ids.filter((id) => id !== "emergency");
      (BOT.overlaps || []).forEach(([keep, drop]) => { if (ids.includes(keep)) ids = ids.filter((id) => id !== drop); });
      if (!ids.length) return null;
      ids = ids.slice(0, 3);
      return { html: optLead + ids.map(answerHtml).join("<br><br>"), chips: intentById[ids[0]].chips || BOT.quickReplies };
    }

    /* ---------- "What did I book?" ---------- */
    function recordCard(rec) {
      const rows = rec.rows || [["Name", rec.name], ["Phone", rec.phone], ["Date", rec.date ? fmtDate(fromISO(rec.date)) : ""], ["Time", rec.time], ["Doctor", rec.doctor], ["Reason", rec.reason]];
      return `<div class="summary"><div class="summary-head">${icon("calendar", 14)} ${esc(fill(T.summaryTitle))}</div>` +
        rows.filter(([, v]) => v).map(([k, v]) => `<div class="summary-row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join("") + `</div>`;
    }
    function showMyBookings(chips) {
      let list = SESSION.bookings.slice(-3);
      if (!list.length) {
        try { const last = (JSON.parse(localStorage.getItem(STORE_KEY)) || []).find((r) => r.type === "new"); if (last) list = [last]; } catch (err) { /* ignore */ }
      }
      if (!list.length) return bot(tx("noBooking"), [BOT.quickReplies[0]]);
      return bot(tx("myBookings") + list.map(recordCard).join("") + tx("myBookingsNote"), chips);
    }

    /* =====================================================================
       ROUTER (no booking in progress)
       ---------------------------------------------------------------------
       🔌 WHERE THE CLAUDE API GOES (real/production version)
       This widget uses local intent detection so it works with no API key.
       For the real version, send free-text questions to Claude — e.g. call
       it from respond() when nothing matched (the fallback / out-of-scope
       branches), or replace buildAnswer() entirely:

         const res = await fetch("https://YOUR-BACKEND/api/chat", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ messages: chatHistory })
         });
         const { reply } = await res.json();
         bot(esc(reply));

       The backend (never the browser — the API key must stay secret) calls:
         POST https://api.anthropic.com/v1/messages
         headers: x-api-key: process.env.ANTHROPIC_API_KEY,
                  anthropic-version: 2023-06-01, content-type: application/json
         body: { model: "claude-sonnet-5-5",   // or claude-haiku-4-5 for lower cost
                 max_tokens: 300,
                 system: <built from CONFIG: business facts, prices, hours, staff,
                          + rules: reply in English, 1–3 sentences, stay on topic,
                          use the out-of-scope line for anything else>,
                 messages: chatHistory }
       Keep the booking flow below as-is (deterministic & validated), and send
       confirmed bookings from submitRequest() to email/WhatsApp/Sheets/CRM.
       ===================================================================== */
    const outOfScope = () => bot(esc(T.outOfScope.replace("{business}", B.name)));    // one line only — no quick replies
    function respond(text) {
      const a = analyze(text), s = a.scores, defaults = BOT.quickReplies;
      if (a.crisis) return bot(tx("crisis"));                                    // self-harm → 988 first, nothing else
      if (!a.n) return bot(tx("rephrase"), defaults);
      if (a.injection) return outOfScope();                                      // prompt injection → one line

      const e = extractEntities(text, null);
      const core = hasCore(e);
      const ans = buildAnswer(a, e, false);

      if (a.urgent) return bot(ans.html, ans.chips);                             // emergencies always first
      if (MY_BOOKING_RE.test(a.n)) return showMyBookings(defaults);

      // Conversation wrap-up after a booking: "no" / "thanks" / "bye" → one warm goodbye, then no more questions
      if (SESSION.phase) {
        const closingWords = (s.bye || 0) >= 3 || (s.thanks || 0) >= 3 || /^(no|nope|nah|not really|nothing|nothing else|no thanks|no thank you|thats all|thats it|all good|im good|im fine|all set|no thats all|no thats it)\b/.test(a.n);
        if (closingWords && !hasCore(e) && maxAnswerScore(a) < 3 && !a.question) {
          const first = SESSION.lastName;
          const lines = T.goodbyes.split("|");
          const html = SESSION.phase === "closed" ? ((s.bye || 0) >= 3 ? (first ? `Bye for now, ${esc(first)}! 👋` : "Bye for now! 👋") : tx("welcomeBack")) : first ? fill(lines[Math.floor(Math.random() * lines.length)], { first: esc(first) }) : tx("goodbyeNoName");
          SESSION.phase = "closed";
          return bot(html);
        }
        if (SESSION.phase === "askedElse" && /^(yes|yeah|yep|sure|yes please|actually yes)$/.test(a.n)) { SESSION.phase = null; return bot(tx("yesAfter"), defaults); }
        SESSION.phase = null;                                                    // they asked something new → carry on normally
      }
      if (a.offTopic && !a.onTopic && maxAnswerScore(a) < 3 && !hasFields(e)) return outOfScope();
      if ((s.reschedule || 0) >= 3 && !((s.cancelPolicy || 0) >= 3)) return startFlow("reschedule", e);   // "cancellation policy?" is a question, not a cancellation
      if (ans && ans.info && (s.book || 0) < 3) return bot(ans.html, ans.chips);   // availability / opening-day questions

      const multi = multiPerson(a.n);
      const coreNoFields = !!(e.name || e.phone || e.email || e.date || e.dateError || e.time != null || e.timeError || e.staff || e.anyStaff || e.earliest);
      const wantsBooking = (s.book || 0) >= 3 || e.earliest || multi || ((s.book || 0) >= 1 && (core || !ans) && !(a.question && ans)) ||
        (coreNoFields && (!a.question || !ans || e.time != null || e.timeError || e.phone || e.email)) ||
        (hasFields(e) && !ans);                                                     // "Facial" alone → info, "a facial tomorrow" → booking
      if (wantsBooking) {
        Object.entries(textFieldFrom(a)).forEach(([id, v]) => { if (e.fields[id] == null) e.fields[id] = v; });
        if (BK.multiPerson === false && /\b(me and my|my (wife|husband|partner|friend|date) and (me|i))\b/.test(a.n)) {   // restaurant: "me and my wife" = a table for 2
          const nf = Object.keys(FIELDS).find((id) => FIELDS[id].type === "number");
          if (nf && e.fields[nf] == null) e.fields[nf] = 2;
        }
        return startFlow("book", e, { multi, greeted: (s.greeting || 0) >= 3 });
      }

      if (ans) return bot(ans.html, ans.chips);
      if ((s.bye || 0) >= 3 || (s.thanks || 0) >= 3) return bot(answerHtml((s.bye || 0) >= 3 ? "bye" : "thanks"));   // warm goodbye
      if ((s.greeting || 0) >= 3) return bot(answerHtml("greeting"), defaults);
      if (/^(yes|yeah|yep|sure|ok|okay|yes please)$/.test(a.n)) return bot(tx("yesIdle"), defaults);
      if (/^(no|nope|nah|no thanks|no thank you)$/.test(a.n)) return bot(tx("noIdle"));
      if (a.offTopic) return outOfScope();
      if (a.gibberish) return bot(tx("rephrase"), defaults);
      if (a.onTopic) return bot(tx("fallback"), defaults);
      return outOfScope();
    }

    /* =====================================================================
       BOOKING STATE — kept separately, so answering questions never resets it
       ===================================================================== */
    const Flow = { active: null, step: null, data: {}, earliest: false, recNoted: false, pending: [], prevPhone: null, asked: new Set(), failField: null, failCount: 0 };
    const CONFIRM_CHIPS = ["✅ Yes, confirm", "✏️ Edit details", "✖ Cancel"];
    const SUMMARY = (BK.summary || ["name", "contact", "date", "time", ...(ST ? ["staff"] : []), ...Object.keys(FIELDS)]).map(toContact);
    const labelOf = (k) => (k === "name" ? "Name" : k === "contact" ? "Contact" : k === "date" ? "Date" : k === "time" ? "Time" : k === "staff" ? ST.label : FIELDS[k].label);
    const EDIT_CHIPS = (BK.editChips || []).map((c) => (c === "Phone" ? "Contact" : c)).filter(Boolean).length ? BK.editChips.map((c) => (c === "Phone" ? "Contact" : c)) : SUMMARY.filter((k) => k !== "staff" || BOOK_STEPS.includes("staff")).map(labelOf);
    const recStaff = (d) => (d.recId ? STAFF_LIST.find((x) => x.id === d.recId) : null);
    const stepsOf = () => (Flow.active === "book" ? BOOK_STEPS : RESCHED_STEPS);
    const chosenOption = (d) => { for (const id of Object.keys(FIELDS)) { const v = d[id]; if (v && typeof v === "object" && (v.days || v.times)) return v; } return null; };
    const fieldValueText = (id, v) => (v == null ? "" : Array.isArray(v) ? v.map((o) => o.label).join(" + ") : typeof v === "object" ? v.label : FIELDS[id] && FIELDS[id].display ? FIELDS[id].display.replace("{value}", v) : String(v));

    function nextStep() {
      const d = Flow.data;
      if (d.cancelOnly) return "submit";
      const missing = stepsOf().find((k) => (k === "contact" ? (!d.phone && !d.email) || (Flow.contactWant === "both" && !(d.phone && d.email)) : d[k] == null));
      return missing || (Flow.active === "book" ? "confirm" : "submit");
    }
    function dateChips() {
      const d0 = Flow.data, out = [], t = today(), opt = chosenOption(d0);
      let d = firstOpenDate();
      for (let i = 0; i < 40 && out.length < 5; i++, d = addDays(d, 1)) {
        if (!isOpenDay(d) || (d0.staff && !worksOn(d0.staff, d)) || (opt && opt.days && !opt.days.includes(d.getDay()))) continue;
        if (d0.staff && sameDay(d, t) && staffLast(d0.staff, d) < nowMin() + 30) continue;
        out.push(sameDay(d, t) ? "Today" : sameDay(d, addDays(t, 1)) ? "Tomorrow" : fmtShort(d));
      }
      return Flow.active === "reschedule" ? [...out, T.justCancel] : out;
    }
    const PARTS = { morning: [0, 719], afternoon: [720, 1019], evening: [1020, 1439] };
    function timeChips(date, part, staff) {
      const isToday = date && sameDay(date, today());
      const okNow = (m) => !isToday || m >= nowMin() + 30;
      const opt = chosenOption(Flow.data);
      if (opt && opt.times) return opt.times.map(hmToMin).filter(okNow).map(minToLabel);
      const x = date && dayInfo(date);
      let from = staff ? staff.fromMin : x ? x.open : OPEN_MIN, to = staff ? staffLast(staff, date) : x ? x.last : LAST_MIN;
      if (part && PARTS[part]) {
        const pf = Math.max(from, PARTS[part][0]), pt = Math.min(to, PARTS[part][1]);
        if (pf <= pt) { from = pf; to = pt; }
      }
      if (!staff && !part && !x && BK.timeSlots) return BK.timeSlots.slice();
      // Open slots only (some are already taken, like a real diary), spread over the day
      let slots = [];
      for (let m = Math.ceil(from / SLOT) * SLOT; m <= to; m += SLOT) if (okNow(m) && !slotTaken(date, m)) slots.push(m);
      if (slots.length > 8) { const st = (slots.length - 1) / 7; slots = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => slots[Math.round(i * st)]); }
      return slots.map(minToLabel);
    }
    // A realistic diary: roughly a third of slots are already booked (stable for the same day and time)
    const SLOT = BK.slotMinutes || 30;
    function slotTaken(date, min) {
      if (!date) return false;
      // a slot booked earlier in this chat (e.g. the first of two appointments) is taken too
      if (SESSION.bookings.some((r) => r.ics && r.ics.date === toISO(date) && Math.floor(r.ics.time / SLOT) === Math.floor(min / SLOT))) return true;
      const key = `${CONFIG.id}|${toISO(date)}|${Math.floor(min / SLOT) * SLOT}`;
      let h = 2166136261;
      for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
      return ((h >>> 0) % 100) < (TEST.takenPercent ?? BK.takenPercent ?? 30);
    }
    function nearestFree(date, min) {
      const x = dayInfo(date); if (!x) return [];
      const isToday = sameDay(date, today());
      const out = [];
      for (let k = 1; k < 40 && out.length < 3; k++) {
        for (const m of [min - k * SLOT, min + k * SLOT]) {
          if (m >= x.open && m <= x.last && !slotTaken(date, m) && (!isToday || m >= nowMin() + 30) && !out.includes(m)) out.push(m);
        }
      }
      return out.sort((p, q) => p - q).slice(0, 3);
    }
    function chipsFor(step) {
      const d = Flow.data;
      if (step === "date") return dateChips();
      if (step === "time") return timeChips(d.date, d.part, d.staff);
      if (step === "staff") return [fill("{anyStaff}")];
      if (step === "name") return Flow.prev && Flow.prev.name ? [`${T.samePerson} (${Flow.prev.name})`] : [];
      if (step === "contact") return Flow.prevPhone ? [`Same contact (${Flow.prevPhone})`] : d.phone || d.email || Flow.contactWant ? [] : ["Phone", "Email", "Both"];
      if (step === "confirm") return CONFIRM_CHIPS;
      if (step === "editPick") return EDIT_CHIPS;
      const f = FIELDS[step];
      if (f) return f.chips || (f.options || []).map((o) => o.label);
      return [];
    }
    function recommendText(s, date) {
      return date && worksOn(s, date) ? tx("recommend", { ...staffVals(s), weekday: weekdayPlural(date) }) : tx("recommendOther", staffVals(s));
    }

    function askStep(step, o = {}) {
      if (step !== Flow.step) resetFails();          // moved on → the previous input was valid
      Flow.step = step;
      const d = Flow.data, book = Flow.active === "book";
      const short = !!o.prefix || !!o.short || Flow.asked.has(step);    // the long wording is used only the first time
      Flow.asked.add(step);
      const first = d.name ? esc(firstName(d.name)) : "";
      let html, chips = chipsFor(step);
      switch (step) {
        case "name":
          html = short ? tx("askNameShort") : book ? tx("askName") : tx("askNameResched");
          break;
        case "contact":
          html = Flow.contactWant === "both" && d.phone && !d.email ? tx("askOtherEmail")
            : Flow.contactWant === "both" && d.email && !d.phone ? tx("askOtherPhone")
            : Flow.contactWant === "phone" ? tx("askPhoneOnly") : Flow.contactWant === "email" ? tx("askEmailOnly") : Flow.contactWant === "both" ? tx("askBoth")
            : short || !first ? tx("askContactShort") : book ? tx("askContact", { first }) : tx("askContactResched", { first });
          break;
        case "date":
          html = short ? (book ? tx("askDateShort") : tx("askDateReschedShort"))
            : book ? (d.staff && ST ? tx("askDateStaff", { staff: esc(d.staff.name), short: esc(d.staff.short), days: daysText(d.staff) }) : tx("askDate"))
                   : tx("askDateResched");
          break;
        case "staff": {
          const rec = recStaff(d), list = availableStaff(d.date, d.time);
          if (!list.length) { html = tx("noStaff", { date: fmtDate(d.date) }); chips = dateChips(); Flow.step = "date"; break; }
          html = tx("availableOn", { date: fmtDate(d.date) }) + staffCards(list, rec, (s) => s.name);
          if (rec && !list.includes(rec)) {
            const next = nextDateFor(rec, d.date);
            if (next) { html += tx("staffNotIn", { ...staffVals(rec), next: fmtDate(next) }); chips = [...chips, `${fmtShort(next)} with ${rec.short}`]; }
          }
          break;
        }
        case "time": {
          const opt = chosenOption(d);
          html = opt && opt.times ? tx("askTimeOption", { option: esc(opt.label), times: joinAnd(opt.times.map((t) => minToShort(hmToMin(t)))) })
            : d.part ? tx("askTimePart", { part: d.part })
            : d.staff && ST ? tx("askTimeStaff", { short: esc(d.staff.short), range: rangeText(d.staff), dateShort: fmtShort(d.date) })
            : short || !d.date ? tx("askTimeShort", { onDate: d.date ? " on " + fmtDate(d.date) : "" })
            : tx("askTime", { date: fmtDate(d.date), ...hoursTokens(d.date) });
          break;
        }
        case "confirm":
          html = summaryCard(d) + tx("confirmQ");
          break;
        case "count":
          html = tx("askCount", { nouns: nounPlural });
          chips = ["2", "3", "4"];
          break;
        default: {
          const f = FIELDS[step];
          html = fill(short && f.shortPrompt ? f.shortPrompt : f.prompt);
        }
      }
      bot((o.prefix || "") + (o.html || html), chips);
    }
    const continuePrompt = () => askStep(Flow.step, { prefix: tx(Flow.active === "book" ? "continueBooking" : "continueRequest") + " " });

    function summaryCard(d) {
      const row = (k, v) => `<div class="summary-row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`;
      return `<div class="summary"><div class="summary-head">${icon("calendar", 14)} ${esc(fill(T.summaryTitle))}</div>` +
        SUMMARY.map((k) => {
          if (k === "date") return row("Date", fmtDate(d.date));
          if (k === "time") return row("Time", timeLabel(d.time));
          if (k === "staff") return row(ST.label, d.staff ? `${d.staff.name} (${d.staff.specialty})` : T.anyAvailable);
          if (k === "name") return row("Name", d.name);
          if (k === "contact") return (d.phone ? row("Phone", d.phone) : "") + (d.email ? row("Email", d.email) : "");
          return d[k] == null ? "" : row(labelOf(k), fieldValueText(k, d[k]));
        }).join("") + (d.request ? row("Request", `${d.request} (team will confirm)`) : "") + `</div>`;
    }
    function summaryRows(d) {
      return SUMMARY.flatMap((k) => (k === "contact" ? [["Phone", d.phone || ""], ["Email", d.email || ""]] : [k])).map((k) => {
        if (Array.isArray(k)) return k;
        if (k === "date") return ["Date", d.date ? fmtDate(d.date) : ""];
        if (k === "time") return ["Time", d.time != null ? timeLabel(d.time) : ""];
        if (k === "staff") return [ST.label, d.staff ? `${d.staff.name} (${d.staff.specialty})` : ""];
        if (k === "name") return ["Name", d.name || ""];
        return [labelOf(k), fieldValueText(k, d[k])];
      }).concat(d.request ? [["Request", `${d.request} (team will confirm)`]] : []);
    }

    function endFlow() {
      Object.assign(Flow, { active: null, step: null, data: {}, earliest: false, recNoted: false, pending: [], prevPhone: null, asked: new Set(), contactWant: null, onlyContact: null,
        group: [], prev: null, startE: null });
      resetFails();
    }
    const nounPlural = BK.nounPlural || (noun.endsWith("s") ? noun + "es" : noun + "s");
    function startFlow(type, e = {}, o = {}) {
      endFlow();
      Flow.group = []; Flow.prev = null;
      Flow.active = type;
      // Several options in one message (e.g. two properties, two classes) → one booking each
      for (const [id, v] of Object.entries(e.fields || {})) {
        if (Array.isArray(v) && FIELDS[id] && FIELDS[id].multi === "bookings") {
          e.fields[id] = v[0];
          Flow.pending.push(...v.slice(1).map((opt) => ({ who: opt.label, preset: { [id]: opt }, samePerson: true })));
        }
      }
      if (o.multi && type === "book") {
        if (o.multi.count == null) { Flow.startE = e; Flow.startGreeted = !!o.greeted; return askStep("count", { prefix: o.greeted ? tx("helloMidFlow") + " " : "" }); }
        Flow.pending.push(...o.multi.who.map((who) => ({ who, samePerson: BK.multiPerson === false })));
      }
      const multiNote = Flow.pending.length ? tx("multiIntroN", { count: Flow.pending.length + 1, nouns: nounPlural }) : "";
      if (!hasData(e)) return askStep(stepsOf()[0], multiNote ? { prefix: multiNote } : {});
      return advance(applyEntities(e), { intro: true, greeted: !!o.greeted, multiNote });
    }
    function pickAnyStaff(d) {
      const list = availableStaff(d.date, d.time), rec = recStaff(d);
      return rec && list.includes(rec) ? rec : list[0] || null;
    }

    // Stores extracted data. Returns which fields were added, changed, or invalid.
    function applyEntities(e) {
      const d = Flow.data, book = Flow.active === "book", r = { added: [], changed: [], errors: [] };
      const same = (x, y) => (x instanceof Date && y instanceof Date ? x.getTime() === y.getTime() : x === y);
      const set = (k, v) => { if (d[k] == null) r.added.push(k); else if (!same(d[k], v)) r.changed.push(k); d[k] = v; };
      const unset = (k) => { d[k] = null; r.added = r.added.filter((x) => x !== k); r.changed = r.changed.filter((x) => x !== k); };
      const staffStep = BOOK_STEPS.includes("staff");

      // "earliest possible slot" → nearest day, time (and staff member)
      if (e.earliest && !e.date && !e.dateError) {
        const slot = earliestSlot(book && ST && staffStep ? e.staff || d.staff || recStaff(d) : null);
        if (slot) {
          e.date = slot.date;
          if (e.time == null && d.time == null) e.time = slot.time;
          if (book && slot.staff && staffStep && !e.staff && !d.staff) e.staff = slot.staff;
          Flow.earliest = true;
        }
      }
      if (e.name) set("name", e.name);
      if (e.request && book) { if (d.request !== e.request) r.requestNoted = true; d.request = e.request; }
      // Contact details: phone and/or email ("actually use my email instead" drops the phone)
      if (e.contactPref) Flow.onlyContact = e.contactPref;                // "actually use my email instead"
      if (e.phone) set("phone", e.phone);
      if (e.email) set("email", e.email);
      if (Flow.onlyContact === "email" && d.email) { if (d.phone) { d.phone = null; if (!r.added.includes("email")) r.changed.push("contactEmailOnly"); } Flow.onlyContact = null; Flow.contactWant = null; }
      else if (Flow.onlyContact === "phone" && d.phone) { if (d.email) { d.email = null; if (!r.added.includes("phone")) r.changed.push("contactPhoneOnly"); } Flow.onlyContact = null; Flow.contactWant = null; }
      else if (e.contactPref && !(e.contactPref === "email" ? e.email : e.phone)) { Flow.contactWant = e.contactPref; r.ask = "contact"; }
      if (e.emailError && !e.email) r.errors.push({ field: "contact", code: "email" });
      else if (e.phoneError && !e.phone && !e.email) r.errors.push({ field: "contact", code: "phone" });
      if (e.dateError) r.errors.push({ field: "date", code: e.dateError, date: e.dateRaw });
      else if (e.date) set("date", e.date);

      // Custom fields (reason, guests, property, service, class…)
      if (book) {
        for (const [id, v] of Object.entries(e.fields || {})) {
          const f = FIELDS[id];
          if (!f || !BOOK_STEPS.includes(id)) continue;
          if (f.type === "text") {
            if (d[id] == null) set(id, v);
            if (f.recommend && !d.recId) { const sp = specialistFor(analyze(v).scores); if (sp) d.recId = sp.doc.id; }
          } else if (f.type === "number") {
            if (v < (f.min || 1)) r.errors.push({ field: id, code: "tooSmall" });
            else if (f.max && v > f.max) r.errors.push({ field: id, code: "tooBig" });
            else set(id, v);
          } else if (f.type === "choice") {
            let val = v;
            if (Array.isArray(v) && f.multi === "bookings") {             // two properties / classes → a second booking for the rest
              val = v[0];
              v.slice(1).forEach((opt) => { if (!Flow.pending.some((p) => p.preset && p.preset[id] === opt)) Flow.pending.push({ who: opt.label, preset: { [id]: opt }, samePerson: true }); });
            }
            set(id, val);
            const first = Array.isArray(val) ? val[0] : val;
            if (ST && first.staff) {                                     // e.g. a property's listing agent
              const s = STAFF_LIST.find((x) => x.id === first.staff);
              if (s && !staffStep) d.staff = s;
            }
            if (ST && staffStep && !d.recId) { const s = STAFF_LIST.find((x) => (x.treats || []).includes(first.id)); if (s) d.recId = s.id; }
          }
        }
      }
      if (e.part && e.time == null) d.part = e.part;

      // Staff: must work on the chosen date
      if (book && ST) {
        if (staffStep) {
          if (e.staff) {
            if (d.date && !worksOn(e.staff, d.date)) r.errors.push({ field: "staff", code: "unavailable", staff: e.staff });
            else set("staff", e.staff);
          } else if (e.anyStaff && !d.staff) {
            if (d.date) { const pick = pickAnyStaff(d); if (pick) set("staff", pick); } else d.anyStaff = true;
          }
          if (!d.staff && d.anyStaff && d.date) { const pick = pickAnyStaff(d); if (pick) set("staff", pick); }
          if (e.date && d.staff && !worksOn(d.staff, d.date) && !r.errors.some((x) => x.field === "staff")) {
            r.errors.push({ field: "staff", code: "unavailable", staff: d.staff });
            d.staff = null;
          }
        } else if (d.staff && d.date && !worksOn(d.staff, d.date) && (e.date || hasFields(e))) {
          r.errors.push({ field: "date", code: "staffOnly", staff: d.staff, date: d.date });   // e.g. listing agent is off that day
          unset("date");
        }
      }
      // Class/option days (e.g. Yoga runs Mon/Wed/Fri)
      const opt = chosenOption(d);
      if (book && opt && opt.days && d.date && !opt.days.includes(d.date.getDay())) {
        r.errors.push({ field: "date", code: "optionDay", opt, date: d.date });
        unset("date");
      }

      // Time: day hours, staff hours, option times, and not in the past
      const timeCheck = (min) => {
        if (opt && opt.times && !opt.times.map(hmToMin).includes(min)) return "optionTime";
        return timeIssue(min, d.date, ST ? d.staff : null) || (d.date && slotTaken(d.date, min) ? "taken" : null);   // already booked → nearest free slots
      };
      if (e.timeError) r.errors.push({ field: "time", code: e.timeError });
      else if (e.time != null) {
        const issue = timeCheck(e.time);
        if (issue) r.errors.push({ field: "time", code: issue, min: e.time, opt });
        else { set("time", e.time); d.part = null; }
      } else if ((e.date || e.staff || e.anyStaff || hasFields(e)) && d.time != null) {
        const issue = timeCheck(d.time);                       // a new date/staff/option can make the earlier time invalid
        if (issue) { r.errors.push({ field: "time", code: issue === "staffHours" ? "staffClash" : issue, min: d.time, opt }); d.time = null; }
      }
      return r;
    }

    function errorText(err) {
      const d = Flow.data;
      if (err.field === "staff") {
        const s = err.staff, next = nextDateFor(s, d.date);
        err.chips = next ? [`${fmtShort(next)} with ${s.short}`] : [];
        return tx("staffUnavailable", { ...staffVals(s), staff: `<b>${esc(s.name)}</b>`, weekday: weekdayPlural(d.date), next: next ? relDate(next) : "—", date: fmtDate(d.date) }) +
          staffCards(availableStaff(d.date, null), null, (x) => x.name);
      }
      if (err.code === "staffOnly") {
        const s = err.staff, next = nextDateFor(s, err.date);
        err.chips = next ? [fmtShort(next)] : [];
        return tx("staffUnavailableOnly", { ...staffVals(s), staff: `<b>${esc(s.name)}</b>`, weekday: weekdayPlural(err.date), next: next ? relDate(next) : "—" });
      }
      if (err.code === "optionDay") {
        const o = err.opt;
        let next = null;
        for (let i = 0, x = today(); i < 21; i++, x = addDays(x, 1)) if (o.days.includes(x.getDay()) && !dateIssue(x)) { next = x; break; }
        err.chips = next ? [fmtShort(next)] : [];
        return tx("optionDay", { option: esc(o.label), days: joinAnd(o.days.map((i) => DAY_SHORT[i])), next: next ? relDate(next) : "—" });
      }
      if (err.code === "optionTime") {
        const o = err.opt;
        err.chips = o.times.map((t) => minToLabel(hmToMin(t)));
        return tx("optionTime", { option: esc(o.label), times: joinAnd(o.times.map((t) => minToShort(hmToMin(t)))) });
      }
      if (err.code === "taken") {
        const free = nearestFree(d.date, err.min);
        err.chips = free.map(minToLabel);
        return tx("slotTaken", { time: minToLabel(err.min), options: joinAnd(free.map((m) => `<b>${minToLabel(m)}</b>`)) || "later in the week" });
      }
      if (err.code === "staffHours" || err.code === "staffClash") {
        const s = d.staff;
        return tx(err.code === "staffHours" ? "timeStaff" : "staffTimeClash", { staff: s.name, range: rangeText(s),
          weekday: d.date ? weekdayPlural(d.date) : "that day", date: d.date ? fmtDate(d.date) : "that day", time: minToLabel(err.min) });
      }
      if (FIELDS[err.field]) {
        const f = FIELDS[err.field];
        return fill(err.code === "tooBig" ? f.tooBig || f.invalid : f.invalid);
      }
      if (err.field === "contact") return tx(err.code === "email" ? "emailInvalid" : "contactInvalid");
      const texts = {
        date: { impossible: "dateImpossible", past: "datePast", closed: "dateClosed", far: "dateFar", todayLate: "dateTodayLate", unclear: "dateUnclear" },
        time: { range: "timeRange", late: "timeLate", past: "timePast", unclear: "timeUnclear" }
      };
      const key = (texts[err.field] || {})[err.code] || "rephrase";
      return tx(key, { weekday: err.date ? weekdayPlural(err.date) : "that day", ...hoursTokens(err.field === "time" ? d.date : null) });
    }
    const whenText = (d, part) => (sameDay(d, today()) ? `today${part ? " " + (part === "evening" ? "evening" : part) : ""}` : sameDay(d, addDays(today(), 1)) ? `tomorrow${part ? " " + part : ""} (${fmtShort(d)})` : `${fmtShort(d)}${part ? " " + part : ""}`);
    function contactAck(added) {
      const p = added.includes("phone"), m = added.includes("email"), d = Flow.data;
      if (!p && !m) return "";
      return tx(d.phone && d.email ? "ackBoth" : p ? "ackPhone" : "ackEmail") + " ";
    }
    function ackText(added, intro, greeted) {
      const d = Flow.data, bits = [];
      const withStaff = d.staff && added.includes("staff") ? ` with <b>${esc(d.staff.name)}</b>` : "";
      let lead = "";
      if (Flow.earliest && added.includes("date")) {
        lead = tx("earliest", { date: relDate(d.date), at: d.time != null ? ` at <b>${timeLabel(d.time)}</b>` : "",
          with: d.staff ? ` with <b>${esc(d.staff.name)}</b> (${esc(d.staff.specialty)})` : "" });
        Flow.earliest = false;
      } else if (added.includes("date")) {
        const when = `<b>${whenText(d.date, added.includes("time") ? null : d.part)}</b>` + (added.includes("time") ? ` at <b>${timeLabel(d.time)}</b>` : "") + withStaff;
        lead = tx(intro && Flow.active === "book" ? "bookFor" : "notedWhen", { when });
      } else if (added.includes("time")) bits.push(`<b>${timeLabel(d.time)}</b>` + withStaff);
      else if (added.includes("staff")) bits.push(`<b>${esc(d.staff.name)}</b> (${esc(d.staff.specialty)})`);
      for (const id of Object.keys(FIELDS)) {
        if (!added.includes(id)) continue;
        const f = FIELDS[id];
        if (f.ackAlone === false && !(bits.length || lead)) continue;
        let v = fieldValueText(id, d[id]);
        if (f.ackLower) v = v.toLowerCase();
        bits.push(fill(f.ack || "{value}", { value: esc(v) }));
      }
      const first = d.name ? esc(firstName(d.name)) : "";
      const hi = added.includes("name") ? (greeted ? tx("hiName", { first }) : tx("thanksName", { first }))
        : intro && !(lead && Flow.active === "book") ? tx(Flow.active === "book" ? "introBook" : "introResched") : lead || bits.length ? "" : tx("great");
      return hi + lead + (bits.length ? tx(lead ? "alsoNoted" : "noted", { items: joinAnd(bits) }) : "") + contactAck(added);
    }
    function changedText(changed) {
      const d = Flow.data;
      const label = (k) => {
        if (k === "name") return `your name to <b>${esc(d.name || "")}</b>`;
        if (k === "phone") return `your phone number to <b>${esc(d.phone || "")}</b>`;
        if (k === "email") return `your email to <b>${esc(d.email || "")}</b>`;
        if (k === "contactEmailOnly") return "your contact to <b>email only</b>";
        if (k === "contactPhoneOnly") return "your contact to <b>phone only</b>";
        if (k === "date") return d.date ? `the date to <b>${fmtDate(d.date)}</b>` : "the date";
        if (k === "time") return d.time != null ? `the time to <b>${timeLabel(d.time)}</b>` : "the time";
        if (k === "staff") return d.staff ? `the ${ST.singular} to <b>${esc(d.staff.name)}</b>` : `the ${ST.singular}`;
        const f = FIELDS[k];
        return `${f.changeLabel || "the " + f.label.toLowerCase()} to <b>${esc(fieldValueText(k, d[k]))}</b>`;
      };
      return tx("updated", { changes: joinAnd(changed.map(label)) });
    }

    // After new data: report errors, acknowledge what was captured, then ask for what's still missing.
    function advance(r, o = {}) {
      const d = Flow.data;
      if (r.errors.length) {
        const [err, extra] = r.errors;
        const lead = r.changed.length ? changedText(r.changed) + " " : r.added.length ? ackText(r.added, o.intro) : "";
        let html = lead + errorText(err);
        if (extra && extra.field === "time" && (extra.code === "range" || extra.code === "late"))
          html += " " + tx("timeAlso", { time: minToLabel(extra.min) });
        Flow.step = err.field;
        return invalid(err.field, html, err.chips || chipsFor(err.field), err.code === "email" ? "email" : null);
      }
      const next = nextStep();
      let prefix = "";
      const onlyContact = r.added.length && r.added.every((k) => k === "phone" || k === "email");
      if (r.changed.length) prefix = changedText(r.changed) + " " + contactAck(r.added);
      else if (onlyContact) prefix = contactAck(r.added);
      else if (r.added.length && !(r.added.length === 1 && r.added[0] === o.step)) prefix = ackText(r.added, o.intro, o.greeted);
      if (r.requestNoted) prefix += tx("requestNoted", { request: esc(d.request) }) + " ";   // "with Dr. Patel" → noted, team confirms
      // Automatic notes for a chosen option (e.g. fasting instructions for a blood test)
      (r.added || []).concat(r.changed || []).forEach((id) => {
        const v = d[id];
        if (FIELDS[id] && FIELDS[id].type === "choice" && v) [].concat(v).forEach((o) => { if (o && o.note) prefix += fill(o.note) + " "; });
      });
      if (o.multiNote) prefix += o.multiNote;                     // "I'll happily book 2 appointments — let's start with the first one."
      if (r.ask && next !== "submit") return askStep(r.ask, { prefix });
      // Recommend the right specialist as soon as we know the reason (and the date)
      const rec = recStaff(d);
      if (Flow.active === "book" && rec && !d.staff && d.date && !Flow.recNoted && next !== "staff") {
        prefix += recommendText(rec, d.date) + " ";
        Flow.recNoted = true;
      }
      if (next === "submit") return submitRequest();
      askStep(next, { prefix });
    }

    function fieldFromText(n) {
      if (ST && new RegExp(`\\b(${[ST.singular, ...(ST.words || []), ...(ST.titles || [])].join("|")})\\b`).test(n)) return BOOK_STEPS.includes("staff") && Flow.active === "book" ? "staff" : null;
      if (/\bname\b/.test(n)) return "name";
      if (/\b(phone|number|mobile|email|e mail|contact)\b/.test(n)) return "contact";
      if (/\b(date|day)\b/.test(n)) return "date";
      if (/\b(time|hour)\b/.test(n)) return "time";
      if (Flow.active === "book") for (const [id, f] of Object.entries(FIELDS)) if (BOOK_STEPS.includes(id) && new RegExp(`\\b(${f.words || f.label.toLowerCase()})\\b`).test(n)) return id;
      return null;
    }

    /* ---------- Wrong-input handling ----------
       1st wrong attempt  → the friendly, detailed message (with an example)
       2nd+ wrong attempt → a short message, rotated so it never repeats twice in a row
       3rd+ wrong attempt → also offer the phone number
       The counter resets as soon as the customer enters something valid. */
    function resetFails() { Flow.failField = null; Flow.failCount = 0; }
    function invalid(field, detailedHtml, chips, shortKey) {
      Flow.failCount = Flow.failField === field ? Flow.failCount + 1 : 1;
      Flow.failField = field;
      let html = detailedHtml;
      if (Flow.failCount >= 2) {
        const options = (FIELDS[field] && FIELDS[field].shortErrors) || SHORT_ERRORS[shortKey || field] || SHORT_ERRORS.field;
        html = fill(options[(Flow.failCount - 2) % options.length], hoursTokens(null));   // rotates → never the same line twice in a row
      }
      if (Flow.failCount >= 3) html += "<br>" + tx("havingTrouble");
      return bot(html, chips);
    }
    const stepInvalidText = (step) => {
      if (FIELDS[step]) return fill(FIELDS[step].invalid);
      return tx({ name: "nameInvalid", contact: "contactInvalid", date: "dateUnclear", time: "timeUnclear", staff: "staffInvalid", confirm: "confirmInvalid", editPick: "confirmInvalid" }[step]);
    };

    /* =====================================================================
       ROUTER (booking in progress) — priority: exit → emergency/questions →
       booking data → step input. The pending step is never lost.
       ===================================================================== */
    function handleFlow(text) {
      const a = analyze(text), n = a.n, step = Flow.step, book = Flow.active === "book", s = a.scores;
      if (a.crisis) return bot(tx("crisis"));                                    // self-harm → 988 first; never continue booking in this reply
      if (!n) return bot(tx("rephrase"), chipsFor(step));
      if (a.injection) return outOfScope();

      // Exit words
      if (!book && step === "date" && /^(just )?cancel( it| my appointment| the appointment| appointment| my reservation| the reservation| reservation)?$/.test(n)) {
        Flow.data.cancelOnly = true;
        return submitRequest();
      }
      if (ABORT_RE.test(n) || (step !== "confirm" && step !== "editPick" && !(FIELDS[step] && FIELDS[step].optional) && /^(no|nope|nah)$/.test(n))) {
        endFlow();
        return bot(tx("stopped", { what: book ? "booking" : "request" }), BOT.quickReplies);
      }
      if (MY_BOOKING_RE.test(n)) { showMyBookings(); return continuePrompt(); }

      // "How many bookings?" → set up one booking per person
      if (step === "count") {
        const m = n.match(new RegExp(`\\b${NUM}\\b`));
        const c = m ? Math.min(toNum(m[1]) || 0, 6) : 0;
        if (c >= 1) {
          Flow.pending = ORDINAL_WHO.slice(0, Math.max(c - 1, 0)).map((who) => ({ who, samePerson: BK.multiPerson === false }));
          const se = Flow.startE || { fields: {} }, greeted = Flow.startGreeted;
          Flow.startE = null; Flow.step = null;
          const multiNote = Flow.pending.length ? tx("multiIntroN", { count: c, nouns: nounPlural }) : "";
          return hasData(se) ? advance(applyEntities(se), { intro: true, greeted, multiNote }) : askStep(stepsOf()[0], multiNote ? { prefix: multiNote } : {});
        }
        if (!a.question) return invalid("count", tx("askCount", { nouns: nounPlural }), ["2", "3", "4"]);
      }
      // Next person in a group booking: "same person" / "same" reuses the previous details
      if (Flow.prev && /\bsame\b/.test(n) && (step === "name" || step === "contact")) {
        const p = Flow.prev, e0 = { fields: {} };
        if (step === "name" || /\bperson\b/.test(n)) { e0.name = p.name; }
        if (p.phone) e0.phone = p.phone;
        if (p.email) e0.email = p.email;
        return advance(applyEntities(e0), { step });
      }

      const confirming = step === "confirm" || step === "editPick";
      const e = extractEntities(text, confirming ? null : step);
      // A question or worry about another service ("is root canal painful?") doesn't replace the one already chosen
      if ((a.question || a.fear) && !/\b(instead|actually|change|switch|rather|make it|swap)\b/.test(n))
        Object.keys(e.fields).forEach((id) => { if (FIELDS[id] && FIELDS[id].type === "choice" && Flow.data[id] != null) delete e.fields[id]; });
      // Service words mid-booking ("cleaning", "and surgery") are the reason for the visit, not a name
      if (book && ((s.book || 0) >= 3 || hasCore(e) || a.tokens.length <= 4) && !a.question) {
        Object.entries(textFieldFrom(a)).forEach(([id, v]) => { if (e.fields[id] == null && Flow.data[id] == null) e.fields[id] = v; });
      }
      const textAdded = Object.keys(e.fields).some((id) => FIELDS[id] && FIELDS[id].type === "text" && Flow.data[id] == null);
      const dataCore = !!(e.name || e.phone || e.email || e.emailError || e.phoneError || e.contactPref || e.date || e.dateError || e.time != null || e.timeError || e.staff || e.anyStaff || e.earliest ||
        Object.keys(e.fields).some((id) => FIELDS[id] && FIELDS[id].type !== "text"));
      const data = dataCore || !!e.part || textAdded;
      let ans = buildAnswer(a, e, true);
      // "What does it cost?" / "how long is it?" mid-booking → details of the chosen property, class or service
      const picked = Object.keys(FIELDS).map((id) => Flow.data[id]).find((v) => v && typeof v === "object" && v.info);
      if (a.question && picked && !a.urgent && /\b(cost|costs|price|how much|how long|details|info)\b/.test(n) &&
          (!ans || /\b(it|this|that)\b/.test(n))) ans = { html: fill(picked.info), chips: null };

      if (step === "contact" && !data && !a.question && a.tokens.length <= 4) {
        const want = /\bboth\b/.test(n) ? "both" : /\b(e ?mail|mail)\b/.test(n) ? "email" : /\b(phone|number|call|text|mobile|cell|whatsapp)\b/.test(n) ? "phone" : null;
        if (want) { Flow.contactWant = want; return askStep("contact"); }
      }

      // Free-text fields (e.g. reason for visit) — unless it's clearly a question, new data or an emergency
      const f = FIELDS[step];
      if (f && f.type === "text" && !dataCore && !e.part && !a.question && !(a.urgent && a.tokens.length > 4)) {
        // Optional questions (e.g. insurance) can be skipped
        if (f.optional && /^(skip|no|none|nope|nah|na|n a|not now|no insurance|self pay|selfpay|uninsured|prefer not|no thanks|none thanks|i dont have|dont have)/.test(n))
          return advance(applyEntities({ fields: { [step]: /self ?pay|uninsured|no insurance|dont have|i dont/.test(n) ? "Self-pay" : (f.skipValue || T.skipLabel) } }), { step });
        // Name-type fields (e.g. the child's name) are validated like names
        if (f.validate === "name") {
          const c = stripIntro(text.replace(/^(his|her|their|my (son|daughter|child|kid)'?s?) name is\s+/i, ""));
          if (!nameValid(c)) return invalid(step, fill(f.invalid), chipsFor(step));
          return advance(applyEntities({ fields: { [step]: titleCase(c) } }), { step });
        }
        if (a.gibberish || text.trim().length < 2) return invalid(step, fill(f.invalid), chipsFor(step));
        const mapped = textFieldFrom(a)[step];                         // "cleaning" → "Teeth cleaning"
        return advance(applyEntities({ fields: { [step]: mapped || cap(text.trim().replace(/\s+/g, " ").slice(0, 120)) } }), { step });
      }

      // A plain name at the name step is the answer (even if it matches a staff surname, e.g. "Omar Khan").
      // A full name typed at another step while we still need it counts too (e.g. "Leo Park" after a date error).
      if (!a.question && !a.urgent && !dataCore && Flow.data.name == null && step !== "name" && stepsOf().includes("name") &&
          stripIntro(text).split(/\s+/).length >= 2 && nameValid(stripIntro(text))) {
        return advance(applyEntities({ name: titleCase(stripIntro(text)), fields: {} }), { step });
      }
      if (step === "name" && !a.question && !a.urgent && !dataCore) {
        const candidate = stripIntro(text);
        if (nameValid(candidate)) return advance(applyEntities({ name: titleCase(candidate), fields: {} }), { step });
      }

      // 1) Emergencies & questions are always answered first
      if (ans && (a.question || a.urgent || !data || ans.info)) {
        bot(ans.html.replace(/\s*Would you like (me )?to book (one|an appointment|a table|a viewing)( for you)?\?/g, ""), ans.info ? ans.chips : null);   // already booking
        if (!data || ans.info) return continuePrompt();
      }

      // 2) Booking data anywhere in the message (also handles "actually make it Thursday")
      if (data) {
        if (step === "name" && !e.name) {
          const candidate = stripIntro(e.rest || "");
          if (candidate && nameValid(candidate)) e.name = titleCase(candidate);
        }
        return advance(applyEntities(e), { step });
      }

      // "Phone", "Email" or "Both" as an answer to the contact question
      if (step === "contact" && !data) {
        const want = /\bboth\b/.test(n) ? "both" : /\b(e ?mail|mail)\b/.test(n) ? "email" : /\b(phone|number|call|text|mobile|cell|whatsapp)\b/.test(n) ? "phone" : null;
        if (want && !a.question) { Flow.contactWant = want; return askStep("contact"); }
      }

      // 3) Confirmation step
      if (confirming) {
        const field = fieldFromText(n);
        if (step === "editPick" && field) return askStep(field, { prefix: tx("sure") });
        if (EDIT_RE.test(n)) {
          if (field) return askStep(field, { prefix: tx("sure") });
          Flow.step = "editPick";
          return bot(tx("editWhich"), EDIT_CHIPS);
        }
        if (YES_RE.test(n) && !NO_RE.test(n)) return submitRequest();
        if (NO_RE.test(n)) { endFlow(); return bot(tx("notBooked"), BOT.quickReplies); }
      }

      // 4) Plain answer to the pending step
      if (step === "name") {
        const candidate = stripIntro(text);
        if (nameValid(candidate)) return advance(applyEntities({ name: titleCase(candidate), fields: {} }), { step });
      }
      if ((s.bye || 0) >= 3) return bot(answerHtml("bye"));
      if ((s.thanks || 0) >= 3 || (s.greeting || 0) >= 3) {
        bot((s.thanks || 0) >= 3 ? tx("thanksMidFlow") : tx("helloMidFlow"));
        return continuePrompt();
      }
      if (/^(yes|yeah|yep|yup|sure|ok|okay|yes please|continue|go on|lets continue)$/.test(n)) return askStep(step, { short: true });
      if (a.offTopic && !a.onTopic) return outOfScope();
      // A reason in their own words when it isn't on the list (e.g. "sore throat for 3 days")
      if (FIELDS[step] && FIELDS[step].type === "choice" && FIELDS[step].allowOther && !a.question && !a.gibberish && text.trim().length >= 3)
        return advance(applyEntities({ fields: { [step]: cap(text.trim().replace(/\s+/g, " ").slice(0, 80)) } }), { step });

      // 5) Nothing usable → wrong-input message for this step
      return invalid(confirming ? "confirm" : step, stepInvalidText(step), chipsFor(step));
    }

    function submitRequest() {
      const d = Flow.data, book = Flow.active === "book", pending = Flow.pending || [];
      const rec = {
        id: Date.now(), business: B.name,
        type: book ? "new" : d.cancelOnly ? "cancel" : "reschedule",
        rows: book ? summaryRows(d) : [["Name", d.name], ["Phone", d.phone || ""], ["Email", d.email || ""], ["Date", d.date && !d.cancelOnly ? fmtDate(d.date) : ""], ["Time", d.time != null && !d.cancelOnly ? timeLabel(d.time) : ""], ["Request", d.cancelOnly ? "Cancel" : "Reschedule"]],
        createdAt: new Date().toISOString()
      };
      if (book && d.date && d.time != null) {
        rec.ics = { date: toISO(d.date), time: d.time, duration: BK.duration || 60, location: `${B.name}, ${B.address}, ${B.city}`,
          title: `${cap(noun)} at ${B.name}`, description: rec.rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n") };
      }
      const group = [...(Flow.group || []), rec];
      const firstBooking = (Flow.group || [])[0];
      endFlow();
      saveRequest(rec);   // In production: POST this to your backend → email / WhatsApp / Google Sheets / CRM
      if (rec.type === "new") SESSION.bookings.push(rec);
      rec.person = { name: d.name, phone: d.phone || null, email: d.email || null };

      // More bookings to make (2 appointments, me and my wife, a second property…) → next one, no closing yet
      if (book && pending.length) {
        const next = pending[0];
        const item = typeof next === "string" ? { who: next } : next;
        Flow.active = "book"; Flow.pending = pending.slice(1); Flow.group = group;
        Flow.prev = rec.person; Flow.prevPhone = d.phone || d.email;
        const saved = tx("groupSaved", { i: group.length, n: group.length + pending.length }) + " ";
        if (item.samePerson || item.preset) {                    // same customer, e.g. a second property viewing
          const e2 = { fields: { ...(item.preset || {}) } };
          if (item.samePerson) { e2.name = d.name; if (d.phone) e2.phone = d.phone; if (d.email) e2.email = d.email; }
          const r2 = applyEntities(e2);
          return advance({ ...r2, added: [], changed: [] }, { multiNote: saved + tx(item.preset ? "multiNextItem" : "multiNextSame", { item: esc(item.who) }) + " " });
        }
        if (BK.groupShare) {                                     // e.g. a friend joining the same trial class, day and time
          const e2 = { fields: {} };
          BK.groupShare.forEach((k) => { if (k === "date") e2.date = d.date; else if (k === "time") e2.time = d.time; else if (d[k] != null) e2.fields[k] = d[k]; });
          applyEntities(e2);
        }
        return askStep(BOOK_STEPS[0], { prefix: saved + tx("multiNext", { who: esc(item.who) }) + " ", html: tx("multiAskName", { who: esc(item.who) }) });
      }

      const lead = firstBooking ? firstBooking.person : rec.person;
      SESSION.lastName = lead.name ? firstName(lead.name) : SESSION.lastName;
      const how = lead.phone && lead.email ? "Both" : lead.email ? "Email" : "Phone";
      const contactLine = tx("contactLine" + how, { team: T.team });
      const calBtn = (r, label) => (r.ics ? `<button type="button" class="cal-btn" data-ics="${r.id}">${label}</button>` : "");
      if (rec.type === "new" && group.length > 1) {
        // ONE combined summary of every booking, then ONE closing message
        const extra = T.closingExtra ? " " + T.closingExtra : "";
        bot(tx("groupSummary", { all: group.length === 2 ? "both" : "all " + group.length, nouns: nounPlural }) + group.map(recordCard).join(""));
        bot(tx("closingGroup", { first: esc(firstName(lead.name || "")), All: group.length === 2 ? "Both" : "All " + group.length, nouns: nounPlural, contactLine, extra, signoff: T["signoff" + how] }) +
          "<br>" + group.map((r, i) => calBtn(r, `${T.calendarButton} (${i + 1})`)).join(" "));
      } else if (rec.type === "new") {
        const vals = { noun, date: fmtShort(d.date), time: timeLabel(d.time), staffWith: d.staff ? ` with ${d.staff.name}` : "" };
        Object.keys(FIELDS).forEach((id) => { let v = fieldValueText(id, d[id]); if (FIELDS[id].closingLower) v = v.toLowerCase(); vals[id] = v; });
        const summary = fill(BK.closingLine || T.closingLine, vals);
        const extra = T.closingExtra ? " " + T.closingExtra : "";
        bot(tx("closing", { first: esc(firstName(d.name)), summary, contactLine, extra, signoff: T["signoff" + how] }) + (rec.ics ? "<br>" + calBtn(rec, T.calendarButton) : ""));
      }
      else if (rec.type === "cancel") bot(tx("sentCancel") + " " + contactLine);
      else bot(tx("sentResched", { date: fmtDate(d.date), time: timeLabel(d.time) }));

      SESSION.phase = "askedElse";                            // ask "anything else?" only once
      bot(tx("anythingElseOnce"), BOT.quickReplies);
    }

    /* ---------- Requests: stored locally + announced to the host page ---------- */
    const STORE_KEY = "clinicbot_bookings_" + (CONFIG.id || "default");
    const SESSION = { bookings: [], phase: null, lastName: null };
    function saveRequest(rec) {
      try {
        const all = JSON.parse(localStorage.getItem(STORE_KEY)) || [];
        localStorage.setItem(STORE_KEY, JSON.stringify([rec, ...all]));
      } catch (err) { /* storage unavailable — ignore */ }
      // Any page can listen: window.addEventListener("demochatbot:request", e => console.log(e.detail))
      window.dispatchEvent(new CustomEvent("demochatbot:request", { detail: rec }));
    }

    /* =====================================================================
       OPEN / CLOSE / WIRING
       ===================================================================== */
    let prevBodyOverflow = "", tooltipTimer;
    function setUnread(k) { unread = k; unreadEl.textContent = k; unreadEl.classList.toggle("show", k > 0); }
    function showTooltip(autoHideMs) {
      if (isOpen()) return;
      tooltip.classList.add("show");
      clearTimeout(tooltipTimer);
      if (autoHideMs) tooltipTimer = later(hideTooltip, autoHideMs);
    }
    function hideTooltip() { clearTimeout(tooltipTimer); tooltip.classList.remove("show"); }
    function openChat() {
      root.classList.add("open");
      launcher.setAttribute("aria-expanded", "true");
      launcher.setAttribute("aria-label", "Close chat");
      hideTooltip(); setUnread(0);
      if (isMobile()) { prevBodyOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
      if (!started) { started = true; welcome(); }
      fitToViewport();
      later(() => { if (!isMobile()) input.focus(); }, 320);
    }
    function closeChat() {
      root.classList.remove("open");
      launcher.setAttribute("aria-expanded", "false");
      launcher.setAttribute("aria-label", "Open chat");
      document.body.style.overflow = prevBodyOverflow;
      fitToViewport();
    }
    // Phones: size the chat to the *visible* area, so the input box stays above the on-screen keyboard
    const vv = window.visualViewport;
    function fitToViewport() {
      if (!vv || !isOpen() || !isMobile()) { root.style.removeProperty("--bs-vh"); root.style.removeProperty("--bs-top"); return; }
      root.style.setProperty("--bs-vh", vv.height + "px");
      root.style.setProperty("--bs-top", vv.offsetTop + "px");
      scrollDown();
    }
    const onKey = (ev) => { if (ev.key === "Escape" && isOpen()) closeChat(); };
    if (vv) { vv.addEventListener("resize", fitToViewport); vv.addEventListener("scroll", fitToViewport); }
    window.addEventListener("resize", fitToViewport);
    document.addEventListener("keydown", onKey);
    input.addEventListener("focus", () => later(fitToViewport, 300));

    function welcome() {
      const sep = document.createElement("div");
      sep.className = "day-sep"; sep.textContent = T.todayLabel;
      chatBody.appendChild(sep);
      bot(esc(BOT.welcome.replace("{business}", B.name)), BOT.quickReplies);
    }
    function restart() {                                     // "Start new chat"
      session++; queue = Promise.resolve(); endFlow();
      clearTimeout(batchTimer); pending = []; pendingRows.length = 0;
      SESSION.phase = null;
      chatBody.innerHTML = ""; setChips([]);
      clearState();
      welcome();
    }

    launcher.onclick = () => (isOpen() ? closeChat() : openChat());
    launcher.addEventListener("mouseenter", () => showTooltip());
    launcher.addEventListener("mouseleave", () => hideTooltip());
    tooltip.onclick = openChat;
    $(".head-btn.close").onclick = closeChat;
    $(".head-btn.restart").onclick = restart;
    if (opts.onSwitch) $(".head-btn.switch").onclick = () => { closeChat(); opts.onSwitch(); };
    $(".chat-input").onsubmit = (ev) => {
      ev.preventDefault();
      if (input.value.trim()) { const sb = $(".send-btn"); if (sb) { sb.classList.remove("fly"); void sb.offsetWidth; sb.classList.add("fly"); setTimeout(() => sb.classList.remove("fly"), 650); } }
      sendUser(input.value);
    };

    // Show the tooltip + unread badge a few seconds after page load
    if (BOT.showTooltipAfterMs > 0 && !opts.open) later(() => { if (!started) { showTooltip(8000); setUnread(1); } }, BOT.showTooltipAfterMs);

    function destroy() {
      destroyed = true; session++;
      timers.forEach(clearTimeout);
      if (vv) { vv.removeEventListener("resize", fitToViewport); vv.removeEventListener("scroll", fitToViewport); }
      window.removeEventListener("resize", fitToViewport);
      document.removeEventListener("keydown", onKey);
      if (isOpen()) document.body.style.overflow = prevBodyOverflow;
      host.remove();
    }

    const api = {
      open: openChat,
      close: closeChat,
      restart,
      _test: (o) => Object.assign(TEST, o),                // tests only: speed up typing delays / batching
      book: () => { openChat(); if (!Flow.active) queue.then(() => sendUser(BOT.quickReplies[0])); },
      config: CONFIG,
      business: B,
      storeKey: STORE_KEY
    };
    const restored = restoreState();                        // same visit → continue the saved chat
    const mountNow = () => { document.body.appendChild(host); if (opts.open || restored === "open") later(openChat, opts.openDelay || 300); };
    if (document.body) mountNow(); else document.addEventListener("DOMContentLoaded", mountNow);
    return { api, destroy };
  }

  /* =====================================================================
     PUBLIC API + AUTO-MOUNT
     ===================================================================== */
  let current = null;
  function mount(type, o = {}) {
    const cfg = REGISTRY[type];
    if (!cfg) { console.warn(`[DemoChatbot] No config registered for "${type}".`); return null; }
    if (current) current.destroy();
    current = createBot(cfg, o);
    window.dispatchEvent(new CustomEvent("demochatbot:mounted", { detail: { type, config: cfg, business: current.api.business } }));
    return current.api;
  }
  window.DemoChatbot = window.ClinicChatbot = { mount, icon, configs: REGISTRY, get current() { return current && current.api; } };

  // One-line embed: <script src="chatbot.js" data-niche="dental" data-name="Business Name" data-city="…" data-phone="…">
  if (SCRIPT && !SCRIPT.hasAttribute("data-manual")) {
    const niche = (SCRIPT.getAttribute("data-niche") || SCRIPT.getAttribute("data-type") || "dental").replace(/[^a-z0-9-]/gi, "").toLowerCase();
    const overrides = { name: SCRIPT.getAttribute("data-name"), city: SCRIPT.getAttribute("data-city"), phone: SCRIPT.getAttribute("data-phone") };
    const go = () => mount(REGISTRY[niche] ? niche : Object.keys(REGISTRY)[0], { overrides });
    if (REGISTRY[niche]) go();
    else {
      const s = document.createElement("script");                       // load niches.js from next to chatbot.js
      s.src = new URL("niches.js", SCRIPT.src).href;
      s.onload = go;
      document.head.appendChild(s);
    }
  }
})();
