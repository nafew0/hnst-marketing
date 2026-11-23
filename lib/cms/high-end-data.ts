import type { Homepage, Page } from '@/lib/cms/payload-types'

/*
 * The high-end pivot's copy (Dylan's Grok Build packet, 22–23 Nov 2026), for
 * lib/cms/seed-high-end.ts. Bracketed placeholders are resolved as Dylan
 * decided on 23 Nov (HonestMarketing AI/reports/High-End Pivot Build Plan.md):
 * terms are "set out in your written agreement", project insurance and the
 * "samples for training" line are out, timelines say what the blueprint sets.
 * The app figures are SAMPLES until Nafew sends the real ones; the section
 * says so on the page.
 */

type Blocks = NonNullable<Page['blocks']>
type Kind = 'call' | 'text' | 'email' | 'price'

const act = (...kinds: Kind[]) => kinds.map((kind) => ({ kind }))
const go = (label: string, href: string) => ({
  kind: 'link' as const,
  label,
  href,
})
const items = (...rows: [string, string?][]) =>
  rows.map(([title, text]) => ({ title, ...(text && { text }) }))
const tags = (...titles: string[]) => titles.map((title) => ({ title }))
const join = (...parts: string[]) => parts.join('\n\n')

const CALL_TEXT_EMAIL = act('call', 'text', 'email')
const WITH_PRICE = act('call', 'text', 'email', 'price')
const AGREEMENT = 'Set out in your written agreement.'
const NO_GUARANTEE =
  'Outcomes depend on your business; we don’t guarantee results.'
const STILL_SELLING =
  'Didn’t you say you want to get started right now? Isn’t time important to you? Why are we still selling?'
const CHEAPER =
  'I agree. There are people who do it cheaper. We pride ourselves on being the most expensive so that price is no longer the problem. If price isn’t a problem for you, it’s not going to be a problem for us either. The question is: if this is the right product, is the solution worth it to you?'

/** Nafew's shipped products. The figures are samples until he sends real ones. */
const NAFEW_APPS = {
  heading: 'Shipped by our team',
  style: 'apps' as const,
  intro:
    'Our co-founder, Nafew, has spent ten years building national-scale digital services for higher education and government. A few of the products his team has shipped:',
  sampleFigures: true,
  items: [
    {
      title: 'Synapse',
      text: 'An AI assistant for the member institutions of Bangladesh’s national research and education network.',
      stat: '18,400+',
      statLabel: 'conversations a month',
      url: 'https://chat.bdren.ai',
    },
    {
      title: 'MindSpear',
      text: 'A quiz, quest and survey platform.',
      stat: '9,200+',
      statLabel: 'players and respondents',
      url: 'https://mindspear.app',
    },
    {
      title: 'MindSpear Surveys',
      text: 'Build forms, collect responses, analyse results and export reports.',
      stat: '1,300+',
      statLabel: 'surveys built',
      url: 'https://survey.mindspear.app',
    },
    {
      title: 'iLearn BD',
      text: 'An online learning platform.',
      stat: '26,000+',
      statLabel: 'learners',
      url: 'https://ilearn.bd',
    },
    {
      title: 'AI Mail Wizard',
      text: 'A Google Workspace add-on that writes, replies to, forwards and summarises email with AI.',
      stat: '4,800+',
      statLabel: 'installs',
      url: 'https://workspace.google.com/marketplace/app/ai_mail_wizard_aimwiz/176933046910',
    },
    {
      title: 'ECOMM Hosting',
      text: 'Managed WordPress and WooCommerce hosting, with servers, pricing and support in Bangladesh.',
      stat: '350+',
      statLabel: 'sites hosted',
      url: 'https://hosting.ecomm.bd',
    },
    {
      title: 'ClauseChain',
      text: 'World Champion of the United Nations Global Hackathon 2026. Nafew led the team as architect and lead developer.',
      stat: '1st',
      statLabel: 'UN Global Hackathon 2026',
    },
  ],
}

const PEOPLE = {
  dylan: {
    name: 'Dylan',
    role: 'Founder',
    body: 'Marketing since the Myspace days. Built and lost companies for lack of systems, then built the systems that were missing. Leads the story and the vision behind every project.',
    placeholder: 'Portrait coming',
  },
  nafew: {
    name: 'Nafew',
    role: 'Co-founder',
    body: join(
      'AI product and platform leader with ten years of experience building national-scale digital services for higher education and government in Bangladesh. Leads the Innovation team at BdREN, the national research and education network, as product owner and architect of seven AI products and the learning and collaboration platforms behind them.',
      'World Champion of the United Nations Global Hackathon 2026 as team lead, architect and lead developer of ClauseChain. Promoted twice at BdREN, with donor-funded delivery for GIZ and regular speaking at APAN, APNIC and APRICOT.',
      'Builds and runs the agents, automation and operations that let a small crew deliver at enterprise scale: product strategy, LLM application architecture, agent orchestration, retrieval-augmented generation, document intelligence, and on-premise AI hosting.'
    ),
    placeholder: 'Portrait coming',
  },
}

// ─── Mobile Application ─────────────────────────────────────────────────────

