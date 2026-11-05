"""Generates webinar/index.html and event/index.html from one template.
Run:  python build.py
Edit the CONFIG block and the PAGES copy below, then run again."""
import os, re, time

ASSET_V = str(int(time.time()))   # cache-buster: changes on every build

# ---------------- CONFIG: fill these in, then re-run ----------------
SITE_URL      = "https://kj3digitalco.github.io/tradenexx-landing-pages"   # live URL, used by the og tags
GCASH_NAME    = "To be added"      # account name shown after the form
GCASH_NUMBER  = "To be added"      # GCash number shown after the form
# One Google Form (and so one Sheet) per page. Change the endpoint/fields here to point a page somewhere else.
FORMS = {
    "webinar": {  # online webinar -> "Tradenexx Webinar Registrations"
        "endpoint": "https://docs.google.com/forms/d/e/1FAIpQLScJTpPh0JxHpk6vJThUEXRQUFcjbcZCZPDi_rwF6C_zLRfVMw/formResponse",
        "fields": {'name': 'entry.111817025', 'email': 'entry.1383634402', 'mobile': 'entry.807792033', 'who': 'entry.1394399725', 'product': 'entry.801241235', 'ref': 'entry.85631141', 'price': 'entry.1304411898', 'at': 'entry.653598797'},
    },
    "event": {    # offline live training -> "Tradenexx Live Training Registrations"
        "endpoint": "https://docs.google.com/forms/d/e/1FAIpQLSd5X1Jb-M0Lil1soywG2fKQTvbLnF_204dPD1-CZrUcSYMH6w/formResponse",
        "fields": {'name': 'entry.1822913447', 'email': 'entry.592665859', 'mobile': 'entry.249020773', 'who': 'entry.1300424268', 'product': 'entry.709407751', 'ref': 'entry.1327088152', 'price': 'entry.1885423582', 'at': 'entry.1913739855'},
    },
}
# VIDEOS: paste a YouTube link, a Facebook video link, or a file path like "../assets/video/intro.mp4".
# Leave "" to show the "coming soon" placeholder. POSTER is optional (an image path); the coach photo is the default.
SAMPLE = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"   # free CC0 sample clip, swap for the real video
VIDEOS = {"webinar": {"src": SAMPLE, "poster": "../assets/img/playbook.jpg"},
          "event":   {"src": SAMPLE, "poster": "../assets/img/group.jpg"}}
PRICE         = 500
COMPANY_LINE  = "Tradenexx is registered in the United Kingdom (Companies House no. 17483940)."

RISK = ("Tradenexx provides trading education, tools and coaching. It is not an investment offer and "
        "nothing here is financial advice. Trading forex, CFDs and automated systems carries a high risk of loss, "
        "and past results, including backtests, never guarantee future results. Only trade money you can afford to lose, "
        "keep your funds in your own regulated broker account, and never hand your money to an account manager.")

def candles(n=16, seed=3):
    """Deterministic candlestick strip as inline svg (uses currentColor, so CSS sets the tint)."""
    r = seed; out = []; y = 150
    for i in range(n):
        r = (r * 1103515245 + 12345) & 0x7fffffff
        d = (r % 70) - 32; o = y; y = max(40, min(250, y + d)); c = y
        hi = min(o, c) - (r >> 8) % 26; lo = max(o, c) + (r >> 12) % 26
        x = 22 + i * 36
        fill = "currentColor" if c < o else "none"
        out.append(f'<line x1="{x}" y1="{hi}" x2="{x}" y2="{lo}"/><rect x="{x-9}" y="{min(o,c)}" width="18" height="{max(6,abs(o-c))}" rx="2" fill="{fill}"/>')
    return f'<svg viewBox="0 0 {22*2+n*36} 300" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">{"".join(out)}</svg>'

def rings(n=6):
    return '<svg viewBox="0 0 400 400" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' + "".join(f'<circle cx="200" cy="200" r="{40+i*30}"/>' for i in range(n)) + '</svg>'

CANDLES = candles(); CANDLES_WIDE = candles(24, 9); RINGS = rings()

