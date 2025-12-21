// site/src/routes/auth/SignupCreator.jsx
import SignupBase from "./SignupBase.jsx";

export default function SignupCreator() {
  return (
    <SignupBase
      role="CREATOR"
      title="Apply as Creator"
      subtitle="Host your own closet, share looks, and build a community around your personal style."
      icon="✨"
      gradient="linear-gradient(135deg, #fef08a, #fcd34d)"
      benefits={[
        "Upload and manage your own closet",
        "Share style breakdowns with community",
        "Analytics and engagement tracking",
        "Creator tools suite (Director, Scene Packs, etc.)",
        "Monetization opportunities",
        "Creator community access",
        "Custom storefront for merch/affiliates",
      ]}
      buttonText="Apply as Creator"
    />
  );
}
