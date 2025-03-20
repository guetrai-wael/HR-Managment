import { FC } from "react";
import FormContainer from "../components/FormContainer";
import AuthForm from "../components/AuthForm";
import * as Yup from "yup";
import LoginBackground from "../../../assets/img/log in.png";

/**
 * Validation schema for login form
 * Uses Yup to validate:
 * - Email format
 * - Password length
 */
const LoginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email format"
    )
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
}).required();

/**
 * Login page component
 * Displays login form using FormContainer and AuthForm
 */
const Login: FC = () => {
  // Handle successful Google login
  const handleGoogleLoginSuccess = (credentialResponse: any) => {
    console.log("Google Login Success:", credentialResponse);
    // Here you would send the credential to your backend
  };

  // Handle Google login errors
  const handleGoogleLoginError = () => {
    console.error("Google Login Failed");
  };
  return (
    <FormContainer
      title="Log in"
      subtitle="Welcome back! Please enter your details."
      actionLinkText="Don't have an account?"
      actionLinkLabel="Sign up"
      actionLinkTo="/signup"
      backgroundImage={LoginBackground}
      infoHeading="Welcome Back! Your HR Hub Awaits"
      infoText="Track your leave balance, submit job applications, and stay updated on your work attendance—all in one place."
    >
      <AuthForm
        onSubmit={(data) => {
          // Handle login logic here - will be replaced with actual API call
          console.log("Login submitted with data:", data);
        }}
        schema={LoginSchema}
        submitText="Sign in"
        showRememberMe={true} // Show remember me checkbox on login
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "Enter your email",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "Enter your password",
          },
        ]}
        onGoogleSuccess={handleGoogleLoginSuccess}
        onGoogleError={handleGoogleLoginError}
      />
    </FormContainer>
  );
};

export default Login;
