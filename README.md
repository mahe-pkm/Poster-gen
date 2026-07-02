# Store Poster Maker

Daily-use grocery poster app built with vanilla HTML/CSS/JS and a small Node/Express backend.

## Run

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment

Copy `.env.example` to `.env.local` and fill what you need.

- `OPENROUTER_API_KEY` stays server-side and is never sent to browser JavaScript.
- `OPENROUTER_IMAGE_MODEL` defaults to `google/gemini-3.1-flash-lite-image` for low-cost demo image generation.
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` enable cloud product/template/image reuse.
- If Supabase is not configured, the app uses `data/store.local.json` plus `public/generated-products`.

## Supabase

Run `supabase/schema.sql` in your Supabase SQL editor, then create a public Storage bucket named `product-images`.

## Workflow

- Add or edit products.
- Generate an image once per product through the backend.
- Reuse the saved `imageUrl` every day unless `Regenerate` is clicked.
- Adjust grid presets or custom rows/columns.
- Save layout changes as the reusable template.
- Export the poster as PNG from the canvas.
