import React from "react";
import { Card, Row, Col } from "antd";
import { TrophyOutlined, UserOutlined, RiseOutlined } from "@ant-design/icons";

interface TopPerformer {
  name: string;
  email: string;
  rate?: number;
  consistency?: number;
  improvement?: number;
  department?: string;
}

interface TopPerformersData {
  highestAttendance: TopPerformer[];
  mostConsistent: TopPerformer[];
  mostImproved: TopPerformer[];
}

interface TopPerformersCardProps {
  topPerformers: TopPerformersData;
}

const TopPerformersCard: React.FC<TopPerformersCardProps> = ({
  topPerformers,
}) => {
  const renderPerformerCard = (
    icon: React.ReactNode,
    title: string,
    performers: TopPerformer[],
    valueKey: "rate" | "consistency" | "improvement",
    color: string,
    suffix: string = "%"
  ) => {
    return (
      <Card>
        <div style={{ textAlign: "center" }}>
          {icon}
          <h4 style={{ margin: 0, fontSize: 14 }}>{title}</h4>
          {performers.length > 0 ? (
            <>
              {performers.length === 1 ? (
                <>
                  <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                    {performers[0].name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {valueKey === "improvement" && performers[0][valueKey]! > 0
                      ? "+"
                      : ""}
                    {performers[0][valueKey]}
                    {suffix}
                  </p>
                  {performers[0].department && (
                    <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                      {performers[0].department}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                    {performers.length} employees tied
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {valueKey === "improvement" && performers[0][valueKey]! > 0
                      ? "+"
                      : ""}
                    {performers[0][valueKey]}
                    {suffix}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#666" }}>
                    {performers.map((emp) => emp.name).join(", ")}
                  </p>
                </>
              )}
            </>
          ) : (
            <p
              style={{
                margin: 0,
                color: "#999",
                fontSize: 12,
              }}
            >
              {title === "Most Consistent"
                ? "Requires 3+ recordings and 70%+ attendance"
                : title === "Most Improved"
                ? "No significant improvement"
                : "No data"}
            </p>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Card title="🏆 Top Performers" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={8}>
          {renderPerformerCard(
            <TrophyOutlined
              style={{ fontSize: 24, color: "#faad14", marginBottom: 8 }}
            />,
            "Highest Attendance",
            topPerformers.highestAttendance,
            "rate",
            "#3f8600"
          )}
        </Col>
        <Col span={8}>
          {renderPerformerCard(
            <UserOutlined
              style={{ fontSize: 24, color: "#1890ff", marginBottom: 8 }}
            />,
            "Most Consistent",
            topPerformers.mostConsistent,
            "consistency",
            "#1890ff",
            "% consistency"
          )}
        </Col>
        <Col span={8}>
          {renderPerformerCard(
            <RiseOutlined
              style={{ fontSize: 24, color: "#52c41a", marginBottom: 8 }}
            />,
            "Most Improved",
            topPerformers.mostImproved,
            "improvement",
            "#52c41a"
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default TopPerformersCard;
