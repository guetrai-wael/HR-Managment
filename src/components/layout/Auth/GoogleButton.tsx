import { GoogleLogin } from "@react-oauth/google";
import { GoogleButtonProps } from "../../../types";

const GoogleButton = ({ onSuccess, onError }: GoogleButtonProps) => {
  return (
    <div className="!w-full">
      <div className="!w-full !h-[40px] flex justify-center">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap
          theme="outline"
          size="large"
        />
      </div>
    </div>
  );
};

export default GoogleButton;
