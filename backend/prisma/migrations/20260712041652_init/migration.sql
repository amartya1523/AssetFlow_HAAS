-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'RETURNED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'REPAIR');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('REQUESTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditCycleStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditItemStatus" AS ENUM ('PENDING', 'VERIFIED', 'MISMATCH', 'MISSING', 'NOT_FOUND');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ALERT', 'APPROVAL', 'BOOKING', 'GENERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "headId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "serialNumber" TEXT,
    "model" TEXT,
    "brand" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseValue" DECIMAL(12,2),
    "currentValue" DECIMAL(12,2),
    "imageUrl" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "categoryId" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT,
    "initiatedById" TEXT NOT NULL,
    "receivedById" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "type" "MaintenanceType" NOT NULL DEFAULT 'CORRECTIVE',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'REQUESTED',
    "issue" TEXT NOT NULL,
    "resolution" TEXT,
    "cost" DECIMAL(12,2),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AuditCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_cycle_auditors" (
    "id" TEXT NOT NULL,
    "auditCycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_cycle_auditors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_items" (
    "id" TEXT NOT NULL,
    "auditCycleId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "auditorId" TEXT,
    "status" "AuditItemStatus" NOT NULL DEFAULT 'PENDING',
    "expectedLocation" TEXT,
    "actualLocation" TEXT,
    "remarks" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_headId_key" ON "departments"("headId");

-- CreateIndex
CREATE INDEX "departments_headId_idx" ON "departments"("headId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_name_key" ON "asset_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_code_key" ON "asset_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetTag_key" ON "assets"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "assets_categoryId_key" ON "assets"("categoryId");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_categoryId_idx" ON "assets"("categoryId");

-- CreateIndex
CREATE INDEX "assets_departmentId_idx" ON "assets"("departmentId");

-- CreateIndex
CREATE INDEX "assets_assetTag_idx" ON "assets"("assetTag");

-- CreateIndex
CREATE INDEX "assets_createdAt_idx" ON "assets"("createdAt");

-- CreateIndex
CREATE INDEX "allocations_assetId_idx" ON "allocations"("assetId");

-- CreateIndex
CREATE INDEX "allocations_userId_idx" ON "allocations"("userId");

-- CreateIndex
CREATE INDEX "allocations_status_idx" ON "allocations"("status");

-- CreateIndex
CREATE INDEX "allocations_createdAt_idx" ON "allocations"("createdAt");

-- CreateIndex
CREATE INDEX "transfers_assetId_idx" ON "transfers"("assetId");

-- CreateIndex
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

-- CreateIndex
CREATE INDEX "transfers_initiatedById_idx" ON "transfers"("initiatedById");

-- CreateIndex
CREATE INDEX "transfers_toDepartmentId_idx" ON "transfers"("toDepartmentId");

-- CreateIndex
CREATE INDEX "transfers_createdAt_idx" ON "transfers"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_assetId_idx" ON "bookings"("assetId");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_startTime_idx" ON "bookings"("startTime");

-- CreateIndex
CREATE INDEX "bookings_endTime_idx" ON "bookings"("endTime");

-- CreateIndex
CREATE INDEX "bookings_departmentId_idx" ON "bookings"("departmentId");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "maintenance_requests_assetId_idx" ON "maintenance_requests"("assetId");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests"("status");

-- CreateIndex
CREATE INDEX "maintenance_requests_type_idx" ON "maintenance_requests"("type");

-- CreateIndex
CREATE INDEX "maintenance_requests_requestedById_idx" ON "maintenance_requests"("requestedById");

-- CreateIndex
CREATE INDEX "maintenance_requests_createdAt_idx" ON "maintenance_requests"("createdAt");

-- CreateIndex
CREATE INDEX "audit_cycles_status_idx" ON "audit_cycles"("status");

-- CreateIndex
CREATE INDEX "audit_cycles_startDate_idx" ON "audit_cycles"("startDate");

-- CreateIndex
CREATE INDEX "audit_cycles_createdAt_idx" ON "audit_cycles"("createdAt");

-- CreateIndex
CREATE INDEX "audit_cycle_auditors_userId_idx" ON "audit_cycle_auditors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "audit_cycle_auditors_auditCycleId_userId_key" ON "audit_cycle_auditors"("auditCycleId", "userId");

-- CreateIndex
CREATE INDEX "audit_items_auditCycleId_idx" ON "audit_items"("auditCycleId");

-- CreateIndex
CREATE INDEX "audit_items_assetId_idx" ON "audit_items"("assetId");

-- CreateIndex
CREATE INDEX "audit_items_status_idx" ON "audit_items"("status");

-- CreateIndex
CREATE INDEX "audit_items_auditorId_idx" ON "audit_items"("auditorId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "notifications"("category");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_idx" ON "activity_logs"("entityType");

-- CreateIndex
CREATE INDEX "activity_logs_entityId_idx" ON "activity_logs"("entityId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_headId_fkey" FOREIGN KEY ("headId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_cycle_auditors" ADD CONSTRAINT "audit_cycle_auditors_auditCycleId_fkey" FOREIGN KEY ("auditCycleId") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_cycle_auditors" ADD CONSTRAINT "audit_cycle_auditors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_auditCycleId_fkey" FOREIGN KEY ("auditCycleId") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
