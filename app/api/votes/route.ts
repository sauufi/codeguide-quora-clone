import { NextRequest } from "next/server";
import { eq, and, sql, count, desc } from "drizzle-orm";
import { db } from "@/db";
import { votes, questions, answers, user } from "@/db/schema";
import {
    createSuccessResponse,
    createErrorResponse,
    requireAuth,
    validateRequestBody,
    generateId,
    getItemVoteCounts,
    handleApiError,
} from "@/lib/api-utils";
import { createVoteSchema } from "@/lib/validations";

// POST /api/votes - Create or update a vote
export async function POST(request: NextRequest) {
    try {
        const authenticatedUser = await requireAuth(request);
        const body = await validateRequestBody(request, createVoteSchema);

        // Check if the item exists
        let itemExists;
        if (body.itemType === "question") {
            itemExists = await db
                .select({ id: questions.id })
                .from(questions)
                .where(eq(questions.id, body.itemId))
                .limit(1);
        } else {
            itemExists = await db
                .select({ id: answers.id })
                .from(answers)
                .where(eq(answers.id, body.itemId))
                .limit(1);
        }

        if (!itemExists.length) {
            return createErrorResponse(`${body.itemType} not found`, 404);
        }

        // Check if user already voted on this item
        const existingVote = await db
            .select()
            .from(votes)
            .where(
                and(
                    eq(votes.userId, authenticatedUser.id),
                    eq(votes.itemId, body.itemId),
                    eq(votes.itemType, body.itemType)
                )
            )
            .limit(1);

        let vote;
        if (existingVote.length > 0) {
            // Update existing vote
            if (existingVote[0].voteType === body.voteType) {
                // Remove vote if it's the same type
                await db
                    .delete(votes)
                    .where(eq(votes.id, existingVote[0].id));

                vote = null;
            } else {
                // Change vote type
                [vote] = await db
                    .update(votes)
                    .set({
                        voteType: body.voteType,
                        createdAt: new Date(), // Update timestamp
                    })
                    .where(eq(votes.id, existingVote[0].id))
                    .returning();
            }
        } else {
            // Create new vote
            [vote] = await db
                .insert(votes)
                .values({
                    id: generateId(),
                    userId: authenticatedUser.id,
                    itemId: body.itemId,
                    itemType: body.itemType,
                    voteType: body.voteType,
                })
                .returning();
        }

        // Get updated vote counts
        const voteCounts = await getItemVoteCounts(body.itemId, body.itemType);

        return createSuccessResponse({
            vote: vote ? {
                id: vote.id,
                voteType: vote.voteType,
                userId: vote.userId,
                itemId: vote.itemId,
                itemType: vote.itemType,
                createdAt: vote.createdAt,
            } : null,
            voteCounts,
            userVoteType: vote?.voteType || null,
        }, vote ? "Vote recorded successfully" : "Vote removed successfully");

    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/votes - Remove a vote
export async function DELETE(request: NextRequest) {
    try {
        const authenticatedUser = await requireAuth(request);
        const { searchParams } = new URL(request.url);

        const itemId = searchParams.get("itemId");
        const itemType = searchParams.get("itemType") as "question" | "answer";

        if (!itemId || !itemType || !["question", "answer"].includes(itemType)) {
            return createErrorResponse("itemId and itemType (question/answer) are required", 400);
        }

        // Check if the item exists
        let itemExists;
        if (itemType === "question") {
            itemExists = await db
                .select({ id: questions.id })
                .from(questions)
                .where(eq(questions.id, itemId))
                .limit(1);
        } else {
            itemExists = await db
                .select({ id: answers.id })
                .from(answers)
                .where(eq(answers.id, itemId))
                .limit(1);
        }

        if (!itemExists.length) {
            return createErrorResponse(`${itemType} not found`, 404);
        }

        // Find and delete the vote
        const existingVote = await db
            .select()
            .from(votes)
            .where(
                and(
                    eq(votes.userId, authenticatedUser.id),
                    eq(votes.itemId, itemId),
                    eq(votes.itemType, itemType)
                )
            )
            .limit(1);

        if (!existingVote.length) {
            return createErrorResponse("No vote found for this item", 404);
        }

        await db.delete(votes).where(eq(votes.id, existingVote[0].id));

        // Get updated vote counts
        const voteCounts = await getItemVoteCounts(itemId, itemType);

        return createSuccessResponse({
            voteCounts,
            userVoteType: null,
        }, "Vote removed successfully");

    } catch (error) {
        return handleApiError(error);
    }
}

// GET /api/votes - Get votes for a specific item or user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get("itemId");
        const itemType = searchParams.get("itemType") as "question" | "answer";
        const userId = searchParams.get("userId");

        if (!itemId && !userId) {
            return createErrorResponse("Either itemId or userId must be provided", 400);
        }

        if (itemId && (!itemType || !["question", "answer"].includes(itemType))) {
            return createErrorResponse("itemType (question/answer) is required when itemId is provided", 400);
        }

        let votesQuery = db
            .select({
                id: votes.id,
                userId: votes.userId,
                itemId: votes.itemId,
                itemType: votes.itemType,
                voteType: votes.voteType,
                createdAt: votes.createdAt,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
            })
            .from(votes)
            .leftJoin(user, eq(votes.userId, user.id));

        if (itemId) {
            votesQuery = votesQuery.where(
                and(
                    eq(votes.itemId, itemId),
                    eq(votes.itemType, itemType)
                )
            );
        } else if (userId) {
            votesQuery = votesQuery.where(eq(votes.userId, userId));
        }

        const votesData = await votesQuery.orderBy(desc(votes.createdAt));

        // Get vote counts for the item if itemId is provided
        let voteCounts = null;
        if (itemId) {
            voteCounts = await getItemVoteCounts(itemId, itemType);
        }

        const formattedVotes = votesData.map((vote) => ({
            ...vote,
            user: vote.user || {
                id: vote.userId,
                name: "Unknown User",
                email: "",
                image: null,
            },
        }));

        return createSuccessResponse({
            votes: formattedVotes,
            voteCounts,
        }, "Votes retrieved successfully");

    } catch (error) {
        return handleApiError(error);
    }
}