const mobileApplication: Blocks = [
  {
    blockType: 'salesHero',
    badge: 'Our lead offer',
    title:
      'Can you imagine your brand on your customer’s home screen — a channel you actually own?',
    subheadline:
      'A custom mobile application for $10M+ companies. Your story, your platform, your data, one tap from your customer.',
    body: 'We didn’t come here to sell you software. We came here to sell a customer experience, a solution that actually competes. Not a website squeezed onto a phone. Not another licensed snapshot of somebody else’s CRM. A product your customers open every day, with your data in your house and the source of it all owned by you. Every month you wait, someone else trains their thumbs. Now can you see it? Your logo, sitting next to the apps they can’t live without.',
    points: items(
      ['You own it.', 'Platform, hosting, data and licensing rights.'],
      ['Built to size.', 'No fixed package. Scoped to your ambition.'],
      ['Risk handled.', 'Trial first, milestones in escrow.']
    ),
    actions: [
      ...CALL_TEXT_EMAIL,
      go('See the payback math', '#payback'),
      { kind: 'price' },
    ],
  },
  {
    blockType: 'salesSection',
    anchor: 'vision',
    title:
      'Your customers live on their phones. The platforms own the relationship. That’s the problem.',
    subheadline:
      'Imagine owning the most valuable real estate in marketing, the home screen, while the market is still open.',
    body: join(
      'Ads get scrolled past. Email gets buried. Social feeds belong to someone else. Most companies your size run on software they rent: a one-size-fits-all snapshot, licensed by a corporation that sells software as a service, with a training course and a monthly bill. Those platforms eat a big market share, and they still leave you renting your own customer. Servers go down, terms change, and your data lives in someone else’s house.',
      'If you’re a public company, it’s worse: your financials are already online, your holdings stay flat while the major indexes grow, and you lose buying power every year even when revenue holds. Nobody’s hyped about your business.'
    ),
    groups: [
      {
        heading: 'What we’re saying',
        style: 'statements',
        items: items(
          [
            'You should own that.',
            'The service, the hosting and the data. Not rent them back every month.',
          ],
          [
            'You should own the experience.',
            'Your customers come in, check out and see their dashboard, inside a product with your name on it.',
          ],
          [
            'You should be talking.',
            'Get radically transparent and people will trust you. Then start marketing, and put the hype back in the business.',
          ]
        ),
      },
    ],
    closing:
      'Now can you see it? Market share on mobile is being decided now, and your company belongs in that fight.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'included',
    title: 'Built to the size of your ambition. Owned by you.',
    subheadline:
      'Can you imagine an app scoped to what you want to become, not to a price tier? Here’s what goes into it.',
    body: 'There’s no fixed package. Built to size. You own the message; we build it. We start from first principles: what your customers need, what your industry requires, and how far you want to go. Then we scope the build with you. Your build includes what your vision calls for, for example:',
    groups: [
      {
        style: 'cards',
        items: items(
          [
            'Story and product strategy',
            'What the app is for, who it serves and why they’ll open it again tomorrow. Everything is built on that “why.”',
          ],
          [
            'Fact-finding and blueprint',
            'Your customers, your systems, your regulations and your goals, turned into a feature map, user flows, scope and milestones, signed off before a line of code.',
          ],
          [
            'UX and interface design',
            'Screens built around your brand, your offer and your customers’ habits, delivered as clickable screens you hold and test before we build.',
          ],
          [
            'The build',
            'iPhone, Android or both, AI-accelerated and human-directed, built the way your goals demand.',
          ],
          [
            'A CRM you own',
            'Replace the rented CRM with your own: your customers, your pipeline, your data, in a database you own.',
          ],
          [
            'One integrated stack',
            'Connected to the systems you already use, through the lanes you already run, so every transaction lands in one place. Fewer handoffs, fewer reconciliations, less manual bookkeeping. Scoped per engagement.',
          ],
          [
            'Built for your industry’s rules',
            'Regulated industry? We point the build at the regulations and specifics your business has to meet, scoped per engagement.',
          ],
          [
            'Sized to your user base',
            'From your first few hundred users to thousands, the build is scoped to the scale you’re planning for.',
          ],
          [
            'App store launch',
            'Listings, screenshots and store copy that tell your story.',
          ],
          [
            'Room for the show',
            'The podcast can live inside the app, so you take control of the conversation in a channel you own.',
          ],
          [
            'Your data, your assets, your rights',
            'At the end of the process, we give you the licensing rights. We don’t keep your sensitive data. It’s all owned by you. You can trademark it.',
          ],
          [
            'Project work, not a live-in IT shop',
            'We deliver on a project basis. We are not maintenance, security triage or your in-house team. You hold your own in-house security, so we’re never the bottleneck. We will build it. We will come back for the next build. We don’t live in your house.',
          ]
        ),
      },
      {
        heading: 'Features your build can include',
        style: 'tags',
        items: tags(
          'Customer accounts',
          'Checkout and payments',
          'Customer dashboard',
          'Booking',
          'Push notifications',
          'Loyalty and rewards',
          'Community',
          'Referral network (your users bringing users)',
          'Content feed',
          'Podcast and video hub',
          'Support channel',
          'Investor and shareholder hub for public companies',
          'Analytics you own'
        ),
      },
    ],
    closing:
      'Now can you see it? The only limit on this list is how far you want to go.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    anchor: 'payback',
    title: 'What an app does for a company your size.',
    subheadline:
      'Can you imagine one channel that speaks to customers, investors and future hires at once?',
    body: 'Features are what we build. This is what they’re built to do for you.',
    groups: [
      {
        style: 'cards',
        items: items(
          [
            'You own the channel and the data.',
            'Not another rented CRM. A direct line, permanent, one tap from your customer, and the data stays in your house.',
          ],
          [
            'Out of the rent cycle.',
            'Stop paying, every month, for the right to reach your own customers. Build it once and own it.',
          ],
          [
            'Customers who come back.',
            'Accounts, loyalty, rewards and push notifications are built to bring them back, again and again, without paying an ad platform for every visit.',
          ],
          [
            'Investor relations, built in.',
            'The same story that wins customers shows investors where the company is headed. Founder-led content is how a CEO works in public, and a public company that gets radically transparent gives people a reason to trust it.',
          ],
          [
            'Down-to-earth connection.',
            'It sounds like a person, not a press release. Your customers hear from you, not from a platform’s algorithm.',
          ],
          [
            'Culture that recruits.',
            'Clarity about the mission draws the right hires, gives your team a reason to stay, and cuts the cost of turnover.',
          ],
          [
            'One stack, less friction.',
            'Your systems talk to each other in one place, so your team spends less time moving paper and more time serving customers.',
          ],
          [
            'Objections answered before the call.',
            'This page is long on purpose. It should take you through every question you’d ever have, so the marketing leads you through every step of the sale. Your app can do the same for your customers.',
          ]
        ),
      },
      {
        heading: 'Payback, illustrated',
        style: 'panel',
        intro: join(
          'Example only, with your numbers. Take your client lifetime value (what a client is worth a year, times the years they stay) and the cost of your build. Break-even is the build divided by that lifetime value: that many new clients, and the app has paid for itself.',
          'If your last launch with no marketing got 42 users and the app helps double that to 84, the return is 84 times your client lifetime value. Divide that by the build, and you have how many times the investment came back. We run your real numbers when we talk.'
        ),
      },
    ],
    note: `Illustrative example, not a projection. ${NO_GUARANTEE}`,
    closing:
      'Now can you see it? This isn’t a cost center. It’s a channel with your name on it.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    anchor: 'process',
    title: 'From idea to app store, with delivery risk handled.',
    subheadline:
      'Imagine watching your app take shape milestone by milestone, with payment released as we deliver.',
    groups: [
      {
        style: 'steps',
        items: items(
          [
            'Story session',
            'We find the “why” your app exists: who it serves, what it changes, and what your customers should feel when they open it. Everything is built on that.',
          ],
          [
            'Fact-finding',
            'We learn your customers, your current systems, your data, your industry’s rules and the numbers that matter, including your lifetime value, so the payback math is yours, not ours.',
          ],
          [
            'Blueprint',
            'Feature map, user flows, scope, milestones and timeline, signed off before a line of code. Any change after signing becomes its own written addendum. No scope creep, and no promises left undelivered.',
          ],
          [
            'Trial',
            'Want to see the work first? Tell us what you want to see within the next week. We deliver it, and the first payment releases on your acceptance. A trial is a close, not a loophole to get out.',
          ],
          [
            'Design',
            'Clickable screens you hold and test before we build. You mark what’s wrong, what must change and what perfect looks like.',
          ],
          [
            'Build and review, funds in escrow',
            'Working builds at each milestone. You place funds in escrow, and they unlock as deliverables are accepted. The test is “did we deliver what we agreed,” not how anyone feels about old objections.',
          ],
          [
            'Launch',
            'Store submission, launch content and go-live, with the runway to build the hype before the day arrives.',
          ],
          [
            'Handover',
            'Rights, data, accounts and assets transfer to you. We stay available for the next project, not as a live-in maintenance team.',
          ]
        ),
      },
      {
        heading: 'How we handle the risk',
        style: 'panel',
        intro:
          'Every option below is designed to de-risk delivery, not to promise a result. The details are set out in your written agreement.',
        items: items(
          [
            'Trial first',
            'Real work in your hands before the full commitment.',
          ],
          [
            'Escrow',
            'Funds sit in escrow and release as each deliverable is accepted.',
          ],
          [
            'Small start',
            'A smaller first payment, with the first deliverable before the rest releases.',
          ],
          [
            'Financing help',
            'If cash flow is the question, we can help you find a lender, and the funds still sit in escrow.',
          ]
        ),
      },
    ],
    note: 'Your blueprint sets the exact dates before the build starts. Our standard is to give a launch nine to twelve weeks of runway so the hype can build.',
    closing: 'See yourself at step eight? It’s closer than you think.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'proof',
    title: 'Built, not promised.',
    subheadline:
      'Can you imagine judging us by what we’ve shipped instead of what we say?',
    body: 'We don’t post testimonials we don’t have. We’d rather show you too much than ask you to trust us. When somebody has any ounce of fear, we show another exhibit, then another, until every question is answered. Prototypes, web apps and products with real users all go on the table.',
    groups: [
      NAFEW_APPS,
      {
        heading: 'What happens after launch',
        style: 'list',
        items: items(
          ['You own it.', 'Rights, data and assets are yours.'],
          [
            'We don’t move in.',
            'We build on a project basis. Your team holds in-house security and day-to-day operations.',
          ],
          [
            'We come back for the next build.',
            'A new feature, a new market, another company in your portfolio. You want another house? Let’s go build that one.',
          ]
        ),
      },
    ],
    closing: 'Now can you see it? The same standard, pointed at your app.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'fit',
    title: 'Built for companies with momentum.',
    subheadline: 'Imagine the company that’s ready for this. It’s yours.',
    groups: [
      {
        heading: 'This is for you if',
        style: 'yes',
        items: items(
          [
            'You’re doing $10M+ a year and your customers come back again and again.',
          ],
          [
            'You want to own a channel instead of renting a CRM or a social feed.',
          ],
          [
            'You’re paying, every month, for software that owns your customer data, and you’re done with it.',
          ],
          [
            'You own the company’s message — and if you’re public, you’re ready to talk, to be transparent, and to put hype back in the narrative.',
          ],
          [
            'You run in a niche or regulated industry where off-the-shelf software never quite fits.',
          ],
          [
            'You have a launch coming, or a customer base big enough that a direct line changes the math.',
          ]
        ),
      },
      {
        heading: 'This isn’t for you if',
        style: 'no',
        items: items(
          [
            'You’re shopping for the cheapest app that fits a budget. We build the best one for your ambition. We pride ourselves on being the most expensive so that price is no longer the problem.',
          ],
          ['You want a template with your logo on it.'],
          [
            'You want a live-in IT team for maintenance and security. We build on a project basis.',
          ],
          [
            'You want a promise about results. Nobody honestly can make one. We contract the work and deliver it.',
          ]
        ),
      },
    ],
    closing:
      'Did you just recognize your company? Then you know the next step.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'objections',
    anchor: 'questions',
    title: 'Is this what you’re thinking?',
    subheadline:
      'Can you imagine getting every answer before you even ask? Start here.',
    items: [
      {
        question: '“We don’t need that software.”',
        answer:
          'I agree. You don’t need more software. We didn’t come here to sell software. We came here to sell a customer experience, a solution that actually competes.',
      },
      {
        question: '“An app is a big investment. It’s not in the budget.”',
        answer:
          'It is, and it should be worth it if this is the right product. So let’s ask the only question that matters: if this was the right product, would the solution be worth it to you? Budgets follow priorities. Run the payback math with your own numbers, and if cash flow is the question, ask us about escrow and financing. For the number for your build, use Get a Price and tell us the intent.',
      },
      {
        question: '“We can get an app cheaper.”',
        answer:
          'I agree. There are people who do it cheaper. We pride ourselves on being the most expensive so that price is no longer the problem. If price isn’t a problem for you, it won’t be a problem for us either.',
      },
      {
        question: '“Our customers are used to our current CRM.”',
        answer:
          'They should be comfortable. That’s why we build around the way they already work, connect to the systems you already run, and move you off the rented platform without breaking what works.',
      },
      {
        question: '“Show us your experience. Do you have the team?”',
        answer:
          'Fair. Ask for any exhibit and we’ll put it on the table: shipped apps, prototypes, the build plan and the people behind it. A small crew, AI-accelerated and human-directed, with professionals brought in for every specialty your build needs.',
      },
      {
        question:
          '“I need to think about it / we don’t make decisions overnight / now’s not the right time.”',
        answer:
          'How long until launch? Six weeks? Our standard is to run a launch at nine or twelve weeks so we can build enough hype. So we need to get started, correct? Every month you wait, a competitor gets closer to your customer’s home screen.',
      },
      {
        question: '“I need to bring in my spouse, my CFO or the board.”',
        answer:
          'Good. Bring them in. Are they available now? Tell us what each of them will want to see and we’ll have it ready: the payback math with your lifetime value for the CFO, the escrow structure for the accountant, and every piece of evidence for the board. Founder-led content is investor relations.',
      },
      {
        question: '“IT and legal need to review it.”',
        answer:
          'They should. We’ll walk your IT lead through the build and data handling. Your legal team gets the contract in writing: what happens on a revision, and how any change becomes its own addendum, so there’s no scope creep and no promise left undelivered.',
      },
      {
        question: '“Our industry is too niche.”',
        answer:
          'Exactly. That’s why we build custom, and why we point the build at the regulations and specifics your industry has to meet.',
      },
      {
        question: '“Can you guarantee the results? We’ve been burned before.”',
        answer:
          'No. I don’t think anybody honestly can guarantee results. What we put in writing is the work: what we deliver, when, and what releases payment. So let’s make it feel safe: start with a trial, and put the funds in escrow so they release only as we deliver.',
      },
      {
        question: '“Who owns the app and the data? Who maintains it?”',
        answer:
          'You own it: licensing rights, data, accounts and assets. We don’t keep your sensitive data, and you can trademark it. Your team holds in-house security and day-to-day operations, so we’re never your bottleneck. We come back for the next build.',
      },
      {
        question: '“This is missing something.”',
        answer:
          'Is that the objection — that this is missing something? Tell us what, or look again on this page. If it’s here, we’ll point to it. If it isn’t, we’ll say so.',
      },
    ],
    closing: STILL_SELLING,
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    closingStyle: true,
    title: 'Picture it on their home screen. Now let’s build it.',
    subheadline:
      'You’re already on the website. Call while you’re here. I can walk you through it.',
    body: 'You’ve seen the vision, the build, the math and the protection. If all of this is true, is there any reason we shouldn’t get started right now? Bring the biggest version of your idea. Call, text or email, and it comes straight to us, not into a maze.',
    closing:
      'Now can you see your company there? If you’re still here, just do it already.',
    actions: CALL_TEXT_EMAIL,
  },
]

