// site/src/routes/auth/SignupFan.jsx
import SignupBase from "./SignupBase.jsx";

export default function SignupFan() {
  return (
    <SignupBase
      role="FAN"
      title="Join as a Fan"
      subtitle="Explore Lala's world, save your favorite looks, and connect with a community of style enthusiasts."
      icon="🌈"
      gradient="linear-gradient(135deg, #fde7f4, #e0f2fe)"
      benefits={[
        "Browse all episodes and closet drops",
        "Save outfits you love",
        "Participate in community",
        "Lightweight, no-pressure experience",
        "Free to join, optional upgrades available",
      ]}
      buttonText="Start as Fan"
    />
  );
}
