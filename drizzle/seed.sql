-- Insert sample topics
INSERT INTO "topics" ("id", "name", "slug", "description") VALUES
('topic-1', 'Technology', 'technology', 'Discussions about technology, programming, and software development'),
('topic-2', 'Science', 'science', 'Scientific discussions and discoveries'),
('topic-3', 'Business', 'business', 'Business, entrepreneurship, and startup discussions'),
('topic-4', 'Arts & Culture', 'arts-culture', 'Arts, literature, music, and cultural topics'),
('topic-5', 'Health', 'health', 'Health, wellness, and medical discussions');

-- Note: User, question, answer, and vote data will be inserted through the application
-- as it requires proper authentication and user IDs from the Better Auth system