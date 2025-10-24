import { NextRequest } from "next/server";
import { eq, ilike, desc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { topics, questionTopics, questions } from "@/db/schema";
import {
    createSuccessResponse,
    createErrorResponse,
    validateRequestBody,
    generateId,
    handleApiError,
} from "@/lib/api-utils";
import { createTopicSchema } from "@/lib/validations";

// GET /api/topics - List all topics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

        let topicsQuery = db
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
            .groupBy(topics.id);

        if (search) {
            topicsQuery = topicsQuery.where(
                ilike(topics.name, `%${search}%`)
            );
        }

        const topicsData = await topicsQuery
            .orderBy(desc(sql`COUNT(questions.id)`), desc(topics.name))
            .limit(limit);

        return createSuccessResponse(topicsData, "Topics retrieved successfully");
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/topics - Create a new topic (admin only for now)
export async function POST(request: NextRequest) {
    try {
        const body = await validateRequestBody(request, createTopicSchema);

        // Check if topic with same name or slug already exists
        const existingTopic = await db
            .select()
            .from(topics)
            .where(
                sql`(${topics.name} = ${body.name} OR ${topics.slug} = ${body.slug})`
            )
            .limit(1);

        if (existingTopic.length > 0) {
            return createErrorResponse("Topic with this name or slug already exists", 409);
        }

        // Create the topic
        const [newTopic] = await db
            .insert(topics)
            .values({
                id: generateId(),
                name: body.name,
                slug: body.slug,
                description: body.description || null,
            })
            .returning();

        return createSuccessResponse(newTopic, "Topic created successfully");
    } catch (error) {
        return handleApiError(error);
    }
}