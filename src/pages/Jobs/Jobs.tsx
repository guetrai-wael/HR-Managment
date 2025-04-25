import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { Modal, message, Spin } from "antd";
import { Header, SectionHeader } from "../../components/common/index";
import { JobCard } from "../../components/Jobs/index";
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

  // Add a fetchId ref to prevent race conditions
  const fetchId = useRef(0);

  // Use the new service function instead of direct Supabase call
  const loadJobs = async () => {
    const currentFetch = ++fetchId.current;
    setLoading(true);

    try {
      // Add timeout protection
      const data = await Promise.race([
        fetchJobs(activeTab !== "all" ? activeTab : undefined),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 10000)
        ),
      ]);

      // Only update state if this is still the most recent fetch
      if (fetchId.current === currentFetch) {
        console.log("Jobs loaded:", data?.length || 0);
        setJobs(data || []);
      }
    } catch (error) {
      // Only update state if this is still the most recent fetch
      if (fetchId.current === currentFetch) {
        console.error("Error fetching jobs:", error);
        message.error("Failed to load jobs");
        setJobs([]);
      }
    } finally {
      // Only clear loading if this is still the most recent fetch
      if (fetchId.current === currentFetch) {
        setLoading(false);
      }
    }
  };

  // Fetch jobs on initial load and when activeTab changes
  useEffect(() => {
    loadJobs();
    // Cleanup function to handle unmounting
    return () => {
      // This prevents state updates after unmount by marking the current fetch as stale
      fetchId.current = -1;
    };
  }, [activeTab]);

  // Rest of your component remains the same...

  // Existing handlers
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

  const onDeleteJob = async (id: number) => {
    const success = await handleDeleteJob(id);
    if (success) {
      loadJobs();
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
