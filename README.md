# API Lens

API Lens is a client-side workbench for exploring HTTP Archive (HAR) captures. It parses captured requests in the browser, catalogs endpoints, visualizes host relationships, and surfaces heuristic security observations without uploading capture data to an API Lens backend.

> **Privacy reminder:** HAR files often contain session cookies, API tokens, personal information, and internal URLs. The parser redacts common sensitive fields, but redaction is heuristic rather than a guarantee. Review captures and exported reports before sharing or publishing them.
>
> ##live link
> https://apilens-drab.vercel.app/

## Features

- Import `.har` or `.json` files up to 50 MB, or load the included synthetic fixture.
- Inspect requests, response status and bodies, headers, query parameters, timings, and transport security.
- Browse endpoint and domain summaries, filter and sort observed traffic, and inspect API flow relationships.
- Run client-side heuristic checks for cleartext HTTP, credential indicators, PII, response diagnostics, security headers, and cookie attributes.
- Generate summaries and export a sanitized JSON report.
- Optionally ask Gemini or OpenAI for explanations using a personal API key (BYOK).
- Keep the active capture in browser memory and IndexedDB on the current device; clear the stored analysis from the app when finished.

Security findings are traffic-based observations, not proof of exploitable vulnerabilities. Validate findings in the context of the application being analyzed.

## Technology

- React 18 and React Router
- Vite 6
- Tailwind CSS
- Recharts and Lucide React
- Browser FileReader and IndexedDB APIs
- Node.js for the test scripts and build tooling

## Project structure

```text
.
├── index.html                     # Vite HTML entry point
├── package.json                   # Scripts and dependencies
├── package-lock.json              # Reproducible npm dependency graph
├── vite.config.js                 # Vite and React plugin configuration
├── tailwind.config.js             # Tailwind theme and content paths
├── postcss.config.js              # Tailwind and Autoprefixer
├── vercel.json                    # SPA rewrite for Vercel hosting
├── api-lens-sample-test.har        # Synthetic test capture; no real user traffic
├── scripts/
│   ├── e2eTestSuite.js             # Main Node-based regression suite
│   └── auditTest.js                # Redaction and IndexedDB audit suite
└── src/
    ├── App.jsx                     # Application routes
    ├── main.jsx                    # React bootstrap and providers
    ├── context/HarContext.jsx       # Shared capture state and persistence
    ├── data/sampleHar.js            # Synthetic fixture used by the app
    ├── pages/                      # Overview, upload, explorer, inspector, reports
    ├── components/                 # Shared layout and UI components
    └── utils/
        ├── harParser.js             # HAR parsing, metrics, graph, and audit rules
        ├── redaction.js             # Field, URL, and payload sanitization
        └── indexedDb.js             # Local browser persistence
```

The `stitch_api_lens_overview_dashboard/` directory contains UI design reference exports; it is not required to run the application.

## Requirements

- Node.js 20 LTS or newer
- npm (the project includes `package-lock.json`)

## Install and run locally

```bash
npm ci
npm run dev
```

Vite prints the local development URL (normally `http://localhost:5173`). To create and serve a production build locally:

```bash
npm run build
npm run preview
```

## Configure an AI provider (optional)

No environment variables are required for local development or deployment. API keys are entered in **AI Analyst → Configure API Key** and held in the browser's `sessionStorage` for that tab/session. Supported keys:

- Google Gemini API keys (typically start with `AIza`)
- OpenAI API keys (typically start with `sk-`)

The browser sends the configured key directly to the selected provider: Gemini in the `x-goog-api-key` header or OpenAI in the `Authorization` header. API Lens does not proxy these requests. A provider may apply its own retention and usage policies; consult its terms before sending prompts. The app builds prompts from the question and aggregate metrics rather than including raw request/response bodies or endpoint lists.

**Do not put provider keys in source code, `.env` files, Vercel environment variables, or `VITE_*` variables.** Vite exposes `VITE_*` values to browser bundles, so they cannot be used to protect secrets in this client-only app. Use a user-supplied key in the UI, or add a separately secured server-side proxy if a future product design requires centrally managed credentials.

## Use API Lens

1. Open **HAR Upload** and choose a `.har`/`.json` file, drag it into the drop zone, or load the synthetic sample.
2. Visit **Overview** for aggregate request, status, latency, and security metrics.
3. Use **API Explorer** to search and filter endpoint, domain, and recent-request views.
4. Open **Request Inspector** to select a request and review its headers, payloads, response, timing, and security context.
5. Review the heuristic observations in **Security Inspector**, and explore host and endpoint relationships in **API Flow Map**.
6. Generate or export a report from **Reports**. Inspect the exported file before sharing.
7. Use **Clear Analysis** to remove the current capture and its saved IndexedDB session.

## Security and privacy

- HAR parsing, metrics, redaction, and heuristic audits run in the browser; capture data is not sent to an API Lens server.
- Sensitive-looking headers, query parameters, and payload values are redacted before normalized data is displayed or saved. Matching is heuristic and cannot guarantee that every secret or personal-data format is detected.
- The latest analysis is persisted in browser IndexedDB so it can be restored after refresh. Other users of the same browser profile may be able to access local browser data; clear the session on shared devices.
- Optional AI provider requests send the entered key and a sanitized question/aggregate context directly to that provider. Do not include secrets in prompts.
- The included HAR is a synthetic fixture using example/test data. Never commit real HAR captures, credentials, exported reports, or personal data.

## Tests

Run the main regression suite and the additional privacy/persistence audit:

```bash
npm test
node scripts/auditTest.js
```

The current release-preparation validation completed with **107/107** main regression checks and **86/86** privacy/persistence checks passing. These are Node-based functional checks; the repository does not currently include browser-driven UI tests.

## Production build and deployment

Build the static site:

```bash
npm ci
npm run build
```

Vite writes the production site to `dist/`. The included `vercel.json` rewrites application routes to the Vite entry point so React Router routes work on direct navigation and refresh.

### Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Select the Vite framework preset (or use the detected defaults).
3. Set the project root to the repository root.
4. Use `npm run build` as the build command and `dist` as the output directory.
5. Do not add API keys or secrets as Vercel environment variables; this client-only build has no server-side secret consumer.
6. Deploy a preview first and verify navigation, refreshes on nested routes, HAR parsing, report export, and optional AI calls using a test key.
7. Promote to production only after the preview has been reviewed.

## Known limitations and future improvements

- Redaction and security checks are heuristics; unusual credential names and personal-data formats may not be recognized.
- Browser persistence uses the current browser profile's IndexedDB and does not encrypt data at rest.
- Direct browser-to-provider AI calls require the user's own key and may be limited by provider CORS, network, quota, or account policy.
- Large captures are accepted up to 50 MB, but memory and rendering costs depend on the browser and device.
- Browser-level interaction tests, a server-side AI proxy option, and stronger configurable retention controls would improve future releases.

## License

No license file or license declaration is included in this repository. All rights remain with the applicable copyright holder; do not assume that the project is licensed for redistribution or reuse. Add an explicit license before describing this repository as open source.
