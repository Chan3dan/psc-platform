# Niyukta SEO Setup Guide

This guide covers the practical SEO setup for the Niyukta website.

Important:

- No developer can honestly guarantee rank 1 for keywords like `computer operator` or `loksewa`.
- What we can do is maximize technical SEO, content quality, crawlability, speed, and keyword targeting so the site has a real chance to compete.

## Current SEO foundations already implemented

- Production alias: `https://niyukta.vercel.app`
- Canonical site URL support through app metadata
- `robots.txt`
- `sitemap.xml`
- `manifest.webmanifest`
- Open Graph and Twitter metadata
- JSON-LD structured data on the landing page
- Public exam landing pages at `/exam/[slug]`
- `noindex` for dashboard, admin, auth, and other private surfaces

## 1. Domain strategy

Best practice is to use a real custom domain, not only `niyukta.vercel.app`.

Recommended:

- `niyukta.com`
- `niyukta.com.np`
- `app.niyukta.com`

Why:

- Custom domains build more trust
- Better brand recall
- Better long-term SEO authority
- Easier to use in backlinks, Search Console, and marketing

After adding a custom domain:

1. Add the domain in Vercel.
2. Make it the primary production domain.
3. Update these production env vars:
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_APP_URL`
4. Redeploy production.

## 2. Google Search Console

Set up Google Search Console as soon as possible.

Steps:

1. Open Google Search Console.
2. Add property:
   - `https://niyukta.vercel.app`
   - or your custom domain when ready
3. Verify ownership.
4. Submit sitemap:
   - `https://niyukta.vercel.app/sitemap.xml`
5. Check:
   - indexing status
   - coverage errors
   - mobile usability
   - Core Web Vitals
   - search queries

## 3. Keyword strategy

Target specific intent-based keywords first instead of only broad terms.

Recommended clusters:

- `computer operator preparation nepal`
- `computer operator mock test nepal`
- `loksewa computer operator mcq`
- `loksewa preparation nepal`
- `psc nepal practice questions`
- `computer operator notes pdf`
- `ict loksewa mcq`
- `office assistant preparation nepal`

Use one primary keyword per public page.

## 4. Public SEO pages to create

To rank better, create more public pages that match search intent.

Recommended page ideas:

- `/computer-operator`
- `/loksewa`
- `/loksewa-computer-operator`
- `/office-assistant`
- `/gk`
- `/ict`
- `/computer-fundamentals`
- `/ms-word`
- `/excel`
- `/database-management-system`

Each page should include:

- a unique title
- a unique description
- a real H1
- 600 to 1500 words of useful content
- FAQ section
- internal links to relevant exam pages
- structured data where appropriate

## 5. Content rules for ranking pages

Every SEO page should:

- answer a real user search intent
- include Nepal-specific context
- include exam-specific terminology
- include internal links to notes, mocks, and exams
- avoid duplicate content
- avoid thin content

Good examples:

- syllabus overview
- exam pattern breakdown
- negative marking explanation
- subject-wise preparation tips
- common mistakes
- topic-wise resource map
- mock test strategy

## 6. Metadata checklist

For every public page:

- unique page title
- unique meta description
- canonical URL
- Open Graph title and description
- Twitter card metadata
- keyword alignment with visible page content

Title guidelines:

- keep near 50 to 60 characters when possible
- include brand only when it helps
- include the target phrase naturally

Description guidelines:

- keep near 140 to 160 characters
- explain the page value clearly
- include the target keyword naturally

## 7. Structured data recommendations

Already used:

- `Organization`
- `WebSite`
- `SoftwareApplication`
- `Course` on exam pages

Useful additions for future pages:

- `FAQPage`
- `BreadcrumbList`
- `Article`
- `EducationalOccupationalProgram`

## 8. Internal linking

Strong internal linking improves crawlability and topical relevance.

Recommended:

- landing page links to public exam pages
- public exam pages link to related subjects and future topic pages
- future blog/content pages link back to exam and conversion pages
- footer links to key public SEO pages

Avoid linking search engines into private dashboards for ranking.

## 9. Performance and UX

SEO is also affected by user experience.

Focus on:

- fast LCP
- low layout shift
- responsive mobile layout
- fast route navigation
- working PDFs and notes
- no broken links
- no auth errors on public conversion flow

## 10. Image and file SEO

For images:

- use descriptive filenames
- add alt text where useful
- prefer optimized delivery

For PDFs:

- make sure they open correctly
- use descriptive titles
- organize by exam and subject

If you want PDFs indexed publicly in the future, expose them through public pages intentionally instead of private in-app note links.

## 11. What to do next for stronger rankings

Recommended order:

1. Fix remaining public-facing login/OAuth issues.
2. Add Google Search Console.
3. Add a custom domain.
4. Create 5 to 10 high-quality public keyword pages.
5. Add FAQ sections with structured data.
6. Build backlinks from:
   - education directories
   - Nepali exam communities
   - social profiles
   - blog posts
7. Track impressions and clicks in Search Console every week.

## 12. Realistic ranking expectations

You may rank faster for long-tail keywords such as:

- `computer operator mock test nepal`
- `loksewa computer operator practice`
- `computer operator notes pdf nepal`

Broad keywords like:

- `loksewa`
- `computer operator`

are more competitive and usually require:

- more content
- more backlinks
- more topical authority
- more time

## 13. Maintenance checklist

Review monthly:

- broken links
- sitemap freshness
- metadata quality
- page indexing
- search queries
- low CTR pages
- slow pages

## 14. Deployment checklist after SEO changes

Whenever SEO changes are made:

1. deploy production
2. verify:
   - `/robots.txt`
   - `/sitemap.xml`
   - page title
   - description
   - canonical URL
   - structured data
3. request indexing in Search Console for important new pages

