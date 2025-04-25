import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Descriptions, Tag, Modal, Spin, message } from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { Header } from "../../components/common";
import { ApplicationForm } from "../../components/Jobs/index";
import supabase from "../../services/supabaseClient";
import { useUser, useRole } from "../../hooks";
import { getJobById } from "../../services/api/jobService";
import { handleError } from "../../utils/errorHandler";
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

  // Add fetchId ref to track the latest request
  const fetchId = useRef(0);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      const currentFetch = ++fetchId.current;
      setLoading(true);

      try {
        // Add timeout protection
        const jobData = await Promise.race([
          getJobById(id),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 10000)
          ),
        ]);

        // Only update state if this is still the most recent fetch
        if (fetchId.current === currentFetch) {
          setJob(jobData);
        }

        // Check if user already applied
        if (user && fetchId.current === currentFetch) {
          const { data: applicationData, error: applicationError } =
            await supabase
              .from("applications")
              .select("id")
              .eq("job_id", id)
              .eq("user_id", user.id)
              .maybeSingle();

          if (applicationError && fetchId.current === currentFetch)
            throw applicationError;
          if (fetchId.current === currentFetch) {
            setAlreadyApplied(!!applicationData);
          }
        }
      } catch (error) {
        // Only update error state if this is still the most recent fetch
        if (fetchId.current === currentFetch) {
          handleError(error, {
            userMessage: "Failed to load job details",
          });
        }
      } finally {
        // Only reset loading if this is still the most recent fetch
        if (fetchId.current === currentFetch) {
          setLoading(false);
        }
      }
    };

    fetchJob();

    // Cleanup function for unmounting
    return () => {
      fetchId.current = -1; // Mark all in-flight requests as stale
    };
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

  // Rest of your component remains the same
  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      {/* Header section with back button */}
      <div className="px-4 md:px-8 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center"
        >
          <span>Back to Jobs</span>
        </Button>
        {/* Use truncate to prevent very long titles from breaking layout */}
        <Header
          title={<span className="truncate block">{jobData.title}</span>}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12 md:p-20">
          <Spin size="large" />
        </div>
      ) : (
        <div className="px-4 md:px-8 space-y-6 md:space-y-8">
          {/* Status tag and apply button - responsive flex layout */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <Tag color="green" className="text-sm py-1 px-3">
              {jobData.status}
            </Tag>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleApply}
              disabled={alreadyApplied || isAdmin}
              className="min-w-[120px]"
            >
              {alreadyApplied
                ? "Applied"
                : isAdmin
                ? "Admin Mode"
                : "Apply Now"}
            </Button>
          </div>

          {/* Job details in responsive descriptions component */}
          <div className="job-details-table max-w-xl w-full overflow-hidden">
            <Descriptions
              bordered
              column={1}
              className="job-details-descriptions"
              size="small"
              labelStyle={{ fontWeight: 500 }}
            >
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
          </div>

          {/* Job information sections with word-break for mobile */}
          <div className="max-w-3xl">
            <h3 className="text-lg font-medium mb-3">Description</h3>
            <p className="whitespace-pre-line break-words text-gray-700">
              {jobData.description}
            </p>
          </div>

          <div className="max-w-3xl">
            <h3 className="text-lg font-medium mb-3">Requirements</h3>
            <p className="whitespace-pre-line break-words text-gray-700">
              {jobData.requirements}
            </p>
          </div>

          <div className="max-w-3xl">
            <h3 className="text-lg font-medium mb-3">Responsibilities</h3>
            <p className="whitespace-pre-line break-words text-gray-700">
              {jobData.responsibilities}
            </p>
          </div>
        </div>
      )}

      {/* Application Modal - Improved for mobile */}
      <Modal
        title={`Apply for ${jobData.title}`}
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        footer={null}
        width={650}
        style={{ maxWidth: "95%" }}
        bodyStyle={{ padding: "16px" }}
        className="job-application-modal"
        maskClosable={false}
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
