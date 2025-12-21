// site/src/routes/auth/SignupAdmin.jsx
import SignupBase from "./SignupBase.jsx";

export default function SignupAdmin() {
  return (
    <SignupBase
      role="ADMIN"
      title="Admin Access"
      subtitle="Lala's control room. Manage the platform, moderate content, and tune the entire experience."
      icon="⚙️"
      gradient="linear-gradient(135deg, #dbeafe, #bfdbfe)"
      benefits={[
        "Closet management & curation",
        "User and role management",
        "Content moderation tools",
        "Game rules and events admin",
        "Episode studio",
        "Creator assets management",
        "Analytics and reporting",
        "Exclusive Prime Studios access",
      ]}
      buttonText="Login as Admin"
    />
  );
}
