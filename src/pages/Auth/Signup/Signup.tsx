// src/pages/Signup.tsx
import { FC } from "react";
import FormContainer from "../components/FormContainer";
import AuthForm from "../components/AuthForm";
import * as Yup from "yup";
import SignupBackground from "../../../assets/img/sign up.png";

/**
 * Validation schema for signup form
 * Uses Yup to validate:
 * - Name (required, min length)
 * - Email format
 * - Password length
 */
const SignupSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: Yup.string()
    .email("Invalid email format")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email format"
    )
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

/**
 * Signup page component
 * Displays signup form using FormContainer and AuthForm
 */
const Signup: FC = () => {
  // Handle successful Google signup
  const handleGoogleSignupSuccess = (credentialResponse: any) => {
    console.log("Google Signup Success:", credentialResponse);
    // Here you would send the credential to your backend
  };

  // Handle Google signup errors
  const handleGoogleSignupError = () => {
    console.error("Google Signup Failed");
  };
  return (
    <FormContainer
      title="Sign up"
      subtitle="Create your account"
      actionLinkText="Already have an account?"
      actionLinkLabel="Log in"
      actionLinkTo="/"
      backgroundImage={SignupBackground}
      infoHeading="Streamline Your HR Experience"
      infoText="Manage your leave requests, job applications, and attendance with ease. Join our system and stay connected with your workplace."
    >
      <AuthForm
        onSubmit={(data) => {
          // Handle signup logic here - will be replaced with actual API call
          console.log("Signup submitted with data:", data);
        }}
        schema={SignupSchema}
        submitText="Create account"
        fields={[
          {
            name: "name",
            label: "Full Name",
            type: "text",
            placeholder: "Enter your full name",
          },
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
        onGoogleSuccess={handleGoogleSignupSuccess}
        onGoogleError={handleGoogleSignupError}
      />
    </FormContainer>
  );
};

export default Signup;
