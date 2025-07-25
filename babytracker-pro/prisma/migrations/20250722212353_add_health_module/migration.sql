-- AlterTable
ALTER TABLE "diaper_entries" ADD COLUMN     "changedBy" TEXT,
ADD COLUMN     "diaper" JSONB,
ADD COLUMN     "mood" TEXT,
ADD COLUMN     "stool" JSONB,
ADD COLUMN     "wetness" JSONB;

-- CreateTable
CREATE TABLE "healthcare_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "hours" TEXT,
    "distance" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_details" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "groupNumber" TEXT NOT NULL,
    "copay" TEXT NOT NULL,
    "deductible" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "reminders" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_entries" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "location" TEXT,
    "batchNumber" TEXT,
    "reactions" TEXT,
    "notes" TEXT,
    "ageGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_entries" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION,
    "temperatureUnit" TEXT NOT NULL DEFAULT 'celsius',
    "notes" TEXT NOT NULL,
    "doctorContacted" BOOLEAN NOT NULL DEFAULT false,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptoms" (
    "id" TEXT NOT NULL,
    "symptomEntryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_photos" (
    "id" TEXT NOT NULL,
    "symptomEntryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptom_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "activeIngredient" TEXT NOT NULL,
    "concentration" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_entries" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "dosage" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "prescribedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_doses" (
    "id" TEXT NOT NULL,
    "medicationEntryId" TEXT,
    "symptomEntryId" TEXT,
    "dosage" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_doses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developmental_milestones" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minWeeks" INTEGER NOT NULL,
    "maxWeeks" INTEGER NOT NULL,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedDate" TIMESTAMP(3),
    "photos" JSONB,
    "video" TEXT,
    "notes" TEXT,
    "concerns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developmental_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_health_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "complications" JSONB,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_health_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_recovery" (
    "id" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cSectionHealing" BOOLEAN,
    "lochia" TEXT NOT NULL,
    "painLevel" INTEGER NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "sleepQuality" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_recovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mental_health_tracking" (
    "id" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edpsScore" INTEGER,
    "anxietyLevel" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mental_health_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL,
    "mentalHealthTrackingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood" TEXT NOT NULL,
    "anxietyLevel" INTEGER NOT NULL,
    "stressFactors" JSONB,
    "copingStrategies" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breastfeeding_health" (
    "id" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nippleHealth" TEXT NOT NULL,
    "supplyLevel" TEXT NOT NULL,
    "pumpOutput" JSONB,
    "supplements" JSONB,
    "concerns" JSONB,
    "mastitisRisk" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breastfeeding_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "first_aid_guides" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" TEXT,
    "content" TEXT NOT NULL,
    "steps" JSONB,
    "emergencyNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "first_aid_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_checklist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "minWeeks" INTEGER NOT NULL,
    "maxWeeks" INTEGER NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_recalls" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionRequired" TEXT NOT NULL,
    "recallDate" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_recalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_alerts" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_details_userId_key" ON "insurance_details"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_health_profiles_userId_key" ON "parent_health_profiles"("userId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "healthcare_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_entries" ADD CONSTRAINT "vaccine_entries_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_entries" ADD CONSTRAINT "symptom_entries_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptoms" ADD CONSTRAINT "symptoms_symptomEntryId_fkey" FOREIGN KEY ("symptomEntryId") REFERENCES "symptom_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_photos" ADD CONSTRAINT "symptom_photos_symptomEntryId_fkey" FOREIGN KEY ("symptomEntryId") REFERENCES "symptom_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_entries" ADD CONSTRAINT "medication_entries_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_entries" ADD CONSTRAINT "medication_entries_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_doses" ADD CONSTRAINT "medication_doses_medicationEntryId_fkey" FOREIGN KEY ("medicationEntryId") REFERENCES "medication_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_doses" ADD CONSTRAINT "medication_doses_symptomEntryId_fkey" FOREIGN KEY ("symptomEntryId") REFERENCES "symptom_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developmental_milestones" ADD CONSTRAINT "developmental_milestones_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_recovery" ADD CONSTRAINT "physical_recovery_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "parent_health_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mental_health_tracking" ADD CONSTRAINT "mental_health_tracking_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "parent_health_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_mentalHealthTrackingId_fkey" FOREIGN KEY ("mentalHealthTrackingId") REFERENCES "mental_health_tracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breastfeeding_health" ADD CONSTRAINT "breastfeeding_health_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "parent_health_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
