-- PostgreSQL init script

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- The main database 'text_analyzer' is created by POSTGRES_DB env var
-- The keycloak database is created by keycloak service automatically

-- Create logs table for application logging
CREATE TABLE IF NOT EXISTS app_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_timestamp ON app_logs(timestamp);

-- Insert initial log entry
INSERT INTO app_logs (level, message, metadata) 
VALUES ('info', 'Database initialized successfully', '{"component": "database", "action": "init"}');

SELECT 'Database initialization completed successfully' AS status;