// ─── Podcast ────────────────────────────────────────────────────────────────

const podcast: Blocks = [
  {
    blockType: 'salesHero',
    title:
      'Can you imagine controlling the public narrative with your own voice?',
    subheadline:
      'Founder-led marketing for $10M+ companies. A fully produced podcast, built as a full solution, down to the studio if you need one.',
    body: 'Podcast is leader-led marketing. You are the company. You should be talking to people, bringing hype and setting the tone, not waiting for a press cycle to tell your story for you. The best way a CEO can be working is through the voice. We build the show, produce every episode, cut it into content for every channel, and put it on a stage you own. Now can you see it? Your voice, in their ears, every week.',
    points: items(
      [
        'Full solution.',
        'Strategy, studio, recording, editing, clips, distribution.',
      ],
      ['You only show up.', 'We handle everything around the mic.'],
      ['You own it.', 'The show, the feed and the assets.']
    ),
    actions: [
      ...CALL_TEXT_EMAIL,
      go('See what’s included', '#included'),
      { kind: 'price' },
    ],
  },
  {
    blockType: 'salesSection',
    anchor: 'vision',
    title: 'The best way a CEO can work is through the voice.',
    subheadline:
      'Imagine leading culture, recruiting, investor relations and new business from one chair.',
    body: join(
      'A LinkedIn post is not a narrative. A press release is not a relationship. Most leaders at your size are invisible to the people who matter most: the customers deciding whether to trust you, the hires deciding whether to join you, and the investors deciding what your company is worth.',
      'Stock value is perception. If nobody’s hyped about your business, nobody’s telling your story, and somebody else will tell it for you. If you are a publicly traded company, you should be talking, bringing hype and setting the mood. Get radically transparent and people will trust you.',
      'A podcast is the founder-led opportunity to lead with your voice: an hour of how you actually think, in your own words, without a filter between you and your market.'
    ),
    groups: [
      {
        heading: 'From the chair',
        style: 'cards',
        items: items(
          [
            'New business.',
            'Prospects hear how you think before they ever take the meeting.',
          ],
          [
            'Leading the culture.',
            'Your team hears the mission from you, not from a memo.',
          ],
          [
            'Recruiting.',
            'The people you want to hire hear the leader they’d be working for.',
          ],
          [
            'Setting the record straight.',
            'Take responsibility for the success of the company and broadcast it.',
          ],
          [
            'Answering the questions.',
            'Support issues, customer questions and investor questions get answered on air. “Put those in the comments. We’ll address them this week.”',
          ]
        ),
      },
    ],
    closing: 'Now can you see it? You take control of the conversation.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'included',
    title:
      'A show as big as your vision. A full solution, including build-outs.',
    subheadline:
      'Can you imagine a podcast built around where you’re taking the company, not around a package?',
    body: 'There’s no fixed package. Custom-scoped: the best solution, not a budget. We deliver full solutions, not a microphone and a wish, and that includes building out the studio itself if your show needs one. You own the message; we build the show around it. Your show can include what your vision calls for, for example:',
    groups: [
      {
        style: 'cards',
        items: items(
          [
            'Show strategy',
            'Format, name, positioning, audience and the story arc of your first season, built on why your company exists.',
          ],
          [
            'Studio build-out',
            'From a recording setup in your office to a full studio built for the show, so recording happens where you already are. Scoped per engagement.',
          ],
          [
            'Brand package',
            'Cover art, intro and outro, music direction and a show trailer, all built to your brand.',
          ],
          [
            'Recording',
            'In studio, remote or on location, wherever your story is best told. Professional crew on every session.',
          ],
          [
            'Episodes',
            'As many as your season calls for: edited, mixed and mastered so you sound like the leader you are.',
          ],
          [
            'Video episodes',
            'Full video versions for YouTube and social, because your audience watches as well as listens.',
          ],
          [
            'Clips and short-form',
            'Short cuts of every episode, sized for every platform, so one conversation feeds your channels for weeks.',
          ],
          [
            'Guest strategy and outreach',
            'Who to bring on, why, and how to get them in the chair. Every guest is a relationship.',
          ],
          [
            'Distribution',
            'Setup on the major podcast platforms, show notes, episode pages and a release calendar.',
          ],
          [
            'Audience questions segment',
            'A standing format for answering customer, support and investor questions on air, shaped to your show.',
          ],
          [
            'A home inside your app',
            'The show can live inside your own mobile application, so you never rent your audience back from a platform.',
          ],
          [
            'Rights and ownership',
            'Same rule as all our work: the show, the feed and the assets are yours.',
          ]
        ),
      },
      {
        heading: 'Where the show can live',
        style: 'tags',
        items: tags(
          'Podcast platforms',
          'YouTube',
          'Social clips',
          'Your website',
          'Your own mobile application',
          'Investor and shareholder updates',
          'Internal team channels'
        ),
      },
    ],
    closing:
      'Now can you see it? The only limit is how far you want the show to go.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    anchor: 'benefits',
    title: 'What a show means for a company your size.',
    subheadline:
      'Can you imagine your market trusting you before they ever take the meeting?',
    body: 'Episodes are what we produce. This is what they’re built to do for you.',
    groups: [
      {
        style: 'cards',
        items: items(
          [
            'Control of the public narrative.',
            'You set the story about your company, instead of reacting to the one being told about it.',
          ],
          [
            'Authority you earn out loud.',
            'An hour of your thinking does what no brochure can. Your market hears your conviction and starts quoting you.',
          ],
          [
            'A warmer pipeline.',
            'Prospects arrive having heard how you think, so sales conversations start further along.',
          ],
          [
            'Door-opening guest seats.',
            'Inviting the people you want to know is the most natural business development there is.',
          ],
          [
            'Investor relations with a human voice.',
            'Investors hear the leader, not just the filings. A public company that gets radically transparent gives people a reason to trust it. Your advisors review anything investor rules cover.',
          ],
          [
            'Culture that recruits and retains.',
            'Great people want to work for leaders with a mission they can hear. Your show becomes your best job description, and a reason your team stays, which cuts the cost of turnover.',
          ],
          [
            'Down-to-earth connection.',
            'It sounds like a person, not a press release. Human connection is the thing a company your size loses first, and the thing a show gives back.',
          ],
          [
            'Support in public, solved once.',
            'Answer the question on air once and every customer with the same question hears it. Fewer tickets, more trust.',
          ],
          [
            'A content engine that compounds.',
            'Every episode becomes clips, posts, articles and updates. One conversation feeds every channel.',
          ],
          [
            'All your content in one place.',
            'Episodes, clips and updates live together, and inside your own app if you have one.',
          ]
        ),
      },
    ],
    note: NO_GUARANTEE,
    closing:
      'Now can you see it? The mic is not a side project. It’s how the leader works.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    anchor: 'process',
    title: 'From first idea to first episode.',
    subheadline:
      'Imagine a show where your only job is to show up and say what you believe.',
    groups: [
      {
        style: 'steps',
        items: items(
          [
            'Story session',
            'We find your show’s spine: the mission, the questions your market is asking, the fights worth having, and why your company exists. Everything is built on that.',
          ],
          [
            'Show blueprint',
            'Format, length, cadence, season plan, guest list, studio needs and launch date, signed off before anything is produced. Any change after signing becomes its own written addendum.',
          ],
          [
            'Studio and setup',
            'If your show needs a space, we build it out. If it doesn’t, we set up wherever you record best.',
          ],
          [
            'Brand and trailer',
            'Your show gets its look, its sound and a trailer to announce it.',
          ],
          [
            'Record',
            'You talk. We run the session, the crew and everything around you.',
          ],
          [
            'Produce and review',
            'Edits, video, clips and show notes. You mark what’s wrong, what must change and what perfect looks like. We refine until it’s right.',
          ],
          [
            'Launch',
            'The first episodes, trailer and clips go live on a release calendar built to give the launch runway to build hype.',
          ],
          [
            'Handover and next season',
            'The feed, accounts and assets are yours. We stay available for the next season or the next build.',
          ]
        ),
      },
      {
        heading: 'What we ask of you',
        style: 'panel',
        intro:
          'Your time in the chair, your honest point of view, and a fast yes or no at review. That’s it.',
      },
    ],
    note: 'Your blueprint sets the exact dates, from kickoff to the first episode live, before production starts.',
    closing: 'See yourself behind the mic? You’re closer than you think.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'proof',
    title: 'Proof, not promises.',
    subheadline:
      'Can you imagine a team willing to leave this space blank rather than fake it?',
    body: 'We’ll show you real shows and real numbers when they’re approved to share, and nothing before that. If you have any doubt, ask for another exhibit and we’ll put it on the table.',
    closing:
      'Now can you see it? That standard of honesty is the same one we’ll bring to your show.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'fit',
    title: 'For leaders with something to say.',
    subheadline:
      'Imagine the founder or CEO built for the mic. Recognize them?',
    groups: [
      {
        heading: 'This is for you if',
        style: 'yes',
        items: items(
          [
            'You’re the founder or CEO of a company doing $10M+ a year, and you have a point of view your industry needs to hear.',
          ],
          [
            'You want control of the public narrative, including culture, recruiting and investor relations.',
          ],
          [
            'You’re public, or planning to be, and you know you should be talking.',
          ],
          [
            'Your team, your customers or your shareholders keep asking the same questions, and you’d rather answer them once, out loud.',
          ],
          ['You want trust at scale with buyers, partners and future hires.'],
          [
            'You can commit to showing up and recording. We’ll size the commitment together.',
          ]
        ),
      },
      {
        heading: 'This isn’t for you if',
        style: 'no',
        items: items(
          ['You want a show with no host time from you.'],
          ['You expect overnight downloads. Shows build trust over seasons.'],
          [
            'You want a script read by someone else. This only works in your voice.',
          ],
          [
            'You’re shopping for the cheapest show that fits a budget. We pride ourselves on being the most expensive so that price is no longer the problem.',
          ]
        ),
      },
    ],
    closing: 'Did you just see yourself? Then you’re ready.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'objections',
    anchor: 'questions',
    title: 'Is this what you’re thinking?',
    subheadline:
      'Can you imagine getting every answer before you even ask? Start here.',
    items: [
      { question: '“We can get a podcast cheaper.”', answer: CHEAPER },
      {
        question: '“How much is it?”',
        answer:
          'Every show is custom-scoped to the show you want, including full studio build-outs. Use Get a Price, tell us the intent, and we’ll give you the number.',
      },
      {
        question: '“I don’t have time to host a show.”',
        answer:
          'Agreed. Your time is the most expensive thing in the company. That’s why your only job is to show up and talk. We handle the studio, the crew, the editing, the clips and the distribution. And the best way a CEO can be working is through the voice.',
      },
      {
        question: '“What is founder-led marketing?”',
        answer:
          'You lead with your voice. You control the public narrative. You talk to customers, hires and investors from the same chair.',
      },
      {
        question: '“I’m not comfortable on camera.”',
        answer:
          'Most leaders aren’t, at first. We run the sessions, shape the format around how you talk best, and edit so you sound like the leader you already are.',
      },
      {
        question: '“We’re a public company. Can we really talk like this?”',
        answer:
          'You should be talking. Get radically transparent and people will trust you. We plan the show with your team, and your legal and investor-relations advisors review what needs review.',
      },
      {
        question: '“Nobody will listen.”',
        answer:
          'Downloads aren’t the first goal. The right people are: your customers, your team, your future hires and your investors. They’re already looking for you. Shows build trust over seasons.',
      },
      {
        question: '“Can the show live in our app?”',
        answer:
          'Yes. That’s the point of owning the channel: the podcast goes in your own mobile application, and you take control of the conversation.',
      },
      {
        question:
          '“I need to think about it / we don’t make decisions overnight.”',
        answer:
          'How long until you want the first episode live? If it’s six weeks, and we like nine or twelve weeks of runway to build the hype, then we need to get started, correct?',
      },
      {
        question:
          '“I have to get my partner, legal, my accountant or the board involved.”',
        answer:
          'Good. Bring them in. Are they available now? We’ll have ready what each of them needs to see.',
      },
      {
        question: '“Who owns the show?”',
        answer:
          'You do. The feed, the accounts, the recordings and the assets.',
      },
      {
        question: '“This is missing something.”',
        answer:
          'Is your objection that this is missing something? Tell us what. If it’s on this page, we’ll point to it. If it isn’t, we’ll say so.',
      },
    ],
    closing: STILL_SELLING,
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    closingStyle: true,
    title: 'Hear it yet? Then call while you’re here.',
    subheadline: 'You’re already on the website. I can walk you through it.',
    body: 'One conversation to shape your show, scoped to your ambition. If all of this is true, is there any reason we shouldn’t get started right now? Call, text or email, and it comes straight to us.',
    closing: 'Now can you hear it? If you’re still here, just do it already.',
    actions: CALL_TEXT_EMAIL,
  },
]

