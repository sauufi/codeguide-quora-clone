import { NextRequest } from "next/server";
import { eq, and, sql, count, desc } from "drizzle-orm";
import { db } from "@/db";
import { questions, answers, votes, questionTopics, topics, user } from "@/db/schema";
import {
    createSuccessResponse,
    createErrorResponse,
    requireAuth,
    validateRequestBody,
    getUserVote,
    getItemVoteCounts,
    handleApiError,
} from "@/lib/api-utils";
import { updateQuestionSchema } from "@/lib/validations";

// GET /api/questions/[id] - Get a single question with answers
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const questionId = params.id;

        // Get the question with author and topic information
        const questionData = await db
            .select({
                id: questions.id,
                title: questions.title,
                content: questions.content,
                authorId: questions.authorId,
                createdAt: questions.createdAt,
                updatedAt: questions.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
                topics: sql`array_agg(t.name) as topics`,
            })
            .from(questions)
            .leftJoin(user, eq(questions.authorId, user.id))
            .leftJoin(questionTopics, eq(questions.id, questionTopics.questionId))
            .leftJoin(topics.as("t"), eq(questionTopics.topicId, topics.id))
            .where(eq(questions.id, questionId))
            .groupBy(questions.id, user.id)
            .limit(1);

        if (!questionData.length) {
            return createErrorResponse("Question not found", 404);
        }

        const question = questionData[0];

        // Get vote counts for the question
        const voteCounts = await getItemVoteCounts(questionId, "question");

        // Get user's vote if authenticated
        let userVote = null;
        const authUser = await requireAuth(request).catch(() => null);
        if (authUser) {
            userVote = await getUserVote(authUser.id, questionId, "question");
        }

        // Get answers for this question
        const answersData = await db
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
                upvotes: count(sql`CASE WHEN av.vote_type = 'upvote' THEN 1 END`),
                downvotes: count(sql`CASE WHEN av.vote_type = 'downvote' THEN 1 END`),
            })
            .from(answers)
            .leftJoin(user, eq(answers.authorId, user.id))
            .leftJoin(votes.as("av"), and(
                eq(answers.id, sql`av.item_id`),
                eq(sql`av.item_type`, 'answer')
            ))
            .where(eq(answers.questionId, questionId))
            .groupBy(answers.id, user.id)
            .orderBy(desc(sql`COUNT(CASE WHEN av.vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN av.vote_type = 'downvote' THEN 1 END)`), desc(answers.createdAt));

        // Get user votes for answers if authenticated
        let userAnswerVotes = new Map();
        if (authUser && answersData.length > 0) {
            const answerIds = answersData.map(a => a.id);
            const userVotes = await db
                .select()
                .from(votes)
                .where(
                    and(
                        eq(votes.userId, authUser.id),
                        eq(votes.itemType, "answer"),
                        sql`item_id = ANY(${answerIds})`
                    )
                );

            userAnswerVotes = new Map(userVotes.map(vote => [vote.itemId, vote]));
        }

        // Format the response
        const formattedQuestion = {
            ...question,
            author: question.author || {
                id: question.authorId,
                name: "Unknown User",
                email: "",
                image: null,
            },
            topics: question.topics?.filter(Boolean) || [],
            voteCount: voteCounts.total,
            upvotes: voteCounts.upvotes,
            downvotes: voteCounts.downvotes,
            userVote: userVote?.voteType || null,
            answers: answersData.map(answer => ({
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
                userVote: userAnswerVotes.get(answer.id)?.voteType || null,
            })),
        };

        return createSuccessResponse(formattedQuestion, "Question retrieved successfully");
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/questions/[id] - Update a question
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authenticatedUser = await requireAuth(request);
        const questionId = params.id;
        const body = await validateRequestBody(request, updateQuestionSchema);

        // Check if question exists and user owns it
        const existingQuestion = await db
            .select()
            .from(questions)
            .where(eq(questions.id, questionId))
            .limit(1);

        if (!existingQuestion.length) {
            return createErrorResponse("Question not found", 404);
        }

        if (existingQuestion[0].authorId !== authenticatedUser.id) {
            return createErrorResponse("You can only edit your own questions", 403);
        }

        // Update the question and topic relationships in a transaction
        await db.transaction(async (tx) => {
            // Update the question
            await tx
                .update(questions)
                .set({
                    ...(body.title && { title: body.title }),
                    ...(body.content && { content: body.content }),
                    updatedAt: new Date(),
                })
                .where(eq(questions.id, questionId));

            // Update topic relationships if provided
            if (body.topicIds !== undefined) {
                // Delete existing topic relationships
                await tx
                    .delete(questionTopics)
                    .where(eq(questionTopics.questionId, questionId));

                // Create new topic relationships if provided
                if (body.topicIds.length > 0) {
                    const topicRelations = body.topicIds.map((topicId) => ({
                        id: crypto.randomUUID(),
                        questionId,
                        topicId,
                    }));

                    await tx.insert(questionTopics).values(topicRelations);
                }
            }
        });

        // Fetch the updated question
        const updatedQuestion = await db
            .select({
                id: questions.id,
                title: questions.title,
                content: questions.content,
                authorId: questions.authorId,
                createdAt: questions.createdAt,
                updatedAt: questions.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
                topics: sql`array_agg(t.name) as topics`,
            })
            .from(questions)
            .leftJoin(user, eq(questions.authorId, user.id))
            .leftJoin(questionTopics, eq(questions.id, questionTopics.questionId))
            .leftJoin(topics.as("t"), eq(questionTopics.topicId, topics.id))
            .where(eq(questions.id, questionId))
            .groupBy(questions.id, user.id)
            .limit(1);

        const formattedQuestion = {
            ...updatedQuestion[0],
            author: updatedQuestion[0].author || {
                id: updatedQuestion[0].authorId,
                name: "Unknown User",
                email: "",
                image: null,
            },
            topics: updatedQuestion[0].topics?.filter(Boolean) || [],
        };

        return createSuccessResponse(formattedQuestion, "Question updated successfully");
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authenticatedUser = await requireAuth(request);
        const questionId = params.id;

        // Check if question exists and user owns it
        const existingQuestion = await db
            .select()
            .from(questions)
            .where(eq(questions.id, questionId))
            .limit(1);

        if (!existingQuestion.length) {
            return createErrorResponse("Question not found", 404);
        }

        if (existingQuestion[0].authorId !== authenticatedUser.id) {
            return createErrorResponse("You can only delete your own questions", 403);
        }

        // Delete the question (cascade will handle related records)
        await db.delete(questions).where(eq(questions.id, questionId));

        return createSuccessResponse(null, "Question deleted successfully");
    } catch (error) {
        return handleApiError(error);
    }
}