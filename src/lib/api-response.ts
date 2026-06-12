import { NextResponse } from "next/server";
import { AppError, toApiError } from "@/lib/errors";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown, fallbackStatus = 500) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: toApiError(error) },
      { status: error.statusCode }
    );
  }
  console.error("[API Error]", error);
  return NextResponse.json(
    { error: { message: "An unexpected error occurred" } },
    { status: fallbackStatus }
  );
}
