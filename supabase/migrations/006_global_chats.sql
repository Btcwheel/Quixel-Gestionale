-- Migration 006: Rendi project_id nullable per supportare chat globali di brainstorming
ALTER TABLE chat_sessions ALTER COLUMN project_id DROP NOT NULL;
