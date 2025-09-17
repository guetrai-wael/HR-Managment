// HR services - employee and workforce management
export { employeeService } from "./employeeService";

// Leave management services (refactored from monolithic leaveService)
export { leaveTypeService } from "./leaveTypeService";
export { leaveRequestService } from "./leaveRequestService";
export { leaveApprovalService } from "./leaveApprovalService";
export { leaveBalanceService } from "./leaveBalanceService";
export { leaveCarryoverService } from "./leaveCarryoverService";

// Export employee types for convenience
export type { EmployeeDataForUI } from "./employeeService";
