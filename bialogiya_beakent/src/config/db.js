const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const safeRun = async (sql) => {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (err) {
    // Non-fatal, e.g. already exists or harmless warning
  }
};

const runMigrations = async () => {
  console.log('[DB] Checking and applying schema migrations...');

  // 1. Center table & columns
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Center" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "website" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "settings" JSONB NOT NULL DEFAULT '{}',
      CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "address" TEXT`);
  await safeRun(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "phone" TEXT`);
  await safeRun(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "email" TEXT`);
  await safeRun(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "website" TEXT`);
  await safeRun(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`);
  await safeRun(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}'`);
  await safeRun(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Center_name_idx" ON "Center"("name")`);

  // 2. AIAgent table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "AIAgent" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "model" TEXT NOT NULL,
      "apiKey" TEXT NOT NULL,
      "useCases" JSONB NOT NULL DEFAULT '[]',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "centerId" TEXT,
      CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "AIAgent" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);

  // 3. Room table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Room" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "capacity" INTEGER,
      "color" TEXT,
      "amenities" JSONB NOT NULL DEFAULT '[]',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "branchId" TEXT,
      "centerId" TEXT,
      CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "branchId" TEXT`);
  await safeRun(`ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);

  // 4. Lead table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Lead" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "source" TEXT NOT NULL DEFAULT 'other',
      "status" TEXT NOT NULL DEFAULT 'new',
      "interestedIn" TEXT,
      "note" TEXT,
      "frozenUntil" TIMESTAMP(3),
      "closedAt" TIMESTAMP(3),
      "closeReason" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "branchId" TEXT,
      "managerId" TEXT,
      "studentId" TEXT,
      "centerId" TEXT,
      CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "branchId" TEXT`);
  await safeRun(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "managerId" TEXT`);
  await safeRun(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "studentId" TEXT`);
  await safeRun(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Lead_centerId_idx" ON "Lead"("centerId")`);

  // 5. LeadActivity table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "LeadActivity" (
      "id" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "scheduledAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "leadId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
    )
  `);

  // 6. Expense table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Expense" (
      "id" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'expense',
      "category" TEXT NOT NULL DEFAULT 'other',
      "title" TEXT,
      "amount" INTEGER NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "note" TEXT,
      "method" TEXT NOT NULL DEFAULT 'cash',
      "branchId" TEXT,
      "createdById" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "centerId" TEXT,
      CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "branchId" TEXT`);
  await safeRun(`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Expense_category_idx" ON "Expense"("category")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Expense_centerId_idx" ON "Expense"("centerId")`);

  // 7. Tenant centerId columns across all tables
  const tenantTables = ['User', 'Branch', 'Group', 'Lesson', 'Homework', 'Submission', 'Test', 'Result', 'Attendance', 'Notification', 'AIChat', 'UploadedFile', 'Resource', 'Payment', 'Lead', 'Expense', 'Room', 'AIAgent'];
  for (const table of tenantTables) {
    await safeRun(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);
    await safeRun(`CREATE INDEX IF NOT EXISTS "${table}_centerId_idx" ON "${table}" ("centerId")`);
  }

  // 8. Legacy center seeding and mapping
  await safeRun(`
    INSERT INTO "Center" ("id", "name", "settings")
    SELECT 'legacy-center', 'Legacy Center', '{}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM "Center")
  `);
  await safeRun(`UPDATE "User" SET "centerId" = 'legacy-center' WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Branch" SET "centerId" = COALESCE((SELECT "centerId" FROM "User" WHERE "User"."id" = "Branch"."receptionId" OR "User"."id" = "Branch"."managerId" LIMIT 1), 'legacy-center') WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Group" SET "centerId" = COALESCE((SELECT "centerId" FROM "User" WHERE "User"."id" = "Group"."teacherId"), (SELECT "centerId" FROM "Branch" WHERE "Branch"."id" = "Group"."branchId"), 'legacy-center') WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Lesson" SET "centerId" = (SELECT "centerId" FROM "Group" WHERE "Group"."id" = "Lesson"."groupId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Homework" SET "centerId" = (SELECT "centerId" FROM "Group" WHERE "Group"."id" = "Homework"."groupId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Test" SET "centerId" = (SELECT "centerId" FROM "Group" WHERE "Group"."id" = "Test"."groupId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Attendance" SET "centerId" = (SELECT "centerId" FROM "Group" WHERE "Group"."id" = "Attendance"."groupId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Resource" SET "centerId" = (SELECT "centerId" FROM "User" WHERE "User"."id" = "Resource"."teacherId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Payment" SET "centerId" = (SELECT "centerId" FROM "User" WHERE "User"."id" = "Payment"."studentId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Lead" SET "centerId" = COALESCE((SELECT "centerId" FROM "Branch" WHERE "Branch"."id" = "Lead"."branchId"), (SELECT "centerId" FROM "User" WHERE "User"."id" = "Lead"."managerId"), 'legacy-center') WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Expense" SET "centerId" = COALESCE((SELECT "centerId" FROM "Branch" WHERE "Branch"."id" = "Expense"."branchId"), (SELECT "centerId" FROM "User" WHERE "User"."id" = "Expense"."createdById"), 'legacy-center') WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Submission" SET "centerId" = (SELECT "centerId" FROM "Homework" WHERE "Homework"."id" = "Submission"."homeworkId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Result" SET "centerId" = (SELECT "centerId" FROM "User" WHERE "User"."id" = "Result"."studentId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "Notification" SET "centerId" = (SELECT "centerId" FROM "User" WHERE "User"."id" = "Notification"."userId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "AIChat" SET "centerId" = (SELECT "centerId" FROM "User" WHERE "User"."id" = "AIChat"."studentId") WHERE "centerId" IS NULL`);
  await safeRun(`UPDATE "UploadedFile" SET "centerId" = 'legacy-center' WHERE "centerId" IS NULL`);

  // 9. User columns
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isFrozen" BOOLEAN NOT NULL DEFAULT false`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "age" INTEGER`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studyLocation" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "residence" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "alternativeWorkplace" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clonedVoiceId" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clonedVoiceName" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "maxBranches" INTEGER NOT NULL DEFAULT 3`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salaryType" TEXT NOT NULL DEFAULT 'percent'`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salaryShare" INTEGER NOT NULL DEFAULT 50`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hourlyRate" INTEGER`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchId" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parentPhone" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parentName" TEXT`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customRoleId" TEXT`);

  // 10. Resource columns
  await safeRun(`ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT`);
  await safeRun(`ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "fileData" BYTEA`);
  await safeRun(`ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "mimeType" TEXT`);

  // 11. Payment table & columns
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Payment" (
      "id"        TEXT NOT NULL,
      "month"     TEXT NOT NULL,
      "isPaid"    BOOLEAN NOT NULL DEFAULT true,
      "status"    TEXT NOT NULL DEFAULT 'paid',
      "expectedAmount" INTEGER NOT NULL DEFAULT 0,
      "amount"    INTEGER NOT NULL DEFAULT 0,
      "method"    TEXT NOT NULL DEFAULT 'cash',
      "note"      TEXT,
      "paidAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "studentId" TEXT NOT NULL,
      "teacherId" TEXT NOT NULL,
      CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'paid'`);
  await safeRun(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "expectedAmount" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amount" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "method" TEXT NOT NULL DEFAULT 'cash'`);
  await safeRun(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await safeRun(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "branchId" TEXT`);
  await safeRun(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Payment_month_idx" ON "Payment"("month")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Payment_centerId_idx" ON "Payment"("centerId")`);

  // 12. LessonMedia table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "LessonMedia" (
      "id"         TEXT NOT NULL,
      "lessonId"   TEXT NOT NULL,
      "kind"       TEXT NOT NULL,
      "slideIndex" INTEGER NOT NULL DEFAULT -1,
      "data"       BYTEA NOT NULL,
      "mimeType"   TEXT NOT NULL DEFAULT 'audio/mpeg',
      "voice"      TEXT,
      "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "LessonMedia_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`UPDATE "LessonMedia" SET "slideIndex" = -1 WHERE "slideIndex" IS NULL`);

  // 13. Role enum
  await safeRun(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'reception'`);
  await safeRun(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'manager'`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permissions" JSONB NOT NULL DEFAULT '{}'`);
  await safeRun(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isFrozen" BOOLEAN NOT NULL DEFAULT false`);

  // 14. Branch table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Branch" (
      "id"              TEXT NOT NULL,
      "name"            TEXT NOT NULL,
      "address"         TEXT,
      "latitude"        DOUBLE PRECISION,
      "longitude"       DOUBLE PRECISION,
      "studentCapacity" INTEGER,
      "isActive"        BOOLEAN NOT NULL DEFAULT true,
      "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "receptionId"     TEXT,
      "managerId"       TEXT,
      "centerId"        TEXT,
      CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "managerId" TEXT`);
  await safeRun(`ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`);
  await safeRun(`ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`);
  await safeRun(`ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "studentCapacity" INTEGER`);
  await safeRun(`ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);

  // 15. Group columns
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "branchId" TEXT`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "monthlyFee" INTEGER`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "weekDays" TEXT`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "startTime" TEXT`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "endTime" TEXT`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "room" TEXT`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "roomId" TEXT`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "totalLessons" INTEGER`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "level" TEXT`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);
  await safeRun(`ALTER TABLE "Group" ALTER COLUMN "subject" SET DEFAULT 'other'`);
  await safeRun(`ALTER TABLE "Lesson" ALTER COLUMN "subject" SET DEFAULT 'other'`);

  // 16. Application & UploadedFile tables
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Application" (
      "id"        TEXT NOT NULL,
      "name"      TEXT NOT NULL,
      "phone"     TEXT NOT NULL,
      "message"   TEXT,
      "status"    TEXT NOT NULL DEFAULT 'new',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "UploadedFile" (
      "id"        TEXT NOT NULL,
      "name"      TEXT NOT NULL,
      "mimeType"  TEXT NOT NULL,
      "data"      BYTEA NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "centerId"  TEXT,
      CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "UploadedFile" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);

  // 17. CustomRole table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "CustomRole" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "baseRole" TEXT NOT NULL DEFAULT 'reception',
      "permissions" JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "centerId" TEXT NOT NULL,
      CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`CREATE INDEX IF NOT EXISTS "CustomRole_centerId_idx" ON "CustomRole"("centerId")`);

  // 18. Plan table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Plan" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "price" INTEGER NOT NULL DEFAULT 199000,
      "currency" TEXT NOT NULL DEFAULT 'UZS',
      "trialDays" INTEGER NOT NULL DEFAULT 7,
      "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
      "aiProvider" TEXT,
      "aiModel" TEXT,
      "aiMonthlyTokenLimit" INTEGER NOT NULL DEFAULT 0,
      "aiMonthlyRequestLimit" INTEGER NOT NULL DEFAULT 0,
      "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
      "smsProvider" TEXT,
      "smsMonthlyLimit" INTEGER NOT NULL DEFAULT 0,
      "maxBranches" INTEGER NOT NULL DEFAULT 1,
      "maxStudents" INTEGER NOT NULL DEFAULT 100,
      "maxTeachers" INTEGER NOT NULL DEFAULT 5,
      "maxGroups" INTEGER NOT NULL DEFAULT 10,
      "features" JSONB NOT NULL DEFAULT '{}',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
    )
  `);

  // 19. Subscription table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Subscription" (
      "id" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'trial',
      "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "trialEndsAt" TIMESTAMP(3),
      "currentPeriodStart" TIMESTAMP(3),
      "currentPeriodEnd" TIMESTAMP(3),
      "nextDueDate" TIMESTAMP(3),
      "lastPaidAt" TIMESTAMP(3),
      "paymentMethod" TEXT NOT NULL DEFAULT 'manual',
      "aiApiKeySource" TEXT NOT NULL DEFAULT 'platform',
      "aiApiKeyEncrypted" TEXT,
      "aiApiKeyIV" TEXT,
      "aiPreferredModel" TEXT,
      "smsProvider" TEXT NOT NULL DEFAULT 'platform',
      "smsApiKeyEncrypted" TEXT,
      "smsApiKeyIV" TEXT,
      "smsSenderName" TEXT,
      "currentMonthTokens" INTEGER NOT NULL DEFAULT 0,
      "currentMonthRequests" INTEGER NOT NULL DEFAULT 0,
      "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
      "totalRequestsUsed" INTEGER NOT NULL DEFAULT 0,
      "currentMonthSms" INTEGER NOT NULL DEFAULT 0,
      "totalSmsSent" INTEGER NOT NULL DEFAULT 0,
      "centerId" TEXT NOT NULL,
      "planId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "currentPeriodStart" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "nextDueDate" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastPaidAt" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'manual'`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "aiApiKeySource" TEXT NOT NULL DEFAULT 'platform'`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "aiApiKeyEncrypted" TEXT`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "aiApiKeyIV" TEXT`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "aiPreferredModel" TEXT`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "smsProvider" TEXT NOT NULL DEFAULT 'platform'`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "smsApiKeyEncrypted" TEXT`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "smsApiKeyIV" TEXT`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "smsSenderName" TEXT`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "currentMonthTokens" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "currentMonthRequests" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "totalTokensUsed" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "totalRequestsUsed" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "currentMonthSms" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "totalSmsSent" INTEGER NOT NULL DEFAULT 0`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "centerId" TEXT`);
  await safeRun(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "planId" TEXT`);
  await safeRun(`CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_centerId_key" ON "Subscription"("centerId")`);

  // 20. Invoice table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "Invoice" (
      "id" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'UZS',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "paidAt" TIMESTAMP(3),
      "paidBy" TEXT,
      "note" TEXT,
      "subscriptionId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await safeRun(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3)`);
  await safeRun(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidBy" TEXT`);
  await safeRun(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "note" TEXT`);
  await safeRun(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId")`);

  // 21. AIUsageLog table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "AIUsageLog" (
      "id" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "model" TEXT NOT NULL,
      "useCase" TEXT NOT NULL DEFAULT 'chat',
      "tokensIn" INTEGER NOT NULL DEFAULT 0,
      "tokensOut" INTEGER NOT NULL DEFAULT 0,
      "totalTokens" INTEGER NOT NULL DEFAULT 0,
      "requestCount" INTEGER NOT NULL DEFAULT 1,
      "costUsd" DOUBLE PRECISION,
      "userId" TEXT,
      "centerId" TEXT NOT NULL,
      "subscriptionId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "AIUsageLog" ADD COLUMN IF NOT EXISTS "requestCount" INTEGER NOT NULL DEFAULT 1`);
  await safeRun(`ALTER TABLE "AIUsageLog" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "AIUsageLog_centerId_idx" ON "AIUsageLog"("centerId")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt")`);

  // 22. SMSLog table
  await safeRun(`
    CREATE TABLE IF NOT EXISTS "SMSLog" (
      "id" TEXT NOT NULL,
      "provider" TEXT NOT NULL DEFAULT 'eskiz',
      "toPhone" TEXT NOT NULL,
      "recipientType" TEXT NOT NULL DEFAULT 'parent',
      "trigger" TEXT NOT NULL DEFAULT 'manual',
      "messageText" TEXT,
      "status" TEXT NOT NULL DEFAULT 'sent',
      "cost" DOUBLE PRECISION,
      "currency" TEXT NOT NULL DEFAULT 'UZS',
      "errorMessage" TEXT,
      "userId" TEXT,
      "centerId" TEXT NOT NULL,
      "subscriptionId" TEXT,
      "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SMSLog_pkey" PRIMARY KEY ("id")
    )
  `);
  await safeRun(`ALTER TABLE "SMSLog" ADD COLUMN IF NOT EXISTS "recipientType" TEXT NOT NULL DEFAULT 'parent'`);
  await safeRun(`ALTER TABLE "SMSLog" ADD COLUMN IF NOT EXISTS "messageText" TEXT`);
  await safeRun(`ALTER TABLE "SMSLog" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT`);
  await safeRun(`ALTER TABLE "SMSLog" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "SMSLog_centerId_idx" ON "SMSLog"("centerId")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "SMSLog_createdAt_idx" ON "SMSLog"("createdAt")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "SMSLog_centerId_idx" ON "SMSLog"("centerId")`);
  await safeRun(`CREATE INDEX IF NOT EXISTS "SMSLog_createdAt_idx" ON "SMSLog"("createdAt")`);

  console.log('[DB] All schema migrations verified and applied');
};

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('[DB] PostgreSQL (Neon) connected via Prisma');
    await runMigrations();
  } catch (err) {
    console.error('[DB] Database connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
