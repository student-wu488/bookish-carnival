-- Migration: Add content moderation tables for 净网守护系统

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add role column to Users if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'role'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';
  END IF;
END $$;

-- FilterRules table
CREATE TABLE IF NOT EXISTS "FilterRules" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL DEFAULT 'block',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CustomKeywords table
CREATE TABLE IF NOT EXISTS "CustomKeywords" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'custom',
  "action" TEXT NOT NULL DEFAULT 'block',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- BlockedContent table
CREATE TABLE IF NOT EXISTS "BlockedContent" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "content_type" TEXT NOT NULL DEFAULT 'text',
  "content" TEXT NOT NULL,
  "author" TEXT,
  "platform" TEXT,
  "status" TEXT NOT NULL DEFAULT 'blocked',
  "action" TEXT NOT NULL DEFAULT 'block',
  "trigger_rule" TEXT,
  "trigger_category" TEXT,
  "confidence" REAL,
  "sentiment" TEXT,
  "appeal_status" TEXT,
  "appeal_note" TEXT,
  "is_emergency" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Reports table
CREATE TABLE IF NOT EXISTS "Reports" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "content_url" TEXT,
  "content_text" TEXT,
  "violation_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "platform" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- UserSettings table
CREATE TABLE IF NOT EXISTS "UserSettings" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL UNIQUE,
  "filter_level" TEXT NOT NULL DEFAULT 'standard',
  "notification_mode" TEXT NOT NULL DEFAULT 'banner',
  "emergency_alerts" BOOLEAN NOT NULL DEFAULT true,
  "weekly_report" BOOLEAN NOT NULL DEFAULT true,
  "stealth_mode" BOOLEAN NOT NULL DEFAULT false,
  "auto_learn" BOOLEAN NOT NULL DEFAULT true,
  "sync_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_filter_rules_user_id" ON "FilterRules"("user_id");
CREATE INDEX IF NOT EXISTS "idx_custom_keywords_user_id" ON "CustomKeywords"("user_id");
CREATE INDEX IF NOT EXISTS "idx_blocked_content_user_id" ON "BlockedContent"("user_id");
CREATE INDEX IF NOT EXISTS "idx_blocked_content_status" ON "BlockedContent"("status");
CREATE INDEX IF NOT EXISTS "idx_blocked_content_created_at" ON "BlockedContent"("created_at");
CREATE INDEX IF NOT EXISTS "idx_reports_user_id" ON "Reports"("user_id");
