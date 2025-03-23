import { message } from "antd";
import supabase from "../services/supabaseClient";

export const handleLogin = async (email: string, password: string) => {
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) message.error(error.message);
  else {
    console.log(session);
  }
};

export const handleRegister = async (email: string, password: string) => {
  const { data: session, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) message.error(error.message);
  else {
    console.log(session);
  }
};