MARQUEE_WORDS = ["Education", "Discipline", "Risk first", "Transparency", "Systematic thinking", "Community", "Credibility", "Opportunity", "Responsible trading"]
_set = "".join(f"<span>{w}</span><i></i>" for w in MARQUEE_WORDS)
MARQUEE = '<div class="marquee" aria-hidden="true"><div class="track">' + "".join(f'<div class="mset">{_set}</div>' for _ in range(4)) + '</div></div>'

COMMON = dict(
    who_h="Built for people with busy lives.",
    who=[("Business owners", "You run a business and have no time to watch charts. Learn how rules-based trading works and how to read your own reports."),
         ("Seafarers and OFWs", "Your work keeps you far from the market. Learn how a setup can run on a VPS while you are away, and how to check in from your phone."),
         ("IT and BPO workers", "You like systems and proof. Learn to test, check and question a strategy instead of trusting a pitch."),
         ("First-timers", "You are starting from zero. We begin with the basics and a free demo account, so no real money is needed to learn.")],
    mods=[("Module 1", "Your trading toolkit", "MT4 or MT5, how to install MT5 and open a demo account, lots and pips explained with real examples, and the 1 to 2 percent risk rule.", ["MT5", "Demo account", "Lots and pips", "Risk rule"]),
          ("Module 2", "Reading the market", "Trend, support and resistance, institutional levels, trading sessions in Philippine time, and the news that moves price. You leave with your own one-month trading plan.", ["Trend", "Support and resistance", "Sessions in PH time", "News: NFP, CPI, FOMC"]),
          ("Module 3", "Manual vs automated", "How an Expert Advisor works, how to install one, what to do and avoid with a VPS, settings and leverage, and why no result is ever guaranteed.", ["Expert Advisors", "VPS", "Settings", "Leverage"]),
          ("Module 4", "Habits that protect you", "The holy grail trap, red flags of signal scams, how martingale quietly grows risk, how to verify anyone's results, and a daily routine for Filipino traders.", ["Scam red flags", "Verify results", "Daily routine"])],
    calc_h="See the 1 to 2 percent rule in pesos.",
    calc_p="Most beginners lose by risking too much on a single trade. Put in your starting capital and see what 1% to 2% really looks like.",
    coach_h="Learn from someone who has done it for over 10 years.",
    coach_p="Coach Alex Uy is the founder of Tradenexx and Smart Money 24/7. He has more than 10 years in forex trading and 9 years in automated trading systems. He teaches automated trading, Expert Advisors, copy trading and AI-powered market analysis, so Filipinos can build financial discipline, manage risk and turn earned income into long-term assets.",
    facts=["Over 10 years in forex, 9 years in automated trading",
           "Best Forex CEO 2024, awarded by WikiFX",
           "Best Trading Partner, XM, 2018",
           "Business Leader Excellence, CXO2",
           "Top 13 BNI member (August 2025) and Vice President of BNI Progress",
           "Former Mang Inasal franchisee for 7 years and The Generics Pharmacy franchisee for 13 years"],
    steps=[("Fill in the form", "Your name, mobile number and email. It takes one minute."),
           ("Pay by GCash", "Scan the QR code and send the amount. Use your reference code in the message."),
           ("Get your confirmation", "We confirm your payment and send your seat details once the dates are set.")],
)

