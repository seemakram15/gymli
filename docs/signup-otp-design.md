# Signup confirmation email & verify success animation

Design reference for Stockli’s **signup OTP email** and the **in-app animation** after a successful verify. Source of truth in code:

- Email: [`supabase/templates/confirm-email.html`](../supabase/templates/confirm-email.html)
- OTP UI + success motion: [`components/auth/otp-verification.tsx`](../components/auth/otp-verification.tsx)
- Post-signup warm-up (after redirect): [`components/auth/account-warmup.tsx`](../components/auth/account-warmup.tsx)

---

## Flow overview

```text
Sign up
  → Supabase sends confirm-email.html (6-digit OTP, 10 min)
  → User enters code in OtpVerificationPanel (kind: "signup")
  → verifyOtp({ type: "signup" })
  → Success animation (~550ms)
  → Redirect into app (session kept)
  → Account warmup overlay prepares dashboard caches
```

| Setting | Value |
| --- | --- |
| OTP length | 6 digits (`mailer_otp_length: 6`) |
| OTP expiry | 10 minutes (`otp_expiry: 600`) |
| Resend cooldown | 60 seconds (app-side) |
| Subject (recommended) | `Your Stockli confirmation code` |

---

## 1. Signup confirmation email design

Matches the same OTP visual language as reset / change-email templates: mint-on-dark Stockli header, white card, large monospace code.

### Layout

```text
┌─────────────────────────────────────────────┐
│  [outer page bg #eef8f4]                    │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  HEADER (dark emerald gradient)     │   │
│   │  [icon] Stockli          SECURE…    │   │
│   ├─────────────────────────────────────┤   │
│   │  ONE MORE STEP                      │   │
│   │  Enter your confirmation code       │   │
│   │  We’ve sent a 6-digit code…         │   │
│   │                                     │   │
│   │  ┌───────────────────────────────┐  │   │
│   │  │     CONFIRMATION CODE         │  │   │
│   │  │         1 2 3 4 5 6           │  │   │
│   │  └───────────────────────────────┘  │   │
│   │                                     │   │
│   │  Return to Stockli, enter the…      │   │
│   └─────────────────────────────────────┘   │
│   Footer blurb (muted)                      │
└─────────────────────────────────────────────┘
```

### Colors

| Token | Hex | Use |
| --- | --- | --- |
| Page background | `#eef8f4` | Soft mint wash behind the card |
| Card background | `#ffffff` | Main content surface |
| Card border | `#cfe2dc` | Soft green outline |
| Card shadow | `rgba(10, 33, 29, 0.12)` | Soft depth |
| Header gradient | `#009663` → `#07231f` | Brand strip |
| Wordmark | `#7dffc8` | Luminous mint “Stockli” + glow |
| Wordmark underline | `#5dffb0` | 2px accent under brand |
| Eyebrow | `#008f61` | “ONE MORE STEP” |
| Headline | `#0b171a` | “Enter your confirmation code” |
| Body | `#5f6f75` | Supporting copy |
| Code box bg | `#f3fbf7` | Mint panel |
| Code box border | `#b7e5d3` | Panel outline |
| Code digits | `#009663` | Large OTP |
| Footer | `#7d8d92` | Product one-liner |

### Typography

