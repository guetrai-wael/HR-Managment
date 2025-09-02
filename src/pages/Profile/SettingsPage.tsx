import React, { useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Card,
  Row,
  Col,
} from "antd";
import { UserOutlined, InboxOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../../hooks/useUser";
import QueryBoundary from "../../components/common/QueryBoundary";
import { PageLayout } from "../../components/common"; // Added PageLayout
import {
  fetchUserProfile,
  updateUserProfile,
  updateUserAvatar,
} from "../../services/api/userService";
import { UserProfile } from "../../types/models";
import type { RcFile, UploadProps } from "antd/es/upload/interface";
import { useMutationHandler } from "../../hooks/useMutationHandler";

// --- Interfaces ---
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
  const {
    user,
    authLoading,
    profileLoading: userProfileLoadingHook,
  } = useUser();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ProfileFormValues>();

  // --- React Query for fetching user profile ---
  const {
    data: profile,
    isLoading: profileQueryIsLoading,
    error: profileError,
    isFetching: profileIsFetching,
  } = useQuery<UserProfile | null, Error>({
    queryKey: ["userProfile", user?.id],
    queryFn: () =>
      user?.id ? fetchUserProfile(user.id) : Promise.resolve(null),
    enabled: !!user && !!user.id && !authLoading && !userProfileLoadingHook,
  });

  // Effect to fill form when profile data is available or user session loads
  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        first_name: profile.first_name || user?.user_metadata?.first_name || "",
        last_name: profile.last_name || user?.user_metadata?.last_name || "",
        phone: profile.phone || user?.user_metadata?.phone || "",
        bio: profile.bio,
        physical_address: profile.physical_address,
      });
    } else if (user && !profileQueryIsLoading && !profileError) {
      // Pre-fill from user_metadata if no profile exists yet and not loading/error
      form.setFieldsValue({
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        phone: user.user_metadata?.phone || "",
        bio: "",
        physical_address: "",
      });
    }
  }, [profile, user, profileQueryIsLoading, profileError, form]);

  // Display error messages
  useEffect(() => {
    if (profileError) {
      message.error(`Failed to load profile: ${profileError.message}`);
    }
  }, [profileError]);

  // --- React Query Mutation for updating profile ---
  const { mutate: saveProfile, isPending: isSavingProfile } =
    useMutationHandler<UserProfile, Error, ProfileFormValues>({
      mutationFn: async (values) => {
        if (!user?.id) throw new Error("User ID is missing.");
        const payload: Partial<UserProfile> & { email?: string } = {
          ...values,
        };
        if (profile && !profile.id && user.email) {
          payload.email = user.email;
        }
        return updateUserProfile(user.id, payload);
      },
      queryClient,
      successMessage: "Profile saved successfully!",
      errorMessagePrefix: "Failed to save profile",
      invalidateQueries: [["userProfile", user?.id]],
    });

  // --- React Query Mutation for updating avatar ---
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } =
    useMutationHandler<UserProfile, Error, File>({
      mutationFn: (file) => {
        if (!user?.id) throw new Error("User ID is missing.");
        return updateUserAvatar(user.id, file);
      },
      queryClient,
      successMessage: "Avatar updated successfully!",
      errorMessagePrefix: "Failed to upload avatar",
      invalidateQueries: [["userProfile", user?.id]],
    });

  const handleFormSubmit = (values: ProfileFormValues) => {
    saveProfile(values);
  };

  const handleAvatarUploadInternal = async (
    fileToUpload: File,
    antOnSuccess: (body: AvatarUploadSuccessBody, xhr?: XMLHttpRequest) => void,
    antOnError: (err: Error) => void
  ) => {
    try {
      const updatedProfile = await uploadAvatar(fileToUpload);
      antOnSuccess({ url: updatedProfile.avatar_url || "" }, undefined);
    } catch (error) {
      antOnError(error as Error);
    }
  };

  // Effect to fill form when user loads after profile data might have been fetched (or not)
  useEffect(() => {
    if (
      user &&
      !profile &&
      !profileQueryIsLoading &&
      form.getFieldsValue().first_name === undefined
    ) {
      form.setFieldsValue({
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        phone: user.user_metadata?.phone || "",
        bio: "",
        physical_address: "",
      });
    }
  }, [user, profile, profileQueryIsLoading, form]);

  if (!user && !authLoading && !userProfileLoadingHook) {
    // If no user and session loading is done
    return <p>Please log in to view your settings.</p>;
  }

  const currentAvatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url;

  const draggerProps: UploadProps = {
    name: "avatar",
    multiple: false,
    accept: "image/*",
    showUploadList: false,
    disabled: isUploadingAvatar,
    style: { padding: "20px" },
    beforeUpload: (file: RcFile) => {
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must be smaller than 2MB!");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      if (onSuccess && onError) {
        await handleAvatarUploadInternal(
          file as File,
          onSuccess as (
            body: AvatarUploadSuccessBody,
            xhr?: XMLHttpRequest
          ) => void,
          onError as (err: Error) => void
        );
      } else {
        if (onError) {
          (onError as (err: Error) => void)(
            new Error("Upload configuration error.")
          );
        }
      }
    },
  };
  return (
    <PageLayout
      title="Profile Settings"
      subtitle="Manage your personal information and preferences."
    >
      <div className="settings-container">
        <Card className="settings-card">
          <QueryBoundary
            isLoading={
              authLoading ||
              userProfileLoadingHook ||
              (profileQueryIsLoading && !profile)
            }
            isError={!!profileError && !profile}
            error={profileError}
            loadingTip="Loading profile..."
            errorMessage="Could not load profile. You can try creating one by filling out the form and saving."
          >
            {user && (
              <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                <Form.Item label="Avatar">
                  {" "}
                  <Row gutter={[32, 16]} className="avatar-upload-row">
                    <Col
                      xs={24}
                      sm={24}
                      md={8}
                      lg={6}
                      xl={5}
                      className="avatar-col"
                    >
                      <div className="avatar-container">
                        <Avatar
                          size={{ xs: 100, sm: 120, md: 140, lg: 160, xl: 180 }}
                          src={currentAvatarUrl}
                          icon={!currentAvatarUrl && <UserOutlined />}
                          className="settings-avatar"
                        />
                      </div>
                    </Col>{" "}
                    <Col
                      xs={24}
                      sm={24}
                      md={16}
                      lg={18}
                      xl={19}
                      className="upload-col"
                    >
                      <Upload.Dragger
                        {...draggerProps}
                        disabled={isUploadingAvatar || profileIsFetching}
                        className="settings-upload-dragger"
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Click or drag file to this area to upload
                        </p>
                        <p className="ant-upload-hint">
                          Support for a single image file (e.g., JPG, PNG). Max
                          2MB.
                        </p>
                      </Upload.Dragger>
                    </Col>
                  </Row>{" "}
                </Form.Item>{" "}
                <Row gutter={[24, 0]}>
                  <Col xs={24} sm={24} md={12}>
                    <Form.Item
                      name="first_name"
                      label="First Name"
                      rules={[
                        {
                          required: true,
                          message: "Please input your first name!",
                        },
                      ]}
                    >
                      <Input
                        disabled={profileIsFetching || isSavingProfile}
                        className="settings-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={12}>
                    <Form.Item
                      name="last_name"
                      label="Last Name"
                      rules={[
                        {
                          required: true,
                          message: "Please input your last name!",
                        },
                      ]}
                    >
                      <Input
                        disabled={profileIsFetching || isSavingProfile}
                        className="settings-input"
                      />
                    </Form.Item>
                  </Col>{" "}
                </Row>
                <Row gutter={[24, 0]}>
                  <Col xs={24} sm={24} md={12}>
                    <Form.Item name="phone" label="Phone Number">
                      <Input
                        disabled={profileIsFetching || isSavingProfile}
                        className="settings-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={12}>
                    <Form.Item label="Email">
                      <Input
                        value={user?.email || ""}
                        readOnly
                        className="settings-input settings-readonly"
                      />
                    </Form.Item>
                  </Col>
                </Row>{" "}
                <Form.Item name="physical_address" label="Physical Address">
                  <Input.TextArea
                    rows={3}
                    disabled={profileIsFetching || isSavingProfile}
                    className="settings-textarea"
                  />
                </Form.Item>
                <Form.Item name="bio" label="Bio">
                  <Input.TextArea
                    rows={4}
                    disabled={profileIsFetching || isSavingProfile}
                    className="settings-textarea"
                  />
                </Form.Item>
                <Form.Item className="settings-submit-container">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSavingProfile}
                    disabled={profileIsFetching}
                    className="settings-submit-btn"
                    size="large"
                  >
                    Save Changes
                  </Button>
                </Form.Item>{" "}
              </Form>
            )}
          </QueryBoundary>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
