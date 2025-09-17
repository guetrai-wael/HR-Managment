# Component Structure Template

## Standard Component File Structure

```tsx
// 1. React and core imports first
import React from "react";

// 2. Third-party library imports
import { Typography } from "antd";
import { useNavigate } from "react-router-dom";

// 3. Internal imports - types first, then components, then hooks, then utils
import { ComponentProps } from "../../types";
import { SomeComponent } from "../common";
import { useCustomHook } from "../../hooks";
import { utilityFunction } from "../../utils";

// 4. Interface definitions (if not in types file)
interface LocalProps {
  // Only for component-specific interfaces
}

// 5. Component implementation with descriptive comment
/**
 * Component description explaining its purpose and main functionality
 */
const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2, ...rest }) => {
  // 6. Hooks at the top (order: React hooks, third-party hooks, custom hooks)
  const [localState, setLocalState] = React.useState<string>("");
  const navigate = useNavigate();
  const { customData } = useCustomHook();

  // 7. Event handlers and functions
  const handleAction = React.useCallback(() => {
    // Implementation
  }, []);

  // 8. Early returns for loading/error states
  if (loading) {
    return <div>Loading...</div>;
  }

  // 9. Main render
  return <div className="component-container">{/* Component content */}</div>;
};

// 10. Export (default or named - be consistent)
export default ComponentName;
```

## Key Principles

1. **Import Order**: React → Third-party → Internal (types, components, hooks, utils)
2. **Hooks Order**: React hooks → Third-party hooks → Custom hooks
3. **Early Returns**: Handle loading/error states before main render
4. **TypeScript**: Always type props and state properly
5. **Comments**: JSDoc comment for complex components
6. **Consistent Spacing**: Empty lines between logical sections

## File Naming

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useUserData.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `camelCase.ts` (e.g., `userTypes.ts`)

## Export Patterns

Choose ONE pattern per project:

### Option A: Default Exports (Current choice)

```tsx
const Component = () => { ... };
export default Component;
```

### Option B: Named Exports

```tsx
export const Component = () => { ... };
```

### Index Files (Barrel exports)

```tsx
export { default as ComponentName } from "./ComponentName";
export { default as AnotherComponent } from "./AnotherComponent";
```
