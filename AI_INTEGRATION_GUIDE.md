# StarCitizenOps AI Integration - Quick Reference

## How It Works

### User Flow
1. User fills out AI Planner form (organization name, player count, operation description)
2. Browser submits form to `/api/ai-planner` (backend API route)
3. Backend validates authentication and input
4. Backend checks if `OPENAI_API_KEY` is configured
5. Backend calls OpenAI API with formatted prompt
6. Backend saves prompt + result to database
7. Backend returns result to frontend (NO API KEY INCLUDED)
8. Frontend displays results to user

### Why This Is Secure

✅ **API Key Never Leaves Server**
- Only read from `process.env.OPENAI_API_KEY`
- Only used in backend route and ai library
- Browser never knows the API key exists

✅ **No NEXT_PUBLIC Prefix**
- Would expose variables to browser if used
- We don't use this for any secrets
- Verified with grep: 0 matches for `NEXT_PUBLIC_OPENAI`

✅ **Authentication Required**
- All requests checked with `getServerSession(authOptions)`
- Unauthorized users get 401 error
- User ID included in database record for audit trail

✅ **Input Validation**
- Zod schema validates all form inputs
- Prevents injection attacks
- Descriptive error messages for bad inputs

✅ **Error Handling**
- Missing API key shows helpful message
- Network errors caught and logged
- No sensitive information in error responses

## Configuration for End Users

### For Local Development
```bash
# 1. Get API key from https://platform.openai.com
# 2. Create a file named .env in the project root
# 3. Add this line:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# 4. Save and restart the server:
npm run dev
```

### For Vercel Deployment
```bash
# In Vercel Dashboard:
# 1. Go to Settings > Environment Variables
# 2. Add new variable:
#    Name: OPENAI_API_KEY
#    Value: sk-proj-xxxxxxxxxxxxxxxxxxxxx
# 3. Click Add
# 4. Redeploy application
```

## File Locations

| File | Purpose | Key Security Feature |
|------|---------|---------------------|
| `src/app/api/ai-planner/route.ts` | Entry point for AI requests | Requires auth, validates input |
| `src/lib/ai.ts` | OpenAI API client | Reads API key from process.env only |
| `src/components/ai-planner-panel.tsx` | Frontend form | Never knows about API key |
| `.env` | Local configuration | Added to .gitignore |
| `.env.example` | Configuration template | No actual API keys |
| `prisma/schema.prisma` | Database schema | AIGeneratedPlan table for records |

## Testing the Integration

### Test Endpoint with curl
```bash
# Get a session token first by logging in, then:
curl -X POST http://localhost:3001/api/ai-planner \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{
    "organizationName": "Aegis Vanguard",
    "numberOfPlayers": 8,
    "operationDescription": "Mining operation with security escort"
  }'
```

### Expected Responses

**Success (200)**:
```json
{
  "success": true,
  "plan": {
    "id": "uuid-here",
    "result": "OPERATION PLAN TEXT..."
  }
}
```

**Missing API Key (503)**:
```json
{
  "error": "AI Planner is not configured",
  "details": "OPENAI_API_KEY is missing. Please configure it in your .env file."
}
```

**Not Authenticated (401)**:
```json
{
  "error": "Unauthorized: Please log in to use the AI planner"
}
```

**Invalid Input (400)**:
```json
{
  "error": "Invalid input",
  "details": {
    "fieldErrors": {
      "organizationName": ["Organization name must be at least 2 characters"]
    }
  }
}
```

## Monitoring and Debugging

### Check API Key is Loaded
```bash
# In Node terminal while server running:
console.log(process.env.OPENAI_API_KEY)  // Should show sk-proj-... (not shown by default)
```

### Monitor Database
```bash
# View saved prompts and results:
npx prisma studio
# Then navigate to AIGeneratedPlan table
```

### Check Browser Never Sees API Key
1. Open browser DevTools (F12)
2. Go to Network tab
3. Trigger AI planner form
4. Click on `/api/ai-planner` request
5. Check Response body - no API key
6. Check Application > Cookies - no API key
7. Check Local Storage - no API key

### Enable Detailed Logging
In `src/app/api/ai-planner/route.ts`, uncomment:
```typescript
console.log("AI Planner requested by:", session.user.id);
console.log("Prompt:", prompt);
console.log("Result received, length:", result.length);
```

## Known Limitations

- No streaming (waits for full response from OpenAI)
- No rate limiting per user (anyone with account can spam)
- No caching (each request calls OpenAI, costs $ per request)
- No fallback if API key is wrong or expired (clear error shown)
- No queue system (simultaneous requests all go through immediately)

## Common Issues

**"AI Planner is not configured"**
→ Add OPENAI_API_KEY to .env and restart server

**"401 Unauthorized"**
→ Log in first, then try the form

**"Invalid input" errors**
→ Check form fields match requirements (organizationName min 2 chars, numberOfPlayers 1-100, description min 10 chars)

**Blank response**
→ OpenAI API returned empty - check your API key is valid at platform.openai.com

**"Another next dev server is already running"**
→ Run `kill 15937` (or PID shown) to stop the old server, then `npm run dev`

## References

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Zod Validation](https://zod.dev/)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
