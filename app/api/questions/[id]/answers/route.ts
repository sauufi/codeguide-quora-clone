import { NextRequest } from "next/server";
import { eq, and, sql, count, desc } from "drizzle-orm";
import { db } from "@/db";
import { questions, answers, votes, user } from "@/db/schema";
import {
    createSuccessResponse,
    createErrorResponse,
    requireAuth,
    validateRequestBody,
    generateId,
    getPaginationParams,
    getUserVote,
    handleApiError,
} from "@/lib/api-utils";
import { createAnswerSchema, answersQuerySchema } from "@/lib/validations";

// GET /api/questions/[id]/answers - List answers for a specific question
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const questionId = params.id;
        const { searchParams } = new URL(request.url);
        const query = answersQuerySchema.parse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            sort: searchParams.get("sort"),
        });

        // Check if question exists
        const questionExists = await db
            .select({ id: questions.id })
            .from(questions)
            .where(eq(questions.id, questionId))
            .limit(1);

        if (!questionExists.length) {
            return createErrorResponse("Question not found", 404);
        }

        const { limit, offset } = getPaginationParams(query.page, query.limit);

        // Get answers with vote counts and author information
        let answersQuery = db
            .select({
                id: answers.id,
                content: answers.content,
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
            .where(eq(answers.questionId, questionId))
            .groupBy(answers.id, user.id);

        // Apply sorting
        if (query.sort === "most_voted") {
            answersQuery = answersQuery.orderBy(
                desc(sql`COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END)`),
                desc(answers.createdAt)
            );
        } else {
            answersQuery = answersQuery.orderBy(desc(answers.createdAt));
        }

        const answersData = await answersQuery.limit(limit).offset(offset);

        // Get total count for pagination
        const totalCountResult = await db
            .select({ count: count() })
            .from(answers)
            .where(eq(answers.questionId, questionId));

        const total = Number(totalCountResult[0].count);

        // Get user votes if authenticated
        let userVotes = new Map();
        const authUser = await requireAuth(request).catch(() => null);
        if (authUser && answersData.length > 0) {
            const answerIds = answersData.map(a => a.id);
            const userVoteData = await db
                .select()
                .from(votes)
                .where(
                    and(
                        eq(votes.userId, authUser.id),
                        eq(votes.itemType, "answer"),
                        sql`item_id = ANY(${answerIds})`
                    )
                );

            userVotes = new Map(userVoteData.map(vote => [vote.itemId, vote]));
        }

        // Format the response
        const formattedAnswers = answersData.map((answer) => ({
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
            userVote: userVotes.get(answer.id)?.voteType || null,
        }));

        return createSuccessResponse(
            formattedAnswers,
            "Answers retrieved successfully",
            { page: query.page, limit, total }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/questions/[id]/answers - Create a new answer for a question
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authenticatedUser = await requireAuth(request);
        const questionId = params.id;
        const body = await validateRequestBody(request, createAnswerSchema);

        // Check if question exists
        const questionExists = await db
            .select({ id: questions.id })
            .from(questions)
            .where(eq(questions.id, questionId))
            .limit(1);

        if (!questionExists.length) {
            return createErrorResponse("Question not found", 404);
        }

        const answerId = generateId();

        // Create the answer
        const [newAnswer] = await db
            .insert(answers)
            .values({
                id: answerId,
                content: body.content,
                questionId,
                authorId: authenticatedUser.id,
            })
            .returning();

        // Get the complete answer with author information
        const completeAnswer = await db
            .select({
                id: answers.id,
                content: answers.content,
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
            voteCount: 0,
            upvotes: 0,
            downvotes: 0,
            userVote: null,
        };

        return createSuccessResponse(formattedAnswer, "Answer created successfully");
    } catch (error) {
        return handleApiError(error);
    }
}