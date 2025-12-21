// site/src/routes/auth/SignupCollab.jsx
import SignupBase from "./SignupBase.jsx";

export default function SignupCollab() {
  return (
    <SignupBase
      role="COLLAB"
      title="Partner as Collaborator"
      subtitle="Manage brand partnerships and co-branded campaigns with our creator community."
      icon="🤝"
      gradient="linear-gradient(135deg, #e9d5ff, #f3e8ff)"
      benefits={[
        "Creator collaboration tools",
        "Campaign management suite",
        "Brand partnership analytics",
        "Direct creator outreach",
        "Campaign performance tracking",
        "Exclusive partnership opportunities",
        "Dedicated support team",
      ]}
      buttonText="Enter Collaborator Hub"
    />
  );
}
