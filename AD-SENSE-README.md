Short AdSense & ads.txt steps

1) Confirm account/site
- Ensure the domain you're deploying to is added and verified in your AdSense account.
- Wait for AdSense site review/approval — this is controlled by Google (hours–days).

2) ads.txt
- `public/ads.txt` already contains:
  `google.com, pub-4799680224544946, DIRECT, f08c47fec0942fa0`
- Deploy to production so `https://yourdomain/ads.txt` is publicly reachable.

3) Ad units
- Create ad units in your AdSense dashboard and copy the `Ad unit ID` (numeric string).
- Replace `data-ad-slot="1234567890"` in `components/FooterAd.js` with the real ad unit ID.

4) Verify script & meta
- `pages/_app.js` already includes the AdSense script and meta tag for `ca-pub-4799680224544946`.
- Ensure `NEXT_PUBLIC_BASE_URL` (or your canonical domain) matches the domain in AdSense.

5) Deploy and check
- Deploy the site to your production domain.
- Visit `https://yourdomain` and `https://yourdomain/ads.txt`.
- In browser console, check that the AdSense script loads and there are no blocking errors.
- Ads may show after AdSense approves the site and ad units.

6) Testing
- Use incognito/private window and avoid AdBlockers while testing.
- Temporary test ads may not appear until AdSense fully approves your account/domain.

7) SEO & earnings expectations
- Adding AdSense script/ads.txt does not immediately improve SEO. SEO gains come from quality content and time.
- Ads start generating revenue only after impressions/clicks on served ads; this depends on traffic volume and ad fill.

If you want, provide the real `data-ad-slot` value and I will update `components/FooterAd.js` now.