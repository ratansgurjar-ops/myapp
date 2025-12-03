# Study GK App (Next.js + MySQL)

Minimal Next.js app for MCQ questions with admin portal and news ticker.

Environment variables (create `.env.local` in `frontend`):

- `DB_HOST` — MySQL host (e.g., `localhost`)
- `DB_USER` — MySQL user (e.g., `root`)
- `DB_PASS` — MySQL password
- `DB_NAME` — MySQL database name (e.g., `study_gk`)
- `NEXT_PUBLIC_BASE_URL` — your site base URL used for sitemap and canonical tags (e.g., `https://studygkhub.com`)
- `ADMIN_TOKEN` — password/token for admin actions (use a strong secret in production; do NOT expose as `NEXT_PUBLIC_...`)

Install and run (Windows PowerShell):

```powershell
cd "e:/StudyGK Hub/study-gk-app/frontend"
npm install
npm run dev
```

This scaffold includes:
- `lib/db.js` — MySQL connection helper (creates tables automatically)
- `models/question.js`, `models/news.js` — SQL model wrappers
- API routes in `pages/api` for questions and news
- Basic homepage UI and admin page for uploads
 
Database dump
- A simple PowerShell script is provided at `scripts/dump_db.ps1` to create a MySQL dump using credentials from `.env.local`.
	Usage (PowerShell):
	```powershell
	cd frontend
	# full dump (schema + data)
	./scripts/dump_db.ps1

	# schema only
	./scripts/dump_db.ps1 -NoData

	# dump specific tables
	./scripts/dump_db.ps1 -Tables questions,news
	```

Deployment note:
- Set `NEXT_PUBLIC_BASE_URL=https://studygkhub.com` in production environment.
- Rotate `ADMIN_TOKEN` to a strong secret and set it in your hosting provider's secret store (Vercel/Render/Heroku env settings). Do not commit secrets to the repo.
