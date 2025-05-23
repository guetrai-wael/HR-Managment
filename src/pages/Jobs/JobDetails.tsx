import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Descriptions, Tag, Modal, message, Alert } from "antd";
import { SendOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "../../components/common";
import QueryBoundary from "../../components/common/QueryBoundary";
import { ApplicationForm } from "../../components/Jobs/index";
import { useUser, useRole } from "../../hooks";
import { getJobById } from "../../services/api/jobService";
import { checkApplicationStatus } from "../../services/api/applicationService";
import { Job } from "../../types";

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { isAdmin } = useRole();
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: job,
    isLoading: jobIsLoading,
    error: jobError,
    isFetching: jobIsFetching,
  } = useQuery<Job | null, Error>({
    queryKey: ["job", id],
    queryFn: async () => {
      if (!id) return null;
      return getJobById(id);
    },
    enabled: !!id,
  });

  const {
    data: applicationStatus,
    isLoading: applicationStatusIsLoading,
    error: applicationError,
    isFetching: applicationStatusIsFetching,
  } = useQuery<{ applied: boolean }, Error>({
    queryKey: ["applicationStatus", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return { applied: false };
      return checkApplicationStatus(id, user.id);
    },
    enabled: !!user && !!id,
  });

  const alreadyApplied = applicationStatus?.applied || false;
  const isLoading = jobIsLoading || applicationStatusIsLoading;
  const isFetchingData = jobIsFetching || applicationStatusIsFetching;

  const isPastDeadline = (() => {
    if (!job?.deadline) return false;
    const deadlineDate = new Date(job.deadline);
    deadlineDate.setHours(23, 59, 59, 999);
    const today = new Date();
    return today > deadlineDate;
  })();

  const effectiveStatus = isPastDeadline ? "Closed" : job?.status;

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
    if (isPastDeadline) {
      message.warning("The application deadline for this job has passed.");
      return;
    }
    setApplyModalVisible(true);
  };

  const handleApplicationSuccess = () => {
    setApplyModalVisible(false);
    message.success("Application submitted successfully!");
    queryClient.invalidateQueries({
      queryKey: ["applicationStatus", id, user?.id],
    });
  };

  if (!id && !isLoading && !jobError) {
    return (
      <Alert message="Job ID is missing or invalid." type="error" showIcon />
    );
  }

  if (jobError) {
    return (
      <Alert
        message="Error loading job details"
        description={jobError.message || "An unexpected error occurred."}
        type="error"
        showIcon
        className="m-8"
      />
    );
  }

  if (applicationError) {
    return (
      <Alert
        message="Error checking application status"
        description={
          applicationError.message || "An unexpected error occurred."
        }
        type="error"
        showIcon
        className="m-8"
      />
    );
  }

  const isApplyDisabled =
    alreadyApplied || isAdmin || isPastDeadline || isFetchingData;

  return (
    <>
      {/* Back button placed outside PageLayout, but within the main fragment */}
      <div className="px-4 md:px-8 pt-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center"
          disabled={isFetchingData}
        >
          <span>Back to Jobs</span>
        </Button>
      </div>
      <PageLayout
        title={job?.title || "Loading Job Details..."}
        subtitle={
          job?.department?.name
            ? `Department: ${job.department.name}`
            : "Job details and application"
        }
      >
        <QueryBoundary
          isLoading={isLoading}
          isError={false}
          loadingTip="Loading job details..."
        >
          {job ? (
            <div className="space-y-6 md:space-y-8">
              {/* Status tag and apply button */}
              <div className="flex justify-between items-center flex-wrap gap-4">
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
                  disabled={isApplyDisabled}
                  loading={isFetchingData}
                  className="min-w-[120px]"
                >
                  {alreadyApplied
                    ? "Applied"
                    : isAdmin
                    ? "Admin Mode"
                    : isPastDeadline
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
          ) : (
            <Alert message="Job not found." type="warning" showIcon />
          )}
        </QueryBoundary>
      </PageLayout>

      {/* Application Modal */}
      {job && (
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
      )}
    </>
  );
};

export default JobDetails;
