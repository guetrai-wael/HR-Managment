import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Descriptions, Tag, Modal, Spin, message } from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { Header } from "../../components/common";
import { ApplicationForm } from "../../components/Jobs/index";
import supabase from "../../services/supabaseClient";
import { useUser, useRole } from "../../hooks";
import { getJobById } from "../../services/api/jobService"; // Import the service
import { Job } from "../../types";

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { isAdmin } = useRole();
  const [loading, setLoading] = useState(true);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      setLoading(true);
      try {
        // Use the service to get job details instead of direct Supabase call
        const jobData = await getJobById(id);
        setJob(jobData);

        // Check if user already applied
        if (user) {
          const { data: applicationData, error: applicationError } =
            await supabase
              .from("applications")
              .select("id")
              .eq("job_id", id)
              .eq("user_id", user.id)
              .maybeSingle();

          if (applicationError) throw applicationError;
          setAlreadyApplied(!!applicationData);
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
        message.error("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, user]);

  const handleApply = () => {
    if (!user) {
      message.warning("Please log in to apply for this job");
      navigate("/login");
      return;
    }

    if (alreadyApplied) {
      message.info("You have already applied for this position");
      return;
    }

    setApplyModalVisible(true);
  };

  const handleApplicationSuccess = () => {
    setApplyModalVisible(false);
    setAlreadyApplied(true);
    message.success("Application submitted successfully!");
  };

  if (!id) {
    return <div>Job not found</div>;
  }

  // Use mock data until the real data loads
  const jobData = job || {
    id: parseInt(id),
    title: "Loading...",
    description: "Loading job description...",
    requirements: "Loading requirements...",
    responsibilities: "Loading responsibilities...",
    status: "Loading",
    deadline: "",
    location: "Loading",
    salary: "Loading",
    department: "Loading",
    posted_at: "",
  };

  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      <div className="px-4 md:px-8 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          Back to Jobs
        </Button>
        <Header title={jobData.title} />
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Spin size="large" />
        </div>
      ) : (
        <div className="px-4 md:px-8 space-y-8">
          <div className="flex justify-between items-center">
            <Tag color="green" className="text-sm py-1 px-3">
              {jobData.status}
            </Tag>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleApply}
              disabled={alreadyApplied || isAdmin}
            >
              {alreadyApplied
                ? "Applied"
                : isAdmin
                ? "Admin Mode"
                : "Apply Now"}
            </Button>
          </div>

          <Descriptions bordered column={1}>
            <Descriptions.Item label="Department">
              {jobData.department}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {jobData.location}
            </Descriptions.Item>
            <Descriptions.Item label="Salary">
              {jobData.salary}
            </Descriptions.Item>
            <Descriptions.Item label="Posted Date">
              {jobData.posted_at}
            </Descriptions.Item>
            <Descriptions.Item label="Deadline">
              {jobData.deadline}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <h3 className="text-lg font-medium mb-3">Description</h3>
            <p className="whitespace-pre-line">{jobData.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Requirements</h3>
            <p className="whitespace-pre-line">{jobData.requirements}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Responsibilities</h3>
            <p className="whitespace-pre-line">{jobData.responsibilities}</p>
          </div>
        </div>
      )}

      {/* Application Modal */}
      <Modal
        title={`Apply for ${jobData.title}`}
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: "800px" }}
        className="responsive-modal"
      >
        <ApplicationForm
          jobId={jobData.id}
          jobTitle={jobData.title}
          onSuccess={handleApplicationSuccess}
          onCancel={() => setApplyModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default JobDetails;
