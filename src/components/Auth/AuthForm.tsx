import { FC, useState } from "react";
import { useForm, Controller, Path } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Checkbox } from "antd";
import { InputField } from "./index";
import { AuthFormProps, AuthFormValues } from "../../types";
import { GoogleSignInButton } from "./index";

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
  } = useForm<AuthFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      ...fields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {} as Record<string, string>),
      rememberMe: false,
    },
    mode: "onTouched",
    reValidateMode: "onSubmit",
  });

  const onSubmitForm = async (data: AuthFormValues) => {
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
            name={field.name as Path<AuthFormValues>}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            control={control}
            error={errors[field.name as keyof AuthFormValues]}
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
          {/* Google Sign-in Button */}
          <GoogleSignInButton
            label={`Continue with Google`}
            onSuccess={onGoogleSuccess}
            onError={(error) => onGoogleError?.(error)}
          />
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
