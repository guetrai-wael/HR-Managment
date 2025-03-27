import { FC } from "react";
import { FormContainer, AuthForm } from "../../components/layout/Auth/index";
import * as Yup from "yup";
import SignupBackground from "../../assets/img/sign up.png";
import { handleRegister, getSession } from "../../API/Login";
import { ILoginData } from "../../types";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

const Signup: FC = () => {
  const navigate = useNavigate();
  const SignupSchema = Yup.object().shape({
    name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters"),
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

  const onSubmit = async (data: ILoginData) => {
    const { email, password } = data;
    await handleRegister(email, password);
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
      actionLinkTo="/"
      backgroundImage={SignupBackground}
      infoHeading="Streamline Your HR Experience"
      infoText="Manage your leave requests, job applications, and attendance with ease. Join our system and stay connected with your workplace."
    >
      <AuthForm
        onSubmit={onSubmit}
        schema={SignupSchema}
        submitText="Create account"
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={handleGoogleError}
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
      />
    </FormContainer>
  );
};

export default Signup;
