import { CognitoIdentityProviderClient, ConfirmSignUpCommand, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoConfig } from "./appSyncConfig";

const cognitoClient = new CognitoIdentityProviderClient({
  region: cognitoConfig.region,
});

/**
 * Send confirmation code to user's email
 * Used when user gets UserNotConfirmedException during login
 */
export async function resendConfirmationCode(username) {
  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: cognitoConfig.userPoolWebClientId,
      Username: username,
    });
    await cognitoClient.send(command);
    return { success: true, message: "Confirmation code sent to your email" };
  } catch (err) {
    console.error("Error resending confirmation code:", err);
    return { 
      success: false, 
      message: err.message || "Failed to resend confirmation code" 
    };
  }
}

/**
 * Confirm user email with verification code
 */
export async function confirmSignUp(username, confirmationCode) {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: cognitoConfig.userPoolWebClientId,
      Username: username,
      ConfirmationCode: confirmationCode,
    });
    await cognitoClient.send(command);
    return { success: true, message: "Email verified! You can now log in." };
  } catch (err) {
    console.error("Error confirming sign up:", err);
    return { 
      success: false, 
      message: err.message || "Invalid confirmation code" 
    };
  }
}

/**
 * Check if user needs email confirmation
 */
export function isEmailConfirmationError(error) {
  return error?.message?.includes("UserNotConfirmedException");
}
