import { FC } from "react";
import { FormContainer, AuthForm } from "../../components/layout/Auth/index";
import * as yup from "yup";
import LoginBackground from "../../assets/img/log in.png";
import { ILoginData } from "../../types";
import { handleLogin, getSession } from "../../API/Login";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

const Login: FC = () => {
  const navigate = useNavigate();
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

  const onSubmit = async (data: ILoginData) => {
    const { email, password } = data;
    await handleLogin(email, password);
    navigate("/");
  };

  const handleGoogleSuccess = async () => {
    try {
      // This will be called after the user is redirected back from Google
      const session = await getSession();
      if (session) {
        message.success("Successfully logged in with Google!");
        navigate("/");
      }
    } catch (error) {
      console.error("Error handling Google login success:", error);
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
        onSubmit={onSubmit}
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
      />
    </FormContainer>
  );
};

export default Login;
