import { FC } from "react";
import { FormContainer, AuthForm } from "../../components/Auth/index";
import * as yup from "yup";
import LoginBackground from "../../assets/img/log in.png";
import { ILoginData } from "../../types";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../../hooks/index";

const Login: FC = () => {
  const navigate = useNavigate();
  const { login, getSession, isLoadingLogin } = useAuth();

  const LoginSchema = yup.object().shape({
    email: yup
      .string()
      .required("email is required")
      .matches(
        /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim,
        "email is not valid"
      ),
    password: yup.string().required("password is required"),
  });

  const handleSubmit = async (data: ILoginData) => {
    // Ensure email and password are not undefined before calling login
    if (data.email && data.password) {
      const result = await login(data.email, data.password);
      if (result && result.session) {
        navigate("/");
      }
    } else {
      // Handle cases where email or password might be missing, though yup should prevent this.
      console.error("Login form data is incomplete.");
      message.error("Email and password are required.");
    }
  };

  const handleGoogleSuccess = async () => {
    try {
      const session = await getSession();
      if (session) {
        message.success("Successfully logged in with Google!");
        navigate("/");
      }
    } catch (error) {
      console.error("Error handling Google login success:", error);
      message.error("Failed to process Google login. Please try again.");
    }
  };

  const handleGoogleError = (error: Error) => {
    message.error("Google login failed: " + error.message);
  };

  return (
    <FormContainer
      title="Login"
      subtitle="Welcome back! Please enter your details."
      actionLinkText="Don't have an account? "
      actionLinkLabel=" Sign up"
      actionLinkTo="/signup"
      backgroundImage={LoginBackground}
      infoHeading="Welcome Back! Your HR Hub Awaits"
      infoText="Track your leave balance, submit job applications, and stay updated on your work attendance—all in one place."
    >
      <AuthForm
        onSubmit={handleSubmit}
        schema={LoginSchema}
        submitText="Login"
        showRememberMe={true}
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={handleGoogleError}
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
        isLoading={isLoadingLogin}
      />
    </FormContainer>
  );
};

export default Login;
