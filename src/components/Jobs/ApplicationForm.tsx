import React, { useState } from "react";
import { Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useUser, useApplicationActions } from "../../hooks";
import { ApplicationFormProps } from "../../types";

const { TextArea } = Input;

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId,
  jobTitle,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const { user } = useUser();
  const { handleSubmitApplication, loading: submitting } =
    useApplicationActions();

  const handleSubmit = async (values: any) => {
    if (!user) {
      message.error("You must be logged in to apply");
      return;
    }

    try {
      // Prepare application data
      const applicationData = {
        job_id: jobId,
        user_id: user.id,
        cover_letter: values.coverLetter || "",
      };

      // Get the file from fileList if available
      const file =
        fileList.length > 0 && fileList[0].originFileObj
          ? fileList[0].originFileObj
          : undefined;

      // Submit application using the service
      const success = await handleSubmitApplication(applicationData, file);

      if (success) {
        form.resetFields();
        setFileList([]);
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
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
          Submit Application
        </Button>
      </div>
    </Form>
  );
};

export default ApplicationForm;
