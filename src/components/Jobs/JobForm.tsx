import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker } from "antd"; // Removed Button, Spin, Alert
import { useUser } from "../../hooks";
import { useJobActions } from "../../hooks/useJobActions";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Job, JobFormProps, JobFormValues } from "../../types";
import { Department } from "../../types/models";
import { departmentService } from "../../services/api";
import FormActions from "../common/FormActions";
import QueryBoundary from "../common/QueryBoundary"; // Added QueryBoundary

const { TextArea } = Input;
const { Option } = Select;

const JobForm: React.FC<JobFormProps> = ({
  jobId,
  initialValues,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { user } = useUser();

  const { createJob, isCreatingJob, updateJob, isUpdatingJob } =
    useJobActions();

  const isEditMode = !!jobId;

  const {
    data: departments,
    isLoading: isLoadingDepartments,
    error: departmentError,
    // isFetching: isFetchingDepartments, // if needed for more granular loading
  } = useQuery<Department[], Error>({
    queryKey: ["departments"],
    queryFn: departmentService.getAll,
  });

  useEffect(() => {
    if (isEditMode && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        department_id: initialValues.department_id,
        deadline: initialValues.deadline
          ? dayjs(initialValues.deadline)
          : undefined,
      });
    } else if (!isEditMode) {
      form.resetFields();
    }
  }, [form, initialValues, isEditMode]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = async (values: JobFormValues) => {
    const jobData: Partial<Job> = {
      title: values.title || "Untitled Job",
      description: values.description || "No description provided",
      requirements: values.requirements || "No requirements specified",
      responsibilities:
        values.responsibilities || "No responsibilities specified",
      department_id: values.department_id,
      location: values.location || "Remote",
      salary: values.salary || null,
      deadline: values.deadline ? values.deadline.format("YYYY-MM-DD") : null,
    };

    // Status is now determined automatically by deadline
    const deadlineDate = values.deadline
      ? new Date(values.deadline.format("YYYY-MM-DD"))
      : new Date();
    deadlineDate.setHours(23, 59, 59, 999); // End of deadline day
    const today = new Date();
    jobData.status = today <= deadlineDate ? "Open" : "Closed";

    if (!isEditMode && user?.id) {
      jobData.posted_by = user.id;
    }

    let success = false;
    if (isEditMode && jobId) {
      const updatedJobResult = await updateJob({ id: jobId, jobData });
      success = !!updatedJobResult;
    } else {
      const newJobResult = await createJob(jobData);
      success = !!newJobResult;
    }

    if (success) {
      form.resetFields();
      onSuccess();
    }
  };

  const submitting = isCreatingJob || isUpdatingJob;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="job-form-container max-w-full"
    >
      <QueryBoundary
        isLoading={isLoadingDepartments}
        isError={!!departmentError}
        error={departmentError}
        loadingTip="Loading departments..."
        errorMessage={
          departmentError?.message || "Failed to load departments list."
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {/* Left column */}
          <div>
            <Form.Item
              name="title"
              label="Job Title"
              rules={[
                { required: true, message: "Please enter the job title" },
              ]}
            >
              <Input placeholder="e.g., Senior Frontend Developer" />
            </Form.Item>

            <Form.Item
              name="department_id"
              label="Department"
              rules={[
                { required: true, message: "Please select a department" },
              ]}
            >
              <Select
                placeholder="Select a department"
                loading={isLoadingDepartments} // Keep this for Select's own loading indicator
                disabled={isLoadingDepartments || !!departmentError} // Keep disabled logic
              >
                {(departments || []).map((dept: Department) => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="location"
              label="Location"
              rules={[
                { required: true, message: "Please enter the job location" },
              ]}
            >
              <Input placeholder="e.g., Remote, New York, Hybrid" />
            </Form.Item>
          </div>

          {/* Right column */}
          <div>
            <Form.Item
              name="salary"
              label="Salary Range"
              rules={[
                { required: true, message: "Please enter the salary range" },
              ]}
            >
              <Input placeholder="e.g., $80,000 - $100,000" />
            </Form.Item>

            <Form.Item
              name="deadline"
              label="Application Deadline"
              rules={[
                {
                  required: true,
                  message: "Please set an application deadline",
                },
              ]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
        </div>

        <Form.Item
          name="description"
          label="Job Description"
          rules={[
            { required: true, message: "Please enter a job description" },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Describe the position and company..."
          />
        </Form.Item>

        <Form.Item
          name="requirements"
          label="Requirements"
          rules={[{ required: true, message: "Please enter job requirements" }]}
        >
          <TextArea
            rows={4}
            placeholder="List the requirements, one per line, e.g.:
- 5+ years of React experience
- TypeScript knowledge
- Bachelor's degree or equivalent experience"
          />
        </Form.Item>

        <Form.Item
          name="responsibilities"
          label="Responsibilities"
          rules={[
            { required: true, message: "Please enter job responsibilities" },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="List the responsibilities, one per line, e.g.:
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Code reviews and mentoring junior developers"
          />
        </Form.Item>
      </QueryBoundary>

      <FormActions
        primaryActionText={isEditMode ? "Update Job" : "Post Job"}
        onPrimaryAction={() => form.submit()} // Trigger form submission
        primaryActionProps={{
          loading: submitting,
          // Disable submit if departments are still loading or failed to load, as it's a required field.
          disabled: isLoadingDepartments || !!departmentError || submitting,
          // Remove htmlType="submit" to prevent double submission
        }}
        secondaryActionText="Cancel"
        onSecondaryAction={handleCancel}
      />
    </Form>
  );
};

export default JobForm;
