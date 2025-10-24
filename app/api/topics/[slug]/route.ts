import { NextRequest } from "next/server";
import { eq, sql, count, desc } from "drizzle-orm";
import { db } from "@/db";
import { topics, questionTopics, questions, user } from "@/db/schema";
import {
    createSuccessResponse,
    createErrorResponse,
    getPaginationParams,
    getItemVoteCounts,
    handleApiError,
} from "@/lib/api-utils";
import { questionsQuerySchema } from "@/lib/validations";

// GET /api/topics/[slug] - Get a single topic with questions
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const topicSlug = params.slug;
        const { searchParams } = new URL(request.url);
        const query = questionsQuerySchema.parse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            sort: searchParams.get("sort"),
        });

        // Get the topic
        const topicData = await db
            .select({
                id: topics.id,
                name: topics.name,
                slug: topics.slug,
                description: topics.description,
                createdAt: topics.createdAt,
                updatedAt: topics.updatedAt,
                questionCount: count(questions.id),
            })
            .from(topics)
            .leftJoin(questionTopics, eq(topics.id, questionTopics.topicId))
            .leftJoin(questions, eq(questionTopics.questionId, questions.id))
            .where(eq(topics.slug, topicSlug))
            .groupBy(topics.id)
            .limit(1);

        if (!topicData.length) {
            return createErrorResponse("Topic not found", 404);
        }

        const topic = topicData[0];

        // Get questions for this topic
        const { limit, offset } = getPaginationParams(query.page, query.limit);

        let questionsQuery = db
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
                answerCount: count(sql`DISTINCT answers.id`),
                upvotes: count(sql`CASE WHEN v.vote_type = 'upvote' THEN 1 END`),
                downvotes: count(sql`CASE WHEN v.vote_type = 'downvote' THEN 1 END`),
            })
            .from(questions)
            .innerJoin(questionTopics, eq(questions.id, questionTopics.questionId))
            .innerJoin(topics, eq(questionTopics.topicId, topics.id))
            .leftJoin(user, eq(questions.authorId, user.id))
            .leftJoin(questions.as("answers"), eq(questions.id, sql`answers.question_id`))
            .leftJoin(require("@/db/schema/qa").votes.as("v"), eq(questions.id, sql`v.item_id AND v.item_type = 'question'`))
            .where(eq(topics.slug, topicSlug))
            .groupBy(questions.id, user.id);

        // Apply sorting
        if (query.sort === "most_voted") {
            questionsQuery = questionsQuery.orderBy(
                desc(sql`COUNT(CASE WHEN v.vote_type = 'upvote' THEN 1 END) - COUNT(CASE WHEN v.vote_type = 'downvote' THEN 1 END)`),
                desc(questions.createdAt)
            );
        } else {
            questionsQuery = questionsQuery.orderBy(desc(questions.createdAt));
        }

        const questionsData = await questionsQuery.limit(limit).offset(offset);

        // Get total count for pagination
        const totalCountResult = await db
            .select({ count: count() })
            .from(questions)
            .innerJoin(questionTopics, eq(questions.id, questionTopics.questionId))
            .innerJoin(topics, eq(questionTopics.topicId, topics.id))
            .where(eq(topics.slug, topicSlug));

        const total = Number(totalCountResult[0].count);

        // Format the response
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
        }));

        return createSuccessResponse({
            topic,
            questions: formattedQuestions,
        }, "Topic and questions retrieved successfully", { page: query.page, limit, total });
    } catch (error) {
        return handleApiError(error);
    }
}