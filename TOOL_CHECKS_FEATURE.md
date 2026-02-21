# Weekly Tool Check Feature Implementation

## Overview

Implemented a comprehensive weekly tool check system that allows administrators to conduct regular inspections of tools allocated to workers. This feature helps track tool condition, identify damage, record costs, and flag lost tools.

## Database Changes

### New Model: ToolCheck

Added a new `ToolCheck` model to the Prisma schema with the following fields:

- `id` - Unique identifier
- `toolId` - Reference to the tool being checked
- `employeeId/freelancerId/traineeId` - Reference to the worker
- `checkDate` - When the check was conducted
- `condition` - Tool condition (NEW, GOOD, FAIR, POOR, DAMAGED)
- `isPresent` - Whether the tool is present
- `isLost` - Whether the tool is lost
- `damageCost` - Cost of damage or repairs
- `damageDescription` - Description of any damage
- `notes` - Additional observations
- `checkedBy` - Who conducted the check
- Timestamps (createdAt, updatedAt)

### Relations Added

- Tool → ToolCheck (one-to-many)
- Employee → ToolCheck (one-to-many)
- FreeLancer → ToolCheck (one-to-many)
- Trainee → ToolCheck (one-to-many)

## API Endpoints

### 1. POST /api/tool-checks

**Purpose:** Create a new tool check record

**Request Body:**

```json
{
  "toolId": "string",
  "employeeId": "string?",
  "freelancerId": "string?",
  "traineeId": "string?",
  "condition": "GOOD | FAIR | POOR | DAMAGED | NEW",
  "isPresent": boolean,
  "isLost": boolean,
  "damageCost": number,
  "damageDescription": "string?",
  "notes": "string?"
}
```

**Features:**

- Records tool check with all details
- Automatically updates tool status if lost or damaged
- Updates tool damage cost and description
- Tracks who conducted the check

### 2. GET /api/tool-checks

**Purpose:** Retrieve tool check history

**Query Parameters:**

- `toolId` - Filter by specific tool
- `employeeId` - Filter by employee
- `freelancerId` - Filter by freelancer
- `traineeId` - Filter by trainee
- `startDate` - Filter checks from date
- `endDate` - Filter checks to date

**Response:** Array of formatted tool check records with worker and tool details

### 3. GET /api/tool-checks/pending

**Purpose:** Get tools that need weekly checks

**Query Parameters:**

- `employeeId` - Filter by employee
- `freelancerId` - Filter by freelancer
- `traineeId` - Filter by trainee

**Features:**

- Returns all allocated tools
- Calculates which tools need checks (>7 days since last check)
- Shows days since last check
- Includes last check details

## Frontend Page

### Location: `/dashboard/tools/checks`

### Features:

#### 1. **Pending Checks Tab**

- Displays all allocated tools
- Highlights tools that need checking (>7 days or never checked)
- Shows:
  - Tool name, serial number, and image
  - Worker name and number
  - Current status and condition
  - Last check date and days since check
  - Visual indicator for tools needing checks
- "Conduct Check" button for each tool

#### 2. **Check History Tab**

- Shows all completed tool checks
- Displays:
  - Check date and time
  - Tool and worker information
  - Condition at time of check
  - Present/Lost status
  - Damage costs and descriptions
  - Additional notes
- Sorted by most recent first

#### 3. **Check Dialog**

- Comprehensive form for conducting checks
- Fields:
  - **Condition dropdown** (NEW, GOOD, FAIR, POOR, DAMAGED)
  - **Is Present checkbox** - Tool is physically present
  - **Is Lost checkbox** - Tool is missing/lost
  - **Damage Cost** - Monetary value of damage/repairs
  - **Damage Description** - Details about damage
  - **Additional Notes** - Any observations
- Auto-shows damage description field when needed
- Validates and submits check data

## Workflow

### Weekly Check Process:

1. Navigate to `/dashboard/tools/checks`
2. View "Pending Checks" tab
3. Tools needing checks are highlighted with orange border
4. Click "Conduct Check" on a tool
5. Fill in the check form:
   - Select current condition
   - Mark if present or lost
   - Enter damage cost if applicable
   - Add damage description
   - Add any notes
6. Submit the check
7. Tool status automatically updates if damaged or lost
8. Check is recorded in history

### Automatic Features:

- Tools are flagged for check if >7 days since last check
- Tool status updates to DAMAGED if damage cost entered
- Tool status updates to LOST if marked as lost
- Check history maintains complete audit trail

## Benefits

1. **Regular Monitoring** - Ensures tools are checked weekly
2. **Damage Tracking** - Records all damage and associated costs
3. **Loss Prevention** - Quickly identifies missing tools
4. **Accountability** - Tracks who checked each tool and when
5. **Cost Management** - Maintains record of all damage/repair costs
6. **Worker Responsibility** - Links tools to specific workers
7. **Audit Trail** - Complete history of all tool inspections

## Next Steps

To activate this feature:

1. **Run Database Migration:**

   ```bash
   npx prisma migrate dev --name add_tool_checks
   ```

2. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

3. **Access the Page:**
   Navigate to `/dashboard/tools/checks` in your application

4. **Add to Navigation:**
   Add a link to the tool checks page in your dashboard navigation menu

## Usage Tips

- Conduct checks weekly for all allocated tools
- Use the "needs check" indicator to prioritize
- Record damage costs immediately when discovered
- Mark tools as lost as soon as they're missing
- Use notes field for detailed observations
- Review check history to identify problematic tools
- Monitor workers with frequent damage reports

## Permissions

The feature respects existing permissions:

- Requires `WORKER_TOOLS_VIEW` permission or higher role
- CEO, Admin Manager, and General Manager have full access
- Checks are attributed to the user who conducted them