PAGES = {
 "webinar": dict(
    title="Tradenexx Online Webinar | Learn to trade with discipline",
    desc="A 4-session live online webinar with Coach Alex Uy. Learn MT5, risk, reading the market and automated trading, with no hype. Just 500 pesos.",
    prefix="TNX-W", product="webinar", video_h="A word from Coach Alex.", video_p="See what the four sessions are about and who they are for.", other="../event/", other_label="Prefer a live classroom? See the live training",
    bands=[(0, .25, "Online webinar · 4 live sessions", "See the system before you trust it.", "Learn how trading and automated trading really work, live with Coach Alex Uy. No hype and no promises of quick money.", ["₱500", "4 sessions, 2 hours each", "From your own laptop"], None),
           (.27, .52, "Module by module", "Your laptop. Now a trading asset.", "Set up MT5, practice on a demo account, and learn how an Expert Advisor trades by rules.", [], None),
           (.54, .77, "Risk comes first", "No hype. No guaranteed returns.", "Trading can lose money. You learn to size every trade, protect your account and spot fake guarantees.", [], None),
           (.79, 1, "Seats open", "Four live sessions. ₱500.", "Reserve your seat now. Dates are announced soon.", [], "Reserve your seat")],
    mods_h="Four sessions. Two hours each.",
    mods_p="Each session builds on the last, from first install to everyday habits.",
    incl=[("4 live group webinars", "Two hours each, taught live"),
          ("30 days free use of Tradenexx systems", "Try the tools before you decide anything"),
          ("47-page Traders Beginners Playbook", "Yours to keep"),
          ("1 month of 1-on-1 coaching on Zoom", "Ask your own questions"),
          ("Access to the Traders Community", "Learn alongside other Filipino traders")],
    offer_h="Everything in one ₱500.", offer_p="One payment. No hidden fees. No money handed over for trading.",
    seat="Webinar seat", tbd="Dates announced soon",
    proof_h="Real people. Live on Zoom.", proof_p="Moments from past online sessions led by Coach Alex.",
    proof_order=["zoom1", "deskselfie", "award", "zoom3", "cert", "zoom2", "selfie", "zoom5", "zoom4"],
    faq=[("Is this an investment scheme?", "No. You do not give us money to trade. This is education, tools and coaching. Your trading money stays in your own broker account, in your own name."),
         ("Do I need trading experience?", "No. We start from the basics and you practice on a demo account first, so you can learn without risking real money."),
         ("Will I earn money?", "We cannot promise that, and anyone who does is a red flag. Trading and automated trading can lose money, and past results never guarantee future ones. You learn how to manage risk and judge claims for yourself."),
         ("What do I need to join?", "A Windows laptop or desktop and an internet connection. We guide you through the MT5 setup."),
         ("When are the sessions?", "Dates are announced soon. People who register hear first."),
         ("How do I pay?", "By GCash, right after the form. You get a QR code and a reference code.")],
    final_h="Learn the system. Then decide for yourself.",
    final_p="Four live sessions, a playbook, and a month of coaching for ₱500."),
 "event": dict(
    title="Tradenexx Live Training | One day classroom session with Coach Alex",
    desc="An 8-hour live classroom training with Coach Alex Uy. Bring your laptop, learn MT5, risk and automated trading in person. Just 500 pesos.",
    prefix="TNX-L", product="live-training", video_h="See what the live training is like.", video_p="A short look at the room, the laptops, and a full day with Coach Alex.", other="../webinar/", other_label="Prefer to learn online? See the webinar",
    bands=[(0, .25, "Live training · 1 day · classroom", "One day. Eight hours. In person.", "Sit in the room with Coach Alex Uy and learn to trade with discipline, on your own laptop, with help beside you.", ["₱500", "8 hours", "Classroom session"], None),
           (.27, .52, "Hands on", "Bring your laptop. Leave set up.", "Install MT5, open a demo account and place practice trades with the team next to you.", [], None),
           (.54, .77, "Risk comes first", "No hype. No guaranteed returns.", "Trading can lose money. You learn to size every trade, protect your account and spot fake guarantees.", [], None),
           (.79, 1, "Seats open", "Eight hours. ₱500.", "Reserve your seat now. Date and venue are announced soon.", [], "Reserve your seat")],
    mods_h="Four topics. One full day.",
    mods_p="The same foundations, taught in the room with hands-on help.",
    incl=[("8-hour live training", "A full classroom session with Coach Alex"),
          ("30 days free use of Tradenexx systems", "Try the tools before you decide anything"),
          ("47-page Traders Beginners Playbook", "Yours to keep"),
          ("1 month of 1-on-1 coaching on Zoom", "Ask your own questions after the day"),
          ("Access to the Traders Community", "Learn alongside other Filipino traders")],
    offer_h="Everything in one ₱500.", offer_p="One payment. No hidden fees. No money handed over for trading.",
    seat="Live training seat", tbd="Date and venue announced soon",
    proof_h="This is what the room looks like.", proof_p="Moments from past live trainings led by Coach Alex.",
    proof_order=["workshop", "laptops", "award", "hall", "cert", "deskselfie", "selfie", "class", "playbook"],
    faq=[("Is this an investment scheme?", "No. You do not give us money to trade. This is education, tools and coaching. Your trading money stays in your own broker account, in your own name."),
         ("Where and when is it?", "The date and venue are announced soon. People who register hear first."),
         ("What should I bring?", "Your laptop. A Windows laptop works best. We help you set up MT5 in the room, and the full details come with your confirmation."),
         ("Do I need trading experience?", "No. We start from the basics and you practice on a demo account first, so you can learn without risking real money."),
         ("Will I earn money?", "We cannot promise that, and anyone who does is a red flag. Trading can lose money, and past results never guarantee future ones. You learn how to manage risk and judge claims for yourself."),
         ("Can I join the online webinar instead?", "Yes. There is a separate 4-session online webinar for the same price. You can find it from the link at the bottom of this page.")],
    final_h="One day in the room can change how you trade.",
    final_p="Eight hours, a playbook, and a month of coaching for ₱500."),
}