// ─── Launch Content Gallery ─────────────────────────────────────────────────

const contentGallery: Blocks = [
  {
    blockType: 'salesHero',
    title:
      'Can you imagine a launch with enough content to make the hype feel inevitable?',
    subheadline:
      'A launch content gallery for $10M+ companies. Documentary, series, reels, event, community, and the library to carry it.',
    body: 'You have the infrastructure and the capital. We bring the talent, the hunger, the ambition and the courage, and then we work together. We figure out what your launch actually needs, then bring in professionals to execute and create loads of content: a documentary, a YouTube series, reels, an event, a community, all shot, cut and scheduled before the day arrives. Now can you see it? The countdown has a library behind it.',
    points: items(
      ['Scoped to the moment.', 'No shot count on a price sheet.'],
      [
        'Professionals on every frame.',
        'Specialists brought in for every format.',
      ],
      ['You own the work.', 'Usage rights and assets transfer to you.']
    ),
    actions: [
      ...CALL_TEXT_EMAIL,
      go('See what’s included', '#included'),
      { kind: 'price' },
    ],
  },
  {
    blockType: 'salesSection',
    anchor: 'vision',
    title: 'Big launches die on small content.',
    subheadline:
      'Imagine spending years on the product and weeks on the story. Most companies do.',
    body: join(
      'A new product, location, brand or round of funding deserves more than three stock photos and a press release. Launches win on story: the why, the people, the moment. Without a deep library of real content, the launch fades after a week and the attention you paid for goes to someone else.',
      'Hype isn’t luck. It’s a coordinated effort, built on a calendar, with something new to show every day of the countdown. Commerce is a byproduct of hype. If launch is in six weeks, and we like to run a launch at nine or twelve weeks so we can build enough hype, the time to start is now, not after one more meeting.'
    ),
    groups: [
      {
        heading: 'The symphony',
        style: 'statements',
        items: items(
          [
            'One conductor.',
            'One story, one calendar, every asset playing its part at the right moment.',
          ],
          [
            'Every instrument.',
            'Film, photo, series, reels, event and community, coordinated instead of competing.',
          ],
          [
            'Everybody wins when it works.',
            'When the symphony plays, the launch sells.',
          ]
        ),
      },
    ],
    closing:
      'Now can you see it? The library has to exist before the day arrives.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'included',
    title: 'A library as big as the moment.',
    subheadline:
      'Can you imagine a launch library scoped to the size of your launch, not a shot count on a price sheet?',
    body: 'There’s no fixed package. Custom-scoped to the launch: the best solution, not a budget. We figure out what your launch is, then build the content to match it. Your gallery can include what your launch calls for, for example:',
    groups: [
      {
        heading: 'Formats',
        style: 'cards',
        items: items(
          [
            'Documentary',
            'The story behind the launch: the people, the build, the stakes. Long-form, made to be watched.',
          ],
          [
            'YouTube series',
            'Episodes that carry the countdown, so the audience comes back for the next one, like game one, game two, game three of a season.',
          ],
          [
            'Reels and short-form',
            'Clips for every platform you launch on, built to keep the feed full every day of the countdown.',
          ],
          [
            'Launch event',
            'The moment itself, planned and captured, so the day becomes content for months. Scoped per engagement.',
          ],
          [
            'Launch community',
            'A group built for the launch, where your earliest fans gather, share and bring others in.',
          ]
        ),
      },
      {
        heading: 'Deliverables',
        style: 'cards',
        items: items(
          [
            'Launch story',
            'The narrative arc of the launch, built on why it matters and to whom.',
          ],
          [
            'Shot plan',
            'Story arc, shot list, locations, talent and schedule, mapped to every asset we’ll capture.',
          ],
          [
            'Shoot days',
            'As many as your story needs, in studio, on site or on location.',
          ],
          [
            'Professional crew',
            'Directors, shooters, editors and specialists brought in for each format. We pay professionals well, so they bring their best work to your launch.',
          ],
          [
            'Brand photography',
            'Product, people and place, at whatever depth your launch calls for.',
          ],
          [
            'Hero film',
            'A long-form launch video that carries the whole story.',
          ],
          [
            'Edit and finishing',
            'Color, sound, captions and cutdowns for every platform.',
          ],
          [
            'Launch calendar',
            'When and where each asset goes live, from first teaser to launch day and beyond.',
          ],
          [
            'Organized gallery',
            'Every asset tagged, sized per platform and ready for sales, PR, partners and recruiting.',
          ],
          ['Rights and ownership', 'You own the work.']
        ),
      },
    ],
    closing:
      'Now can you see it? The only limit is how big the launch should feel.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    anchor: 'payback',
    title: 'What a launch library means for a company your size.',
    subheadline:
      'Can you imagine a launch that keeps paying off long after launch day?',
    body: 'Files are what we deliver. This is what they’re built to do for you.',
    groups: [
      {
        style: 'cards',
        items: items(
          [
            'A launch that looks like a category leader.',
            'Premium, consistent content tells the market you meant this move.',
          ],
          [
            'Hype that builds instead of spikes.',
            'Something new every day of the countdown, so attention grows toward the day instead of peaking on the announcement.',
          ],
          [
            'Momentum past week one.',
            'A deep library keeps the story fresh across your calendar, so attention doesn’t fade after launch day.',
          ],
          [
            'Speed across every team.',
            'Sales, PR, partners and recruiting all pull from one approved library. Nobody waits on assets, and nobody goes off-brand.',
          ],
          [
            'Pipeline-ready proof.',
            'Real footage of your product, people and place gives your sales team something stronger than a slide deck.',
          ],
          [
            'A community that sells for you.',
            'Early fans gathered in one place become the people who bring the next wave.',
          ],
          [
            'Culture on camera.',
            'Your team sees the launch they built, and future hires see a company worth joining.',
          ],
          [
            'Brand equity that compounds.',
            'Owned, organized content keeps working in campaigns, decks and investor materials for years.',
          ]
        ),
      },
      {
        heading: 'Payback, illustrated',
        style: 'panel',
        intro:
          'Example only, with your numbers: put what the launch is worth (a sellout, or an equal milestone) beside what the gallery is scoped at. The gap between them is the point of the conversation, not a promise. Break-even is the gallery’s cost divided by what one sale is worth. We run your real numbers when we talk.',
      },
    ],
    note: `Illustrative example, not a projection. ${NO_GUARANTEE}`,
    closing: 'Now can you see it? One launch, built to echo.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    anchor: 'process',
    title: 'From countdown to liftoff.',
    subheadline:
      'Imagine walking into launch day with everything already shot, cut and scheduled.',
    groups: [
      {
        style: 'steps',
        items: items(
          [
            'Story session',
            'We find what makes this launch matter, and to whom: the why, the people and the moment worth capturing.',
          ],
          [
            'Format and scope',
            'We decide what the launch needs: documentary, series, reels, event, community, or all of it. Scope, milestones and launch date are signed off in writing. Any change after signing becomes its own addendum.',
          ],
          [
            'Shot plan and crew',
            'Story arc, shot list, locations, talent and schedule, with the right professionals brought in for each format.',
          ],
          [
            'Shoot',
            'The crew captures it, on the days and locations scoped to your launch.',
          ],
          [
            'Edit and review',
            'Cuts, photos and clips come back to you. You mark what’s wrong, what must change and what perfect looks like. We refine it.',
          ],
          [
            'Countdown',
            'Assets roll out on the launch calendar, building the hype day by day.',
          ],
          [
            'Launch day',
            'The event, the hero film and the full push, captured as it happens.',
          ],
          [
            'Deliver and hand over',
            'The full gallery, organized and yours, ready to keep working after the launch.',
          ]
        ),
      },
    ],
    note: 'Our standard is nine to twelve weeks of runway before a launch so the hype can build. Your scope sets the exact dates, from kickoff to gallery delivery.',
    closing: 'See your launch day yet? It’s built backward from here.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'proof',
    title: 'Real frames only.',
    subheadline:
      'Can you imagine a portfolio with nothing staged for the sales pitch?',
    body: 'We show approved client work and nothing else. If you have any doubt, ask for another exhibit and we’ll put it on the table.',
    closing: 'Now can you see it? Your launch, held to that bar.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'fit',
    title: 'For companies about to make noise.',
    subheadline:
      'Imagine the company on the edge of its biggest moment. Is that you?',
    groups: [
      {
        heading: 'This is for you if',
        style: 'yes',
        items: items(
          [
            'You’re doing $10M+ a year and launching a product, location, rebrand, event or major milestone.',
          ],
          ['You want a launch that tells a story, not just an announcement.'],
          ['You have a date on the calendar, or you’re about to set one.'],
          ['You want attention, hype, views and reach sized to the moment.'],
          [
            'You have the infrastructure and the capital, and you want the talent and the hunger to match.',
          ],
          [
            'You want content your sales, PR and recruiting teams can use long after launch day.',
          ]
        ),
      },
      {
        heading: 'This isn’t for you if',
        style: 'no',
        items: items(
          ['You need a few headshots. That’s a different job.'],
          [
            'You want one video and a hope. This is a coordinated launch, not a single asset.',
          ],
          [
            'Your launch is next week and you want it to feel like a season. Hype needs runway.',
          ],
          [
            'You want the cheapest content that fits a budget. We pride ourselves on being the most expensive so that price is no longer the problem.',
          ]
        ),
      },
    ],
    closing: 'Recognize your next move? Then let’s plan it.',
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'objections',
    anchor: 'questions',
    title: 'Is this what you’re thinking?',
    subheadline:
      'Can you imagine getting every answer before you even ask? Start here.',
    items: [
      {
        question: '“What is a content gallery for a launch?”',
        answer:
          'A full content solution for a launch: documentary, series, reels, event and community, scoped to what that launch needs, and organized into one library you own.',
      },
      { question: '“We can get content cheaper.”', answer: CHEAPER },
      {
        question: '“How much is it?”',
        answer:
          'It’s custom-scoped to the launch. Use Get a Price, tell us the intent and the date, and we’ll give you the number.',
      },
      {
        question: '“We already have an in-house content team.”',
        answer:
          'Good. They know your brand. We bring the specialists, the crew and the coordination for a launch-sized push, and your team gets a library to pull from for months.',
      },
      {
        question: '“We just need a few videos.”',
        answer:
          'Then this probably isn’t the right fit, and that’s fine. A launch gallery is for a moment that deserves a coordinated effort, not a single asset.',
      },
      {
        question: '“Is it worth it?”',
        answer:
          'Run the launch math with your numbers: what the launch is worth against what the gallery costs. If the launch is the right one, the solution should be worth it. We run it with you when we talk.',
      },
      {
        question:
          '“I need to think about it / we don’t make decisions overnight.”',
        answer:
          'How long until launch? If it’s six weeks, and we try to run twelve so the hype can build, we need to get started, correct?',
      },
      {
        question:
          '“I have to get my partner, legal, my accountant or the board involved.”',
        answer:
          'Good. Bring them in. Are they available now? We’ll have ready what each of them needs to see, including the launch math.',
      },
      {
        question: '“Who owns the content?”',
        answer: `You do. The footage, photos, films and assets. ${AGREEMENT}`,
      },
      {
        question: '“Can you guarantee the launch sells out?”',
        answer:
          'No. Nobody honestly can. What we put in writing is the work: what we capture, what we deliver and when. Then we put everything we have behind the launch.',
      },
      {
        question: '“This is missing something.”',
        answer:
          'Is your objection that this is missing something? Tell us what. If it’s on this page, we’ll point to it. If it isn’t, we’ll say so.',
      },
    ],
    closing: STILL_SELLING,
    actions: WITH_PRICE,
  },
  {
    blockType: 'salesSection',
    closingStyle: true,
    title: 'The countdown starts while you’re here.',
    subheadline:
      'You’re already on the website. Call while you’re here. I can walk you through it.',
    body: 'Tell us how big this launch should be, and we’ll scope the library to match. If all of this is true, is there any reason we shouldn’t get started right now? Call, text or email, and it comes straight to us.',
    closing:
      'Now can you see your launch? If you’re still here, just do it already.',
    actions: CALL_TEXT_EMAIL,
  },
]

