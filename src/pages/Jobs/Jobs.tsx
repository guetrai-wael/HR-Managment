import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Modal, message, Spin, Select, Button } from "antd";
import { Header, SectionHeader } from "../../components/common/index";
import { JobCard } from "../../components/Jobs/index";
import { JobForm } from "../../components/Jobs/index";
import { useRole, useJobActions } from "../../hooks";
import { fetchJobs } from "../../services/api/jobService";
import { fetchDepartments } from "../../services/api/departmentService";
import { Job } from "../../types";
import { Department } from "../../types/models";

const { Option } = Select;
const { confirm } = Modal;

const Jobs = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { handleDeleteJob, loading: deleteLoading } = useJobActions();

  // State variables
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [jobFormVisible, setJobFormVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | "all"
  >("all");

  const fetchId = useRef(0);

  // --- Fetch Departments ---
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const fetchedDepartments = await fetchDepartments();
        setDepartments(fetchedDepartments);
      } catch (_error) {
        message.error("Failed to load departments for filtering.");
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadDepartments();
  }, []);

  // --- Memoize loadJobs ---
  const loadJobs = useCallback(async () => {
    const currentFetch = ++fetchId.current;
    setLoading(true);

    try {
      const departmentIdToFilter =
        selectedDepartmentId !== "all" ? selectedDepartmentId : undefined;

      const data = await Promise.race([
        fetchJobs(departmentIdToFilter),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 10000)
        ),
      ]);

      if (fetchId.current === currentFetch) {
        console.log("Jobs loaded:", data?.length || 0);
        setJobs(data || []);
      }
    } catch (error) {
      if (fetchId.current === currentFetch) {
        console.error("Error fetching jobs:", error);
        message.error("Failed to load jobs");
        setJobs([]);
      }
    } finally {
      if (fetchId.current === currentFetch) {
        setLoading(false);
      }
    }
  }, [selectedDepartmentId]);

  // Fetch jobs on initial load and when dependencies change
  useEffect(() => {
    if (!loadingDepartments) {
      loadJobs();
    }
    return () => {
      fetchId.current = -1;
    };
  }, [loadJobs, loadingDepartments]);

  // --- Handlers ---
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

  // --- onDeleteJob ---
  const onDeleteJob = (id: number, title: string) => {
    confirm({
      title: `Are you sure you want to delete the job "${title}"?`,
      icon: <ExclamationCircleFilled />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const success = await handleDeleteJob(id);
          if (success && !loadingDepartments) {
            loadJobs();
          }
        } catch (error) {
          console.error("Error during delete confirmation:", error);
          message.error("An unexpected error occurred during deletion.");
        }
      },
      onCancel() {
        console.log("Delete cancelled");
      },
    });
  };

  const handleDepartmentChange = (value: number | "all") => {
    setSelectedDepartmentId(value);
  };

  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      <div className="px-4 md:px-8 mb-6">
        <Header title="Jobs" />
      </div>

      <div className="px-4 md:px-8 space-y-6">
        {/* --- Section Header --- */}
        <SectionHeader
          title="Available Jobs"
          subtitle="Apply to jobs that match your skills and experience"
          tabs={[]}
        />

        {/* --- Filter and Action Row --- */}
        <div className="flex justify-between items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold whitespace-nowrap">
              Filter by Department:
            </span>
            <Select
              value={selectedDepartmentId}
              style={{ width: 200 }}
              onChange={handleDepartmentChange}
              loading={loadingDepartments}
              disabled={loadingDepartments}
              allowClear={false}
            >
              <Option key="all" value="all">
                All Departments
              </Option>
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </div>
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddJob}
            >
              Add Job
            </Button>
          )}
        </div>
        {/* --- End Filter and Action Row --- */}

        {/* Loading/Empty/Job List */}
        {loading || loadingDepartments ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {selectedDepartmentId === "all"
              ? "No jobs available"
              : "No jobs available in this department"}
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
                deadline={job.deadline ?? undefined}
                onActionClick={() => handleViewJob(job.id)}
                onApplyClick={() => handleViewJob(job.id)}
                onEditClick={() => handleEditJob(job)}
                onDeleteClick={() => onDeleteJob(job.id, job.title)}
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
          initialValues={selectedJob ?? undefined}
          onSuccess={() => {
            setJobFormVisible(false);
            if (!loadingDepartments) {
              loadJobs();
            }
          }}
          onCancel={() => setJobFormVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default Jobs;