import json

def split_title(t):
    w = t.split()
    cands = [i + 1 for i, x in enumerate(w[:-1]) if x.endswith(".")]
    mid = len(w) / 2
    k = min(cands, key=lambda i: abs(i - mid)) if cands else len(w) // 2
    return " ".join(w[:k]), " ".join(w[k:])

FAN_ALT = {"hall": "A full training hall at a past Tradenexx event", "selfie": "Coach Alex taking a selfie with a full room of attendees",
           "workshop": "Attendees working on laptops during a live session", "laptops": "Close view of traders at their laptops",
           "group": "Group photo after a live training", "class": "A classroom of attendees",
           "award": "Coach Alex receiving an award in Dubai", "cert": "Best Forex CEO 2024 certificate from WikiFX", "playbook": "Attendees holding up the Traders Beginners Playbook after a live session",
           "deskselfie": "Coach Alex giving a thumbs up at his desk before a live webinar",
           "zoom1": "Coach Alex and attendees waving during a live Zoom session", "zoom2": "A full Zoom room of attendees during a Tradenexx webinar",
           "zoom3": "Coach Alex and attendees on a live Zoom call", "zoom4": "A Zoom Workplace session with attendees from across the Philippines",
           "zoom5": "Participants in an online Tradenexx systems training"}

def gallery_html(order, heading, lede):
    """Three columns of photos that tilt flat as you scroll. Pick the photos per column so no neighbours repeat."""
    o = order
    cols = [[o[0], o[1], o[3]], [o[5], o[2], o[8]], [o[6], o[4], o[7]]]     # nine photos, each once; award in the middle
    ranges = ["[-10,2]", "[15,5]", "[-10,2]"]
    pos = {"award": "50% 25%", "cert": "50% 30%", "deskselfie": "25% 40%", "playbook": "50% 50%"}
    seen, out = set(), ""
    for ci, col in enumerate(cols):
        imgs = ""
        for n in col:
            alt = "" if n in seen else FAN_ALT[n]      # a repeated photo is decoration, not a second description
            seen.add(n)
            imgs += f'<img src="../assets/img/{n}.jpg" alt="{alt}" loading="lazy" decoding="async" draggable="false" style="object-position:{pos.get(n, "50% 50%")}">'
        out += f'<div class="gal-col" data-y="{ranges[ci]}">{imgs}</div>'
    return (f'<div class="gal-head"><div class="eyebrow ba" style="--i:0">Proof</div><h2 class="ba" style="--i:1">{h(heading)}</h2>'
            f'<p class="lede ba" style="--i:2">{h(lede)}</p>'
            f'<div class="ba" style="--i:3"><button class="btn" data-join type="button">Reserve your seat</button></div></div>'
            f'<div class="gal-scroll"><div class="gal-sticky"><div class="gal-grid">{out}</div></div></div>'
            f'<p class="cap gal-cap">Photos and recognition provided by Tradenexx.</p>')

