-- Seed data for text_analyzer database
-- This will be populated after TypeORM entities are created

-- Sample texts for testing (will be inserted through the application)
-- These are just examples of what the seed data might look like

-- Insert sample log entries
INSERT INTO app_logs (level, message, metadata) VALUES
('info', 'Seed data loading started', '{"component": "database", "action": "seed"}'),
('info', 'Sample texts will be created through application API', '{"component": "seeder", "action": "note"}'),
('info', 'Seed data loading completed', '{"component": "database", "action": "seed"}');

-- Note: Actual text entities will be created through TypeORM migrations
-- Sample data will be inserted through the application's seed script

-- Example of what the texts table might look like (for reference):
-- CREATE TABLE texts (
--     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     content TEXT NOT NULL,
--     user_id VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Example seed data that would be inserted through the application:
-- INSERT INTO texts (title, content, user_id) VALUES
-- ('Sample Text 1', 'The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.', 'system'),
-- ('Sample Text 2', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 'system'),
-- ('Sample Text 3', 'This is a sample paragraph for testing. It contains multiple sentences. Each sentence ends with a period.', 'system');

SELECT 'Seed data loaded successfully' AS status;