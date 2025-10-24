// Export all schema tables and relations
export * from "./auth";
export * from "./qa";

// Import and re-export for type consistency
import { user, session, account, verification } from "./auth";
import {
    questions,
    answers,
    votes,
    topics,
    questionTopics,
    questionsRelations,
    answersRelations,
    votesRelations,
    topicsRelations,
    questionTopicsRelations
} from "./qa";
import { relations } from "drizzle-orm";

// Add user relations to connect with Q&A entities
export const userRelations = relations(user, ({ many }) => ({
    questions: many(questions),
    answers: many(answers),
    votes: many(votes),
    sessions: many(session),
    accounts: many(account),
    verifications: many(verification),
}));