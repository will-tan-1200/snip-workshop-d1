# Snip Design Language

## Tokens

- **Background:** `#0c0c0e`; **surface:** `#151518`; **surface raised:** `#1c1c20`
- **Text:** `#f7f4f1`; **muted:** `#96939a`; **faint:** `#68656d`
- **Accent:** warm gradient from `#ff8a65` through `#f35d83` to `#b978ff`
- **Font:** `Inter`, `SF Pro Display`, `Segoe UI`, sans-serif
- **Type scale:** eyebrow `0.72rem`, body `1rem`, section title `1.35rem`, hero `clamp(3.5rem, 9vw, 7rem)`
- **Spacing:** 8px base; content padding `clamp(24px, 5vw, 72px)`; section gap `64px`
- **Radii:** input `28px`; cards `24px`; notices `16px`; controls `12px`
- **Borders:** `1px solid rgba(255, 255, 255, 0.10)`; dividers `rgba(255, 255, 255, 0.07)`
- **Shadows:** `0 24px 70px rgba(0, 0, 0, 0.32)`; accent glow uses soft blurred warm gradients

## Snip Mapping

- **Page header:** the hero; centered headline and muted subline with generous vertical space.
- **URL form:** the chat-style input; a large pill surface with the primary action attached on the right.
- **Result and error notices:** compact rounded feedback surfaces using success green or warm red accents.
- **Links table:** a raised, generously rounded card with quiet dividers and high-contrast short links.
