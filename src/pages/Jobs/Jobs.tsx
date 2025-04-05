import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { Modal, message, Spin } from "antd";
import { Header, SectionHeader, JobCard } from "../../components/common/index";
import { JobForm } from "../../components/Jobs/index";
import supabase from "../../services/supabaseClient";
import { useUser, useRole } from "../../hooks";

// Define job interface
interface Job {
  id: number;
  title: string;
  description: string;
  status: string;
  deadline: string;
  department: string;
  // Add other fields as needed
}

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();

  // State variables
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFormVisible, setJobFormVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch jobs from the database
  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("jobs")
        .select("*")
        .order("posted_at", { ascending: false });

      // Apply department filter if not "all"
      if (activeTab !== "all") {
        query = query.eq("department", activeTab);
      }

      const { data, error } = await query;

      if (error) throw error;

      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      message.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs on initial load and when activeTab changes
  useEffect(() => {
    fetchJobs();
  }, [activeTab]);

  const handleViewJob = (id: number) => {
    navigate(`/jobs/${id}`);
  };

  const handleAddJob = () => {
    setSelectedJob(null); // Reset selected job (for new job form)
    setJobFormVisible(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setJobFormVisible(true);
  };

  const handleDeleteJob = async (id: number) => {
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);

      if (error) throw error;

      message.success("Job deleted successfully");
      fetchJobs(); // Refresh the job list
    } catch (error) {
      console.error("Error deleting job:", error);
      message.error("Failed to delete job");
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
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
                onDeleteClick={() => handleDeleteJob(job.id)}
                showApplyButton={!isAdmin} // Only show apply for non-admins
                showEditButton={isAdmin} // Only show edit for admins
                showDeleteButton={isAdmin} // Only show delete for admins
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
        width={800}
      >
        <JobForm
          jobId={selectedJob?.id}
          initialValues={selectedJob}
          onSuccess={() => {
            setJobFormVisible(false);
            fetchJobs();
          }}
          onCancel={() => setJobFormVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default Jobs;
