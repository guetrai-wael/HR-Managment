# Service Layer Standardization Template

## Overview

This template defines the standardized patterns for all API service files in our React application. These patterns ensure consistency, maintainability, and type safety across the service layer.

## Core Principles

### 1. Import Organization

```typescript
// External libraries (alphabetical)
import dayjs from "dayjs";

// Internal services
import supabase from "../supabaseClient";

// Types (grouped by source)
import type { EntityType, FilterType, ResponseType } from "../../types/models";
import type { ServiceSpecificType } from "../../types/components";
```

### 2. Service Structure Pattern

```typescript
// Use object-based exports for consistency
export const entityService = {
  // Core CRUD operations first
  async getAll(filters?: FilterType): Promise<EntityType[]> {
    // Implementation
  },

  async getById(id: string): Promise<EntityType | null> {
    // Implementation
  },

  async create(data: CreateEntityType): Promise<EntityType> {
    // Implementation
  },

  async update(id: string, data: UpdateEntityType): Promise<EntityType> {
    // Implementation
  },

  async delete(id: string): Promise<void> {
    // Implementation
  },

  // Business logic operations after CRUD
  async customOperation(params: ParamType): Promise<ReturnType> {
    // Implementation
  },
};
```

### 3. Error Handling Pattern

```typescript
// Standardized error handling for all service methods
try {
  const { data, error } = await supabase.from("table_name").select("*");

  if (error) {
    console.error(`[${serviceName}] Operation failed:`, error);
    throw error;
  }

  return data || [];
} catch (error) {
  console.error(`[${serviceName}] Unexpected error:`, error);
  throw error;
}
```

### 4. Query Building Pattern

```typescript
// Standardized Supabase query building
let query = supabase.from("table_name").select(`
    *,
    related_table:related_table_name!foreign_key_constraint (
      id,
      name,
      other_field
    )
  `);

// Apply filters conditionally
if (filters?.someFilter) {
  query = query.eq("field_name", filters.someFilter);
}

// Apply ordering consistently
query = query.order("created_at", { ascending: false });
```

### 5. Type Safety Requirements

```typescript
// Always provide explicit return types
async getEntity(id: string): Promise<EntityType | null> {
  // Type the query result appropriately
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("id", id)
    .maybeSingle(); // Use maybeSingle for single records that might not exist

  if (error) {
    console.error(`[entityService] getEntity failed:`, error);
    throw error;
  }

  return data as EntityType | null;
}
```

### 6. Documentation Standards

```typescript
/**
 * Retrieves all entities with optional filtering
 * @param filters Optional filters to apply to the query
 * @returns Promise that resolves to array of entities
 * @throws Error if database operation fails
 */
async getAll(filters?: FilterType): Promise<EntityType[]> {
  // Implementation
}
```

### 7. Consistent Response Patterns

```typescript
// For collections - always return array, never null
async getAll(): Promise<EntityType[]> {
  // ... query logic
  return data || [];
}

// For single entities - return null if not found
async getById(id: string): Promise<EntityType | null> {
  // ... query logic
  return data || null;
}

// For operations that modify data - return the modified entity
async create(data: CreateType): Promise<EntityType> {
  // ... creation logic
  return data as EntityType;
}

// For delete operations - return void
async delete(id: string): Promise<void> {
  // ... deletion logic
}
```

### 8. Service Export Pattern

```typescript
// File: entityService.ts
export const entityService = {
  // All methods here
};

// File: index.ts
export { entityService } from "./entityService";
export { otherService } from "./otherService";
```

## Implementation Guidelines

1. **Start with Type Definitions**: Ensure all input/output types are properly defined
2. **Implement Core CRUD First**: getAll, getById, create, update, delete
3. **Add Business Logic**: Custom operations after basic CRUD is complete
4. **Consistent Naming**: Use consistent method names across all services
5. **Error Logging**: Always log errors with service name prefix for debugging
6. **Query Optimization**: Use appropriate Supabase query methods (single, maybeSingle)
7. **Filter Handling**: Consistent pattern for applying optional filters

## Benefits

- **Consistency**: All services follow the same patterns
- **Maintainability**: Easy to understand and modify any service
- **Type Safety**: Full TypeScript support with proper typing
- **Debugging**: Consistent error logging makes issues easier to track
- **Scalability**: Easy to add new services following the same pattern
- **Code Review**: Standardized patterns make reviews more efficient

This template ensures that all service files maintain the same high quality and consistency that we've achieved with our hook standardization.
