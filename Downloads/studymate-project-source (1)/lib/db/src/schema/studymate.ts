import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("studymate_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("student"),
  branch: text("branch").notNull().default("Computer Engineering"),
  academicYear: text("academic_year").notNull().default("2025-26"),
  year: text("year").notNull().default("Third Year"),
  semester: text("semester").notNull().default("Semester 5"),
  enrollmentNumber: text("enrollment_number").notNull().unique(),
  avatar: text("avatar"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resourcesTable = pgTable("studymate_resources", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  branch: text("branch").notNull(),
  academicYear: text("academic_year").notNull(),
  year: text("year").notNull(),
  semester: text("semester").notNull(),
  subject: text("subject").notNull(),
  unit: text("unit").notNull(),
  description: text("description").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  size: text("size"),
  accent: text("accent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aptitudeQuestionsTable = pgTable("studymate_aptitude_questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  marks: integer("marks").notNull().default(1),
});

export const testsTable = pgTable("studymate_tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  duration: integer("duration").notNull(),
  totalMarks: integer("total_marks").notNull(),
  questionIds: jsonb("question_ids").$type<number[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attemptsTable = pgTable("studymate_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  testId: integer("test_id").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  score: real("score").notNull(),
  totalMarks: real("total_marks").notNull(),
  percentage: real("percentage").notNull(),
  accuracy: real("accuracy").notNull(),
  timeTaken: integer("time_taken").notNull(),
  weakTopics: jsonb("weak_topics").$type<string[]>().notNull(),
  strongTopics: jsonb("strong_topics").$type<string[]>().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studyPlansTable = pgTable("studymate_study_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subject: text("subject").notNull(),
  examDate: text("exam_date").notNull(),
  plan: jsonb("plan").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doubtsTable = pgTable("studymate_doubts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  subject: text("subject").notNull(),
  sources: jsonb("sources").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectsTable = pgTable("studymate_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  domain: text("domain").notNull(),
  difficulty: text("difficulty").notNull(),
  abstract: text("abstract").notNull(),
  technologies: jsonb("technologies").$type<string[]>().notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
});

export const booksTable = pgTable("studymate_books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  recommendationReason: text("recommendation_reason").notNull(),
  externalLink: text("external_link").notNull(),
});

export const notificationsTable = pgTable("studymate_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});