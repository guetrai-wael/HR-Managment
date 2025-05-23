import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Modal, message, Select, Button } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "../../components/common/index";
import QueryBoundary from "../../components/common/QueryBoundary";
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
  const queryClient = useQueryClient();
  const [jobFormVisible, setJobFormVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | "all"
  >("all");

  const departmentIdToFilter =
    selectedDepartmentId !== "all" ? selectedDepartmentId : undefined;
  const { deleteJob: deleteJobMutation, isDeletingJob } =
    useJobActions(departmentIdToFilter);

  const {
    data: departmentsData,
    isLoading: isLoadingDepartments,
    error: departmentsError,
  } = useQuery<Department[], Error>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    isFetching: isFetchingJobs,
    error: jobsError,
  } = useQuery<Job[], Error>({
    queryKey: ["jobs", departmentIdToFilter],
    queryFn: () => fetchJobs(departmentIdToFilter),
    enabled: !!departmentsData,
  });

  const jobs = jobsData || [];
  const departments = departmentsData || [];

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
          await deleteJobMutation(id);
          message.success(`Job "${title}" deleted successfully.`);
        } catch (error) {
          console.error(
            "Error during delete confirmation in component:",
            error
          );
        }
      },
    });
  };

  const handleDepartmentChange = (value: number | "all") => {
    setSelectedDepartmentId(value);
  };

  const currentLoading =
    isLoadingDepartments || isLoadingJobs || isFetchingJobs;

  const combinedError = departmentsError || jobsError;

  return (
    <>
      <PageLayout
        title="Job Listings"
        subtitle="Manage and discover job opportunities."
      >
        <div className="space-y-6">
          {/* --- Filter and Action Row --- */}
          <div className="flex justify-between items-center space-x-4 flex-wrap">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-semibold whitespace-nowrap mb-2 sm:mb-0">
                Filter by Department:
              </span>
              <Select
                value={selectedDepartmentId}
                style={{ width: 200 }}
                onChange={handleDepartmentChange}
                loading={isLoadingDepartments}
                disabled={isLoadingDepartments || !!departmentsError}
                allowClear={false}
                className="mb-2 sm:mb-0"
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
                loading={isDeletingJob}
              >
                Add Job
              </Button>
            )}
          </div>
          {/* --- End Filter and Action Row --- */}

          {/* Loading/Empty/Job List */}
          <QueryBoundary
            isLoading={currentLoading}
            isError={!!combinedError}
            error={combinedError}
            loadingTip={
              isLoadingDepartments
                ? "Loading departments..."
                : "Loading jobs..."
            }
          >
            {jobs.length === 0 && !currentLoading ? (
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
          </QueryBoundary>
        </div>
      </PageLayout>

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
            queryClient.invalidateQueries({
              queryKey: ["jobs", departmentIdToFilter],
            });
          }}
          onCancel={() => setJobFormVisible(false)}
        />
      </Modal>
    </>
  );
};

export default Jobs;
