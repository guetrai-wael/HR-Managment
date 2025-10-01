import React from "react";
import { Card, Row, Col } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

interface AttendanceAlert {
  name: string;
  email: string;
  rate: number;
  department?: string;
}

interface DepartmentStat {
  department: string;
  employeeCount: number;
  averageAttendance: number;
  totalHours: number;
}

interface DepartmentAnalyticsProps {
  departmentStats: DepartmentStat[];
  attendanceAlerts: AttendanceAlert[];
}

const DepartmentAnalytics: React.FC<DepartmentAnalyticsProps> = ({
  departmentStats,
  attendanceAlerts,
}) => {
  return (
    <Row gutter={16}>
      <Col span={16}>
        <Card title="📈 Department Performance">
          {departmentStats.length > 0 ? (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {departmentStats.map((dept, index) => (
                <div
                  key={dept.department}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom:
                      index < departmentStats.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                  }}
                >
                  <div>
                    <strong>{dept.department}</strong>
                    <span style={{ color: "#666", marginLeft: 8 }}>
                      ({dept.employeeCount} employees)
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color:
                          dept.averageAttendance >= 80
                            ? "#3f8600"
                            : dept.averageAttendance >= 60
                            ? "#faad14"
                            : "#cf1322",
                        fontWeight: "bold",
                      }}
                    >
                      {dept.averageAttendance.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {dept.totalHours}h total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#999" }}>
              No department data available
            </p>
          )}
        </Card>
      </Col>
      <Col span={8}>
        <Card title="⚠️ Needs Attention">
          {attendanceAlerts.length > 0 ? (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {attendanceAlerts.slice(0, 5).map((employee, index) => (
                <div
                  key={employee.email}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom:
                      index < Math.min(attendanceAlerts.length, 5) - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 13 }}>
                      {employee.name}
                    </div>
                    {employee.department && (
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {employee.department}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      color: "#cf1322",
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    {employee.rate}%
                  </div>
                </div>
              ))}
              {attendanceAlerts.length > 5 && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 8,
                    color: "#666",
                    fontSize: 12,
                  }}
                >
                  +{attendanceAlerts.length - 5} more
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#3f8600" }}>
              <CheckCircleOutlined style={{ fontSize: 20, marginBottom: 8 }} />
              <p style={{ margin: 0 }}>All employees performing well!</p>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default DepartmentAnalytics;
