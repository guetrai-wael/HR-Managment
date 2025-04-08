import React, { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button } from "antd";
import { useUser, useJobActions } from "../../hooks";
import dayjs from "dayjs";
import { Job, JobFormProps } from "../../types";

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

  const [departments] = useState<string[]>([
    "Engineering",
    "Marketing",
    "Finance",
    "HR",
    "Operations",
    "Design",
    "Sales",
    "Customer Support",
  ]);

  const isEditMode = !!jobId;

  useEffect(() => {
    // If in edit mode and initialValues are provided, set form values
    if (isEditMode && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        deadline: initialValues.deadline ? dayjs(initialValues.deadline) : null,
      });
    }
  }, [form, initialValues, isEditMode]);

  const handleSubmit = async (values: any) => {
    try {
      // Ensure all required fields are present
      const jobData: Partial<Job> = {
        title: values.title || "Untitled Job",
        description: values.description || "No description provided",
        requirements: values.requirements || "No requirements specified",
        responsibilities:
          values.responsibilities || "No responsibilities specified",
        department: values.department || "General",
        location: values.location || "Remote",
        status: values.status || "Open",
        salary: values.salary || null, // Optional field
        deadline: values.deadline
          ? new Date(values.deadline).toISOString().split("T")[0]
          : null,
      };

      // Add posted_by only for new jobs
      if (!isEditMode && user?.id) {
        jobData.posted_by = user.id;
      }

      let success = false;
      if (isEditMode && jobId) {
        // Use the hook to update
        const updatedJob = await handleUpdateJob(jobId, jobData);
        success = !!updatedJob;
      } else {
        // Use the hook to create
        const newJob = await handleCreateJob(jobData);
        success = !!newJob;
      }

      if (success) {
        form.resetFields();
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to save job:", error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        status: "New",
        department: "Engineering",
      }}
    >
      <Form.Item
        name="title"
        label="Job Title"
        rules={[{ required: true, message: "Please enter the job title" }]}
      >
        <Input placeholder="e.g., Senior Frontend Developer" />
      </Form.Item>

      <Form.Item
        name="department"
        label="Department"
        rules={[{ required: true, message: "Please select a department" }]}
      >
        <Select>
          {departments.map((dept) => (
            <Option key={dept} value={dept}>
              {dept}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="location"
        label="Location"
        rules={[{ required: true, message: "Please enter the job location" }]}
      >
        <Input placeholder="e.g., Remote, New York, Hybrid" />
      </Form.Item>

      <Form.Item
        name="salary"
        label="Salary Range"
        rules={[{ required: true, message: "Please enter the salary range" }]}
      >
        <Input placeholder="e.g., $80,000 - $100,000" />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: "Please select a status" }]}
      >
        <Select>
          <Option value="New">New</Option>
          <Option value="Open">Open</Option>
          <Option value="Featured">Featured</Option>
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
        <Button onClick={onCancel} className="!w-full sm:!w-auto">
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          className="!w-full sm:!w-auto"
        >
          {isEditMode ? "Update Job" : "Post Job"}
        </Button>
      </div>
    </Form>
  );
};

export default JobForm;
