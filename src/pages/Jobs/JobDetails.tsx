import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Descriptions, Tag, Modal, Spin, message, Alert } from "antd";
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

  const fetchId = useRef(0);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      const currentFetch = ++fetchId.current;
      setLoading(true);

      try {
        const jobData = await Promise.race([
          getJobById(id),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 10000)
          ),
        ]);

        if (fetchId.current === currentFetch) {
          setJob(jobData);
        }

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
        if (fetchId.current === currentFetch) {
          handleError(error, {
            userMessage: "Failed to load job details",
          });
        }
      } finally {
        if (fetchId.current === currentFetch) {
          setLoading(false);
        }
      }
    };

    fetchJob();

    return () => {
      fetchId.current = -1;
    };
  }, [id, user]);

  // --- Deadline Logic ---
  const isPastDeadline = (() => {
    if (!job?.deadline) return false;
    const deadlineDate = new Date(job.deadline);
    deadlineDate.setHours(23, 59, 59, 999);
    const today = new Date();
    return today > deadlineDate;
  })();

  // Determine the status to display
  const effectiveStatus = isPastDeadline ? "Closed" : job?.status;
  // --- End Deadline Logic ---

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

    // <<< Add check for past deadline >>>
    if (isPastDeadline) {
      message.warning("The application deadline for this job has passed.");
      return;
    }

    setApplyModalVisible(true);
  };

  const handleApplicationSuccess = () => {
    setApplyModalVisible(false);
    setAlreadyApplied(true);
    message.success("Application submitted successfully!");
  };

  if (!id && !loading) {
    return (
      <Alert message="Job ID is missing or invalid." type="error" showIcon />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return (
      <Alert message="Job not found." type="warning" showIcon className="m-8" />
    );
  }

  // Determine if Apply button should be disabled
  const isApplyDisabled = alreadyApplied || isAdmin || isPastDeadline;

  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      {/* Header */}
      <div className="px-4 md:px-8 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center"
        >
          <span>Back to Jobs</span>
        </Button>
        <Header title={<span className="truncate block">{job.title}</span>} />
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 space-y-6 md:space-y-8">
        {/* Status tag and apply button */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          {/* <<< Use effectiveStatus for Tag >>> */}
          <Tag
            color={effectiveStatus === "Closed" ? "red" : "green"}
            className="text-sm py-1 px-3"
          >
            {effectiveStatus}
          </Tag>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleApply}
            disabled={isApplyDisabled} // <<< Use combined disabled state
            className="min-w-[120px]"
          >
            {alreadyApplied
              ? "Applied"
              : isAdmin
              ? "Admin Mode"
              : isPastDeadline // <<< Add text for past deadline
              ? "Deadline Passed"
              : "Apply Now"}
          </Button>
        </div>

        {/* Job details */}
        <div className="job-details-table max-w-xl w-full overflow-hidden">
          <Descriptions
            bordered
            column={1}
            className="job-details-descriptions"
            size="small"
            labelStyle={{ fontWeight: 500 }}
          >
            <Descriptions.Item label="Department">
              {job.department?.name || "Not specified"}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {job.location}
            </Descriptions.Item>
            <Descriptions.Item label="Salary">
              {job.salary || "Not specified"}
            </Descriptions.Item>
            <Descriptions.Item label="Posted Date">
              {job.posted_at
                ? new Date(job.posted_at).toLocaleDateString()
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Deadline">
              {job.deadline
                ? new Date(job.deadline).toLocaleDateString()
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Description, Requirements, Responsibilities */}
        <div className="max-w-3xl">
          <h3 className="text-lg font-medium mb-3">Description</h3>
          <p className="whitespace-pre-line break-words text-gray-700">
            {job.description || "No description provided."}
          </p>
        </div>
        <div className="max-w-3xl">
          <h3 className="text-lg font-medium mb-3">Requirements</h3>
          <p className="whitespace-pre-line break-words text-gray-700">
            {job.requirements || "No requirements provided."}
          </p>
        </div>
        <div className="max-w-3xl">
          <h3 className="text-lg font-medium mb-3">Responsibilities</h3>
          <p className="whitespace-pre-line break-words text-gray-700">
            {job.responsibilities || "No responsibilities provided."}
          </p>
        </div>
      </div>

      {/* Application Modal */}
      <Modal
        title={`Apply for ${job.title}`}
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
          jobId={job.id}
          jobTitle={job.title}
          onSuccess={handleApplicationSuccess}
          onCancel={() => setApplyModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default JobDetails;
