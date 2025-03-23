import { FC } from "react";
import FormContainer from "../../components/layout/Auth/FormContainer";
import AuthForm from "../../components/layout/Auth/AuthForm";
import * as yup from "yup";
import LoginBackground from "../../assets/img/log in.png";
import { ILoginData } from "../../types";
import { handleLogin } from "../../API/Login";

const Login: FC = () => {
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
  };

  return (
    <FormContainer
      title="Log in"
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
      />
    </FormContainer>
  );
};

export default Login;
