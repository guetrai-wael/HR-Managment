import { Controller, FieldValues } from "react-hook-form";

import { InputFieldProps } from "../../../types";

/**
 * Reusable input field component that integrates with React Hook Form
 * Handles validation states and error display
 */
function InputField<T extends FieldValues>(props: InputFieldProps<T>) {
  const { name, label, type, placeholder, control, error, showError } = props;
  return (
    <div className="mb-4">
      {/* Input label */}
      <label
        htmlFor={name as string}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {/* React Hook Form Controller for controlled inputs */}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          // Show error if form was submitted or field was touched and has error
          const shouldShowError = error && (showError || fieldState.isTouched);

          return (
            <>
              {/* Input element */}
              <input
                {...field}
                type={type}
                placeholder={placeholder}
                id={name as string}
                className={`mt-1 block w-full px-3 py-2 border ${
                  shouldShowError ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />

              {/* Error message display */}
              {shouldShowError && typeof error?.message === "string" && (
                <p className="text-red-500 text-xs mt-1">{error.message}</p>
              )}
            </>
          );
        }}
      />
    </div>
  );
}

export default InputField;
