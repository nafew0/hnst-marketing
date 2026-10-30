// DRAFT: Wave 3 Inputs §3 and its referenced S5 steps. Operational labels are draft UI copy.
import type { RequiredDataFromCollectionSlug } from 'payload'

export const wave3Pages: RequiredDataFromCollectionSlug<'pages'>[] = [
  {
    slug: 'how-it-works',
    title: 'A series of questions. Then it’s on us.',
    seo: {
      title: 'A series of questions. Then it’s on us.',
      description:
        'The results depend on your commitment and creativity in answering the questions. Everything after that is our job, until you sign off.',
    },
    blocks: [
      {
        blockType: 'hero',
        title: 'A series of questions. Then it’s on us.',
        description:
          'The results depend on your commitment and creativity in answering the questions. Everything after that is our job, until you sign off.',
        eyebrow: 'How it works',
      },
      {
        blockType: 'processSteps',
        title: 'From your answers to handover',
        items: [
          {
            title: 'Answer the questions',
            description:
              'Answer the questionnaire and upload every marketing asset you can get your hands on. This part runs at your pace.',
          },
          {
            title: 'The bots go to work',
            description:
              'Once your answers are in, our Super Intelligence bot teams take over the execution.',
          },
          {
            title: 'Peer review',
            description:
              "When the assets are ready, you get a Deliverables Peer-Review Sheet. Go through each asset critically: what's wrong, what has to change, what perfect looks like.",
          },
          {
            title: 'Revisions',
            description:
              "We revise every mark and resubmit with a new sheet. Anything you don't flag as work in progress counts as accepted, so treat each draft as if it were the final.",
          },
          {
            title: 'Handover',
            description:
              'Final assets are packaged and delivered, and ownership of everything we created transfers to you.',
          },
        ],
        note: 'Basic DIY is a self-paced course: you run these steps yourself.',
      },
      {
        blockType: 'faqList',
        title: 'Your process questions',
        category: 'process',
      },
      {
        blockType: 'cta',
        title: 'A conversation, first.',
        description: 'Talk through your next step.',
        label: 'Book a call',
        href: '/book',
      },
    ],
    _status: 'draft',
  },
  {
    slug: 'about',
    title: 'Built the hard way.',
    seo: {
      title: 'Built the hard way.',
      description:
        'I’ve lived the struggle this fixes. Here’s how we got here.',
    },
    blocks: [
      {
        blockType: 'hero',
        title: 'Built the hard way.',
        description:
          'I’ve lived the struggle this fixes. Here’s how we got here.',
        eyebrow: 'About HONEST',
      },
      {
        blockType: 'timeline',
        title: 'How we got here',
        items: [
          {
            date: '2009',
            title: 'The pioneering days',
            description:
              'Coded my first website. Myspace, dawg. Top friends, blingy and GIMP were my original content creation tools. My camera was maybe 2MP.',
          },
          {
            date: '2019',
            title: 'My first business',
            description:
              "Six years of hustling and preparing for law school, then I started my first business. I wasn't into tech like I was as a kid. I was an IRL communicator.",
          },
          {
            date: '2020',
            title: 'Covid',
            description:
              'The world shut down. I tried every hustle in the book, until I landed on the brilliance and opportunities of social media and content marketing.',
          },
          {
            date: '2022',
            title: 'Fort Lauderdale',
            description:
              'Moved to Ft. Lauderdale and launched another marketing company. Instant success. Fell straight on its face. Back to Michigan and painting again, and this time, with the help of marketing, it blew up.',
          },
          {
            date: '[Year?]',
            title: 'Failure, again',
            description:
              "Committed to marketing again. Massive contracts coming left and right. Then, right on the brink of scaling, it failed, because the systems weren't there. This time it felt personal.",
          },
          {
            date: '2026',
            title: 'Enter HONEST Marketing',
            description:
              'Grok Bot gets released. I prompt it: "Go get me some money!" Its answer: "You need to be selling marketing packages." It was right.',
          },
        ],
      },
      {
        blockType: 'bioCards',
        title: 'The people behind HONEST',
        items: [
          {
            name: '[Founder name]',
            role: 'Founder',
            body: 'Marketing since the Myspace days. Started and lost marketing companies for lack of systems, then built the ones that were missing. [DRAFT — needs the Founder’s own words.]',
            placeholder: '[DRAFT — Founder photo not supplied]',
          },
          {
            name: '[Co-founder name]',
            role: 'Co-founder',
            body: 'Builds and runs the agents, automation and operations behind HONEST Marketing. [DRAFT — final bio not supplied.]',
            placeholder: '[DRAFT — Co-founder photo not supplied]',
          },
        ],
        experienceApproved: false,
        experienceLabel: '',
      },
      {
        blockType: 'cta',
        title: 'A conversation, first.',
        description: 'Talk through your next step.',
        label: 'Book a call',
        href: '/book',
      },
    ],
    _status: 'draft',
  },
  {
    slug: 'proof',
    title: 'Client zero: HONEST Marketing itself.',
    seo: {
      title: 'Client zero: HONEST Marketing itself.',
      description:
        'We don’t have testimonials to show you yet, and we won’t make any up. So here’s our own system, with private details blurred.',
    },
    blocks: [
      {
        blockType: 'hero',
        title: 'Client zero: HONEST Marketing itself.',
        description:
          'We don’t have testimonials to show you yet, and we won’t make any up. So here’s our own system, with private details blurred.',
        eyebrow: 'Proof',
      },
      {
        blockType: 'proofGallery',
        title: 'Our own working system',
        closeLabel: 'Close image',
        openLabel: 'Open screenshot',
        items: [
          {
            title: 'Notion: HONEST Marketing Hub',
            caption: 'The hub everything runs from.',
            placeholder: '[DRAFT — real screenshot not supplied]',
          },
          {
            title: 'Notion: Brand Bible',
            caption: 'Our brand, documented.',
            placeholder: '[DRAFT — real screenshot not supplied]',
          },
          {
            title: 'Notion: Research Lab',
            caption: 'Our market, researched.',
            placeholder: '[DRAFT — real screenshot not supplied]',
          },
          {
            title: 'Notion: a Content calendar view',
            caption: 'Planned across platforms.',
            placeholder: '[DRAFT — real screenshot not supplied]',
          },
          {
            title: 'GoHighLevel: "Website Leads" pipeline',
            caption: 'Where leads from this site land.',
            placeholder: '[DRAFT — real screenshot not supplied]',
          },
          {
            title: 'GoHighLevel: Discovery Call calendar',
            caption: 'Where your call gets booked.',
            placeholder: '[DRAFT — real screenshot not supplied]',
          },
        ],
      },
      {
        blockType: 'research',
        title: 'Where we’re building first.',
        body: 'Of 48 South Florida municipalities, Fort Lauderdale scores 83.8 on our HONEST Marketing Opportunity Score, ahead of Boca Raton (80.9) and Coral Gables (79.3).',
        attribution:
          'Source: HONEST Market Research Lab. The score is HONEST’s own measure.',
      },
      {
        blockType: 'cta',
        title: 'A conversation, first.',
        description: 'Talk through your next step.',
        label: 'Book a call',
        href: '/book',
      },
    ],
    _status: 'draft',
  },
  {
    slug: 'the-honest-marketer',
    title: 'The HONEST Marketer',
    seo: {
      title: 'The HONEST Marketer',
      description: 'A free eBook. Tell us where to send it.',
    },
    blocks: [
      {
        blockType: 'hero',
        title: 'The HONEST Marketer',
        description: 'A free eBook. Tell us where to send it.',
        eyebrow: 'The guide',
      },
      {
        blockType: 'magnet',
        title: 'The HONEST Marketer',
        placeholder: '[DRAFT COVER PLACEHOLDER — finished eBook not supplied]',
        notice:
          '[DRAFT — the eBook and its delivery workflow are not available yet. Delivery will be by email.]',
        bullets: [
          {
            text: 'How marketing changed, and what the new way looks like',
          },
          {
            text: 'What a complete marketing system includes',
          },
          {
            text: 'Where to start with your own',
          },
        ],
        copy: {
          firstName: 'First name',
          email: 'Email',
          phone: 'Phone (optional, international format)',
          consentLegend: 'Stay in touch (optional)',
          submit: 'Send me the guide',
          pending: 'Sending…',
          success: 'Received',
          retry: 'Try again',
          message: 'Tell us about your business',
          unavailable: 'This form is awaiting approval.',
        },
      },
    ],
    _status: 'draft',
  },
  {
    slug: 'book',
    title: 'Book a discovery call',
    seo: {
      title: 'Book a discovery call',
      description: 'Choose an available time in your timezone.',
    },
    blocks: [
      {
        blockType: 'hero',
        title: 'Let’s talk about what’s next.',
        description: 'Choose an available time in your timezone.',
        eyebrow: 'Book a call',
      },
      {
        blockType: 'booking',
        title: 'Your discovery call',
        copy: {
          timezone: 'Your timezone',
          previousMonth: 'Previous month',
          nextMonth: 'Next month',
          chooseDay: 'Choose an available day',
          chooseTime: 'Choose a time',
          loading: 'Loading availability…',
          emptySlots:
            'No times are available in this range. Try the next month.',
          unavailable: 'Availability is temporarily unavailable.',
          fallbackTitle: 'HONEST Discovery Call calendar',
          fallbackUnavailable:
            'The fallback calendar is not available. Retry availability here.',
          retry: 'Try again',
          name: 'Name',
          email: 'Email',
          phone: 'Phone (optional, international format)',
          questions: 'Before we meet',
          consentLegend: 'Stay in touch (optional)',
          submit: 'Request this time',
          pending: 'Requesting…',
          success: 'Request received',
          error:
            'We could not confirm the result. Retry this request before booking elsewhere.',
          invalid: 'Please check the highlighted details.',
          chooseSlot: 'Choose an available time first.',
          slotTaken: 'Just taken, pick another time',
          queued:
            'Your booking request is queued. This is not a confirmed appointment. Wait for confirmation by email before making plans.',
          confirmed:
            'Your appointment is confirmed. We will also email the details.',
          noReceipt:
            'Check your booking status and email for confirmation. No appointment details are available in this browser.',
          calendarTitle: 'HONEST Marketing Discovery Call',
          download: 'Download ICS',
          google: 'Add to Google Calendar',
          reference: 'Request reference',
        },
      },
    ],
    _status: 'draft',
  },
  {
    slug: 'thanks-magnet',
    title: 'Your guide, by email',
    seo: {
      title: 'Your guide, by email',
      description:
        'Delivery is by email. In this draft preview, the eBook and its delivery workflow are not active yet.',
    },
    blocks: [
      {
        blockType: 'hero',
        title: 'Thank you. Watch your inbox.',
        description:
          'Delivery is by email. In this draft preview, the eBook and its delivery workflow are not active yet.',
        eyebrow: 'The HONEST Marketer',
      },
    ],
    _status: 'draft',
  },
  {
    slug: 'thanks-booking',
    title: 'Your booking status',
    seo: {
      title: 'Your booking status',
      description:
        'A queued request is not a confirmed appointment. Check the status below and watch your email.',
    },
    blocks: [
      {
        blockType: 'hero',
        title: 'Your booking request',
        description:
          'A queued request is not a confirmed appointment. Check the status below and watch your email.',
        eyebrow: 'Your next step',
      },
      {
        blockType: 'bookingReceipt',
        title: 'Booking status',
        copy: {
          timezone: 'Your timezone',
          previousMonth: 'Previous month',
          nextMonth: 'Next month',
          chooseDay: 'Choose an available day',
          chooseTime: 'Choose a time',
          loading: 'Loading availability…',
          emptySlots:
            'No times are available in this range. Try the next month.',
          unavailable: 'Availability is temporarily unavailable.',
          fallbackTitle: 'HONEST Discovery Call calendar',
          fallbackUnavailable:
            'The fallback calendar is not available. Retry availability here.',
          retry: 'Try again',
          name: 'Name',
          email: 'Email',
          phone: 'Phone (optional, international format)',
          questions: 'Before we meet',
          consentLegend: 'Stay in touch (optional)',
          submit: 'Request this time',
          pending: 'Requesting…',
          success: 'Request received',
          error:
            'We could not confirm the result. Retry this request before booking elsewhere.',
          invalid: 'Please check the highlighted details.',
          chooseSlot: 'Choose an available time first.',
          slotTaken: 'Just taken, pick another time',
          queued:
            'Your booking request is queued. This is not a confirmed appointment. Wait for confirmation by email before making plans.',
          confirmed:
            'Your appointment is confirmed. We will also email the details.',
          noReceipt:
            'Check your booking status and email for confirmation. No appointment details are available in this browser.',
          calendarTitle: 'HONEST Marketing Discovery Call',
          download: 'Download ICS',
          google: 'Add to Google Calendar',
          reference: 'Request reference',
        },
      },
    ],
    _status: 'draft',
  },
]

