import React, { useState } from "react";
import { Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import supabase from "../../services/supabaseClient";
import { useUser } from "../../hooks";

const { TextArea } = Input;

interface ApplicationFormProps {
  jobId: string | number;
  jobTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId,
  jobTitle,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();

  const handleSubmit = async (values: any) => {
    if (!user) {
      message.error("You must be logged in to apply");
      return;
    }

    setSubmitting(true);
    try {
      // Log what we're submitting for debugging
      console.log("Submitting application:", {
        job_id: jobId,
        user_id: user.id,
        cover_letter: values.coverLetter
          ? values.coverLetter.substring(0, 20) + "..."
          : null,
      });

      // First upload the resume if provided
      let resumeUrl = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const file = fileList[0].originFileObj;

        // Create a folder with user ID to organize files
        const filePath = `${user.id}/${Date.now()}-${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Resume upload error:", uploadError);
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }

        // Get the public URL if bucket is public, or signed URL if private
        const { data: urlData } = await supabase.storage
          .from("resumes")
          .getPublicUrl(filePath);

        resumeUrl = urlData?.publicUrl || null;
        console.log("Resume uploaded successfully:", resumeUrl);
      }

      // Prepare application data with all required fields
      const applicationData = {
        job_id: jobId,
        user_id: user.id,
        cover_letter: values.coverLetter || "",
        resume_url: resumeUrl,
        status: "pending",
        applied_at: new Date().toISOString(),
      };
      // Add this check before submitting the application
      const { data: existingApp, error: checkError } = await supabase
        .from("applications")
        .select()
        .eq("job_id", jobId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingApp) {
        message.warning("You have already applied for this job!");
        return;
      }

      // Submit the application
      const { data, error } = await supabase
        .from("applications")
        .insert(applicationData)
        .select();

      if (error) {
        console.error("Application submission error:", error);
        throw error;
      }

      console.log("Application submitted successfully:", data);
      message.success("Application submitted successfully!");
      form.resetFields();
      setFileList([]);
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      // Show a more detailed error message to help debug
      message.error(
        `Failed to submit application: ${error.message || "Unknown error"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isPDF = file.type === "application/pdf";
    const isDocx =
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isPDF && !isDocx) {
      message.error("You can only upload PDF or DOCX files!");
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("File must be smaller than 5MB!");
    }

    return (isPDF || isDocx) && isLt5M;
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <h3 className="text-lg font-medium mb-4">Apply for: {jobTitle}</h3>

      <Form.Item
        name="coverLetter"
        label="Cover Letter"
        rules={[{ required: true, message: "Please write a cover letter" }]}
      >
        <TextArea
          rows={6}
          placeholder="Explain why you're interested in this position and how your experience makes you a good fit..."
        />
      </Form.Item>

      <Form.Item
        name="resume"
        label="Resume/CV"
        rules={[{ required: true, message: "Please upload your resume" }]}
      >
        <Upload
          beforeUpload={beforeUpload}
          maxCount={1}
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
        >
          <Button icon={<UploadOutlined />}>Select File (PDF or DOCX)</Button>
        </Upload>
      </Form.Item>

      <div className="flex justify-end gap-4 mt-6">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          Submit Application
        </Button>
      </div>
    </Form>
  );
};

export default ApplicationForm;
