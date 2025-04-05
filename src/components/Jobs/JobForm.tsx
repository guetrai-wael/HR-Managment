import React, { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button, message } from "antd";
import supabase from "../../services/supabaseClient";
import { useUser } from "../../hooks";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

interface JobFormProps {
  jobId?: number; // Optional - if provided, we're editing an existing job
  initialValues?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const JobForm: React.FC<JobFormProps> = ({
  jobId,
  initialValues,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<string[]>([
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
    setSubmitting(true);
    try {
      console.log("Submitting job with values:", values);

      // Ensure all required fields are present
      const jobData = {
        title: values.title || "Untitled Job",
        description: values.description || "No description provided",
        requirements: values.requirements || "No requirements specified",
        responsibilities:
          values.responsibilities || "No responsibilities specified",
        department: values.department || "General",
        location: values.location || "Remote",
        status: "Open", // Default status
        salary: values.salary || null, // Optional field
        deadline: values.deadline
          ? new Date(values.deadline).toISOString().split("T")[0]
          : null,
        posted_by: user?.id,
      };

      console.log("Prepared job data:", jobData);

      const { data, error } = await supabase
        .from("jobs")
        .insert(jobData)
        .select();

      if (error) {
        console.error("Error creating job:", error);
        throw error;
      }

      console.log("Job created successfully:", data);
      message.success("Job posted successfully!");
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error("Failed to save job:", error);
      message.error(`Failed to save job: ${error.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        status: "Open",
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
          <Option value="Open">Open</Option>
          <Option value="New">New</Option>
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

      <div className="flex justify-end gap-4 mt-6">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {isEditMode ? "Update Job" : "Post Job"}
        </Button>
      </div>
    </Form>
  );
};

export default JobForm;
