import { z } from "zod";

// Question validation schemas
export const createQuestionSchema = z.object({
    title: z.string()
        .min(5, "Title must be at least 5 characters")
        .max(300, "Title cannot exceed 300 characters"),
    content: z.string()
        .min(10, "Content must be at least 10 characters")
        .max(5000, "Content cannot exceed 5000 characters"),
    topicIds: z.array(z.string()).optional().default([]),
});

export const updateQuestionSchema = z.object({
    title: z.string()
        .min(5, "Title must be at least 5 characters")
        .max(300, "Title cannot exceed 300 characters")
        .optional(),
    content: z.string()
        .min(10, "Content must be at least 10 characters")
        .max(5000, "Content cannot exceed 5000 characters")
        .optional(),
    topicIds: z.array(z.string()).optional(),
});

// Answer validation schemas
export const createAnswerSchema = z.object({
    content: z.string()
        .min(10, "Answer must be at least 10 characters")
        .max(5000, "Answer cannot exceed 5000 characters"),
});

export const updateAnswerSchema = z.object({
    content: z.string()
        .min(10, "Answer must be at least 10 characters")
        .max(5000, "Answer cannot exceed 5000 characters")
        .optional(),
});

// Vote validation schemas
export const createVoteSchema = z.object({
    itemId: z.string().min(1, "Item ID is required"),
    itemType: z.enum(["question", "answer"], {
        required_error: "Item type must be either 'question' or 'answer'",
    }),
    voteType: z.enum(["upvote", "downvote"], {
        required_error: "Vote type must be either 'upvote' or 'downvote'",
    }),
});

// Topic validation schemas
export const createTopicSchema = z.object({
    name: z.string()
        .min(1, "Topic name is required")
        .max(50, "Topic name cannot exceed 50 characters")
        .transform(val => val.trim().toLowerCase()),
    slug: z.string()
        .min(1, "Slug is required")
        .max(50, "Slug cannot exceed 50 characters")
        .transform(val => val.trim().toLowerCase().replace(/\s+/g, '-')),
    description: z.string()
        .max(200, "Description cannot exceed 200 characters")
        .optional(),
});

// Query parameter validation schemas
export const questionsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    sort: z.enum(["recent", "most_voted"]).default("recent"),
    topic: z.string().optional(),
});

export const answersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    sort: z.enum(["recent", "most_voted"]).default("most_voted"),
});

// Export types for use in components
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerInput = z.infer<typeof updateAnswerSchema>;
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type QuestionsQuery = z.infer<typeof questionsQuerySchema>;
export type AnswersQuery = z.infer<typeof answersQuerySchema>;