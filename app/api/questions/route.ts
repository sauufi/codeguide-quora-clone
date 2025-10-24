import { NextRequest } from "next/server";
import { eq, desc, asc, sql, count, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import { questions, answers, votes, questionTopics, topics, user } from "@/db/schema";
import {
    createSuccessResponse,
    createErrorResponse,
    requireAuth,
    validateRequestBody,
    generateId,
    getPaginationParams,
    getItemVoteCounts,
    getUserVote,
    handleApiError,
} from "@/lib/api-utils";
import { createQuestionSchema, questionsQuerySchema } from "@/lib/validations";

// GET /api/questions - List questions with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = questionsQuerySchema.parse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            sort: searchParams.get("sort"),
            topic: searchParams.get("topic"),
        });

        const { limit, offset } = getPaginationParams(query.page, query.limit);

        // Build the base query
        let baseQuery = db
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
                answerCount: count(answers.id),
                upvotes: count(sql`CASE WHEN v.vote_type = 'upvote' THEN 1 END`),
                downvotes: count(sql`CASE WHEN v.vote_type = 'downvote' THEN 1 END`),
                topics: sql`array_agg(t.name) as topics`,
            })
            .from(questions)
            .leftJoin(user, eq(questions.authorId, user.id))
            .leftJoin(answers, eq(questions.id, answers.questionId))
            .leftJoin(votes.as("v"), eq(questions.id, sql`v.item_id AND v.item_type = 'question'`))
            .leftJoin(questionTopics, eq(questions.id, questionTopics.questionId))
            .leftJoin(topics.as("t"), eq(questionTopics.topicId, topics.id))
            .groupBy(questions.id, user.id);

        // Apply topic filter if specified
        if (query.topic) {
            baseQuery = baseQuery.having(
                sql`array_agg(t.name) && ARRAY[${query.topic}]`
            );
        }

        // Apply sorting
        if (query.sort === "most_voted") {
            baseQuery = baseQuery.orderBy(
                desc(sql`COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END)`),
                desc(questions.createdAt)
            );
        } else {
            baseQuery = baseQuery.orderBy(desc(questions.createdAt));
        }

        // Get paginated results
        const questionsData = await baseQuery.limit(limit).offset(offset);

        // Get total count for pagination
        let totalCountQuery = db.select({ count: count() }).from(questions);
        if (query.topic) {
            totalCountQuery = totalCountQuery
                .innerJoin(questionTopics, eq(questions.id, questionTopics.questionId))
                .innerJoin(topics, eq(questionTopics.topicId, topics.id))
                .where(eq(topics.slug, query.topic));
        }

        const totalCountResult = await totalCountQuery;
        const total = Number(totalCountResult[0].count);

        // Format the response data
        const formattedQuestions = questionsData.map((q) => ({
            ...q,
            author: q.author || {
                id: q.authorId,
                name: "Unknown User",
                email: "",
                image: null,
            },
            voteCount: Number(q.upvotes) - Number(q.downvotes),
            upvotes: Number(q.upvotes),
            downvotes: Number(q.downvotes),
            answerCount: Number(q.answerCount),
            topics: q.topics?.filter(Boolean) || [],
        }));

        return createSuccessResponse(
            formattedQuestions,
            "Questions retrieved successfully",
            { page: query.page, limit, total }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/questions - Create a new question
export async function POST(request: NextRequest) {
    try {
        const authenticatedUser = await requireAuth(request);
        const body = await validateRequestBody(request, createQuestionSchema);

        const questionId = generateId();

        // Start a transaction to create question and topic relationships
        const result = await db.transaction(async (tx) => {
            // Create the question
            const [newQuestion] = await tx
                .insert(questions)
                .values({
                    id: questionId,
                    title: body.title,
                    content: body.content,
                    authorId: authenticatedUser.id,
                })
                .returning();

            // Create topic relationships if provided
            if (body.topicIds && body.topicIds.length > 0) {
                const topicRelations = body.topicIds.map((topicId) => ({
                    id: generateId(),
                    questionId,
                    topicId,
                }));

                await tx.insert(questionTopics).values(topicRelations);
            }

            return newQuestion;
        });

        // Fetch the complete question with relationships
        const completeQuestion = await db
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
            ...completeQuestion[0],
            author: completeQuestion[0].author || {
                id: completeQuestion[0].authorId,
                name: "Unknown User",
                email: "",
                image: null,
            },
            voteCount: 0,
            upvotes: 0,
            downvotes: 0,
            answerCount: 0,
            topics: completeQuestion[0].topics?.filter(Boolean) || [],
        };

        return createSuccessResponse(
            formattedQuestion,
            "Question created successfully",
            { page: 1, limit: 20, total: 1 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}