-- Step 1: Create new enum with all values
CREATE TYPE "ToolStatus_new" AS ENUM (
  'AVAILABLE',
  'ALLOCATED',
  'INTERUSE',
  'RENTED',
  'MAINTENANCE',
  'RETIRED',
  'DAMAGED',
  'LOST',
  'RETURNED',
  'PENDING_RETURN',
  'NOT_AVAILABLE'
);

-- Step 2: Add new columns to tools table
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "serialNumber" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "freelancerId" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "returnDate" TIMESTAMP(3);
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "damageCost" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "damageDescription" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "additionalInfo" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "parentToolId" TEXT;
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "allocatedDate" TIMESTAMP(3);

-- Step 3: Modify existing columns
ALTER TABLE "tools" ALTER COLUMN "purchasePrice" SET DEFAULT 0;
ALTER TABLE "tools" ALTER COLUMN "createdBy" DROP NOT NULL;

-- Step 4: Handle images column conversion from JSONB to TEXT[]
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "images_temp" TEXT[];

UPDATE "tools" SET "images_temp" = ARRAY[]::TEXT[] WHERE "images" IS NULL;
UPDATE "tools" SET "images_temp" = 
  CASE 
    WHEN jsonb_typeof("images") = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text("images"))
    ELSE ARRAY[]::TEXT[]
  END
WHERE "images" IS NOT NULL;

ALTER TABLE "tools" DROP COLUMN "images";
ALTER TABLE "tools" RENAME COLUMN "images_temp" TO "images";
ALTER TABLE "tools" ALTER COLUMN "images" SET DEFAULT ARRAY[]::TEXT[];

-- Step 5: Update tools table status column to use new enum
ALTER TABLE "tools" ADD COLUMN "status_new" "ToolStatus_new";
UPDATE "tools" SET "status_new" = "status"::text::"ToolStatus_new";
ALTER TABLE "tools" DROP COLUMN "status";
ALTER TABLE "tools" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "tools" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE'::"ToolStatus_new";

-- Step 6: Migrate data from worker_tools to tools
INSERT INTO "tools" (
  "id", "name", "description", "serialNumber", "code", "category",
  "canBeRented", "purchasePrice", "purchaseDate", "quantity",
  "employeeId", "freelancerId", "returnDate", "status", "condition",
  "damageCost", "damageDescription", "createdAt", "updatedAt",
  "createdBy", "additionalInfo", "images", "parentToolId", "allocatedDate"
)
SELECT 
  "id", "name", "description", "serialNumber", "code", "category",
  false as "canBeRented",
  "purchasePrice", "purchaseDate", "quantity",
  "employeeId", "freelancerId", "returnDate", 
  "status"::text::"ToolStatus_new",
  "condition",
  "damageCost", "damageDescription", "createdAt", "updatedAt",
  "createdBy", "additionalInfo", 
  COALESCE("images", ARRAY[]::TEXT[]),
  "parentToolId", "allocatedDate"
FROM "worker_tools"
ON CONFLICT ("id") DO NOTHING;

-- Step 7: Update tool_returns status column
ALTER TABLE "tool_returns" ADD COLUMN "status_new" "ToolStatus_new";
UPDATE "tool_returns" SET "status_new" = "status"::text::"ToolStatus_new";
ALTER TABLE "tool_returns" DROP COLUMN "status";
ALTER TABLE "tool_returns" RENAME COLUMN "status_new" TO "status";

-- Step 8: Drop the old worker_tools table
DROP TABLE IF EXISTS "worker_tools" CASCADE;

-- Step 9: Drop old enum and rename new one
DROP TYPE "ToolStatus";
ALTER TYPE "ToolStatus_new" RENAME TO "ToolStatus";

-- Step 10: Drop WorkerToolStatus enum
DROP TYPE IF EXISTS "WorkerToolStatus";

-- Step 11: Add foreign key constraints
ALTER TABLE "tools" ADD CONSTRAINT "tools_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tools" ADD CONSTRAINT "tools_freelancerId_fkey" 
  FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tools" ADD CONSTRAINT "tools_parentToolId_fkey" 
  FOREIGN KEY ("parentToolId") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tool_returns" ADD CONSTRAINT "tool_returns_toolId_fkey" 
  FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tool_maintenance" ADD CONSTRAINT "tool_maintenance_toolId_fkey" 
  FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

