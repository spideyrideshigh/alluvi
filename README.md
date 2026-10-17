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

- `data/site.json`: all website content and settings
- `data/orders.json`: orders
- `data/admin.json`: admin password hash
- `public/uploads/`: images

Back up `data/` and `public/uploads/` regularly.

## Going live

1. Host it on any server that runs Node.js 18+ (a VPS, Render, Railway, etc.). It needs a persistent disk, because content and orders are saved as files.
2. Put it behind HTTPS. If it runs behind a proxy or load balancer, start it with `TRUST_PROXY=1`.
3. In the dashboard: set **SEO › Live website address**, your contact email, and replace the placeholder Terms and Privacy pages with reviewed versions.
4. Add the site to Google Search Console and submit `/sitemap.xml`.
5. Orders are saved in the dashboard but no email is sent. To get notified, set a webhook (e.g. Zapier) under **Checkout & shipping**.
