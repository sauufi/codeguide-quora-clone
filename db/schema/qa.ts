import {
    pgTable,
    text,
    timestamp,
    integer,
    primaryKey,
    index
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations } from "drizzle-orm";

// Topics table for categorizing questions
export const topics = pgTable("topics", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    nameIdx: index("topics_name_idx").on(table.name),
    slugIdx: index("topics_slug_idx").on(table.slug),
}));

// Questions table
export const questions = pgTable("questions", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    authorId: text("author_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    authorIdx: index("questions_author_idx").on(table.authorId),
    createdAtIdx: index("questions_created_at_idx").on(table.createdAt.desc()),
    titleIdx: index("questions_title_idx").on(table.title),
}));

// Answers table
export const answers = pgTable("answers", {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    questionId: text("question_id")
        .notNull()
        .references(() => questions.id, { onDelete: "cascade" }),
    authorId: text("author_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    questionIdx: index("answers_question_idx").on(table.questionId),
    authorIdx: index("answers_author_idx").on(table.authorId),
    createdAtIdx: index("answers_created_at_idx").on(table.createdAt.desc()),
}));

// Votes table with composite primary key to prevent duplicate votes
export const votes = pgTable("votes", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    itemType: text("item_type", { enum: ["question", "answer"] }).notNull(),
    voteType: text("vote_type", { enum: ["upvote", "downvote"] }).notNull(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    // Unique constraint to prevent duplicate votes
    userItemUnique: primaryKey({
        name: "votes_user_item_unique",
        columns: [table.userId, table.itemId, table.itemType],
    }),
    // Indexes for performance
    userIdx: index("votes_user_idx").on(table.userId),
    itemIdx: index("votes_item_idx").on(table.itemId, table.itemType),
}));

// Many-to-many relationship between questions and topics
export const questionTopics = pgTable("question_topics", {
    id: text("id").primaryKey(),
    questionId: text("question_id")
        .notNull()
        .references(() => questions.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
        .notNull()
        .references(() => topics.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    // Unique constraint to prevent duplicate topic assignments
    questionTopicUnique: primaryKey({
        name: "question_topics_unique",
        columns: [table.questionId, table.topicId],
    }),
    // Indexes for performance
    questionIdx: index("question_topics_question_idx").on(table.questionId),
    topicIdx: index("question_topics_topic_idx").on(table.topicId),
}));

// Define relations
export const questionsRelations = relations(questions, ({ one, many }) => ({
    author: one(user, {
        fields: [questions.authorId],
        references: [user.id],
    }),
    answers: many(answers),
    votes: many(votes),
    topics: many(questionTopics),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
    question: one(questions, {
        fields: [answers.questionId],
        references: [questions.id],
    }),
    author: one(user, {
        fields: [answers.authorId],
        references: [user.id],
    }),
    votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
    user: one(user, {
        fields: [votes.userId],
        references: [user.id],
    }),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
    questions: many(questionTopics),
}));

export const questionTopicsRelations = relations(questionTopics, ({ one }) => ({
    question: one(questions, {
        fields: [questionTopics.questionId],
        references: [questions.id],
    }),
    topic: one(topics, {
        fields: [questionTopics.topicId],
        references: [topics.id],
    }),
}));

// Export types for TypeScript usage
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type QuestionTopic = typeof questionTopics.$inferSelect;
export type NewQuestionTopic = typeof questionTopics.$inferInsert;