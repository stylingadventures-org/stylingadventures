/**
 * Payment Service - Stripe Integration
 * Handles checkout session creation and payment flow
 * Note: Components using this must have access to AuthContext (user & tokens)
 */

const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_TEST_KEY';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Initiates a Stripe Checkout session for tier upgrade
 * @param {string} tier - 'BESTIE' or 'CREATOR'
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @param {Object} user - Cognito user object from AuthContext
 * @returns {Promise<{sessionId: string, url: string}>}
 */
export const initiateStripeCheckout = async (tier, billingCycle, user) => {
  try {
    if (!user) {
      throw new Error('User must be logged in to initiate payment');
    }

    // Get user's ID token for backend auth
    const token = await user.getIdToken();

    // Prepare payload
    const payload = {
      tier: tier.toUpperCase(), // 'BESTIE' | 'CREATOR'
      billingCycle: billingCycle.toLowerCase(), // 'monthly' | 'annual'
      userEmail: user.email,
      userId: user.sub || user.username, // Cognito sub from token
      successUrl: `${window.location.origin}/bestie/home?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/upgrade/${tier.toLowerCase()}`,
    };

    console.log('[Payment] Initiating checkout:', payload);

    // Call backend to create checkout session
    const response = await fetch(`${API_BASE_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    
    if (!data.sessionId) {
      throw new Error('No session ID returned from backend');
    }

    console.log('[Payment] Checkout session created:', data.sessionId);

    return {
      sessionId: data.sessionId,
      clientSecret: data.clientSecret, // If using redirect flow
      url: data.url, // Direct redirect URL
    };
  } catch (error) {
    console.error('[Payment] Checkout initiation failed:', error);
    throw error;
  }
};

/**
 * Redirects to Stripe Checkout page
 * @param {string} tier - 'BESTIE' or 'CREATOR'
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @param {Object} user - Cognito user object from AuthContext
 */
export const redirectToStripeCheckout = async (tier, billingCycle, user) => {
  try {
    const { url } = await initiateStripeCheckout(tier, billingCycle, user);
    
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No redirect URL provided');
    }
  } catch (error) {
    console.error('[Payment] Redirect failed:', error);
    throw error;
  }
};

/**
 * Retrieves checkout session status (used on success page)
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<{status: string, payment_status: string, customer_email: string}>}
 */
export const getCheckoutSessionStatus = async (sessionId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be logged in');
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/payments/checkout-session/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve session status');
    }

    return await response.json();
  } catch (error) {
    console.error('[Payment] Failed to get session status:', error);
    throw error;
  }
};

/**
 * Webhook callback for local testing
 * In production, this is handled by AWS Lambda
 */
export const handleStripeWebhook = async (eventData) => {
  console.log('[Payment] Webhook received:', eventData.type);
  
  switch (eventData.type) {
    case 'checkout.session.completed':
      console.log('[Payment] Payment successful for:', eventData.data.object.customer_email);
      // Backend Lambda handles role assignment
      break;
    case 'charge.failed':
      console.error('[Payment] Payment failed:', eventData.data.object.failure_message);
      break;
    default:
      console.log('[Payment] Unhandled event type:', eventData.type);
  }
};

export default {
  initiateStripeCheckout,
  redirectToStripeCheckout,
  getCheckoutSessionStatus,
  handleStripeWebhook,
};
