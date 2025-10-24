import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

// Types for API responses
export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    details?: any;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

// Helper function to create success responses
export function createSuccessResponse<T>(
    data: T,
    message?: string,
    pagination?: PaginationParams & { total: number }
): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
        success: true,
        data,
    };

    if (message) {
        response.message = message;
    }

    if (pagination) {
        response.pagination = {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        };
    }

    return NextResponse.json(response);
}

// Helper function to create error responses
export function createErrorResponse(
    error: string,
    status: number = 400,
    details?: any
): NextResponse<ApiErrorResponse> {
    console.error("API Error:", error, details);
    return NextResponse.json(
        {
            success: false,
            error,
            ...(details && { details }),
        },
        { status }
    );
}

// Authentication middleware
export async function getAuthenticatedUser(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session || !session.user || !session.user.id) {
            return null;
        }

        // Get full user data from database
        const userData = await db
            .select()
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        return userData[0] || null;
    } catch (error) {
        console.error("Authentication error:", error);
        return null;
    }
}

// Require authentication middleware
export async function requireAuth(request: NextRequest) {
    const user = await getAuthenticatedUser(request);

    if (!user) {
        throw new Error("Authentication required");
    }

    return user;
}

// Validate request body with Zod schema
export function validateRequestBody<T>(request: NextRequest, schema: any): Promise<T> {
    return request.json().then(data => schema.parse(data));
}

// Generate ID utility function
export function generateId(): string {
    return crypto.randomUUID();
}

// Pagination helper
export function getPaginationParams(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return { limit, offset };
}

// Vote count calculation
export async function getItemVoteCounts(itemId: string, itemType: "question" | "answer") {
    const voteCounts = await db
        .select({
            upvotes: count(sql`CASE WHEN vote_type = 'upvote' THEN 1 END`),
            downvotes: count(sql`CASE WHEN vote_type = 'downvote' THEN 1 END`),
        })
        .from(require("@/db/schema/qa").votes)
        .where(
            and(
                eq(require("@/db/schema/qa").votes.itemId, itemId),
                eq(require("@/db/schema/qa").votes.itemType, itemType)
            )
        );

    const result = voteCounts[0] || { upvotes: 0, downvotes: 0 };
    return {
        upvotes: Number(result.upvotes),
        downvotes: Number(result.downvotes),
        total: Number(result.upvotes) - Number(result.downvotes),
    };
}

// User vote check
export async function getUserVote(userId: string, itemId: string, itemType: "question" | "answer") {
    const userVote = await db
        .select()
        .from(require("@/db/schema/qa").votes)
        .where(
            and(
                eq(require("@/db/schema/qa").votes.userId, userId),
                eq(require("@/db/schema/qa").votes.itemId, itemId),
                eq(require("@/db/schema/qa").votes.itemType, itemType)
            )
        )
        .limit(1);

    return userVote[0] || null;
}

// Error handler for API routes
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
    console.error("Unhandled API error:", error);

    if (error instanceof Error) {
        if (error.message === "Authentication required") {
            return createErrorResponse("Authentication required", 401);
        }
        if (error.message.includes("not found")) {
            return createErrorResponse("Resource not found", 404);
        }
        if (error.message.includes("unauthorized")) {
            return createErrorResponse("Unauthorized", 403);
        }
        return createErrorResponse(error.message, 500);
    }

    return createErrorResponse("Internal server error", 500);
}