# CyberSafe

**See the destination. Understand the risk. Stay safe.**

A hackathon prototype by **Team X** that helps students and college staff understand a link's potential risk before opening it.

## What it does

CyberSafe analyzes URL text only — it never opens, fetches, or follows the submitted destination. Paste a URL and get:

- Parsed URL components (scheme, actual hostname, path, query)
- A clear **SAFE**, **REVIEW**, or **SUSPICIOUS** verdict
- An evidence list showing each triggered rule, what part of the URL triggered it, and why it matters

## Features

- **Sign in / Sign up** with demo authentication (Supabase)
- **URL analysis** with 8+ transparent, deterministic, rule-based checks
- **Recent analyses** saved per user session
- **Sample URLs** for quick testing (ordinary, deceptive, ambiguous, invalid)
- **Responsive design** — works on desktop and mobile
- **QR code scanner** — scan QR codes via camera or upload an image; decoded locally on-device

## Analysis rules

1. Deceptive `@` pattern — reveals the actual hostname behind user-info
2. Lookalike hostname — detects common typosquatting patterns
3. Non-web scheme — flags `javascript:`, `data:`, and other non-HTTP(S) schemes
4. IP-address hostname — flags raw IP addresses, especially with login paths
5. Suspicious URL patterns — embedded credentials, excessive subdomains, login-related paths
6. Shortened URL — recognizes common shorteners and returns REVIEW
7. Invalid or incomplete input — shows a useful validation message
8. Benign unusual URL — avoids false high-risk warnings from harmless oddities

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS for styling
- Supabase for authentication and data storage
- lucide-react for icons
- jsQR for client-side QR code decoding

## Getting started

```bash
npm install
npm run dev
```

## Demo credentials

Click "Use demo credentials" on the login page, or sign up with any email and password (6+ characters).

## Project structure

```
src/
  lib/
    urlAnalyzer.ts    # URL analysis engine (rules + verdict logic)
    types.ts           # Shared TypeScript types
    supabaseClient.ts  # Supabase client setup
  hooks/
    useAuth.tsx        # Authentication context
  components/
    Logo.tsx
    VerdictBadge.tsx
    AnalysisResultCard.tsx
    RecentAnalyses.tsx
    QrScanner.tsx
  pages/
    LoginPage.tsx
    DashboardPage.tsx
  App.tsx
  main.tsx
```

## Disclaimer

CyberSafe is a screening aid, not a guarantee that a URL is safe. Always use judgment and verify through trusted channels.

---

Built for a hackathon by Team X.
