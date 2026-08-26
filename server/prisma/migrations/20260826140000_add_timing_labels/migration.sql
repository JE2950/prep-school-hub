-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "startTimeLabel" TEXT,
ADD COLUMN     "endTimeLabel" TEXT,
ADD COLUMN     "halfTermStartTimeLabel" TEXT,
ADD COLUMN     "halfTermEndTimeLabel" TEXT;

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "startTimeLabel" TEXT,
ADD COLUMN     "endTimeLabel" TEXT;
