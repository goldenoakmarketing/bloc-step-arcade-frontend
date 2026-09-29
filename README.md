# Bloc Step Arcade frontend

The Next.js arcade UI for Bloc Step, with Farcaster Mini App support and Base wallet integrations. The backend is maintained separately in `bloc-step-arcade-backend`.

## Local setup

Use Node.js 22 LTS (22.12 or newer) or Node.js 24 LTS and npm. `.nvmrc` and Netlify select Node 22.

1. Run `npm ci --ignore-scripts` to install the committed dependency versions without package lifecycle scripts.
2. Copy `.env.example` to `.env.local` (`Copy-Item .env.example .env.local` in PowerShell, or `cp .env.example .env.local` in a POSIX shell).
3. Configure your local backend at `http://localhost:3000`, or set `NEXT_PUBLIC_API_URL` to a development backend you control.
4. Run `npm run dev -- --port 3001` and open `http://localhost:3001`.

The example contains Base **mainnet** contract addresses. Local frontend hosting does not make wallet transactions a simulation. Wallet connection and transaction testing require an intentionally configured wallet and chain. For code checks, no wallet or running backend is needed.

## Configuration

Every `NEXT_PUBLIC_*` value is browser-visible and is embedded at build time. Never use private keys, signing secrets, or backend credentials. WalletConnect project IDs and any browser RPC provider keys should have the appropriate provider-side domain restrictions.

The sample lists the API URL, WalletConnect project ID, Base RPC URL, and the six contract addresses used by the UI. Supported chains are defined in `src/config/wagmi.ts`; `NEXT_PUBLIC_CHAIN_ID` is not used. Configure the deployment environment separately and rebuild after changing public values. If the API URL is omitted, existing runtime code falls back to the production backend, so use the local sample during development.

The Farcaster account association in `public/.well-known/farcaster.json` and the route at `src/app/api/well-known/[...path]/route.ts` are public manifest data. Keep those two copies aligned when intentionally updating app branding or its signed domain association. Never replace them with wallet signing secrets.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm audit
```

Lint runs without setup prompts. The production build validates the Next.js routes and TypeScript output; it does not verify wallet transactions, deployed headers, or backend business behavior. `npm run start -- --port 3001` serves a completed local production build.

Next.js and its ESLint configuration are pinned together to the patched 15.5 line. This upgrades the previous 14.1 installation while retaining React 18 and the existing wallet/game integrations. See the [Next.js security release](https://vercel.com/changelog/next-js-may-2026-security-release) for why the 14.x line needed an upgrade. Review remaining `npm audit` findings rather than applying `npm audit fix --force`, which can change wallet SDK major versions.

The 2026-09-29 lockfile audit, after compatible fixes, reports 30 moderate findings and no high or critical findings. Remaining findings involve `decode-uri-component`, `stream-json`, and `uuid` plus their wallet/Farcaster dependency chains. Resolving those requires separate SDK compatibility work; this cleanup does not claim a clean security audit.

Two same-major overrides address pinned transitive dependencies: Next.js uses PostCSS 8.5.28 for the [source-map/stringifier fixes](https://github.com/advisories/GHSA-6g55-p6wh-862q), and WalletConnect's nested viem uses ws 8.21.0 for the [WebSocket fragmentation fix](https://github.com/advisories/GHSA-96hv-2xvq-fx4p). Keep these overrides until the parent packages resolve patched versions themselves. `ox` is a direct dependency because `src/config/builder.ts` imports its ERC-8021 attribution API; its version preserves the original working dependency rather than relying on transitive hoisting.

Base Account's Coinbase CDP SDK is scoped to the original working version, 1.43.0. Version 1.57.0 statically imports optional x402 payment peers through the connectors bundle and breaks this application's build without those unused packages. The pin preserves the existing wallet integration while retaining patched transitive dependencies; revisit it when the upstream packaging issue is resolved.

Lint also retains 11 existing hook-dependency and image-optimization warnings. They remain visible rather than being suppressed; changing game-loop or wallet-effect dependencies needs focused behavior tests.

## Repository layout

- `src/app`: pages, global styles, and the Farcaster manifest route.
- `src/components/games`: game components and the arcade wrappers.
- `src/config`, `src/hooks`, `src/providers`, `src/contexts`: wallet, contract, session, and API integration.
- `public/games/onchain-trail`: the active, separately built Onchain Trail game, loaded by an iframe. Preserve its versioned JavaScript, CSS, and image assets together; the game source/build tooling is not included here.
- `netlify.toml`: existing hosting configuration and response headers. A local Next.js build does not validate Netlify header behavior.

Generated builds, dependency folders, local environment files, and local hosting state are ignored. Commit `package-lock.json` with dependency changes; do not commit `.env.local` or build output.