def h(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def reg_inner(P, pid, inline):
    return f"""    <div class="step1">
      <div class="eyebrow">{h(P['seat'])} · ₱{PRICE}</div>
      <h3{"" if inline else ' id="regt"'}>Reserve your seat</h3>
      <p class="lede" style="font-size:14px">Fill in your details first. Payment comes next.</p>
      <form autocomplete="on">
        <div class="fld"><label for="{pid}-name">Full name</label><input id="{pid}-name" name="name" required autocomplete="name"{"" if inline else " autofocus"}></div>
        <div class="fld"><label for="{pid}-mobile">Mobile number (GCash)</label><input id="{pid}-mobile" name="mobile" type="tel" required inputmode="tel" placeholder="0917 506 0103" maxlength="13" autocomplete="tel"></div>
        <div class="fld"><label for="{pid}-email">Email</label><input id="{pid}-email" name="email" type="email" required autocomplete="email" placeholder="name@gmail.com"></div>
        <div class="fld"><label for="{pid}-who">I am a</label><select id="{pid}-who" name="who" required><option value="" disabled selected>Choose one</option><option>Business owner</option><option>Seafarer or OFW</option><option>IT or BPO professional</option><option>First-timer</option><option>Other</option></select></div>
        <label class="chk"><input type="checkbox" name="ok" required><span>I understand this is trading education, not an investment, and that trading can lose money.</span></label>
        <div class="err" role="alert"></div>
        <button class="btn" type="submit">Continue to payment</button>
      </form>
    </div>
    <div class="step2">
      <div class="eyebrow">Step 2 of 3</div>
      <h3>Pay by GCash</h3>
      <p class="lede" style="font-size:14px">Thanks, <span data-name></span>. Scan the code or send to the number, then tap the button below.</p>
      <div class="pay">
        <div class="qr"><img src="../assets/gcash-qr.png" alt="GCash QR code" onerror="this.replaceWith(document.createTextNode('GCash QR code goes here'))"></div>
        <dl><div><dt>Amount</dt><dd>₱{PRICE}</dd></div><div><dt>GCash name</dt><dd>{h(GCASH_NAME)}</dd></div><div><dt>GCash number</dt><dd>{h(GCASH_NUMBER)}</dd></div></dl>
      </div>
      <div class="ref">Put this reference code in your GCash message: <b data-ref></b></div>
      <button class="btn" type="button" data-paid>I have paid</button>
    </div>
    <div class="step3">
      <div class="eyebrow">Step 3 of 3</div>
      <h3>Salamat, <span data-name></span>.</h3>
      <p class="lede" style="font-size:14px;margin-top:10px">We will check your payment and send your seat details to your mobile number and email once the dates are set. Messenger should open now. Send your GCash receipt screenshot and your reference code (<b data-ref></b>) there.</p>
      <a class="btn" href="https://m.me/tradenexx" target="_blank" rel="noopener">Open Messenger</a>
      {'<button class="btn ghost" type="button" data-reset>Register someone else</button>' if inline else '<button class="btn ghost" type="button" data-close>Close</button>'}
    </div>"""

def build(key, P):
    C = COMMON
    who = "".join(f'<div class="rv"><span class="n">0{i+1}</span><h3>{h(t)}</h3><p>{h(d)}</p></div>' for i, (t, d) in enumerate(C["who"]))
    mods = ""
    for tag, t, d, chips in C["mods"]:
        li = "".join(f"<li>{h(c)}</li>" for c in chips)
        mods += f'<div class="mod"><div class="tag">{tag}</div><h3>{h(t)}</h3><p>{h(d)}</p><ul>{li}</ul></div>\n'
    BOT = ('<span class="bot"><svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true">'
           '<line x1="12" y1="3.2" x2="12" y2="6.6" stroke="#bcd4ff" stroke-width="1.6" stroke-linecap="round"/>'
           '<circle class="ant" cx="12" cy="2.6" r="1.7" fill="#7fe0ff"/>'
           '<rect x="4" y="6.6" width="16" height="12.6" rx="4.2" fill="#fff"/>'
           '<rect x="1.6" y="11" width="2.4" height="4.6" rx="1.2" fill="#bcd4ff"/><rect x="20" y="11" width="2.4" height="4.6" rx="1.2" fill="#bcd4ff"/>'
           '<rect x="6.4" y="9" width="11.2" height="7.8" rx="2.6" fill="#001664"/>'
           '<circle class="eye" cx="9.6" cy="12.2" r="1.5" fill="#7fe0ff"/><circle class="eye" cx="14.4" cy="12.2" r="1.5" fill="#7fe0ff"/>'
           '<path d="M10 15.2h4" stroke="#7fe0ff" stroke-width="1.1" stroke-linecap="round"/></svg>Trading bot</span>')
    incl = "".join(f'<li class="rv"><span class="i">0{i+1}</span><div><b>{h(t)}{BOT if "Tradenexx systems" in t else ""}</b><small>{h(d)}</small></div></li>' for i, (t, d) in enumerate(P["incl"]))
    facts = "".join(f"<li>{h(f)}</li>" for f in C["facts"])
    steps = "".join(f'<div class="rv"><h3>{h(t)}</h3><p>{h(d)}</p></div>' for t, d in C["steps"])
    faq = "".join(f"<details><summary>{h(q)}</summary><p>{h(a)}</p></details>" for q, a in P["faq"])
    o = P["proof_order"]
    cls = ["a", "b", "c", "d", "e"]
    alt = {"hall": "A full training hall at a past Tradenexx event", "selfie": "Coach Alex taking a selfie with a full room of attendees",
           "workshop": "Attendees working on laptops during a live session", "laptops": "Close view of traders at their laptops",
           "group": "Group photo after a live training", "class": "A classroom of attendees", "award": "Coach Alex receiving an award in Dubai", "cert": "Best Forex CEO 2024 certificate from WikiFX"}
    V = VIDEOS[key]
    vsrc = V["src"].strip()
    vposter = V["poster"].strip() or "../assets/img/selfie.jpg"
    vstate = "ready" if vsrc else "placeholder"
    T1, T2 = split_title(P["bands"][0][3])
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{h(P['title'])}</title>
<meta name="description" content="{h(P['desc'])}">
<meta name="theme-color" content="#050d26">
<meta name="robots" content="noindex, nofollow"><!-- LAUNCH STEP: delete this line when the GCash details and the real video are in -->
<!-- DEPLOY STEP: set SITE_URL in build.py to the live GitHub Pages URL and re-run, so these two tags are absolute -->
<meta property="og:title" content="{h(P['title'])}">
<meta property="og:description" content="{h(P['desc'])}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE_URL}/{key}/">
<meta property="og:image" content="{SITE_URL}/assets/img/hall.jpg">
<link rel="icon" type="image/png" href="../assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/site.css?v={ASSET_V}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><i></i></div>
<div class="env" aria-hidden="true"></div>
<nav class="top" aria-label="Main">
  <a class="logo-plate" href="./" aria-label="Tradenexx home"><img src="../assets/img/logo.png" alt="Tradenexx" width="301" height="250"></a>
  <button class="btn small" data-join type="button">Reserve your seat</button>
</nav>

<header class="hero3" id="top">
  <div class="stage3">
    <div class="bg3" aria-hidden="true"></div>
    <div class="vframe">
      <!-- VIDEO: set the link in build.py (VIDEOS) and re-run it. Nothing here needs editing by hand. -->
      <div class="vid" data-state="{vstate}" data-src="{h(vsrc)}">
        <img class="vid-poster" src="{h(vposter)}" alt="" loading="lazy">
        <div class="vid-art" aria-hidden="true">{CANDLES_WIDE}</div>
        <button class="vid-play" type="button" aria-label="Play video"{"" if vsrc else " disabled"}>
          <span class="vid-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>
          <span class="vid-label">{"Watch the video" if vsrc else "Video coming soon"}</span></button>
      </div>
    </div>
    <div class="intro3"><div class="eyebrow">{h(P['bands'][0][2])}</div></div>
    <h1 class="titles"><span class="t1">{h(T1)}</span> <span class="t2">{h(T2)}</span></h1>
    <div class="hint3"><p class="lede">{h(P['bands'][0][4])}</p><span class="eyebrow">Scroll to open the video</span></div>
  </div>
</header>

{MARQUEE}

<main id="main" tabindex="-1">
<section class="s t-navy d-dots fx reveal">
  <div class="dr-root dr-local" aria-hidden="true"><canvas class="dr-bloom"></canvas><canvas class="dr-main"></canvas><div class="dr-vignette"></div><div class="dr-grain"></div></div>
<div class="wrap">
  <div class="eyebrow rv">Who it is for</div>
  <h2 class="rv">{h(C['who_h'])}</h2>
  <div class="who">{who}</div>
  <div class="who-cta rv">
    <button class="btn" data-join type="button">Reserve your seat</button>
    <div class="meta">{"".join(f'<span class="eyebrow">{h(c)}</span>' for c in P['bands'][0][5])}</div>
  </div>
</div></section>

<section class="s t-white d-chart"><div class="deco" aria-hidden="true">{CANDLES}</div><div class="wrap">
  <div class="eyebrow">What you will learn</div>
  <h2>{h(P['mods_h'])}</h2>
  <p class="lede">{h(P['mods_p'])}</p>
  <div class="path"><svg class="line" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true"><path class="track" d="M12 0 V100" vector-effect="non-scaling-stroke"/><path class="draw" d="M12 0 V100" pathLength="1" vector-effect="non-scaling-stroke"/></svg>
  {mods}</div>
</div></section>

<section class="s t-deep d-ticks aur-sec"><div class="aur" aria-hidden="true"><i></i><i></i><i></i></div><div class="wrap">
  <div class="eyebrow">Try it</div>
  <h2>{h(C['calc_h'])}</h2>
  <p class="lede">{h(C['calc_p'])}</p>
  <div class="calc">
    <div class="calc-in">
      <div class="calc-row"><label class="f" for="capital">Your starting capital</label><span class="tag-edit">Type your own</span></div>
      <div class="field nudge" id="capfield"><span class="cur">₱</span><input id="capital" type="number" inputmode="numeric" min="0" step="1000" value="100000" aria-describedby="calc-hint"><svg class="pen" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zm17.7-10.05a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75 2.12-1.8z"/></svg></div>
      <div class="chips" role="group" aria-label="Quick amounts"><button type="button" data-cap="10000">₱10,000</button><button type="button" data-cap="50000">₱50,000</button><button type="button" data-cap="100000">₱100,000</button><button type="button" data-cap="500000">₱500,000</button></div>
      <div class="calc-row" style="margin-top:30px"><label class="f" for="riskpct">Risk per trade</label><span class="tag-edit">Drag the dot</span></div>
      <div class="pct" id="riskpctlabel">1.0%</div>
      <div class="slider nudge" id="slidewrap"><input id="riskpct" type="range" min="1" max="2" step="0.1" value="1" aria-label="Risk per trade, 1 to 2 percent"><div class="ends"><span>1% careful</span><span>2% the most</span></div></div>
      <p class="hint" id="calc-hint">Type any amount or drag the dot. The answer changes right away.</p>
    </div>
    <div class="out">
      <div class="eyebrow">Risk on one trade</div>
      <div class="big" id="riskout" aria-live="polite">₱1,000</div>
      <p class="note" id="riskper"></p>
      <p class="note" style="margin-top:14px;opacity:.8">A learning example, not advice.</p>
    </div>
  </div>
</div></section>

<div class="stack">
<section class="s t-pale d-stripes reveal">
  <div class="wrap">
  <div class="eyebrow rv">What is included</div>
  <h2 class="rv">{h(P['offer_h'])}</h2>
  <div class="offer">
    <ul class="incl">{incl}</ul>
    <aside class="price rv" aria-label="Price">
      <div class="eyebrow">{h(P['seat'])}</div>
      <div class="amt"><sup>₱</sup>{PRICE}</div>
      <p>{h(P['offer_p'])}</p>
      <div class="tbd"><i></i>{h(P['tbd'])}</div>
      <button class="btn" data-join type="button">Reserve your seat</button>
    </aside>
  </div>
</div></section>

<section class="s t-navy aur-sec reveal"><div class="aur" aria-hidden="true"><i></i><i></i><i></i></div><div class="wrap coach">
  <div class="ph rv"><img src="../assets/img/coach.jpg" alt="Coach Alex Uy, founder of Tradenexx" loading="lazy" width="720" height="923"></div>
  <div>
    <div class="eyebrow rv">Your coach</div>
    <h2 class="rv">{h(C['coach_h'])}</h2>
    <p class="lede rv">{h(C['coach_p'])}</p>
    <ul class="facts rv">{facts}</ul>
  </div>
</div></section>
</div>

<section class="s t-white gal-sec" aria-label="Photos from past trainings">{gallery_html(P["proof_order"], P["proof_h"], P["proof_p"])}</section>

<section class="s t-ink reveal gp-sec" aria-label="Student testimonials">
  <div class="gp" aria-hidden="true" data-avoid=".tst .eyebrow, .tst h2, .tvf figcaption, .tv"><canvas></canvas></div>
  <div class="wrap tst">
  <div class="eyebrow rv">Student stories</div>
  <h2 class="rv">Hear it from people who joined.</h2>
  <div class="tvs">
    <figure class="tvf"><button class="tv" type="button" data-src="../assets/vid/kristan.mp4" aria-label="Play Kristan's testimonial"><img src="../assets/vid/kristan.jpg" alt="" loading="lazy"><span class="tvp" aria-hidden="true"></span></button><figcaption><b>Kristan</b><span class="eyebrow">Testimonial &middot; 4:09</span></figcaption></figure>
    <figure class="tvf"><button class="tv" type="button" data-src="../assets/vid/mobelyn.mp4" aria-label="Play Mobelyn's testimonial"><img src="../assets/vid/mobelyn.jpg" alt="" loading="lazy"><span class="tvp" aria-hidden="true"></span></button><figcaption><b>Mobelyn</b><span class="eyebrow">Testimonial &middot; 2:12</span></figcaption></figure>
  </div>
</div></section>

<div class="flow">
<section class="s t-blue d-wave reveal"><div class="wrap">
  <div class="eyebrow rv">How to join</div>
  <h2 class="rv">Three steps. About two minutes.</h2>
  <div class="steps">{steps}</div>
</div></section>

<section class="s t-pale d-plus"><div class="wrap">
  <div class="eyebrow">Questions</div>
  <h2>The honest answers.</h2>
  <div class="faq">{faq}</div>
</div></section>

<section class="final t-cta" id="join">
  <div class="aur" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="final-grid">
    <div class="final-copy">
      <div class="eyebrow">Seats open</div>
      <h2>{h(P['final_h'])}</h2>
      <p class="lede">{h(P['final_p'])}</p>
      <ul class="final-points"><li>₱{PRICE}, one payment, no hidden fees</li><li>Pay by GCash right after the form</li><li>{h(P['tbd'])}</li></ul>
    </div>
    <div class="reg reg-inline" data-step="1" role="group" aria-label="Registration form">
      <div class="in">
{reg_inner(P, "i", True)}
      </div>
    </div>
  </div>
</section>
</div>
</main>

<footer><div class="wrap">
  <p class="risk">{h(RISK)}</p>
  <p>{h(COMPANY_LINE)} © 2026 Tradenexx.</p>
</div></footer>

<dialog class="reg" data-step="1" aria-labelledby="regt">
  <button class="x" type="button" data-close aria-label="Close">×</button>
  <div class="in">
{reg_inner(P, "f", False)}
  </div>
</dialog>

<script>window.TNX={{product:"{P['product']}",prefix:"{P['prefix']}",price:{PRICE},endpoint:"{FORMS[key]["endpoint"]}",fields:{json.dumps(FORMS[key]["fields"])}}};</script>
<script src="../assets/datarain.js?v={ASSET_V}"></script>
<script src="../assets/magnetic.js?v={ASSET_V}"></script>
<script src="../assets/site.js?v={ASSET_V}"></script>
</body>
</html>
"""

for key, P in PAGES.items():
    os.makedirs(key, exist_ok=True)
    open(f"{key}/index.html", "w", encoding="utf-8", newline="\n").write(build(key, P))
    print("wrote", f"{key}/index.html")

# root: a tiny chooser so the GitHub Pages root is not empty
open("index.html", "w", encoding="utf-8", newline="\n").write("""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tradenexx</title><meta name="theme-color" content="#050d26"><meta name="robots" content="noindex, nofollow">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050d26;color:#eef2fb;font:16px/1.6 "IBM Plex Mono",ui-monospace,monospace}main{display:grid;gap:14px;width:min(420px,88vw);text-align:center}h1{font:700 28px Tahoma,Verdana,sans-serif;margin:0 0 8px}a{display:block;padding:16px;border:1px solid #2a427f;border-radius:14px;color:#eef2fb;text-decoration:none}a:hover{background:#0e2255}</style></head>
<body><main><h1>Tradenexx</h1><a href="webinar/">Online webinar</a><a href="event/">Live training</a></main></body></html>
""")
print("wrote index.html")
