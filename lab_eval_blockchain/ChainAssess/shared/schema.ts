import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  role: text("role").notNull().default("student"), // student, teacher, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// Batches table
export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  teacher: text("teacher").notNull(), // wallet address
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Student-Batch relationship
export const batchStudents = pgTable("batch_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: varchar("batch_id").references(() => batches.id),
  studentAddress: text("student_address").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientAddress: text("recipient_address").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // batch_invitation, assignment_created, etc.
  isRead: boolean("is_read").notNull().default(false),
  data: text("data"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  deadline: timestamp("deadline").notNull(),
  tokenReward: integer("token_reward").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdByAddress: text("created_by_address").notNull(), // teacher wallet address
  batchId: varchar("batch_id").references(() => batches.id), // assignment belongs to specific batch
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentAddress: text("student_address").notNull(),
  assignmentId: varchar("assignment_id").references(() => assignments.id),
  ipfsHash: text("ipfs_hash").notNull(),
  fileName: text("file_name").notNull(),
  submissionTime: timestamp("submission_time").defaultNow(),
  isOnTime: boolean("is_on_time").notNull().default(true),
  reviewed: boolean("reviewed").notNull().default(false),
  rewardIssued: boolean("reward_issued").notNull().default(false),
  transactionHash: text("transaction_hash"),
});

export const tokenTransactions = pgTable("token_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientAddress: text("recipient_address").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  blockNumber: integer("block_number"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const nftRewards = pgTable("nft_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientAddress: text("recipient_address").notNull(),
  tokenId: text("token_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUri: text("image_uri"),
  transactionHash: text("transaction_hash").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const contractEvents = pgTable("contract_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractAddress: text("contract_address").notNull(),
  eventName: text("event_name").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  eventData: text("event_data"), // JSON string
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBatchStudentSchema = createInsertSchema(batchStudents).omit({
  id: true,
  addedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submissionTime: true,
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  timestamp: true,
});

export const insertNftRewardSchema = createInsertSchema(nftRewards).omit({
  id: true,
  timestamp: true,
});

export const insertContractEventSchema = createInsertSchema(contractEvents).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;

export type InsertBatchStudent = z.infer<typeof insertBatchStudentSchema>;
export type BatchStudent = typeof batchStudents.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;

export type InsertNftReward = z.infer<typeof insertNftRewardSchema>;
export type NftReward = typeof nftRewards.$inferSelect;

export type InsertContractEvent = z.infer<typeof insertContractEventSchema>;
export type ContractEvent = typeof contractEvents.$inferSelect;
