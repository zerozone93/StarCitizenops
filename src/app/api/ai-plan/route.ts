import { NextResponse } from "next/server";

/**
 * DEPRECATED: This endpoint is deprecated as of the AI/OpenAI integration update.
 * Please use /api/ai-planner instead, which provides a more secure backend-only
 * implementation with improved error handling and database persistence.
 *
 * If you have existing clients calling this endpoint, migrate them to:
 * POST /api/ai-planner
 *
 * Request body remains the same:
 * {
 *   organizationName: string,
 *   numberOfPlayers: number,
 *   operationDescription: string
 * }
 *
 * Response format:
 * {
 *   success: true,
 *   plan: {
 *     id: string,
 *     result: string
 *   }
 * }
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      message: "The /api/ai-plan endpoint is deprecated. Please use /api/ai-planner instead.",
      migration: {
        oldEndpoint: "/api/ai-plan",
        newEndpoint: "/api/ai-planner",
        requestFormat: "Same as before (no changes needed)",
        responseFormat: "Changed - see documentation",
      },
      documentation: "See AI_SECURITY_CHECKLIST.md for details",
    },
    { status: 410 } // 410 Gone - resource no longer available
  );
}
