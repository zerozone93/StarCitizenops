# Logistics AI Scanner

Planned scanner workflow:
- Upload screenshots through the Logistics scanner page
- Validate file type and size
- Hash images and detect duplicates
- Send structured requests to an AI provider abstraction
- Review detected items before any stock-changing action is applied

Current integration:
- API route: `app/api/logistics/scan/route.ts`
- Client helper: `src/lib/ai-scanner-client.ts`
- Consumer forms: `src/components/MemberSubmissionPortal.tsx`

Provider wiring:
- Provider name: `starcitizenopps`
- Environment variables:
	- `STARCITIZENOPPS_AI_ENDPOINT`
	- `STARCITIZENOPPS_AI_KEY`

Behavior:
- If endpoint/key are configured, the server forwards scan payloads to StarCitizenOpps AI.
- If unavailable or request fails, the system returns a deterministic local fallback verdict so workflows continue without blocking.

Endpoint contract:
- `GET /api/logistics/scan` returns provider configuration status.
- `POST /api/logistics/scan` accepts:
	- `context`: `offer | request | inventory`
	- `hasScreenshot`: boolean
	- `title?`, `materialName?`, `category?`, `lineItems?`, `note?`
	and responds with:
	- `verdict`
	- `provider`
	- `configured`
