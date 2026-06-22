-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('IBADAH', 'PELAYANAN', 'SARANA_PRASARANA', 'LAINNYA');

-- CreateTable
CREATE TABLE "FeedbackSubmission" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "contactInfo" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);