export const wave3Faqs: RequiredDataFromCollectionSlug<'faqs'>[] = [
  {
    category: 'process',
    question: 'How does the process begin?',
    answer:
      'Once payment is accepted, you get the course and your starter assets. You complete the setup and the questionnaire at your own pace. When your answers are in, we take over.',
    order: 0,
    _status: 'draft',
  },
  {
    category: 'ownership',
    question: 'Who owns the finished system?',
    answer:
      'You do. When the final assets are delivered, ownership of everything we created transfers to you, along with the accounts and data we set up for you.',
    order: 1,
    _status: 'draft',
  },
  {
    category: 'pricing',
    question: 'What does each package include?',
    answer:
      'Basic DIY is the self-paced course with 6 bot templates. Executive adds done-for-you delivery, with 13 bot templates and a link-in-bio site. The Founder Package has a 24-page website, 2 funnels and 26 bot templates. Diamond is human-led and in person in Fort Lauderdale. See the comparison table for details.',
    order: 2,
    _status: 'draft',
  },
  {
    category: 'tools',
    question: 'Which tools do I need?',
    answer:
      "Google Workspace ($8.40/month per seat), an X or Grok subscription (about $8–$200/month) and GoHighLevel ($97/month). That's about $115–$310/month, paid directly to those providers and not included in the package price.",
    order: 3,
    _status: 'draft',
  },
  {
    category: 'timeline',
    question: 'When does the delivery window start?',
    answer:
      'After setup, once your answers are in. The absolute maximums are 14–21 days for Executive and 7–14 days for the Founder Package. Diamond is 21–28 days. Basic DIY runs at your own pace. (Decision 8)',
    order: 4,
    _status: 'draft',
  },
  {
    category: 'process',
    question: 'How do revisions work?',
    answer:
      "After each draft, you mark exactly what's wrong, what has to change and what perfect looks like. Anything you don't flag as work in progress counts as accepted. The Founder Package includes 5 rounds and Diamond is unlimited. (Executive: 3, or 3–5? Decision 13)",
    order: 5,
    _status: 'draft',
  },
  {
    category: 'process',
    question: 'How is content reviewed?',
    answer:
      'You review it. Each delivery comes with a Deliverables Peer-Review Sheet, so you can go through every asset critically before anything is final.',
    order: 6,
    _status: 'draft',
  },
  {
    category: 'pricing',
    question: 'Can I upgrade my package?',
    answer:
      "[DECISION NEEDED: no source defines this. Decision 7] There's no financing. Extra items à la carte are available from Executive up.",
    order: 7,
    _status: 'draft',
  },
  {
    category: 'ownership',
    question: 'How is my website handed over?',
    answer:
      "The Founder Package and Diamond include a website; Executive includes a link-in-bio site. Once it's final, it's packaged and delivered with everything else, and ownership transfers to you.",
    order: 8,
    _status: 'draft',
  },
  {
    category: 'process',
    question: 'What support is included?',
    answer:
      'Executive includes our first tier of direct support and 1 free consulting hour. The Founder Package has priority over Executive and 2 free hours. Diamond has our highest priority and a designated team. Basic DIY includes the course only.',
    order: 9,
    _status: 'draft',
  },
]
