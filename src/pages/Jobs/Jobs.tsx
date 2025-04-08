import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { Modal, message, Spin } from "antd";
import { Header, SectionHeader, JobCard } from "../../components/common/index";
import { JobForm } from "../../components/Jobs/index";
import { useRole, useJobActions } from "../../hooks";
import { fetchJobs } from "../../services/api/jobService";
import { Job } from "../../types";

const Jobs = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { handleDeleteJob } = useJobActions();

  // State variables
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFormVisible, setJobFormVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Use the new service function instead of direct Supabase call
  const loadJobs = async () => {
    setLoading(true);
    try {
      // Replace the direct Supabase call with our service function
      const data = await fetchJobs(activeTab !== "all" ? activeTab : undefined);
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      message.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs on initial load and when activeTab changes
  useEffect(() => {
    loadJobs();
  }, [activeTab]);

  const handleViewJob = (id: number) => {
    navigate(`/jobs/${id}`);
  };

  const handleAddJob = () => {
    setSelectedJob(null);
    setJobFormVisible(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setJobFormVisible(true);
  };

  // Use the service function instead of direct Supabase call
  const onDeleteJob = async (id: number) => {
    const success = await handleDeleteJob(id);
    if (success) {
      loadJobs(); // Refresh the job list
    }
  };

  // Define the department tabs for filtering
  const departmentTabs = [
    { key: "all", label: "All" },
    { key: "Engineering", label: "Engineering" },
    { key: "Marketing", label: "Marketing" },
    { key: "Finance", label: "Finance" },
    { key: "HR", label: "HR" },
    { key: "Design", label: "Design" },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      <div className="px-4 md:px-8 mb-6">
        <Header title="Jobs" />
      </div>

      <div className="px-4 md:px-8 space-y-10">
        {/* Featured Jobs Section */}
        <SectionHeader
          title="Available Jobs"
          subtitle="Apply to jobs that match your skills and experience"
          tabs={departmentTabs}
          defaultActiveTab="all"
          onTabChange={setActiveTab}
          actionButton={
            isAdmin
              ? {
                  icon: <PlusOutlined />,
                  label: "Add Job",
                  onClick: handleAddJob,
                }
              : undefined
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No jobs available in this category
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                title={job.title}
                description={job.description}
                status={job.status}
                icon="featured"
                deadline={job.deadline}
                onActionClick={() => handleViewJob(job.id)}
                onApplyClick={() => handleViewJob(job.id)}
                onEditClick={() => handleEditJob(job)}
                onDeleteClick={() => onDeleteJob(job.id)}
                showApplyButton={!isAdmin}
                showEditButton={isAdmin}
                showDeleteButton={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Job Add/Edit Modal */}
      <Modal
        title={selectedJob ? "Edit Job" : "Add New Job"}
        open={jobFormVisible}
        onCancel={() => setJobFormVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: "800px" }}
        className="responsive-modal"
      >
        <JobForm
          jobId={selectedJob?.id}
          initialValues={selectedJob}
          onSuccess={() => {
            setJobFormVisible(false);
            loadJobs();
          }}
          onCancel={() => setJobFormVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default Jobs;
