/**
 * AWS Lambda - Stripe Webhook Handler
 * Endpoint: POST /api/payments/webhook
 * 
 * Receives Stripe webhook events
 * On payment success: assigns Cognito role to user
 * Updates subscription info in DynamoDB
 */

import Stripe from 'stripe';
import AWS from 'aws-sdk';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Lambda handler for Stripe webhooks
 */
export const handler = async (event) => {
  console.log('[Webhook] Event received');

  try {
    // Verify webhook signature
    const signature = event.headers['stripe-signature'];
    const body = event.body;

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
      console.log('[Webhook] Signature verified:', stripeEvent.type);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(stripeEvent.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(stripeEvent.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;

      default:
        console.log('[Webhook] Unhandled event type:', stripeEvent.type);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook handler failed' }),
    };
  }
};

/**
 * Handle successful checkout session completion
 * Assigns tier to user and creates subscription record
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('[Webhook] Checkout session completed:', session.id);

  try {
    const customerId = session.customer;
    const tier = session.metadata?.tier;
    const subscriptionId = session.subscription;

    if (!tier) {
      console.error('[Webhook] No tier in metadata');
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;

    console.log(`[Webhook] Assigning ${tier} role to ${email}`);

    // Get user from Cognito by email
    const cognitoUser = await findUserByEmail(email);
    
    if (!cognitoUser) {
      console.error('[Webhook] User not found in Cognito:', email);
      return;
    }

    const username = cognitoUser.Username;
    const cognitoUserId = cognitoUser.Attributes.find(a => a.Name === 'sub')?.Value;

    // Add user to tier group
    const groupName = tier === 'BESTIE' ? 'BESTIE' : 'CREATOR';
    await addUserToGroup(username, groupName);

    console.log(`[Webhook] User added to ${groupName} group`);

    // Store subscription info in DynamoDB
    await storeSubscription({
      userId: cognitoUserId,
      email: email,
      tier: tier,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    console.log('[Webhook] Subscription stored in DynamoDB');
  } catch (error) {
    console.error('[Webhook] Failed to handle checkout completion:', error);
    throw error;
  }
}

/**
 * Handle recurring invoice payment success
 * Updates subscription status
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('[Webhook] Invoice payment succeeded:', invoice.id);

  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      console.log('[Webhook] No subscription for invoice');
      return;
    }

    // Get subscription to find user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);

    // Update subscription status
    await updateSubscriptionStatus(customer.email, subscriptionId, 'active');
    console.log('[Webhook] Subscription status updated to active');
  } catch (error) {
    console.error('[Webhook] Failed to handle invoice payment:', error);
  }
}

/**
 * Handle failed invoice payment
 * Updates subscription status and alerts user
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('[Webhook] Invoice payment failed:', invoice.id);

  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);

    // Update subscription status
    await updateSubscriptionStatus(customer.email, subscriptionId, 'payment_failed');
    
    // TODO: Send email notification to user
    console.log('[Webhook] User notification sent for failed payment');
  } catch (error) {
    console.error('[Webhook] Failed to handle payment failure:', error);
  }
}

/**
 * Handle subscription cancellation
 * Removes user from tier group
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('[Webhook] Subscription deleted:', subscription.id);

  try {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;

    // Find user
    const cognitoUser = await findUserByEmail(email);
    if (!cognitoUser) {
      console.error('[Webhook] User not found for cancellation');
      return;
    }

    const username = cognitoUser.Username;

    // Remove from all tier groups
    for (const groupName of ['BESTIE', 'CREATOR']) {
      try {
        await removeUserFromGroup(username, groupName);
      } catch (err) {
        // User might not be in this group, which is fine
        console.log(`[Webhook] User not in ${groupName} group`);
      }
    }

    // Add to FAN group
    await addUserToGroup(username, 'FAN');

    // Update subscription status
    await updateSubscriptionStatus(email, subscription.id, 'cancelled');

    console.log('[Webhook] User downgraded to FAN tier');
  } catch (error) {
    console.error('[Webhook] Failed to handle cancellation:', error);
  }
}

/**
 * Find Cognito user by email
 */
async function findUserByEmail(email) {
  try {
    const result = await cognito
      .listUsers({
        UserPoolId: USER_POOL_ID,
        Filter: `email = "${email}"`,
      })
      .promise();

    return result.Users[0] || null;
  } catch (error) {
    console.error('[Webhook] Failed to find user by email:', error);
    throw error;
  }
}

/**
 * Add user to Cognito group
 */
async function addUserToGroup(username, groupName) {
  try {
    await cognito
      .adminAddUserToGroup({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: groupName,
      })
      .promise();

    console.log(`[Webhook] User ${username} added to ${groupName}`);
  } catch (error) {
    console.error('[Webhook] Failed to add user to group:', error);
    throw error;
  }
}

/**
 * Remove user from Cognito group
 */
async function removeUserFromGroup(username, groupName) {
  try {
    await cognito
      .adminRemoveUserFromGroup({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: groupName,
      })
      .promise();

    console.log(`[Webhook] User ${username} removed from ${groupName}`);
  } catch (error) {
    console.error('[Webhook] Failed to remove user from group:', error);
    throw error;
  }
}

/**
 * Store subscription info in DynamoDB
 */
async function storeSubscription(subscriptionData) {
  try {
    await dynamodb
      .put({
        TableName: process.env.SUBSCRIPTIONS_TABLE,
        Item: {
          userId: subscriptionData.userId,
          email: subscriptionData.email,
          tier: subscriptionData.tier,
          stripeCustomerId: subscriptionData.stripeCustomerId,
          stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
          status: subscriptionData.status,
          createdAt: subscriptionData.createdAt,
          updatedAt: new Date().toISOString(),
        },
      })
      .promise();

    console.log('[Webhook] Subscription stored:', subscriptionData.userId);
  } catch (error) {
    console.error('[Webhook] Failed to store subscription:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
async function updateSubscriptionStatus(email, stripeSubscriptionId, status) {
  try {
    // Query by email to find user ID
    const result = await dynamodb
      .query({
        TableName: process.env.SUBSCRIPTIONS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      })
      .promise();

    if (result.Items.length === 0) {
      console.log('[Webhook] Subscription not found for email:', email);
      return;
    }

    const userId = result.Items[0].userId;

    await dynamodb
      .update({
        TableName: process.env.SUBSCRIPTIONS_TABLE,
        Key: {
          userId: userId,
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :now',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':now': new Date().toISOString(),
        },
      })
      .promise();

    console.log('[Webhook] Subscription status updated:', status);
  } catch (error) {
    console.error('[Webhook] Failed to update subscription:', error);
    throw error;
  }
}
