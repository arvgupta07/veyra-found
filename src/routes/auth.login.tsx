import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/AuthScreen";

export const Route = createFileRoute("/auth/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Sign in — Veyra Found" },
      { name: "description", content: "Sign in to Veyra Found with Google or your phone number to discover co-founders across India." },
      { property: "og:title", content: "Sign in — Veyra Found" },
      { property: "og:description", content: "Sign in to Veyra Found with Google or your phone number to discover co-founders across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Login() {
  return (
    <AuthScreen
      mode="login"
      title="Welcome back"
      subtitle="Sign in with Google or your email to find your co-founder."
      googleLabel="Continue with Google"
    />
  );
}
