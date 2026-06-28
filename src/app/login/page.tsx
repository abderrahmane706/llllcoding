import LoginForm from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — Solo Leveling Tracker",
  description: "Authenticate to access the System.",
};

export default function LoginRoute() {
  return <LoginForm />;
}
