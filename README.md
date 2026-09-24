# Snip backend

Snip is a tiny URL shortener backed by an in-memory `Map`. It requires Bun 1.x
and has no npm dependencies.

## Run

```bash
bun start
```

The server listens on port `3000` by default. Set `PORT`, `BASE_URL`, or
`RAILWAY_PUBLIC_DOMAIN` to configure it. Set `PUBLIC_DIR` to serve a built UI
from the same process; `/` serves `index.html`.

## API

- `POST /api/links` with `{ "url": "https://example.com" }` creates a link.
- `GET /api/links` lists all links.
- `GET /:code` redirects to the original URL and increments its hit count.