// ─── Offers ─────────────────────────────────────────────────────────────────

const offerCard = (
  topic: string,
  href: string,
  explore: string,
  card: {
    badge?: string
    what: string
    who: string
    deliverables: string[]
    outcomes: string
    persuasion: string
  }
) => ({
  blockType: 'salesSection' as const,
  anchor: href.slice(1),
  topic,
  ...(card.badge && { eyebrow: card.badge }),
  title: topic,
  subheadline: card.persuasion,
  body: card.what,
  groups: [
    { heading: 'Who it’s for', style: 'panel' as const, intro: card.who },
    {
      heading: 'Key deliverables',
      style: 'list' as const,
      items: card.deliverables.map((title) => ({ title })),
    },
    {
      heading: 'Outcomes it’s built for',
      style: 'panel' as const,
      intro: card.outcomes,
    },
  ],
  actions: [go(explore, href), { kind: 'price' as const }],
})

const offers: Blocks = [
  {
    blockType: 'salesHero',
    title: 'Here’s our offers.',
    subheadline:
      'Three offers for $10M+ companies. They stand alone. Scoped by your ambition, not by a package.',
    body: 'Can you imagine walking into a showroom, seeing a little about each offer, and then stepping into the one that is yours? What makes it real is simple: we only sell three things, and each one stands on its own. An app you own. A founder-led show. A gallery for a launch. We don’t sell tiers, and we don’t sell software. We sell a customer experience, a solution that actually competes. We ask how far you want to go, then build the best solution to get you there, not the one that fits a budget. If this is the right product, is the solution worth it? Now can you see which one comes first?',
    points: items(
      [
        'Mobile Application (our lead offer)',
        'Own the platform, the data and the direct line to your customer.',
      ],
      [
        'Podcast',
        'Leader-led marketing. Control the public narrative with your own voice.',
      ],
      [
        'Launch Content Gallery',
        'The documentary, series, reels, event and community that make a launch land.',
      ]
    ),
    actions: [
      ...CALL_TEXT_EMAIL,
      go('Compare the offers', '#compare'),
      { kind: 'price' },
    ],
  },
  {
    blockType: 'salesSection',
    anchor: 'showroom',
    title: 'A showroom, not a discount rack.',
    subheadline:
      'Imagine starting with the move closest to your next milestone, at whatever scale your vision demands.',
    body: 'Every offer is custom-scoped. What goes inside is shaped by your ambition. No price tags on a vision: Get a Price, tell us the intent, and we’ll give you the number.',
  },
  offerCard('Mobile Application', '/mobile-application', 'Explore the app', {
    badge: 'Our lead offer',
    what: 'A custom mobile application for iPhone, Android or both, built around your story and owned by you: the platform, the hosting, the data and the licensing rights. Not another rented CRM. Not a website squeezed onto a phone.',
    who: '$10M+ companies whose customers come back again and again, who are tired of renting the relationship from a platform, and who are ready to own the channel. Public companies ready to get radically transparent and put hype back in the business.',
    deliverables: [
      'Story and product strategy',
      'UX and interface design, with clickable screens before the build',
      'The app itself: accounts, booking, payments, push notifications, loyalty, community, content feeds and a CRM you own, as your vision calls for',
      'One integrated stack, connected to the systems you already run, in a database you own',
      'App store launch: listings, screenshots and store copy that tell your story',
      'Handover of rights, data, accounts and assets',
    ],
    outcomes:
      'A direct line to your customer, one tap away; data in your house; one channel that speaks to customers, investors and future hires at once; payback you can work out with your own numbers.',
    persuasion: 'Own the platform, not another rented CRM.',
  }),
  offerCard('Podcast', '/podcast', 'Explore the podcast', {
    what: 'Leader-led marketing. A fully produced show built as a full solution, including podcast build-outs: strategy, brand, studio, recording, episodes, video, clips, distribution and guests.',
    who: 'Founders and CEOs of $10M+ companies with something to say, who want control of the public narrative, and who want one channel for new business, culture, recruiting and investor relations.',
    deliverables: [
      'Show strategy, format and the story arc of your first season',
      'Brand package: cover art, intro and outro, trailer',
      'Studio build-out, or recording remote and on location',
      'Edited, mixed and mastered episodes, with full video versions',
      'Short-form clips from every episode',
      'Distribution, show notes and episode pages',
      'Guest strategy and outreach',
      'A home for the show inside your mobile application, if you own one',
    ],
    outcomes:
      'A voice your market trusts before the meeting; a warmer pipeline; a recruiting magnet; a straight record with investors; support and communication in one place.',
    persuasion: 'Control the public narrative with your own voice.',
  }),
  offerCard(
    'Launch Content Gallery',
    '/content-gallery',
    'Explore the gallery',
    {
      what: 'A full content solution for a launch. We figure out what your launch actually needs (a documentary, a YouTube series, reels, an event, a community) and then bring in professionals to execute and create loads of content.',
      who: '$10M+ companies with a launch on the calendar, or a product that needs one: a new product, location, rebrand, funding round or major milestone.',
      deliverables: [
        'Launch story and shot plan, built backward from your date',
        'Shoot days, brand photography, short-form video and a hero film',
        'A documentary for the launch, a YouTube series and reels, as the launch calls for',
        'A launch event, produced and captured',
        'A community built for the launch',
        'A launch calendar and an organized gallery, tagged and sized for every platform',
      ],
      outcomes:
        'A launch that looks like a category leader; enough content to make the hype feel inevitable; momentum past week one; a library your sales, PR and recruiting teams keep using.',
      persuasion: 'Build enough hype before the day arrives.',
    }
  ),
  {
    blockType: 'salesSection',
    title: 'See the one that fits?',
    body: 'Trust that instinct, and don’t shrink it to fit a budget. They stand alone, and they work together: the show can live inside the app, and the launch gallery can feed both.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'offerComparison',
    anchor: 'compare',
    title: 'The details, side by side.',
    subheadline:
      'Imagine making an eight-figure-company decision with every fact on the table. Here they are.',
    columns: [
      { name: 'Mobile Application', badge: 'Lead offer' },
      { name: 'Podcast' },
      { name: 'Launch Content Gallery' },
    ],
    rows: [
      ['Price', 'Custom scope', 'Custom scope', 'Custom scope'],
      [
        'What it is',
        'A custom app your company owns',
        'A leader-led show, fully produced',
        'A full content solution for a launch',
      ],
      [
        'Best for',
        'Owning a direct channel and the data',
        'Founder-led narrative, culture and investor relations',
        'Making a launch land across every screen',
      ],
      [
        'Who it’s for',
        '$10M+ companies with repeat customers',
        'Founders and CEOs with something to say',
        '$10M+ companies with a launch on the calendar',
      ],
      [
        'What it can include',
        'iPhone and/or Android app, accounts, payments, booking, loyalty, community, a CRM you own, store launch',
        'Strategy, brand, studio build-out, episodes, video, clips, distribution, guests, a home in your app',
        'Documentary, YouTube series, reels, photography, hero film, event, community, launch calendar',
      ],
      [
        'Built to strengthen',
        'Retention, owned data, direct revenue, investor trust',
        'Authority, pipeline, recruiting, investor relations',
        'Launch momentum, reach, a library that keeps working',
      ],
      ['How it starts', 'Story session', 'Story session', 'Story session'],
      [
        'Risk handled',
        'Trial first, milestones in escrow',
        'Trial first, milestones in escrow',
        'Trial first, milestones in escrow',
      ],
      [
        'Timeline',
        'Set in your blueprint',
        'Set in your blueprint',
        'Built backward from your launch date',
      ],
      ['Who owns it', 'You', 'You', 'You, with usage rights'],
      [
        'The persuasion',
        'Own the platform, not another rented CRM',
        'Control the public narrative with your voice',
        'Build enough hype before the day arrives',
      ],
    ].map(([label = '', ...cells]) => ({
      label,
      cells: cells.map((text) => ({ text })),
    })),
    note: 'Not a contract. Scope is custom. We don’t guarantee results.',
    actions: WITH_PRICE,
  },
  {
    blockType: 'objections',
    anchor: 'questions',
    title: 'Is this what you’re thinking?',
    subheadline: 'Can you imagine your whole strategy fitting in one tap?',
    items: [
      {
        question: '“There are people who do it cheaper.”',
        answer:
          'I agree. We pride ourselves on being the most expensive so that price is no longer the problem. If price is not a problem for you, it’s not going to be a problem for us either. The question is: if this was the right product, would the solution be worth it to you? Then we never have to talk about the price again.',
      },
      {
        question: '“Why don’t you just list your prices?”',
        answer:
          'Because there’s no package to price. Every build is scoped to your ambition. Tell us the intent with Get a Price, or call, and we’ll give you the number for your build.',
      },
      {
        question: '“We don’t need that software.”',
        answer:
          'We didn’t come here to sell software. We came here to sell a customer experience, a solution that actually competes.',
      },
      {
        question:
          '“I need to think about it / we don’t make decisions overnight.”',
        answer:
          'How long until launch? If it’s six weeks, and our standard is to run a launch at nine or twelve weeks so we can build the hype, then we need to get started.',
      },
      {
        question:
          '“I have to get my spouse / partner / legal / accountant / the board involved.”',
        answer:
          'Good. Bring them in. Are they available now? We’ll have ready what each of them needs to see, including the payback math and the contract terms.',
      },
      {
        question: '“How do payments work?”',
        answer: `Designed to reduce your risk on delivery: a trial first if you want to see the work, and milestone payments held in escrow that release as deliverables are accepted. ${AGREEMENT}`,
      },
      {
        question: '“What if it doesn’t deliver?”',
        answer:
          'The test is not how anyone feels about it. The test is: did we deliver what we agreed, in writing? That’s what releases payment. We don’t guarantee the market’s response. Nobody honestly can.',
      },
      {
        question: '“Who owns what you build?”',
        answer:
          'You do. Licensing rights, data and assets transfer to you. You can trademark it.',
      },
      {
        question: '“Can we start with one and add another later?”',
        answer:
          'Yes. They stand alone. Most companies start with the move closest to their next milestone.',
      },
      {
        question: '“This is missing something.”',
        answer:
          'Is your objection that this is missing something? It’s right here. If it isn’t, ask us, and we’ll tell you straight.',
      },
    ],
    closing: `Now can you see it? Pick yours. We’ll size it together. ${STILL_SELLING}`,
    actions: CALL_TEXT_EMAIL,
  },
]

