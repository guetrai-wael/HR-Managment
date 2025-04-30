import React, { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button, Spin, Alert } from "antd";
import { useUser, useJobActions } from "../../hooks";
import dayjs from "dayjs";
import { Job, JobFormProps, JobFormValues } from "../../types";
import { Department } from "../../types/models";
import { fetchDepartments } from "../../services/api";
import { handleError } from "../../utils/errorHandler";

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
  const {
    handleCreateJob,
    handleUpdateJob,
    loading: submitting,
  } = useJobActions();

  // State for departments list and loading/error status
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const isEditMode = !!jobId;

  // Fetch departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      setDepartmentError(null);
      try {
        const fetchedDepartments = await fetchDepartments();
        setDepartments(fetchedDepartments || []);
      } catch (error) {
        setDepartmentError("Failed to load departments list.");
        handleError(error, {
          userMessage: "Could not load departments for the form.",
        });
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadDepartments();
  }, []);

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
    try {
      const jobData: Partial<Job> = {
        title: values.title || "Untitled Job",
        description: values.description || "No description provided",
        requirements: values.requirements || "No requirements specified",
        responsibilities:
          values.responsibilities || "No responsibilities specified",
        department_id: values.department_id,
        location: values.location || "Remote",
        status: values.status || "Open",
        salary: values.salary || null,
        deadline: values.deadline ? values.deadline.format("YYYY-MM-DD") : null,
      };

      // Add posted_by only for new jobs
      if (!isEditMode && user?.id) {
        jobData.posted_by = user.id;
      }

      let success = false;
      if (isEditMode && jobId) {
        const updatedJob = await handleUpdateJob(jobId, jobData);
        success = !!updatedJob;
      } else {
        const newJob = await handleCreateJob(jobData);
        success = !!newJob;
      }

      if (success) {
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      handleError(error, { userMessage: "Failed to save job" });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="job-form-container max-w-full"
    >
      {loadingDepartments && <Spin tip="Loading departments..." />}
      {departmentError && !loadingDepartments && (
        <Alert
          message={departmentError}
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        {/* Left column */}
        <div>
          <Form.Item
            name="title"
            label="Job Title"
            rules={[{ required: true, message: "Please enter the job title" }]}
          >
            <Input placeholder="e.g., Senior Frontend Developer" />
          </Form.Item>

          <Form.Item
            name="department_id"
            label="Department"
            rules={[{ required: true, message: "Please select a department" }]}
          >
            <Select
              placeholder="Select a department"
              loading={loadingDepartments}
              disabled={loadingDepartments || !!departmentError}
            >
              {departments.map((dept) => (
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
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select>
              <Option value="Open">Open</Option>
              <Option value="Closed">Closed</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Application Deadline"
            rules={[
              { required: true, message: "Please set an application deadline" },
            ]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </div>
      </div>

      <Form.Item
        name="description"
        label="Job Description"
        rules={[{ required: true, message: "Please enter a job description" }]}
      >
        <TextArea rows={4} placeholder="Describe the position and company..." />
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

      <div className="form-actions-container flex-col-reverse sm:flex-row sm:justify-end">
        <Button onClick={handleCancel} className="!w-full sm:!w-auto">
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          className="!w-full sm:!w-auto"
          disabled={loadingDepartments || !!departmentError} // Disable submit if departments failed
        >
          {isEditMode ? "Update Job" : "Post Job"}
        </Button>
      </div>
    </Form>
  );
};

export default JobForm;
