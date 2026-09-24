# Snip CLI

A zero-dependency Node.js CLI for the Snip URL shortener. Node 18 or newer is
required for its built-in `fetch`.

## Usage

Set `SNIP_API` to point at a Snip server, or use the default
`http://localhost:3000`:

```bash
snip add https://example.com/a-long-url
snip ls
snip open abc123
```

The `snip`, `snip.cmd`, and `snip.ps1` wrappers run `cli.js` directly on Unix,
Windows Command Prompt, and PowerShell. The `open` command launches the
redirect target in the operating system's default browser.