- **Family:** Inter / system UI stack (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`)
- **Brand wordmark:** Segoe UI / Arial, **800**, ~23px, tight tracking (`-0.045em`), mint glow
- **Header right label:** 13px, **700**, uppercase, `letter-spacing: 0.12em`, white @ 78% opacity — `Secure signup`
- **Eyebrow:** 13px, **800**, uppercase, tracking `0.12em`
- **Headline:** 38px (30px mobile), **850**, line-height 46px, tracking `-0.02em`
- **Body:** 17px / 28px
- **OTP label:** 12px uppercase muted
- **OTP value:** 40px, **800**, monospace, `letter-spacing: 0.28em` — `{{ .Token }}`

### Branding assets

- Icon URL: `https://mystockli.com/brand/mystockli-icon-green.png` (36×40)
- Wordmark: HTML text (not an image) — mint glow + underline

### Copy (signup email)

- **Preheader (hidden):** `Your Stockli confirmation code is {{ .Token }}. The code will expires in 10 minutes.`
- **Eyebrow:** `One more step`
- **Headline:** `Enter your confirmation code`
- **Body:** We’ve sent a 6-digit code to your email. It expires in **10 minutes**.
- **Code label:** `Confirmation code`
- **Footer help:** Return to Stockli, enter the code, then sign in with your password. If you did not create this account, you can safely ignore this email.
- **Outer footer:** Stockli helps you track portfolios, live P/L, alerts and market movement in one workspace.

### Card chrome

- Width: **600px** max
- Radius: **30px** (22px on small screens)
- Header padding: `24px 32px`
- Content padding: `42px 40px 34px` (`28px 22px` mobile)
- Code panel: radius **18px**, padding `28px 20px`, centered

### Mobile breakpoints (`max-width: 620px`)

- Shell → 100% width
- Card radius → 22px, margin 12px
- Content padding → 28×22
- Headline → 30 / 38

---

## 2. In-app OTP entry (same design language)

Shown on signup after the email is sent (`OtpVerificationPanel` with `kind="signup"`).

### Structure

- Card: `rounded-[1.35rem]`, `ring-1 ring-border`, soft primary radial wash at the top
- Title: **Let’s verify your email** (~1.65–1.85rem semibold)
- Body: “A 6-digit verification code has been sent to **{email}**. … The code will expires in 10 minutes.”
- Countdown: `M:SS` (heading font, primary; turns destructive when ≤ 60s)
- **Six OTP boxes** in a row
- Resend + “Use another email” / “Back to sign in”

### OTP box design

Each digit:

- Outer size ~`3.15rem` (sm: `3.4rem`)
- Rounded ~`0.95rem` frame with **rotating conic gradient** when focused/filled (primary → chart-2), 2.2s linear loop
- Inner inset `1.6px`, rounded `0.82rem`, background surface
- Digit: ~1.45rem semibold, centered
- On fill: brief inset ring pulse (`opacity 0.55 → 0`, `scale 0.86 → 1.12`, 0.35s)

Respects `prefers-reduced-motion` (static gradient instead of spin).

### Phases

| Phase | UI |
| --- | --- |
| `enter` | Title, countdown, 6 boxes, Resend |
| `verifying` | Same + spinner “Verifying code…” (auto when 6 digits filled) |
| `success` | Success animation (below), then redirect |

---

## 3. Success animation (after verify)

Triggered when `verifyOtp` succeeds → `phase = "success"`.

### Visual sequence

1. **Panel swap** (`AnimatePresence mode="wait"`)
   - Exit enter view: fade / slight up (`opacity 0`, `y: -8`)
   - Enter success view: fade + scale in from `0.92 → 1` over **0.35s**, easing `[0.22, 1, 0.36, 1]`
2. **Background wash** switches to a stronger centered primary radial glow  
   `radial-gradient(50% 45% at 50% 48%, primary 22%, transparent 70%)`
3. **Copy**
   - Headline: **Verified successfully**
   - Subcopy (signup): *You’re signed in. Opening your Stockli portfolio…*
4. **Check badge** (hero mark)
   - Delayed **0.12s**
   - Spring: `scale 0.7 → 1`, `opacity 0 → 1` (`stiffness: 260`, `damping: 18`)
   - Soft primary blur halo behind
   - Rounded square ~`5.25rem`, card fill, primary ring + glow shadow
   - Lucide **Check** icon (~40px, `strokeWidth: 2.75`, primary)
5. **Hold, then navigate**
   - Wait **550ms** (or **250ms** if reduced motion)
   - Sets `stockli:account-warmup` flag
   - `window.location.replace(destination)` (safe redirect / dashboard)

### Timing summary

| Step | Duration |
| --- | --- |
| Enter → success crossfade | 350ms |
| Check spring delay | 120ms |
| Pause before redirect | 550ms (250ms reduced) |
| Total feel before leave | ~0.7–0.9s |

### Reduced motion

- No scale punch on panel / check (appear at rest)
- Shorter pause before redirect (250ms)
- OTP boxes skip rotating conic glow

---

## 4. What happens next (account warmup)

After redirect, [`AccountWarmup`](../components/auth/account-warmup.tsx) may show a short “Preparing your dashboard…” overlay that walks through cache warm-up steps (dashboard, market, fundamentals, icons, funds, etc.). That is separate from the verify success animation but is the next visual the new user sees.

---

## Related templates (same OTP design family)

| Template | Header label | Headline |
| --- | --- | --- |
| `confirm-email.html` | Secure signup | Enter your confirmation code |
| `reset-password.html` | Password reset | Enter your reset code |
| `change-email.html` | Email change | Enter your verification code |

Apply templates with:

```bash
npm run supabase:auth-email:apply
```

See also [`supabase/templates/README.md`](../supabase/templates/README.md).
