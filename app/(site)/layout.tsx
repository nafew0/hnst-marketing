// First, before any component: this sheet declares the CSS layer order, and a
// component's `@layer components` loaded earlier would flip it, letting Tailwind's
// reset override every component style.
import '@/lib/styles/css/index.css'
import { TransformProvider } from 'hamo'
import type { Metadata, Viewport } from 'next'
import { draftMode } from 'next/headers'
import { type PropsWithChildren, Suspense } from 'react'
import { ReactTempus } from 'tempus/react'

import { PrivacyControls } from '@/components/forms/privacy'
import { DeviceTierProvider } from '@/components/motion/device-tier'
import { Link } from '@/components/ui/link'
import { RealViewport } from '@/components/ui/real-viewport'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { ApiMocks } from '@/lib/contracts/mocks/api-mocks'
import { APP_BASE_URL, env } from '@/lib/env'
import { OptionalFeatures } from '@/lib/features'
import { routeAlternates } from '@/lib/seo/alternates'
import { JsonLd } from '@/lib/seo/json-ld'
import { organizationSchema, websiteSchema } from '@/lib/seo/schemas'
import { SITE } from '@/lib/seo/site'
import { themes } from '@/lib/styles/colors'
import { fontsVariable } from '@/lib/styles/fonts'

const APP_NAME = SITE.name
const APP_DEFAULT_TITLE = SITE.name
const APP_TITLE_TEMPLATE = `%s | ${SITE.name}`
const APP_DESCRIPTION = SITE.description

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  alternates: {
    // Home canonical only: child routes build their own via `routeAlternates`,
    // or inheriting this one canonicalizes the whole site to `/`.
    ...routeAlternates('/'),
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: APP_BASE_URL,
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: APP_DEFAULT_TITLE,
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  authors: [{ name: SITE.name, url: SITE.url }],
}

if (env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
  metadata.other = { 'fb:app_id': env.NEXT_PUBLIC_FACEBOOK_APP_ID }
}

export const viewport: Viewport = {
  // Matches the server-rendered `data-theme="dark"` in this site layout; <Theme>
  // rewrites it per route.
  themeColor: themes.dark.primary,
  colorScheme: 'normal',
}

/**
 * App-wide providers, metadata and analytics for every route except /admin,
 * which sits outside this group so Payload doesn't pull in the rAF loop,
 * toasts, Visual Editing or JSON-LD.
 */
export default async function AppLayout({ children }: PropsWithChildren) {
  const { isEnabled: isDraftMode } = await draftMode()
  return (
    <html
      lang="en"
      dir="ltr"
      className={fontsVariable}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body>
        {/* On every page, not just home: deep pages are landed on directly far more often. */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <Suspense fallback={null}>
          <Link
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-gap focus:left-gap focus:z-9999 focus:rounded-full focus:bg-gold focus:dr-px-16 focus:dr-py-8 focus:text-void focus:ring-2 focus:ring-starlight focus:outline-none"
          >
            Skip to main content
          </Link>
        </Suspense>
        <RealViewport>
          <ToastProvider>
            <TransformProvider>
              {/*
              DO NOT add Header or Footer here.
              They are included in the <Wrapper> component used by each page.
              See: components/layout/wrapper/index.tsx
            */}
              <DeviceTierProvider>{children}</DeviceTierProvider>
            </TransformProvider>
            <ToastViewport />
          </ToastProvider>
        </RealViewport>
        <OptionalFeatures />
        <ApiMocks />
        <PrivacyControls />

        {/* Not patched in draft mode, to avoid conflicts. */}
        <ReactTempus patch={!isDraftMode} />
      </body>
    </html>
  )
}
