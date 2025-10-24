import { NextRequest } from "next/server";
import { eq, and, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { answers, votes, user } from "@/db/schema";
import {
    createSuccessResponse,
    createErrorResponse,
    requireAuth,
    validateRequestBody,
    getUserVote,
    handleApiError,
} from "@/lib/api-utils";
import { updateAnswerSchema } from "@/lib/validations";

// GET /api/answers/[id] - Get a single answer with vote information
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const answerId = params.id;

        // Get the answer with author and vote information
        const answerData = await db
            .select({
                id: answers.id,
                content: answers.content,
                questionId: answers.questionId,
                authorId: answers.authorId,
                createdAt: answers.createdAt,
                updatedAt: answers.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
                upvotes: count(sql`CASE WHEN v.vote_type = 'upvote' THEN 1 END`),
                downvotes: count(sql`CASE WHEN v.vote_type = 'downvote' THEN 1 END`),
            })
            .from(answers)
            .leftJoin(user, eq(answers.authorId, user.id))
            .leftJoin(votes.as("v"), and(
                eq(answers.id, sql`v.item_id`),
                eq(sql`v.item_type`, 'answer')
            ))
            .where(eq(answers.id, answerId))
            .groupBy(answers.id, user.id)
            .limit(1);

        if (!answerData.length) {
            return createErrorResponse("Answer not found", 404);
        }

        const answer = answerData[0];

        // Get user's vote if authenticated
        let userVote = null;
        const authUser = await requireAuth(request).catch(() => null);
        if (authUser) {
            userVote = await getUserVote(authUser.id, answerId, "answer");
        }

        // Format the response
        const formattedAnswer = {
            ...answer,
            author: answer.author || {
                id: answer.authorId,
                name: "Unknown User",
                email: "",
                image: null,
            },
            voteCount: Number(answer.upvotes) - Number(answer.downvotes),
            upvotes: Number(answer.upvotes),
            downvotes: Number(answer.downvotes),
            userVote: userVote?.voteType || null,
        };

        return createSuccessResponse(formattedAnswer, "Answer retrieved successfully");
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/answers/[id] - Update an answer
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authenticatedUser = await requireAuth(request);
        const answerId = params.id;
        const body = await validateRequestBody(request, updateAnswerSchema);

        // Check if answer exists and user owns it
        const existingAnswer = await db
            .select()
            .from(answers)
            .where(eq(answers.id, answerId))
            .limit(1);

        if (!existingAnswer.length) {
            return createErrorResponse("Answer not found", 404);
        }

        if (existingAnswer[0].authorId !== authenticatedUser.id) {
            return createErrorResponse("You can only edit your own answers", 403);
        }

        // Update the answer
        const [updatedAnswer] = await db
            .update(answers)
            .set({
                ...(body.content && { content: body.content }),
                updatedAt: new Date(),
            })
            .where(eq(answers.id, answerId))
            .returning();

        // Get the complete answer with author information
        const completeAnswer = await db
            .select({
                id: answers.id,
                content: answers.content,
                questionId: answers.questionId,
                authorId: answers.authorId,
                createdAt: answers.createdAt,
                updatedAt: answers.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
            })
            .from(answers)
            .leftJoin(user, eq(answers.authorId, user.id))
            .where(eq(answers.id, answerId))
            .limit(1);

        const formattedAnswer = {
            ...completeAnswer[0],
            author: completeAnswer[0].author || {
                id: completeAnswer[0].authorId,
                name: "Unknown User",
                email: "",
                image: null,
            },
        };

        return createSuccessResponse(formattedAnswer, "Answer updated successfully");
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/answers/[id] - Delete an answer
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authenticatedUser = await requireAuth(request);
        const answerId = params.id;

        // Check if answer exists and user owns it
        const existingAnswer = await db
            .select()
            .from(answers)
            .where(eq(answers.id, answerId))
            .limit(1);

        if (!existingAnswer.length) {
            return createErrorResponse("Answer not found", 404);
        }

        if (existingAnswer[0].authorId !== authenticatedUser.id) {
            return createErrorResponse("You can only delete your own answers", 403);
        }

        // Delete the answer (cascade will handle related votes)
        await db.delete(answers).where(eq(answers.id, answerId));

        return createSuccessResponse(null, "Answer deleted successfully");
    } catch (error) {
        return handleApiError(error);
    }
}