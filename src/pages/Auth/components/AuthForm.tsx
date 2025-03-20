import { FC, MouseEventHandler, useState } from "react";
import { useForm, Controller, Path } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Button, Checkbox } from "antd";
import { GoogleLogin } from "@react-oauth/google";
import InputField from "./InputField";
import GoogleButton from "./GoogleButton";

// Defines the structure of form fields
interface Field {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

// TypeScript interface for the form values
interface FormValues {
  email: string;
  password: string;
  name?: string;
  rememberMe: boolean;
}

// Props for the AuthForm component
interface AuthFormProps {
  onSubmit: (data: FormValues) => void;
  schema: Yup.AnyObjectSchema;
  submitText: string;
  fields: Field[];
  showRememberMe?: boolean;
  // Add new props for Google authentication
  onGoogleSuccess?: (response: any) => void;
  onGoogleError?: () => void;
}

const AuthForm: FC<AuthFormProps> = ({
  onSubmit,
  schema,
  submitText,
  fields,
  showRememberMe = false,
  onGoogleSuccess,
  onGoogleError,
}) => {
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      ...fields.reduce((acc, field) => {
        acc[field.name as keyof FormValues] = "";
        return acc;
      }, {} as Record<string, string>),
      rememberMe: false,
    },
    mode: "onTouched",
    reValidateMode: "onSubmit",
  });

  const onSubmitForm = async (data: FormValues) => {
    setFormSubmitted(true);
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit(onSubmitForm)}
        className="space-y-6"
        noValidate
      >
        {/* Map through fields config to render input fields */}
        {fields.map((field) => (
          <InputField
            key={field.name}
            name={field.name as Path<FormValues>}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            control={control}
            error={errors[field.name as keyof FormValues]}
            showError={formSubmitted}
          />
        ))}

        {/* Optional Remember Me checkbox for login */}
        {showRememberMe && (
          <div className="flex items-center">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="text-gray-700"
                >
                  Remember me for 30 days
                </Checkbox>
              )}
            />
          </div>
        )}

        {/* Submit button with loading state */}
        <div className="flex flex-col gap-4 width-full">
          <Button
            type="primary"
            htmlType="submit"
            className="w-full"
            loading={loading}
            style={{
              boxShadow: "none",
              transition: "background-color 0.2s ease-in-out",
            }}
          >
            {submitText}
          </Button>

          <GoogleButton onSuccess={onGoogleSuccess} onError={onGoogleError} />
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
