# Clinic AI Chatbot

A friendly 24/7 AI assistant for clinics and medical businesses. It answers patient questions, shares prices and insurance details, and books appointments — with **safety-first** replies. It's one engine with 15 niche configs, runs entirely in the browser and needs no API key.

**Live demo:** https://skylinewebco.github.io/clinic-chatbot/

## Niches and direct links

| Niche | Business (fictional) | Direct link |
|---|---|---|
| Dental | Bright Smile Dental | `?niche=dental` |
| Dermatology | ClearSkin Dermatology | `?niche=dermatology` |
| Plastic surgery | Elite Aesthetic Surgery | `?niche=plasticsurgery` |
| Hair transplant | RootRestore Hair Clinic | `?niche=hairtransplant` |
| Medical spa | Glow MedSpa | `?niche=medspa` |
| Eye care | VisionPlus Eye Care | `?niche=eye` |
| Physiotherapy | MoveWell Physiotherapy | `?niche=physio` |
| Chiropractic | AlignRight Chiropractic | `?niche=chiro` |
| Pediatrics | Little Stars Pediatrics | `?niche=pediatrics` |
| Family medicine | CityCare Family Medicine | `?niche=familydoctor` |
| ENT | ClearSound ENT Clinic | `?niche=ent` |
| Orthopedics | Stride Orthopedics | `?niche=ortho` |
| Women's health | Bloom Women's Health | `?niche=womenshealth` |
| Diagnostic lab | QuickTest Diagnostic Lab | `?niche=lab` |
| Counseling | Calm Mind Counseling | `?niche=counseling` |

**Personalise any link for a prospect:** `?niche=dental&name=Smith Family Dental&city=Boston, MA&phone=+1 617 555 0100`. The name, city and phone replace the defaults everywhere, and the tab title becomes "Smith Family Dental – AI Assistant".

- With no parameters, the page shows the landing page with all 15 niches.
- With `?niche=…`, it shows a clean page for that single business and opens the chat automatically.
- The **Owner view** button (bottom left) shows the bookings the chatbot has received, live.

## Safety rules (built in)

- It never diagnoses, never recommends or doses medicine, and never interprets symptoms or results.
- **Emergency signs** (severe bleeding, chest pain, trouble breathing, heavy swelling with fever, head injury…) get: "Please call 911 or go to the nearest emergency room right away." Then the clinic's emergency number, then an offer of the earliest appointment.
- **Self-harm or suicide** mentions get a caring reply with the **988 Suicide & Crisis Lifeline** (call or text 988) before anything else, and never continue a booking in that message.
- **Pregnancy, allergy or medication** questions get: "Your doctor will guide you on that during your visit" plus the clinic phone.
- **Cosmetic niches** (plastic surgery, medspa, hair transplant) always lead with a consultation: prices are "from" prices, the final price is confirmed at the consultation, and results are never guaranteed.

## What it does

- **60+ Q&As per niche:** services and prices, insurance, payment, HSA/FSA, financing, hours, parking, new patients, what to bring, cancellation policy, telehealth, accessibility and more. It handles typos, slang and several questions in one message.
- **Booking:** full name → new or returning → service or reason → date → time → phone/email/both → insurance (optional).
  - Pediatrics asks for the parent's name, the child's name and the child's age.
  - The lab asks which test (with fasting instructions shown automatically) and offers home sample collection.
- **Waits for you to finish typing:** a 4-second timer resets on every message and keystroke, then one reply covers everything.
- **Understands a whole message:** "I'm John Smith, returning patient, cleaning next Tuesday at 11am, 555-123-4567, insurance Aetna" fills everything at once and never asks twice.
- **Multiple bookings:** "me and my wife" or "2 appointments", with one combined summary. Several services in one visit also work ("cleaning and whitening").
- **Checks your answers:** impossible, past and closed dates and out-of-hours times are caught. The first error gets a detailed hint with an example, later ones get short varied hints, and the third also offers the phone number.
- **Time slots:** tappable time chips, with some slots already taken. If you pick a taken one, it offers the nearest free times. Requested doctors are noted, and the team confirms them.
- **Nice touches:**
  - a summary card with Edit and Confirm, and Add to Calendar (.ics)
  - "Start new chat", timestamps and "Seen" ticks
  - the chat survives a page refresh
  - a floating button with a pulse and a tooltip
- **Mobile:** full-screen under 560px with a clear close button. The input stays above the keyboard, with 16px input text and 44px tap targets.

## Add it to any clinic website

```html
<script src="chatbot.js" data-niche="dental" data-name="Smith Family Dental" data-city="Boston, MA" data-phone="+1 617 555 0100"></script>
```

`chatbot.js` loads `niches.js` from the same folder automatically. The widget lives in a Shadow DOM, so it never clashes with the site's styles.

## New client in 3 steps

1. In `niches.js`, copy the `add({ … })` block of the closest niche.
2. Change the `id`, `business`, hours, services and prices, insurance and the Q&As.
3. Embed it with `data-niche="your-id"`.

## Connecting a real AI (optional)

The demo uses smart intent matching, so no API key is needed. In `chatbot.js`, search for **"WHERE THE CLAUDE API GOES"** — that comment shows exactly where to send free-text questions to Claude from your own backend (never put an API key in the browser).

## Receiving bookings

Every booking is saved in the browser for the demo, and fires a `demochatbot:request` event:

```js
window.addEventListener("demochatbot:request", (e) => console.log(e.detail));
```

In production, send it to your backend, email, Google Sheets or CRM. See `submitRequest()` in `chatbot.js`.

## Deploy on Netlify

- Branch to deploy: `main`
- Base directory: *(empty)*
- Build command: *(empty)*
- Publish directory: `.`

`netlify.toml` already contains these settings.

## Files

- `chatbot.js`: the engine (design, understanding, booking flow, safety)
- `niches.js`: the 15 niche configs (built from one shared clinic knowledge base)
- `index.html`: the landing page, single-business pages and Owner view
- `netlify.toml`: Netlify settings

---
All businesses are fictional, for demonstration only. © Skyline Web Co
