# Hierarchical Category System

## Overview
The category system now supports **hierarchical** and **many-to-many** relationships using a single `Category` model. This allows for flexible organization where:
- Categories can have parent-child relationships (unlimited nesting levels)
- Categories can link to multiple other categories
- Sub-categories can themselves have sub-categories

## Database Model

```prisma
model Category {
  id          String         @id @default(cuid())
  name        String         @unique
  description String?
  color       String?
  icon        String?
  type        CategoryType   // INCOME, EXPENSE, BOTH
  parentId    String?       // Links to parent category
  status      CategoryStatus @default(ACTIVE)
  sortOrder   Int           @default(0)

  // Tax Information
  taxDeductible Boolean @default(false)
  taxCategory   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  // Hierarchical self-referential relationship
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  
  // Many-to-many self-referential relationship for linking categories
  relatedCategories Category[] @relation("CategoryLinks")
  relatedBy         Category[] @relation("CategoryLinks")
  
  // Other relations
  transactions Transaction[]
  budgets      BudgetItem[]
  splits       TransactionSplit[]
  Expense      Expense[]
}
```

## Key Features

### 1. Hierarchical Structure (Parent-Child)
- **One parent, multiple children**: Each category can have one parent but unlimited children
- **Unlimited nesting**: Sub-categories can have their own sub-categories
- **Example structure**:
  ```
  Office Supplies (Main)
  ├── Stationery (Sub)
  │   ├── Pens (Sub-sub)
  │   └── Paper (Sub-sub)
  └── Technology (Sub)
      ├── Computers (Sub-sub)
      └── Software (Sub-sub)
  ```

### 2. Many-to-Many Category Links
- **Multiple related categories**: A category can be linked to multiple other categories
- **Bidirectional linking**: Uses `relatedCategories` and `relatedBy`
- **Use cases**:
  - Group similar categories across different hierarchies
  - Create category tags or associations
  - Link categories that often appear together

### 3. Category Types
```typescript
enum CategoryType {
  INCOME   // For income categories
  EXPENSE  // For expense categories
  BOTH     // Can be used for both
}
```

### 4. Category Status
```typescript
enum CategoryStatus {
  ACTIVE   // Active and visible
  INACTIVE // Hidden but not deleted
}
```

## Usage Examples

### Creating a Main Category
```typescript
await db.category.create({
  data: {
    name: "Office Supplies",
    type: "EXPENSE",
    status: "ACTIVE",
    description: "All office-related supplies",
    color: "#3B82F6",
    icon: "briefcase",
  }
});
```

### Creating a Sub-Category
```typescript
await db.category.create({
  data: {
    name: "Stationery",
    type: "EXPENSE",
    status: "ACTIVE",
    parentId: "office-supplies-id", // Link to parent
    description: "Writing materials and paper products",
    color: "#10B981",
    icon: "pencil",
  }
});
```

### Creating a Sub-Sub-Category
```typescript
await db.category.create({
  data: {
    name: "Pens",
    type: "EXPENSE",
    status: "ACTIVE",
    parentId: "stationery-id", // Link to parent (which is itself a sub-category)
    description: "Writing pens and markers",
    color: "#EF4444",
    icon: "pen",
  }
});
```

### Linking Categories (Many-to-Many)
```typescript
// Link "Marketing Materials" to "Office Supplies"
await db.category.update({
  where: { id: "marketing-materials-id" },
  data: {
    relatedCategories: {
      connect: [
        { id: "office-supplies-id" },
        { id: "advertising-id" },
      ]
    }
  }
});
```

### Fetching Categories with Relationships
```typescript
// Get all main categories with children
const mainCategories = await db.category.findMany({
  where: { parentId: null },
  include: {
    children: {
      include: {
        children: true, // Include sub-sub-categories
      }
    },
    relatedCategories: true,
  }
});

// Get a specific category with full hierarchy
const category = await db.category.findUnique({
  where: { id: "category-id" },
  include: {
    parent: true,
    children: true,
    relatedCategories: true,
    relatedBy: true,
  }
});
```

## TypeScript Interface

```typescript
interface Category {
  id: string;
  name: string;
  type: CategoryType;
  status: CategoryStatus;
  description: string | null;
  color: string | null;
  icon: string | null;
  
  // Hierarchical relationships
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  
  // Many-to-many category links
  relatedCategories?: Category[];
  relatedBy?: Category[];
  
  transactions: Transaction[];
  transactionCount: number;
  totalAmount: number;
}
```

## Benefits

1. **Single Model**: No need for separate MainCategory and SubCategory models
2. **Flexible Hierarchy**: Unlimited nesting levels
3. **Cross-linking**: Categories can be related across different hierarchies
4. **Type Safety**: Full TypeScript support with Prisma
5. **Scalable**: Can grow from simple flat structure to complex hierarchies
6. **Maintainable**: Single source of truth for all categories

## Migration Status

✅ **Database Updated**: The schema has been updated with the new relationships
✅ **TypeScript Types Updated**: Category interface includes all new fields
✅ **Backward Compatible**: Existing categories continue to work (parentId is optional)

## Next Steps

To fully utilize the new category system, you may want to:
1. Update the category management UI to support parent selection
2. Add UI for linking related categories
3. Implement recursive category tree display
4. Add breadcumb navigation for nested categories
5. Create category hierarchy visualization
