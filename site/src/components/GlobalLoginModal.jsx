import React, { useState, useEffect } from "react";
import { LoginModal } from "./LoginModal.jsx";

/**
 * GlobalLoginModal - Listens for custom events and displays LoginModal anywhere in the app
 * This component should be mounted at the root level to ensure login modals work from any page
 */
export function GlobalLoginModal() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleOpenLoginModal = () => {
      console.log("[GlobalLoginModal] Opening modal via event");
      setShowLoginModal(true);
    };

    window.addEventListener("openLoginModal", handleOpenLoginModal);
    return () => window.removeEventListener("openLoginModal", handleOpenLoginModal);
  }, []);

  const handleClose = () => {
    console.log("[GlobalLoginModal] Closing modal");
    setShowLoginModal(false);
  };

  const handleLoginSuccess = () => {
    console.log("[GlobalLoginModal] Login success, closing modal (redirect handled by route components)");
    setShowLoginModal(false);
    // Note: Redirect is handled by route components' useEffect when isAuthenticated changes
  };

  return (
    <>
      {showLoginModal && (
        <LoginModal
          onClose={handleClose}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
