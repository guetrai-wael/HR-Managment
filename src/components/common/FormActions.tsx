import React from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";

interface FormActionsProps {
  primaryActionText: string;
  onPrimaryAction: () => void; // Can be form.submit() or a custom handler
  primaryActionProps?: ButtonProps; // To pass loading, disabled, htmlType etc.
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  secondaryActionProps?: ButtonProps;
  containerClassName?: string;
}

const FormActions: React.FC<FormActionsProps> = ({
  primaryActionText,
  onPrimaryAction,
  primaryActionProps,
  secondaryActionText,
  onSecondaryAction,
  secondaryActionProps,
  containerClassName = "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
}) => {
  return (
    <div className={`flex gap-3 mt-6 ${containerClassName}`}>
      {secondaryActionText && onSecondaryAction && (
        <Button
          onClick={onSecondaryAction}
          className="!w-full sm:!w-auto"
          {...secondaryActionProps}
        >
          {secondaryActionText}
        </Button>
      )}
      <Button
        type="primary"
        onClick={onPrimaryAction}
        className="!w-full sm:!w-auto"
        {...primaryActionProps} // Ensure htmlType="submit" is passed here if needed
      >
        {primaryActionText}
      </Button>
    </div>
  );
};

export default FormActions;
