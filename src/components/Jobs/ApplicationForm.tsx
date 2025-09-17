import React, { useState } from "react";
import { Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import { useUser, useApplicationActions } from "../../hooks";
import { ApplicationFormProps, ApplicationFormValues } from "../../types";
import FormActions from "../common/FormActions";

const { TextArea } = Input;

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId,
  jobTitle: _jobTitle,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const { user } = useUser();

  // 🆕 NEW: Using standardized structure
  const {
    actions,
    isLoading,
    error: applicationError,
  } = useApplicationActions();

  const handleSubmit = async (values: ApplicationFormValues) => {
    if (!user) {
      message.error("You must be logged in to apply");
      return;
    }

    const applicationData = {
      job_id: typeof jobId === "string" ? parseInt(jobId, 10) : jobId,
      user_id: user.id,
      cover_letter: values.coverLetter || "",
    };

    const resumeFile =
      fileList.length > 0 && fileList[0].originFileObj
        ? (fileList[0].originFileObj as File)
        : undefined;

    console.log("[ApplicationForm] File list:", fileList);
    console.log("[ApplicationForm] File list length:", fileList.length);
    if (fileList.length > 0) {
      console.log("[ApplicationForm] First file:", fileList[0]);
      console.log(
        "[ApplicationForm] Origin file obj:",
        fileList[0].originFileObj
      );
    }
    console.log("[ApplicationForm] Resume file to submit:", resumeFile);

    try {
      // 🆕 NEW: Using actions.submitApplication instead of direct submitApplication
      await actions.submitApplication({ applicationData, resumeFile });

      // 🆕 NEW: Success handling moved to try block
      form.resetFields();
      setFileList([]);
      onSuccess();
    } catch (submitError) {
      // 🆕 NEW: Enhanced error handling with centralized applicationError
      console.error("Application submission failed:", submitError);
      if (applicationError) {
        console.error("Application hook error:", applicationError);
      }
      message.error("Failed to submit application. Please try again.");
    }
  };

  const beforeUpload = (file: RcFile) => {
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

    if (!((isPDF || isDocx) && isLt5M)) {
      return Upload.LIST_IGNORE;
    }

    // Create a proper UploadFile object with the original file
    const uploadFile: UploadFile = {
      uid: file.uid || Date.now().toString(),
      name: file.name,
      status: "done",
      originFileObj: file,
    };

    setFileList([uploadFile]);
    console.log("[ApplicationForm] beforeUpload - file set:", uploadFile);
    console.log(
      "[ApplicationForm] beforeUpload - originFileObj:",
      uploadFile.originFileObj
    );
    return false;
  };

  const handleRemove = () => {
    setFileList([]);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <div className="space-y-6">
        <Form.Item
          name="coverLetter"
          label="Cover Letter"
          rules={[{ required: true, message: "Please write a cover letter" }]}
        >
          <TextArea
            rows={6}
            className="resize-y min-h-[100px]"
            placeholder="Explain why you're interested in this position and how your experience makes you a good fit..."
          />
        </Form.Item>

        <Form.Item name="resume" label="Resume/CV">
          <Upload
            beforeUpload={beforeUpload}
            onRemove={handleRemove}
            maxCount={1}
            fileList={fileList}
            className="upload-list-inline w-full"
          >
            <Button
              icon={<UploadOutlined />}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <span>Select Resume (PDF/DOCX)</span>
            </Button>
          </Upload>
        </Form.Item>

        <FormActions
          primaryActionText="Submit Application"
          onPrimaryAction={() => form.submit()}
          primaryActionProps={{
            loading: isLoading,
            // Remove htmlType="submit" to prevent double submission
          }}
          secondaryActionText="Cancel"
          onSecondaryAction={onCancel}
        />
      </div>
    </Form>
  );
};

export default ApplicationForm;
