import React, { useState, useEffect } from "react";
import { Table, Tag, Button, message, Spin, Modal } from "antd";
import { Header } from "../../components/common/index";
import supabase from "../../services/supabaseClient";
import { useUser, useRole } from "../../hooks";
import { EyeOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

interface Application {
  id: number;
  job_id: number;
  user_id: string;
  applied_at: string;
  status: string;
  cover_letter: string;
  resume_url: string | null;
  jobs: {
    id: number;
    title: string;
    department: string;
  };
  profiles?: {
    email: string;
    full_name: string;
  };
}

const Registrations: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [coverLetterModalVisible, setCoverLetterModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, isAdmin]);

  const fetchApplications = async () => {
    if (!user) return;

    setLoading(true);
    console.log("Current user ID:", user.id);
    console.log("User is admin:", isAdmin);

    try {
      // Start with a simpler query first
      let query = supabase.from("applications").select(`
        id,
        job_id,
        user_id,
        applied_at,
        status,
        cover_letter,
        resume_url,
        jobs:job_id (
          id,
          title,
          department
        )
      `);

      if (!isAdmin) {
        console.log("Filtering for employee's applications only");
        query = query.eq("user_id", user.id);
      } else {
        console.log("Admin user - fetching all applications");
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("Applications fetched:", data);

      // If we got data, fetch profile information for each application
      if (data && data.length > 0) {
        // For admin, fetch profile information for each application
        if (isAdmin) {
          // Get unique user IDs from applications
          const userIds = [...new Set(data.map((app) => app.user_id))];

          // Fetch profile information
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", userIds);

          if (profilesError) throw profilesError;

          console.log("Profiles fetched:", profilesData);

          // Create a map of profiles by id
          const profileMap = {};
          if (profilesData) {
            profilesData.forEach((profile) => {
              profileMap[profile.id] = profile;
            });
          }

          // Attach profile information to each application
          const appsWithProfiles = data.map((app) => ({
            ...app,
            profiles: profileMap[app.user_id] || {
              email: "Unknown",
              full_name: "Unknown User",
            },
          }));

          setApplications(appsWithProfiles);
        } else {
          // For regular users, just use the data as is
          setApplications(data);
        }
      } else {
        setApplications([]);
      }
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      message.error(`Failed to load applications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCoverLetter = (application: Application) => {
    setSelectedApplication(application);
    setCoverLetterModalVisible(true);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      message.success(`Application ${newStatus.toLowerCase()} successfully`);

      // Update status in local state
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    } catch (error: any) {
      console.error("Error updating status:", error);
      message.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleOpenResume = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      message.info("No resume uploaded for this application");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "interview":
        return "processing";
      case "pending":
      default:
        return "warning";
    }
  };

  // Get appropriate columns based on user role
  const getColumns = () => {
    const baseColumns = [
      {
        title: "Job Position",
        dataIndex: ["jobs", "title"],
        key: "title",
        render: (text: string) => text || "Unknown Job",
      },
      {
        title: "Department",
        dataIndex: ["jobs", "department"],
        key: "department",
        render: (text: string) => text || "N/A",
      },
      {
        title: "Applied Date",
        dataIndex: "applied_at",
        key: "applied_at",
        render: (text: string) => new Date(text).toLocaleDateString(),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (text: string) => (
          <Tag color={getStatusColor(text)}>
            {text?.charAt(0).toUpperCase() + text?.slice(1) || "Pending"}
          </Tag>
        ),
      },
    ];

    // Admin gets additional columns
    if (isAdmin) {
      return [
        {
          title: "Applicant",
          dataIndex: ["profiles", "full_name"],
          key: "applicant",
          render: (text: string, record: Application) => (
            <div>
              <div>{text || "Unknown"}</div>
              <div className="text-xs text-gray-500">
                {record.profiles?.email || record.user_id}
              </div>
            </div>
          ),
        },
        ...baseColumns,
        {
          title: "Actions",
          key: "action",
          render: (_: any, record: Application) => (
            <div className="flex flex-wrap gap-2">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewCoverLetter(record)}
              >
                Cover Letter
              </Button>

              {record.resume_url && (
                <Button
                  size="small"
                  onClick={() => handleOpenResume(record.resume_url)}
                >
                  Resume
                </Button>
              )}

              {record.status?.toLowerCase() === "pending" && (
                <>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus(record.id, "Accepted")}
                  >
                    Accept
                  </Button>
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleUpdateStatus(record.id, "Rejected")}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          ),
        },
      ];
    }

    // Regular users get a simpler view
    return [
      ...baseColumns,
      {
        title: "Action",
        key: "action",
        render: (_: any, record: Application) => (
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCoverLetter(record)}
          >
            View Details
          </Button>
        ),
      },
    ];
  };

  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      <div className="px-4 md:px-8 mb-6">
        <Header
          title={isAdmin ? "Manage Applications" : "My Applications"}
          subtitle={
            isAdmin
              ? "Review and manage all job applications"
              : "Track your submitted job applications"
          }
        />
      </div>

      <div className="px-4 md:px-8">
        {roleLoading || loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {isAdmin
              ? "No applications found."
              : "You haven't applied to any jobs yet."}
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={applications}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </div>

      {/* Cover Letter Modal */}
      <Modal
        title="Application Details"
        open={coverLetterModalVisible}
        onCancel={() => setCoverLetterModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCoverLetterModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedApplication && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Position</h3>
              <p>{selectedApplication.jobs?.title || "Unknown position"}</p>
            </div>

            {isAdmin && selectedApplication.profiles && (
              <div>
                <h3 className="font-medium">Applicant</h3>
                <p>{selectedApplication.profiles.full_name || "Unknown"}</p>
                <p className="text-gray-500">
                  {selectedApplication.profiles.email}
                </p>
              </div>
            )}

            <div>
              <h3 className="font-medium">Cover Letter</h3>
              <div className="whitespace-pre-line bg-gray-50 p-4 rounded-md">
                {selectedApplication.cover_letter || "No cover letter provided"}
              </div>
            </div>

            <div>
              <h3 className="font-medium">Status</h3>
              <Tag color={getStatusColor(selectedApplication.status)}>
                {selectedApplication.status?.charAt(0).toUpperCase() +
                  selectedApplication.status?.slice(1) || "Pending"}
              </Tag>
            </div>

            {selectedApplication.resume_url && (
              <div>
                <Button
                  onClick={() =>
                    handleOpenResume(selectedApplication.resume_url)
                  }
                >
                  View Resume
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Registrations;
