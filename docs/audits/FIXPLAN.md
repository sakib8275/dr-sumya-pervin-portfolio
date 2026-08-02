# FIXPLAN.md — Dr. Sumya Pervin Portfolio Remediation

> ## ⚠️ SUPERSEDED — historical record only
>
> The "fully applied" status below was true of the **Express codebase deleted in `7851663`**,
> not of the Cloudflare backend that replaced it. Reading this line as a statement about the
> current system is what allowed four critical post-migration defects to reach production.
>
> **For the current system, read [`AUDIT-ROUND-3.md`](AUDIT-ROUND-3.md).**

## Status: ✅ Round 1 (security/code) and Round 2 (UI/UX) fully applied to the pre-migration codebase. P3 hygiene items remain optional.

```
8afdcf9 fix: UX audit P0/P1 — hero contrast, booking form reliability, keyboard accessibility
4a981ba fix: P2 security — remove patient notes from notification URLs
98ea2a3 fix: P3 code health — add .gitignore
9158c1e fix: P1 data — add demo disclaimer and remove hardcoded PIN hint from UI
40187ef fix: P2 spec drift — align context.md chambers with index.html implementation
70293ad fix: P2 AI pathology — add missing nav-sticky-wrapper and scroll styling
eeaf9b1 fix: P2 data — replace placeholder email with modal trigger button
b213e66 fix: P1 security — remove CMS PIN backdoors (1234, admin)
c531793 fix: P2 data — remove legacy draft for Dr. Isabella Cruz
e2abfa1 chore: initial commit — Dr. Sumya Pervin portfolio v1
```

## Hygiene (P3 — batched, mechanical)

| ID | Change | Files | Verification |
|---|---|---|---|
| F10 | Either make before/after use the same image with different filter, or add comment noting they're demo images | `index.html:190-199` | Visual check |
| F11 | Add `alt` text clarifying testimonial face images are decorative, not actual patients | `index.html:300-303` | a11y audit |
| F12 | Replace cert images with actual certificate photos if available; otherwise note they're placeholders | `index.html:207-218` | Visual check |

## Recommend Not Doing

- **Adding a real backend**: This is outside the scope of a code audit — it's a product decision. The audit flags the risk; the owner decides if they want Firebase, Supabase, or a simple API.
- **Encrypting localStorage**: It's fundamentally insecure — JS running in the same origin can always read it. The right fix is "don't store patient data in localStorage" or "clearly label it as a demo."
