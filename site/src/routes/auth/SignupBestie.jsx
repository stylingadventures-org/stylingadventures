// site/src/routes/auth/SignupBestie.jsx
import SignupBase from "./SignupBase.jsx";

export default function SignupBestie() {
  return (
    <SignupBase
      role="BESTIE"
      title="Become a Bestie"
      subtitle="Join Lala's inner circle for exclusive content, early access, and VIP moments."
      icon="💖"
      gradient="linear-gradient(135deg, #fce7f3, #fbcfe8)"
      benefits={[
        "Access Bestie-only stories and content",
        "Vote on looks and future collaborations",
        "Early access to new closet drops",
        "Shout-outs and special surprises",
        "VIP community events",
        "Priority support",
      ]}
      buttonText="Become a Bestie"
    />
  );
}
