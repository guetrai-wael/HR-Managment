import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Spin,
  Card,
  Row,
  Col,
} from "antd";
import { UserOutlined, InboxOutlined } from "@ant-design/icons";
import { useUser } from "../../hooks/useUser";
import supabase from "../../services/supabaseClient";
import { UserProfile } from "../../types/models";
import type { RcFile, UploadProps } from "antd/es/upload/interface"; // Import RcFile and UploadProps

interface ProfileFormValues {
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  bio?: string | null;
  physical_address?: string | null;
}

// Define the expected structure for the onSuccess callback body
interface AvatarUploadSuccessBody {
  url: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [form] = Form.useForm<ProfileFormValues>();
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        console.log(
          "[SettingsPage useEffect] User object for profile fetch:",
          JSON.stringify(user, null, 2)
        );
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            if (error.code === "PGRST116") {
              message.info(
                "No profile found. You can create one by saving your settings."
              );
              form.setFieldsValue({
                first_name: user.user_metadata?.first_name || "",
                last_name: user.user_metadata?.last_name || "",
                phone: user.user_metadata?.phone || "",
                bio: "",
                physical_address: "",
              });
            } else {
              throw error;
            }
          }
          if (data) {
            setProfile(data as UserProfile);
            // Fallback to user.user_metadata if profile fields are null/empty
            form.setFieldsValue({
              first_name:
                data.first_name || user.user_metadata?.first_name || "",
              last_name: data.last_name || user.user_metadata?.last_name || "",
              phone: data.phone || user.user_metadata?.phone || "",
              bio: data.bio, // Bio typically doesn't have a fallback in user_metadata
              physical_address: data.physical_address, // Same for physical_address
            });
          }
        } catch (error) {
          message.error("Failed to fetch profile data.");
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, form]);

  const handleFormSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      message.error("User not available. Please log in again.");
      setLoading(false);
      return;
    }
    if (!user.id) {
      message.error("User ID is missing. Cannot save profile.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const existingProfileId = profile?.id; // Use profile state to check if it's an update or insert

      if (!existingProfileId) {
        // CREATE NEW PROFILE
        console.log(
          "[SettingsPage handleFormSubmit] Attempting to CREATE new profile."
        );
        if (!user.email || user.email.trim() === "") {
          console.error(
            "[SettingsPage handleFormSubmit] User email is missing or empty. Cannot create profile without an email. User email value:",
            user.email
          );
          message.error(
            "Your email address is missing or invalid. Profile cannot be saved. Please try logging out and back in, or contact support."
          );
          setLoading(false); // Ensure loading is false before returning
          return;
        }

        const createPayload = {
          id: user.id, // PK
          email: user.email, // Required for new profiles
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          bio: values.bio,
          physical_address: values.physical_address,
          updated_at: new Date(),
        };

        console.log(
          "[SettingsPage handleFormSubmit] Create Payload for Supabase:",
          JSON.stringify(createPayload, null, 2)
        );

        const { data: insertData, error: insertError } = await supabase
          .from("profiles")
          .insert(createPayload)
          .select()
          .single();

        if (insertError) {
          console.error(
            "[SettingsPage handleFormSubmit] Supabase insert error object:",
            JSON.stringify(insertError, null, 2)
          );
          throw insertError;
        }

        message.success("Profile created successfully!");
        setProfile(insertData as UserProfile);
        if (insertData) {
          form.setFieldsValue({
            first_name: insertData.first_name,
            last_name: insertData.last_name,
            phone: insertData.phone,
            bio: insertData.bio,
            physical_address: insertData.physical_address,
          });
        }
      } else {
        // UPDATE EXISTING PROFILE
        console.log(
          "[SettingsPage handleFormSubmit] Attempting to UPDATE existing profile. ID:",
          existingProfileId
        );

        const updatePayload = {
          // id and email are NOT included for update
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          bio: values.bio,
          physical_address: values.physical_address,
          updated_at: new Date(),
        };

        console.log(
          "[SettingsPage handleFormSubmit] Update Payload for Supabase:",
          JSON.stringify(updatePayload, null, 2)
        );

        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", user.id) // Match based on user.id
          .select()
          .single();

        if (updateError) {
          console.error(
            "[SettingsPage handleFormSubmit] Supabase update error object:",
            JSON.stringify(updateError, null, 2)
          );
          throw updateError;
        }

        message.success("Profile updated successfully!");
        setProfile(updateData as UserProfile);
        if (updateData) {
          form.setFieldsValue({
            first_name: updateData.first_name,
            last_name: updateData.last_name,
            phone: updateData.phone,
            bio: updateData.bio,
            physical_address: updateData.physical_address,
          });
        }
      }
    } catch (e: unknown) {
      // More robust error handling
      let errorMessage =
        "An unexpected error occurred while saving the profile. Please try again.";
      let loggableError: Record<string, unknown> = { originalError: e }; // Default loggable error

      if (typeof e === "object" && e !== null) {
        // Create a new object for logging to avoid modifying the original error
        // and to ensure it's serializable for JSON.stringify.
        loggableError = {};
        for (const key in e) {
          if (Object.prototype.hasOwnProperty.call(e, key)) {
            loggableError[key] = (e as Record<string, unknown>)[key];
          }
        }

        const err = e as { code?: string; message?: string }; // Type assertion
        if (err.code === "23502") {
          errorMessage = `Failed to save profile: ${
            err.message || "A required field is missing."
          }. Please ensure all required fields are provided.`;
        } else if (
          typeof err.message === "string" &&
          err.message.toLowerCase().includes("failed to fetch")
        ) {
          errorMessage =
            "Network error: Failed to connect to the server. Please check your internet connection and try again.";
        } else if (err.message) {
          errorMessage = `Failed to save profile: ${err.message}`;
        }
      }

      console.error(
        "Error saving profile:",
        JSON.stringify(loggableError, null, 2)
      );
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (
    fileToUpload: File, // RcFile is also a File
    antOnSuccess: (body: AvatarUploadSuccessBody, xhr?: XMLHttpRequest) => void,
    antOnError: (err: Error) => void
  ) => {
    if (!user) {
      message.error("User not found. Please log in again.");
      antOnError(new Error("User not found"));
      return;
    }
    if (!fileToUpload) {
      message.error("No file selected for upload.");
      antOnError(new Error("No file selected"));
      return;
    }

    setUploading(true);
    try {
      const fileName = `public/${user.id}/${Date.now()}_${fileToUpload.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileToUpload, {
          cacheControl: "3600",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      if (!publicUrlData) {
        throw new Error("Could not get public URL for avatar.");
      }
      const avatar_url = publicUrlData.publicUrl;

      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from("profiles")
        .update({ avatar_url, updated_at: new Date() })
        .eq("id", user.id)
        .select()
        .single();
      if (updateProfileError) throw updateProfileError;

      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatar_url },
      });
      if (userUpdateError) {
        console.warn(
          "Could not update user metadata avatar_url:",
          userUpdateError.message
        );
      }

      message.success("Avatar updated successfully!");
      if (updatedProfile) {
        setProfile(updatedProfile as UserProfile);
      }
      antOnSuccess({ url: avatar_url }, undefined);
    } catch (error) {
      const typedError =
        error instanceof Error ? error : new Error(String(error));
      message.error(`Failed to upload avatar: ${typedError.message}`);
      console.error("Error uploading avatar:", typedError);
      antOnError(typedError);
    } finally {
      setUploading(false);
    }
  };

  if (
    loading &&
    !profile &&
    !form.getFieldValue("first_name") &&
    !form.getFieldValue("last_name")
  ) {
    return (
      <Spin
        tip="Loading profile..."
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      />
    );
  }

  if (!user) {
    return <p>Please log in to view your settings.</p>;
  }

  const currentAvatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url;

  const draggerProps: UploadProps = {
    name: "avatar",
    multiple: false,
    accept: "image/*",
    showUploadList: false,
    disabled: uploading,
    style: { padding: "20px" },
    beforeUpload: (file: RcFile) => {
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must be smaller than 2MB!");
        return Upload.LIST_IGNORE;
      }
      return true; // Proceed to customRequest
    },
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      // file is RcFile, which extends File. onSuccess and onError are from Ant Design.
      if (onSuccess && onError) {
        await handleAvatarUpload(
          file as File, // RcFile is compatible with File
          onSuccess as (
            body: AvatarUploadSuccessBody,
            xhr?: XMLHttpRequest
          ) => void, // Cast to our specific success body type
          onError as (err: Error) => void
        );
      } else {
        // This case should ideally not be reached if Ant Design provides these callbacks
        console.error("Ant Design Upload: onSuccess or onError not provided.");
        if (onError) {
          (onError as (err: Error) => void)(
            new Error("Upload configuration error.")
          );
        }
      }
    },
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: "20px" }}>
      <Card title="Profile Settings">
        <Spin spinning={loading && !!profile}>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item label="Avatar">
              <Row gutter={24} align="middle">
                <Col>
                  <Avatar
                    size={100}
                    src={currentAvatarUrl}
                    icon={!currentAvatarUrl && <UserOutlined />}
                  />
                </Col>
                <Col flex="auto">
                  <Upload.Dragger {...draggerProps}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag file to this area to upload
                    </p>
                    <p className="ant-upload-hint">
                      Support for a single image file (e.g., JPG, PNG). Max 2MB.
                    </p>
                  </Upload.Dragger>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item
              name="first_name"
              label="First Name"
              rules={[
                { required: true, message: "Please input your first name!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[
                { required: true, message: "Please input your last name!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="phone" label="Phone Number">
              <Input />
            </Form.Item>

            <Form.Item name="physical_address" label="Physical Address">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="bio" label="Bio">
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item label="Email">
              <Input
                value={user?.email || ""}
                readOnly
                style={{
                  backgroundColor: "#f5f5f5",
                  cursor: "not-allowed",
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || uploading}
              >
                Save
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default SettingsPage;
