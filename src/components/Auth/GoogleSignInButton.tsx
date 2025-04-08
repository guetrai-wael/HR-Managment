import { FC } from "react";
import { Button } from "antd";
import { useAuth } from "../../hooks/useAuth";
import { GoogleSignInButtonProps } from "../../types";

const GoogleSignInButton: FC<GoogleSignInButtonProps> = ({
  label,
  onSuccess,
  onError,
}) => {
  const { loginWithGoogle, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const success = await loginWithGoogle();

      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      onError?.(error as Error);
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <Button
      type="default"
      size="large"
      onClick={handleGoogleSignIn}
      loading={loading}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-11 rounded-md"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.7874 10.2183C19.7874 9.56504 19.7291 8.91177 19.6126 8.27673H10.2031V12.0512H15.6245C15.3914 13.2953 14.6578 14.359 13.5941 15.0688V17.5768H16.7827C18.6578 15.8353 19.7874 13.2729 19.7874 10.2183Z"
          fill="#4285F4"
        />
        <path
          d="M10.2033 20C12.9008 20 15.1701 19.1152 16.7829 17.5767L13.5944 15.0687C12.7024 15.6681 11.5387 16.0227 10.2033 16.0227C7.5475 16.0227 5.30654 14.2636 4.52823 11.8996H1.24408V14.4922C2.85686 17.8691 6.30289 20 10.2033 20Z"
          fill="#34A853"
        />
        <path
          d="M4.52795 11.8996C4.32616 11.2998 4.21795 10.6595 4.21795 10C4.21795 9.34047 4.32616 8.70017 4.52795 8.10036V5.50781H1.2438C0.452679 6.85938 0 8.38086 0 10C0 11.6191 0.452679 13.1406 1.2438 14.4922L4.52795 11.8996Z"
          fill="#FBBC05"
        />
        <path
          d="M10.2033 3.97734C11.7018 3.97734 13.0467 4.48887 14.1007 5.50295L16.9253 2.67804C15.1654 1.01855 12.9008 0 10.2033 0C6.30289 0 2.85686 2.13086 1.24408 5.50781L4.52823 8.10036C5.30654 5.73639 7.5475 3.97734 10.2033 3.97734Z"
          fill="#EA4335"
        />
      </svg>
      <span>{label}</span>
    </Button>
  );
};

export default GoogleSignInButton;
