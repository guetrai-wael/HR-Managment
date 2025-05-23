// src/components/Leave/LeaveRequestForm.tsx
import React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { leaveService } from "../../services/api/leaveService";
import { LeaveType, LeaveRequest } from "../../types/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Select,
  DatePicker,
  Form,
  Card,
  Typography,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

// Validation Schema using Yup
const leaveRequestSchema = yup.object().shape({
  leave_type_id: yup.string().required("Leave type is required"),
  start_date: yup
    .mixed<Dayjs>() // Expect Dayjs object
    .transform((value) => (value ? dayjs(value) : undefined)) // Transform to Dayjs if not already
    .required("Start date is required")
    .test(
      "is-dayjs",
      "Invalid date format for start date",
      (value) => dayjs.isDayjs(value) && value.isValid()
    )
    .typeError("Start date must be a valid date"),
  end_date: yup
    .mixed<Dayjs>() // Expect Dayjs object
    .transform((value) => (value ? dayjs(value) : undefined)) // Transform to Dayjs if not already
    .required("End date is required")
    .test(
      "is-dayjs",
      "Invalid date format for end date",
      (value) => dayjs.isDayjs(value) && value.isValid()
    )
    .typeError("End date must be a valid date")
    .test(
      "is-after-start",
      "End date cannot be before start date",
      function (value) {
        const { start_date } = this.parent;
        if (
          !dayjs.isDayjs(start_date) ||
          !start_date.isValid() ||
          !dayjs.isDayjs(value) ||
          !value.isValid()
        ) {
          return true; // Skip validation if dates are not valid Dayjs objects
        }
        return value.isAfter(start_date) || value.isSame(start_date, "day");
      }
    ),
  reason: yup.string().optional(),
});

interface LeaveRequestFormData {
  leave_type_id: string;
  start_date: Dayjs;
  end_date: Dayjs;
  reason?: string;
}

interface LeaveRequestFormProps {
  onSubmitSuccess?: () => void; // Added onSubmitSuccess prop
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  onSubmitSuccess,
}) => {
  const queryClient = useQueryClient();

  const { data: fetchedLeaveTypes, isLoading: isLoadingLeaveTypes } = useQuery<
    LeaveType[],
    Error
  >({
    queryKey: ["leaveTypes"],
    queryFn: leaveService.getLeaveTypes,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<LeaveRequestFormData>({
    resolver: yupResolver(leaveRequestSchema),
    defaultValues: {
      leave_type_id: undefined,
      start_date: undefined,
      end_date: undefined,
      reason: "",
    },
    mode: "onTouched",
  });

  const createLeaveMutation = useMutation<
    LeaveRequest,
    Error,
    Omit<
      LeaveRequest,
      | "id"
      | "user_id"
      | "created_at"
      | "updated_at"
      | "status"
      | "approved_by"
      | "approved_at"
      | "comments"
      | "admin_reviewer_id"
      | "admin_reviewed_at"
      | "admin_rejection_reason"
    > & { start_date: string; end_date: string } // Ensure string dates for API
  >({
    mutationFn: (data) => leaveService.createLeaveRequest(data),
    onSuccess: () => {
      message.success("Leave request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaveBalance"] });
      reset();
      if (onSubmitSuccess) {
        onSubmitSuccess(); // Call onSubmitSuccess if provided
      }
    },
    onError: (error) => {
      message.error(`Failed to submit leave request: ${error.message}`);
    },
  });

  const onSubmit: SubmitHandler<LeaveRequestFormData> = (data) => {
    // Convert Dayjs dates to ISO string for the API
    const apiData = {
      ...data,
      start_date: data.start_date.format("YYYY-MM-DD"),
      end_date: data.end_date.format("YYYY-MM-DD"),
    };
    createLeaveMutation.mutate(apiData);
  };

  const disabledDate = (current: Dayjs) => {
    // Can not select days before today
    return current && current < dayjs().startOf("day");
  };

  const disabledEndDate = (current: Dayjs) => {
    const startDate = watch("start_date");
    if (!startDate || !dayjs.isDayjs(startDate) || !startDate.isValid()) {
      return current && current < dayjs().startOf("day");
    }
    return current && current < startDate.startOf("day");
  };

  return (
    <Card
      title={<Title level={4}>Submit Leave Request</Title>}
      variant="borderless" // Changed from bordered={false}
      style={{ boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item
          label="Leave Type"
          required
          validateStatus={errors.leave_type_id ? "error" : ""}
          help={errors.leave_type_id?.message}
        >
          <Controller
            name="leave_type_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select leave type"
                loading={isLoadingLeaveTypes}
                disabled={isLoadingLeaveTypes}
                style={{ width: "100%" }}
              >
                {(fetchedLeaveTypes || []).map(
                  (
                    type // Use fetchedLeaveTypes directly, provide fallback []
                  ) => (
                    <Option key={type.id} value={type.id.toString()}>
                      {type.name}
                    </Option>
                  )
                )}
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Start Date"
          required
          validateStatus={errors.start_date ? "error" : ""}
          help={errors.start_date?.message as string | undefined}
        >
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                disabledDate={disabledDate}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="End Date"
          required
          validateStatus={errors.end_date ? "error" : ""}
          help={errors.end_date?.message as string | undefined}
        >
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                disabledDate={disabledEndDate}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Reason (Optional)"
          validateStatus={errors.reason ? "error" : ""}
          help={errors.reason?.message}
        >
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={4}
                placeholder="Enter reason for leave"
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={createLeaveMutation.isPending}
          >
            {createLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LeaveRequestForm;
