<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Shared project context — Graphify and Caveman

- For a broad codebase investigation, use the local Graphify CLI when available: from the repo root run `graphify .` if the graph is missing or stale, then consult `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` before proposing architecture changes. Verify all important conclusions against source code and tests.
- The graph is generated code knowledge, not conversation memory. Record durable design decisions and handoff context in the repository's existing project documentation, following its file and approval rules.
- Use Caveman-style responses: lead with outcome; be concise, precise and readable. Never omit material risks, test results, commands or missing work, and never truncate required code.
- These aids supplement existing Karpathy guidance and project rules. They never relax safety, data access, deployment, risk-gateway, change scope or QA restrictions.
