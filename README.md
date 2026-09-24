# Snip

Snip is one in-memory URL-shortening backend with two clients: an Angular web
frontend and a zero-dependency Node CLI. Each layer lives on its own branch in
this repository and is mounted here as a submodule.

## API Contract

| Method | Endpoint | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/api/links` | `{ "url": "https://example.com" }` | Created link with `code`, `url`, `shortUrl`, `hits`, and `createdAt` |
| `GET` | `/api/links` | None | Array of link objects |
| `GET` | `/:code` | None | `302` redirect with a `Location` header; increments `hits` |

Invalid URLs and unknown codes return a JSON error with a non-2xx status.

## Branch Layout

```text
main       aggregator superproject
backend    Bun HTTP server             -> ./backend
frontend   Angular web client          -> ./frontend
cli        CommonJS Node CLI           -> ./cli
bundle     generated release output    -> ./bundle
```

The submodules track their matching branches in the same GitHub repository. The
`bundle` branch is generated output; do not hand-edit it. Rebuild it from the
superproject with `node scripts/build-bundle.mjs`, or add `--push` to publish
the generated bundle and updated main pointer.

## Clone

Use recursive cloning so the three folders are populated:

```bash
git clone --recurse-submodules https://github.com/will-tan-1200/snip-workshop-d1.git
cd snip-workshop-d1
```

A plain clone checks out the superproject but leaves the submodule folders
empty. Populate them afterward with `git submodule update --init --recursive`.

## Run

Start the backend first. It requires Bun and listens on port `3000` by default:

```bash
cd backend
bun server.js
```

In another terminal, install and start the Angular client:

```bash
cd frontend
npm install
npm start
```

In a third terminal, use the CLI. It requires Node 18 or newer; `SNIP_API`
defaults to `http://localhost:3000`:

```bash
cd cli
node cli.js add https://example.com/a-long-url
node cli.js ls
node cli.js open <code>
```

## Update Workflow

Commit and push changes inside the relevant submodule branch first:

```bash
cd frontend
git add .
git commit -m "Update frontend"
git push origin frontend
cd ..
```

Then update and commit the submodule pointer in the superproject:

```bash
git submodule update --remote frontend
git add frontend
git commit -m "Bump frontend submodule"
git push origin main
```

Use the same workflow with `backend` or `cli` in place of `frontend`.