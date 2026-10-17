# Alluvi Store

A single-product store for the Alluvi Retatrutide Pen, plus an admin dashboard at `/admin`.

## Run it

```bash
npm install
npm start
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin

The first time it starts, it prints an admin password in the terminal. Change it under **Account** in the dashboard.

Forgot the password? Run `npm run reset-password` (or `npm run reset-password -- YourNewPassword`).

To use a different port: `PORT=8080 npm start`.

## What the dashboard manages

| Section | What you can do |
| --- | --- |
| Home | Order stats, recent orders, SEO health score, quick links |
| Orders | View, search and filter orders; set status, tracking number and notes; export to CSV |
| Products | Add, duplicate and delete products. Each has versions (e.g. 20mg / 40mg) with their own price, SKU, stock and photo, plus photos, key facts, info tabs, FAQ, test report and its own **SEO** tab. Also: volume pricing and the shared product page layout |
| Pages | Edit the home page and other pages. Each page has **Content** (sections you can add, edit, hide and reorder), **SEO** (Google and social previews, focus keyword checks, sitemap settings) and **Settings** (title, URL, status, add to menus) tabs |
| SEO | Every page and product in one list, site-wide settings, verification codes, structured data, robots.txt, sitemap.xml, redirects, tracking code |
| Media | Upload images and PDF test reports |
| Settings | **General** (store details, logo, colours, fonts, footer), **Navigation** (header and footer menus), **Checkout & shipping** (shipping methods, discount codes, cart and checkout text), **Announcement & pop-up** |
| Account | Change password, download a backup |

## Where things are stored

On Vercel, everything is stored in Upstash Redis and uploads in Vercel Blob (see below). On your own computer or server:

- `data/site.json`: all website content and settings
- `data/orders.json`: orders
- `data/messages.json`: contact and wholesale enquiries
- `data/admin.json`: admin password hash
- `public/uploads/`: images

Back up `data/` and `public/uploads/` regularly.

## Deploying on Vercel

Vercel can't save files on its own servers, so the store keeps its data in two free add-ons:

1. **Database (required):** in your Vercel project, open **Storage › Create Database › Upstash for Redis**, create a free database and connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
2. **Image uploads (recommended):** **Storage › Create › Blob**, then connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN`.
3. **Admin password:** in **Settings › Environment Variables**, add `ADMIN_PASSWORD` with the password you want for /admin.
4. **Redeploy** (Deployments › ⋯ › Redeploy) so the new settings take effect.

Without the database the site still loads, but orders, messages and admin changes can't be saved, and the admin shows a warning saying so.

## Going live

1. Host it on Vercel (above), or on any server that runs Node.js 18+ with a persistent disk (a VPS, Render, Railway, etc.).
2. Put it behind HTTPS. If it runs behind a proxy or load balancer, start it with `TRUST_PROXY=1`.
3. In the dashboard: set **SEO › Live website address**, your contact email, and replace the placeholder Terms and Privacy pages with reviewed versions.
4. Add the site to Google Search Console and submit `/sitemap.xml`.
5. Orders are saved in the dashboard but no email is sent. To get notified, set a webhook (e.g. Zapier) under **Checkout & shipping**.
