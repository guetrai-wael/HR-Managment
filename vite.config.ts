import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // UI Framework - split into smaller chunks
          "antd-components": ["antd"],
          "antd-icons": ["@ant-design/icons"],

          // Data fetching and state management
          "query-vendor": ["@tanstack/react-query"],

          // Supabase client
          "supabase-vendor": ["@supabase/supabase-js"],

          // Services - organized by domain
          "core-services": [
            "./src/services/api/core/profileService.ts",
            "./src/services/api/core/avatarService.ts",
            "./src/services/api/core/roleService.ts",
          ],
          "hr-services": [
            "./src/services/api/hr/employeeService.ts",
            "./src/services/api/hr/leaveTypeService.ts",
            "./src/services/api/hr/leaveRequestService.ts",
            "./src/services/api/hr/leaveApprovalService.ts",
          ],
          "recruitment-services": [
            "./src/services/api/recruitment/applicationCrudService.ts",
            "./src/services/api/recruitment/applicationWorkflowService.ts",
            "./src/services/api/recruitment/jobService.ts",
          ],
          "admin-services": ["./src/services/api/admin/departmentService.ts"],
          "analytics-services": [
            "./src/services/api/analytics/statisticsService.ts",
            "./src/services/api/analytics/activityService.ts",
          ],

          // Hooks
          hooks: [
            "./src/hooks/useAuth.ts",
            "./src/hooks/useApplicationActions.ts",
            "./src/hooks/useDashboardData.ts",
            "./src/hooks/useJobActions.ts",
            "./src/hooks/useUser.ts",
          ],

          // Common components
          "common-components": [
            "./src/components/common/DataTable.tsx",
            "./src/components/common/Header.tsx",
            "./src/components/common/Sidebar.tsx",
            "./src/components/common/PageLayout.tsx",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: "esnext",
    minify: "esbuild",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "antd",
      "@ant-design/icons",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
  },
});
