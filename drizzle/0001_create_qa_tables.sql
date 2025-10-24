-- Create Topics table
CREATE TABLE IF NOT EXISTS "topics" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for topics
CREATE INDEX IF NOT EXISTS "topics_name_idx" ON "topics" ("name");
CREATE INDEX IF NOT EXISTS "topics_slug_idx" ON "topics" ("slug");

-- Create Questions table
CREATE TABLE IF NOT EXISTS "questions" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "author_id" text NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "questions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create indexes for questions
CREATE INDEX IF NOT EXISTS "questions_author_idx" ON "questions" ("author_id");
CREATE INDEX IF NOT EXISTS "questions_created_at_idx" ON "questions" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "questions_title_idx" ON "questions" ("title");

-- Create Answers table
CREATE TABLE IF NOT EXISTS "answers" (
    "id" text PRIMARY KEY,
    "content" text NOT NULL,
    "question_id" text NOT NULL,
    "author_id" text NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "answers_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create indexes for answers
CREATE INDEX IF NOT EXISTS "answers_question_idx" ON "answers" ("question_id");
CREATE INDEX IF NOT EXISTS "answers_author_idx" ON "answers" ("author_id");
CREATE INDEX IF NOT EXISTS "answers_created_at_idx" ON "answers" ("created_at" DESC);

-- Create Votes table with unique constraint
CREATE TABLE IF NOT EXISTS "votes" (
    "id" text PRIMARY KEY,
    "user_id" text NOT NULL,
    "item_id" text NOT NULL,
    "item_type" text NOT NULL CHECK ("item_type" IN ('question', 'answer')),
    "vote_type" text NOT NULL CHECK ("vote_type" IN ('upvote', 'downvote')),
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "votes_user_item_unique" UNIQUE ("user_id", "item_id", "item_type")
);

-- Create indexes for votes
CREATE INDEX IF NOT EXISTS "votes_user_idx" ON "votes" ("user_id");
CREATE INDEX IF NOT EXISTS "votes_item_idx" ON "votes" ("item_id", "item_type");

-- Create Question-Topics many-to-many relationship table
CREATE TABLE IF NOT EXISTS "question_topics" (
    "id" text PRIMARY KEY,
    "question_id" text NOT NULL,
    "topic_id" text NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "question_topics_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "question_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "question_topics_unique" UNIQUE ("question_id", "topic_id")
);

-- Create indexes for question_topics
CREATE INDEX IF NOT EXISTS "question_topics_question_idx" ON "question_topics" ("question_id");
CREATE INDEX IF NOT EXISTS "question_topics_topic_idx" ON "question_topics" ("topic_id");

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON "topics" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON "questions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON "answers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();