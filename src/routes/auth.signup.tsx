import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/AuthScreen";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
  head: () => ({
    meta: [
      { title: "Join Veyra Found — Find your co-founder" },
      { name: "description", content: "Create your Veyra Found account in seconds with Google or your phone number." },
      { property: "og:title", content: "Join Veyra Found — Find your co-founder" },
      { property: "og:description", content: "Create your Veyra Found account in seconds with Google or your phone number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Signup() {
  return (
    <AuthScreen
      title="Join Veyra Found"
      subtitle="Get started in seconds — Google or phone number, then set up your profile."
      googleLabel="Sign up with Google"
    />
  );
}
