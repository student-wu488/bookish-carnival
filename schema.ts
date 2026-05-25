import { pgTable, text, timestamp, integer, boolean, real } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// Users Table
// ============================================
export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateUserSchema = insertUserSchema.partial();

export const loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
});

export const signupUserSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

// ============================================
// Uploads Table
// ============================================
export const uploads = pgTable('Uploads', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  uploadId: text('upload_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads, {
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  s3Key: z.string().min(1, 'S3 key is required'),
  s3Url: z.string().url('Invalid S3 URL'),
  uploadId: z.string().optional(),
  status: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
});

export const updateUploadSchema = insertUploadSchema.partial();

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

// ============================================
// Filter Rules Table
// ============================================
export const filterRules = pgTable('FilterRules', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // violence, porn, spam, emotion, image, audio
  action: text('action').notNull().default('block'), // block, warn, log
  enabled: boolean('enabled').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertFilterRuleSchema = createInsertSchema(filterRules, {
  name: z.string().min(1, 'Rule name is required'),
  category: z.enum(['violence', 'porn', 'spam', 'emotion', 'image', 'audio', 'other']),
  action: z.enum(['block', 'warn', 'log']),
  enabled: z.boolean().optional(),
  description: z.string().optional(),
});

export const updateFilterRuleSchema = insertFilterRuleSchema.partial();

export type FilterRule = typeof filterRules.$inferSelect;
export type InsertFilterRule = typeof filterRules.$inferInsert;

// ============================================
// Custom Keywords Table
// ============================================
export const customKeywords = pgTable('CustomKeywords', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull(),
  keyword: text('keyword').notNull(),
  category: text('category').notNull().default('custom'), // violence, spam, custom, whitelist
  action: text('action').notNull().default('block'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertCustomKeywordSchema = createInsertSchema(customKeywords, {
  keyword: z.string().min(1, 'Keyword is required'),
  category: z.enum(['violence', 'spam', 'custom', 'whitelist']).optional(),
  action: z.enum(['block', 'warn', 'log']).optional(),
});

export type CustomKeyword = typeof customKeywords.$inferSelect;
export type InsertCustomKeyword = typeof customKeywords.$inferInsert;

// ============================================
// Blocked Content Table
// ============================================
export const blockedContent = pgTable('BlockedContent', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull(),
  contentType: text('content_type').notNull().default('text'), // text, image, video, audio
  content: text('content').notNull(),
  author: text('author'),
  platform: text('platform'),
  status: text('status').notNull().default('blocked'), // blocked, pending, approved, restored
  action: text('action').notNull().default('block'),
  triggerRule: text('trigger_rule'),
  triggerCategory: text('trigger_category'),
  confidence: real('confidence'),
  sentiment: text('sentiment'), // positive, negative, neutral
  appealStatus: text('appeal_status'), // null, pending, approved, rejected
  appealNote: text('appeal_note'),
  isEmergency: boolean('is_emergency').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertBlockedContentSchema = createInsertSchema(blockedContent, {
  contentType: z.enum(['text', 'image', 'video', 'audio']).optional(),
  content: z.string().min(1, 'Content is required'),
  author: z.string().optional(),
  platform: z.string().optional(),
  status: z.enum(['blocked', 'pending', 'approved', 'restored']).optional(),
  action: z.enum(['block', 'warn', 'log']).optional(),
  triggerRule: z.string().optional(),
  triggerCategory: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  appealStatus: z.string().optional(),
  appealNote: z.string().optional(),
  isEmergency: z.boolean().optional(),
});

export const updateBlockedContentSchema = insertBlockedContentSchema.partial();

export type BlockedContent = typeof blockedContent.$inferSelect;
export type InsertBlockedContent = typeof blockedContent.$inferInsert;

// ============================================
// Reports Table
// ============================================
export const reports = pgTable('Reports', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull(),
  contentUrl: text('content_url'),
  contentText: text('content_text'),
  violationType: text('violation_type').notNull(),
  status: text('status').notNull().default('pending'), // pending, submitted, resolved
  platform: text('platform'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports, {
  violationType: z.string().min(1, 'Violation type is required'),
  contentUrl: z.string().optional(),
  contentText: z.string().optional(),
  platform: z.string().optional(),
  notes: z.string().optional(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ============================================
// User Settings Table
// ============================================
export const userSettings = pgTable('UserSettings', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().unique(),
  filterLevel: text('filter_level').notNull().default('standard'), // strict, standard, relaxed
  notificationMode: text('notification_mode').notNull().default('banner'), // silent, badge, banner
  emergencyAlerts: boolean('emergency_alerts').notNull().default(true),
  weeklyReport: boolean('weekly_report').notNull().default(true),
  stealthMode: boolean('stealth_mode').notNull().default(false),
  autoLearn: boolean('auto_learn').notNull().default(true),
  syncEnabled: boolean('sync_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings, {
  filterLevel: z.enum(['strict', 'standard', 'relaxed']).optional(),
  notificationMode: z.enum(['silent', 'badge', 'banner']).optional(),
  emergencyAlerts: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  stealthMode: z.boolean().optional(),
  autoLearn: z.boolean().optional(),
  syncEnabled: z.boolean().optional(),
});

export const updateUserSettingsSchema = insertUserSettingsSchema.partial();

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
