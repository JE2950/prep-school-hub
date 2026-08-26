-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "activeTimetableSeason" TEXT NOT NULL DEFAULT 'winter';

-- AlterTable
ALTER TABLE "TimetableSlot" ADD COLUMN     "season" TEXT NOT NULL DEFAULT 'winter';
