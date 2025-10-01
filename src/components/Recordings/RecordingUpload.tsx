import React from "react";
import { Card, Upload, Button, Spin, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd/es/upload/interface";
import { recordingsService } from "../../services/api/recordingsService";

interface RecordingUploadProps {
  onUploadSuccess?: (recordingId: string) => void;
}

const RecordingUpload: React.FC<RecordingUploadProps> = ({
  onUploadSuccess,
}) => {
  const [fileList, setFileList] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a video file first");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("video_file", fileList[0]);

      const result = await recordingsService.uploadRecording(formData);
      message.success("Video uploaded and processed successfully!");
      setFileList([]);

      onUploadSuccess?.(result.id);
    } catch (error) {
      console.error("Upload error:", error);

      if (error instanceof Error) {
        if (error.message.includes("Detection service")) {
          message.error({
            content:
              "Detection service is not available. Please ensure the Detection-2K25 model is running.",
            duration: 6,
          });
        } else if (error.message.includes("Failed to save")) {
          message.error({
            content:
              "Failed to save recording data. Please check your connection and try again.",
            duration: 4,
          });
        } else if (error.message.includes("Failed to process")) {
          message.error({
            content:
              "Failed to process video. Please ensure the video format is supported.",
            duration: 4,
          });
        } else {
          message.error({
            content: error.message || "Upload failed. Please try again.",
            duration: 4,
          });
        }
      } else {
        message.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: (_file) => setFileList([]),
    multiple: false,
    accept: "video/*",
    beforeUpload: (file: File) => {
      if (!file.type.startsWith("video/")) {
        message.error("You can only upload video files!");
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // prevent automatic upload
    },
    fileList: fileList.map((file) => ({
      uid: file.name,
      name: file.name,
      status: "done",
      type: file.type,
    })) as UploadFile[],
    maxCount: 1,
  };

  return (
    <Card title="📤 Upload Recording">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Step 1: Select Video */}
        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>
            Step 1: Select Video File
          </h4>
          <Upload.Dragger className="recordings-drag-area" {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag a video file to this area to select
            </p>
            <p className="ant-upload-hint">
              Supported formats: MP4, MOV, AVI. Max size: depends on backend.
            </p>
          </Upload.Dragger>
        </div>

        {/* Step 2: Process Video (only show when file is selected) */}
        {fileList.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>
              Step 2: Process Video
            </h4>
            <div
              style={{
                padding: "16px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                backgroundColor: "#fafafa",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    📁 {fileList[0].name}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Ready to process for attendance detection
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => setFileList([])} disabled={uploading}>
                    Change File
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleUpload}
                    loading={uploading}
                    size="large"
                  >
                    {uploading ? "Processing..." : "🚀 Process Video"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {uploading && (
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#e6f7ff",
              borderRadius: "6px",
              border: "1px solid #91d5ff",
            }}
          >
            <Spin />
            <div style={{ marginTop: 8, color: "#1890ff", fontWeight: 600 }}>
              Processing video for attendance detection...
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              This may take a few minutes depending on video length
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecordingUpload;
