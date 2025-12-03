Deployment checklist — Go live with `https://studygkhub.com`

1) DNS & Hosting
 - Create an A or CNAME record pointing `studygkhub.com` (and `www.studygkhub.com`) to your hosting provider as required.
 - Use a hosting platform that supports Node/Next.js (Vercel, Render, Railway, DigitalOcean App Platform, etc.).
 - Ensure HTTPS/SSL is enabled (Let's Encrypt or managed TLS by host).

2) Environment variables
 - Create `NEXT_PUBLIC_BASE_URL=https://studygkhub.com` in production env.
 - Set DB connection vars: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`.
 - Generate a strong `ADMIN_TOKEN` (random 32+ chars) and set it in production env. Rotating it will invalidate existing admin sessions.

3) Secrets & security
 - Never expose `ADMIN_TOKEN` as `NEXT_PUBLIC_...` or in client JS.
 - Use platform secret store; do not commit secrets.
 - Consider enabling HTTP Strict Transport Security (HSTS) via your host or reverse proxy.

4) Build & deploy
 - Install dependencies and build on the host: `npm install && npm run build && npm start` (or use host's build step).
 - Restart the server after env changes.

5) SEO & verification
 - Ensure `https://studygkhub.com/robots.txt` is reachable (this repo includes one).
 - Confirm `https://studygkhub.com/sitemap.xml` lists your pages and submit it to Google Search Console.
 - Add GA4 or Google Tag Manager snippet to site (optional) and verify in Search Console.

6) Post-deploy checks
 - Visit canonical URLs (question/news pages) and confirm meta tags show correct domain.
 - Test admin login flow (email/password) and verify admin routes are protected.
 - Monitor logs and fix any DB connection errors.

If you want, I can prepare a GitHub Actions workflow for automatic deploys and a short script to rotate `ADMIN_TOKEN` safely.
