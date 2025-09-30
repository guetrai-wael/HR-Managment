import React, { useState } from "react";
import { Button, Card, Table, Upload, message, Space, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/common/PageLayout";
import { recordingsService } from "../../services/api/recordingsService";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import type { RecordingResult } from "../../types/models";

const Recordings: React.FC = () => {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState<File[]>([]); // store real File objects
  const [uploading, setUploading] = useState(false);
  const [_currentRecordingId, _setCurrentRecordingId] = useState<string | null>(
    null
  );

  // Fetch recordings history
  const {
    data: recordings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["recordings"],
    queryFn: recordingsService.getRecordings,
  });

  // Handle file upload
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a video file first");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("video_file", fileList[0]); // the actual File object

      const result = await recordingsService.uploadRecording(formData);
      message.success("Video uploaded and processed successfully!");
      setFileList([]);
      refetch();

      navigate(`/recordings/${result.id}`);
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
    beforeUpload: (file: File) => {
      if (!file.type.startsWith("video/")) {
        message.error("You can only upload video files!");
        return Upload.LIST_IGNORE;
      }
      setFileList([file]); // store real File object
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

  // Table columns for results
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: RecordingResult) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/recordings/${record.id}`)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="Recordings"
      subtitle="Upload and manage employee recordings"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card title="Upload Recording">
          <Spin spinning={uploading} tip="Processing video...">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select Video File</Button>
            </Upload>
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                onClick={handleUpload}
                disabled={fileList.length === 0}
                loading={uploading}
                style={{ marginTop: 16 }}
              >
                {uploading ? "Processing..." : "Upload and Process Video"}
              </Button>
            </div>
          </Spin>
        </Card>

        <Card title="Recording History">
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Spin size="large" spinning={true} />
            </div>
          ) : (
            <Table
              dataSource={recordings}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default Recordings;
