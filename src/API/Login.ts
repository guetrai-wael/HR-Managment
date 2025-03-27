import { message } from "antd";
import supabase from "../services/supabaseClient";

export const handleLogin = async (email: string, password: string) => {
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) message.error(error.message);
  else {
    return session;
  }
};

// New function to handle Google auth session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    message.error(error.message);
    return null;
  }
  return data.session;
};

export const handleRegister = async (email: string, password: string) => {
  const { data: session, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) message.error(error.message);
  else {
    return session;
  }
};

export const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    message.error(error.message);
    return false;
  }

  message.success("Successfully logged out");
  return true;
};
