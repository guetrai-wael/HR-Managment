import { FC } from "react";
import { FormContainer, AuthForm } from "../../components/Auth/index";
import * as Yup from "yup";
import SignupBackground from "../../assets/img/sign up.png";
import { ILoginData } from "../../types";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../../hooks";

const Signup: FC = () => {
  const navigate = useNavigate();
  const { register, getSession } = useAuth();

  const SignupSchema = Yup.object().shape({
    firstName: Yup.string()
      .required("First Name is required")
      .min(2, "First Name must be at least 2 characters"),
    lastName: Yup.string()
      .required("Last Name is required")
      .min(2, "Last Name must be at least 2 characters"),
    email: Yup.string()
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format"
      )
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
  });

  const handleRegistrationSubmit = async (values: ILoginData) => {
    const { email, password, firstName, lastName } = values;
    if (email && password && firstName && lastName) {
      const result = await register(email, password, firstName, lastName);
      if (result) {
        navigate("/");
      }
    } else {
      message.error("All fields are required for signup.");
    }
  };

  const handleGoogleSuccess = async () => {
    try {
      const session = await getSession();
      if (session) {
        message.success("Successfully signed up with Google!");
        navigate("/");
      }
    } catch (error) {
      console.error("Error handling Google signup success:", error);
      message.error("Failed to complete Google sign-up process.");
    }
  };

  const handleGoogleError = (error: Error) => {
    message.error("Google signup failed: " + error.message);
  };

  return (
    <FormContainer
      title="Sign up"
      subtitle="Create your account"
      actionLinkText="Already have an account? "
      actionLinkLabel=" Login"
      actionLinkTo="/login"
      backgroundImage={SignupBackground}
      infoHeading="Streamline Your HR Experience"
      infoText="Manage your leave requests, job applications, and attendance with ease. Join our system and stay connected with your workplace."
    >
      <AuthForm
        onSubmit={handleRegistrationSubmit}
        schema={SignupSchema}
        submitText="Create account"
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={handleGoogleError}
        fields={[
          {
            name: "firstName",
            label: "First Name",
            type: "text",
            placeholder: "Enter your first name",
          },
          {
            name: "lastName",
            label: "Last Name",
            type: "text",
            placeholder: "Enter your last name",
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
      />
    </FormContainer>
  );
};

export default Signup;