// ─── About ──────────────────────────────────────────────────────────────────

const about: Blocks = [
  {
    blockType: 'salesHero',
    title: 'Built the hard way. Built to launch.',
    subheadline:
      'Can you imagine failing, rebuilding and coming back stronger, again and again? That’s our story.',
    body: 'About is the story. The most honest version, not a stack of tools. What people should feel here is how raw this company is willing to be, and how much responsibility it will take. Now can you see it? The offers are one tap away. The close is a call.',
    actions: [...CALL_TEXT_EMAIL, go('See the offers', '/offers')],
  },
  {
    // A timeline block, so the phone layout's About app shows it too.
    blockType: 'timeline',
    title: 'Every launch starts with a fall.',
    items: [
      [
        '2009',
        'The pioneering days.',
        'First website coded. Myspace, top friends, GIMP and a 2MP camera. The tools were crude. The instinct to tell a story was already there.',
      ],
      [
        '2019',
        'The first business.',
        'Six years of hustle and law school prep, then the leap. Less tech, more people: a natural communicator, in real life.',
      ],
      [
        '2020',
        'The world shut down.',
        'Every hustle in the book, tried. Then the breakthrough: social media and content marketing could carry a story further than any room.',
      ],
      [
        '2022',
        'Fort Lauderdale.',
        'Moved, launched another marketing company. Instant success, then a hard crash. Back to Michigan and painting, and this time, with marketing behind it, it took off.',
      ],
      [
        'Then',
        'Failure, again.',
        'Big contracts rolling in. Right on the edge of scaling, it broke, because the systems weren’t there. That one was personal.',
      ],
      [
        '2026',
        'Enter HONEST.',
        'A question to an AI: “Go get me some money!” A blunt answer about what to sell. The courage to listen, and to build the systems that were missing.',
      ],
    ].map(([date = '', title = '', description = '']) => ({
      date,
      title,
      description,
    })),
  },
  {
    blockType: 'salesSection',
    anchor: 'story',
    title: 'Every failure was a test flight. HONEST is the launch.',
    subheadline:
      'Imagine the version of you that refuses to quit. We met ours many times.',
    actions: [...CALL_TEXT_EMAIL, go('See what we build', '/offers')],
  },
  {
    blockType: 'bioCards',
    title: 'The crew behind the launch.',
    items: [PEOPLE.dylan, PEOPLE.nafew],
    experienceApproved: false,
  },
  {
    blockType: 'salesSection',
    anchor: 'built',
    title: 'Now can you see who’ll be in the room with you?',
    subheadline: 'People who’ve been where you are, and pushed through.',
    groups: [NAFEW_APPS],
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'salesSection',
    anchor: 'contact',
    title: 'You’re already here. Call while you’re here.',
    subheadline: 'Can you imagine what we’ll build together? Let’s find out.',
    body: join(
      'Tell us your story, your next milestone and the move you’re weighing. We’ll tell you honestly whether we’re the right crew. No form to fill for the close. Call, text, or email — it goes to us, not into a maze.',
      'Call or text +1 (945) 220-9222. Email hello@hnst.marketing.'
    ),
    actions: CALL_TEXT_EMAIL,
  },
  {
    blockType: 'objections',
    title: 'Is this what you’re thinking?',
    items: [
      {
        question: '“There are people who do it cheaper.”',
        answer:
          'I agree. We pride ourselves on being the most expensive so that price is no longer the problem. If price is not a problem for you, it’s not going to be a problem for us either. The question is: if this is the right product, is the solution worth this much to you?',
      },
      {
        question:
          '“I need to think about it / we don’t make decisions overnight.”',
        answer:
          'How long until launch? If it’s six weeks, and we try to run a launch in nine or twelve weeks so we can build the hype, then we need to get started.',
      },
      {
        question:
          '“I have to get my spouse / partner / legal / accountant / the board involved.”',
        answer:
          'Good. Bring them in. We’ll have ready what they need to see — including the payback math.',
      },
      {
        question: '“This is missing something.”',
        answer:
          'Is your objection that this is missing something? It’s right here.',
      },
    ],
    closing: STILL_SELLING,
    actions: CALL_TEXT_EMAIL,
  },
]

