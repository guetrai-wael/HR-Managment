import { FC, useState } from "react"; // Removed useEffect
import { useForm, Controller, Path, Control } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Checkbox } from "antd";
import { InputField } from "./index";
import { AuthFormProps, AuthFormValues } from "../../types";
import { GoogleSignInButton } from "./index";
import FormActions from "../common/FormActions";

// Update AuthFormProps to include isLoading
interface ExtendedAuthFormProps extends AuthFormProps {
  isLoading?: boolean;
}

const AuthForm: FC<ExtendedAuthFormProps> = ({
  onSubmit,
  schema,
  submitText,
  fields,
  showRememberMe = false,
  onGoogleSuccess,
  onGoogleError,
  isLoading: propIsLoading, // Renamed to avoid conflict with internal loading state
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      ...fields.reduce((acc, field) => {
        (acc as Record<string, string>)[field.name] = "";
        return acc;
      }, {} as AuthFormValues),
      rememberMe: false,
    },
    mode: "onTouched",
    reValidateMode: "onSubmit",
  });

  const onSubmitForm = async (data: AuthFormValues) => {
    setFormSubmitted(true);
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveIsLoading = propIsLoading || isSubmitting;

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit(onSubmitForm)}
        className="space-y-6"
        noValidate
      >
        {fields.map((field) => (
          <InputField<AuthFormValues>
            key={field.name}
            name={field.name as Path<AuthFormValues>}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            control={control as Control<AuthFormValues>}
            error={errors[field.name as keyof AuthFormValues]}
            showError={formSubmitted}
            disabled={effectiveIsLoading}
          />
        ))}

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
                  disabled={effectiveIsLoading}
                >
                  Remember me for 30 days
                </Checkbox>
              )}
            />
          </div>
        )}

        <FormActions
          primaryActionText={submitText}
          onPrimaryAction={() => handleSubmit(onSubmitForm)()}
          primaryActionProps={{
            loading: effectiveIsLoading,
            htmlType: "submit",
            style: {
              boxShadow: "none",
              transition: "background-color 0.2s ease-in-out",
            },
            disabled: effectiveIsLoading,
          }}
          containerClassName="flex flex-col gap-4 w-full"
        />

        <div className="flex flex-col gap-4 w-full">
          <GoogleSignInButton
            label={`Continue with Google`}
            onSuccess={onGoogleSuccess}
            onError={(error) => onGoogleError?.(error)}
            disabled={effectiveIsLoading}
          />
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
