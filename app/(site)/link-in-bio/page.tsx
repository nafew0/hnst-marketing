import { PageShell, PageHero } from '@/components/sections/standard/catalog'
import { Button } from '@/components/ui/button'
import { Section, Container } from '@/components/ui/section'
import { getSettings, getPage } from '@/lib/cms/data'
import { pageMetadata } from '@/lib/seo/cms'
export function generateMetadata() {
  return pageMetadata('link-in-bio', 'Links')
}
export default async function LinksPage() {
  const [settings, page] = await Promise.all([
    getSettings(),
    getPage('link-in-bio'),
  ])
  return (
    <PageShell>
      <PageHero title={page?.title ?? 'Your next step starts here.'} />
      <Section>
        <Container className="flex max-w-[700px] flex-col dr-gap-16">
          <Button href="/packages">Explore the packages</Button>
          <Button href="/contact" variant="ghost">
            Start a conversation
          </Button>
          {settings?.socialLinks?.map((link) => (
            <Button key={link.id ?? link.url} href={link.url} variant="ghost">
              {link.label}
            </Button>
          ))}
        </Container>
      </Section>
    </PageShell>
  )
}