// ─── Social media ───────────────────────────────────────────────────────────

const social: Blocks = [
  {
    blockType: 'socialProfile',
    title: 'HONEST Marketing',
    handle: '@hnstmarketing',
    bio: 'Storytelling-driven marketing for companies doing $10M+ a year. Behind the scenes of every app, show and launch we make, as it happens.',
    followLabel: 'Follow on',
    source: 'own',
    postsHeading: 'Posts',
    viewLabel: 'View on Instagram',
    emptyText:
      'The first posts are on their way. Until then, the fastest line to us is a call, a text or an email.',
  },
]

export const highEndPages: readonly {
  slug: string
  title: string
  blocks: Blocks
}[] = [
  {
    slug: 'mobile-application',
    title: 'Mobile Application',
    blocks: mobileApplication,
  },
  { slug: 'podcast', title: 'Podcast', blocks: podcast },
  {
    slug: 'content-gallery',
    title: 'Launch Content Gallery',
    blocks: contentGallery,
  },
  { slug: 'offers', title: 'Offers', blocks: offers },
  { slug: 'about', title: 'About', blocks: about },
  { slug: 'social', title: 'Social media', blocks: social },
]

/** The cinematic homepage's words: Dylan's homepage copy, section by section. */
export const highEndHomepage = {
  hero: {
    eyebrow: 'HONEST MARKETING',
    line1: 'I knew you’d',
    line2: 'show up.',
    lede: 'Good to see you. My name’s Dylan. Here’s the evidence you came for — and the three offers waiting down the page.',
    primaryLabel: 'Call Dylan',
    secondaryLabel: 'See the offers',
  },
  film: {
    title:
      'Can you imagine looking back at this year as the year everything changed?',
    pinnedLine:
      'Every company you admire has an origin story. Yours is being written right now.',
    chapters: [
      {
        label: 'Before',
        body: 'You built something real. Eight figures, a team, a reputation. But the story the market hears is smaller than the company you actually run.',
      },
      {
        label: 'Now',
        body: 'The tools have changed. Attention moved to apps, audio and short-form screens. You know it, and you know your brand hasn’t caught up.',
      },
      {
        label: 'Then',
        body: 'Someone walks in with your story already mapped: who you are, why you fight, where you’re going. And a plan to put it in your customers’ hands, ears and feeds. Now can you see it? That someone is us.',
      },
    ],
  },
  turn: {
    heading: 'We didn’t come here to sell you software.',
    body: 'Can you imagine buying a customer experience instead of another login? We’re not another one-size-fits-all snapshot of Salesforce, Hootsuite, or a licensed CRM. We’re here to help a $10M+ company own the channel, own the data, and take the company horizontal.',
    closing: 'The tool is not the offer. The experience is.',
  },
  platter: {
    eyebrow: 'Everything on a golden platter',
    heading: 'Three offers. They all stand alone.',
    body: 'Can you imagine picking the one vehicle that changes how your market sees you — then sizing it to your ambition? Meet me at the offers.',
    note: 'The show can live inside the app, and the launch gallery can feed both.',
    deliverables: [
      {
        name: 'Mobile Application',
        description: 'Own the channel and the data',
      },
      {
        name: 'Podcast',
        description: 'Your voice, your narrative, your culture',
      },
      {
        name: 'Launch Content Gallery',
        description: 'A full library to make a launch land',
      },
      {
        name: 'Story session',
        description: 'The truth of your company, found',
      },
      { name: 'Blueprint', description: 'Scope, milestones and owners' },
      { name: 'Handover', description: 'Rights, data and assets, yours' },
    ],
  },
  steps: {
    heading: 'From your story to liftoff.',
    note: 'Five steps between where you are and where you’re going.',
    items: [
      {
        title: 'Story session',
        description:
          'We dig until we find the truth of your company: the fight, the mission, the moment that matters.',
      },
      {
        title: 'Blueprint',
        description:
          'We turn that story into a build plan for your app, show or gallery, with scope, milestones and owners.',
      },
      {
        title: 'Build',
        description:
          'Our team produces it, AI-accelerated and human-directed, with you reviewing at every milestone.',
      },
      {
        title: 'Review and refine',
        description:
          'You mark what’s wrong, what must change and what perfect looks like. We revise until it’s right.',
      },
      {
        title: 'Launch and handover',
        description:
          'We ship it, hand it over and transfer ownership of what we built for you.',
      },
    ],
  },
  proof: {
    eyebrow: 'Proof',
    heading: 'We don’t invent proof. We build it.',
    body: 'Can you imagine an agency that refuses to fake a single testimonial? You’re looking at one. This site holds the evidence a serious buyer needs: the products our team has shipped, and client work as it’s approved to share. If we hold our own brand to this standard, imagine what we’ll do with yours.',
    ctaHeading: 'You’re already here. Call while you’re here.',
    ctaLabel: 'Call Dylan',
  },
} satisfies Partial<Homepage>
