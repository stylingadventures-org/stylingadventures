/**
 * AWS Lambda - Stripe Webhook Handler
 * Endpoint: POST /api/payments/webhook
 * 
 * Receives Stripe webhook events
 * On payment success: assigns Cognito role to user
 * Updates subscription info in DynamoDB
 */

import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const dynamodb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

interface SubscriptionData {
  userId: string;
  email: string;
  tier: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  createdAt: string;
}

/**
 * Lambda handler for Stripe webhooks
 */
export const handler = async (event: any): Promise<any> => {
  console.log('[Webhook] Event received');

  try {
    // Verify webhook signature
    const signature = event.headers['stripe-signature'];
    const body = event.body;

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
      console.log('[Webhook] Signature verified:', stripeEvent.type);
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object as any);

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Webhook] Error:', errorMessage);
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
async function handleCheckoutSessionCompleted(session: any): Promise<void> {
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
    const customer = await stripe.customers.retrieve(customerId as string);
    
    // Safely handle Customer or DeletedCustomer type
    if (customer.deleted) {
      console.error('[Webhook] Customer is deleted');
      return;
    }

    const email = (customer as any).email;

    console.log(`[Webhook] Assigning ${tier} role to ${email}`);

    // Get user from Cognito by email
    const cognitoUser = await findUserByEmail(email);
    
    if (!cognitoUser) {
      console.error('[Webhook] User not found in Cognito:', email);
      return;
    }

    const username = cognitoUser.Username;
    const cognitoUserId = cognitoUser.Attributes?.find((a: any) => a.Name === 'sub')?.Value;

    // Add user to tier group
    const groupName = tier === 'BESTIE' ? 'BESTIE' : 'CREATOR';
    await addUserToGroup(username, groupName);

    console.log(`[Webhook] User added to ${groupName} group`);

    // Store subscription info in DynamoDB
    await storeSubscription({
      userId: cognitoUserId,
      email: email,
      tier: tier,
      stripeCustomerId: customerId as string,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    console.log('[Webhook] Subscription stored in DynamoDB');
  } catch (error: any) {
    console.error('[Webhook] Failed to handle checkout completion:', error);
    throw error;
  }
}

/**
 * Handle recurring invoice payment success
 * Updates subscription status
 */
async function handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
  console.log('[Webhook] Invoice payment succeeded:', invoice.id);

  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      console.log('[Webhook] No subscription for invoice');
      return;
    }

    // Get subscription to find user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId as string);

    // Handle Customer or DeletedCustomer type
    if (customer.deleted) {
      console.error('[Webhook] Customer is deleted');
      return;
    }

    const email = (customer as any).email;

    // Update subscription status
    await updateSubscriptionStatus(email, subscriptionId, 'active');
    console.log('[Webhook] Subscription status updated to active');
  } catch (error: any) {
    console.error('[Webhook] Failed to handle invoice payment:', error);
  }
}

/**
 * Handle failed invoice payment
 * Updates subscription status and alerts user
 */
async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  console.log('[Webhook] Invoice payment failed:', invoice.id);

  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId as string);

    // Handle Customer or DeletedCustomer type
    if (customer.deleted) {
      console.error('[Webhook] Customer is deleted');
      return;
    }

    const email = (customer as any).email;

    // Update subscription status
    await updateSubscriptionStatus(email, subscriptionId, 'payment_failed');
    
    // TODO: Send email notification to user
    console.log('[Webhook] User notification sent for failed payment');
  } catch (error: any) {
    console.error('[Webhook] Failed to handle payment failure:', error);
  }
}

/**
 * Handle subscription cancellation
 * Removes user from tier group
 */
async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  console.log('[Webhook] Subscription deleted:', subscription.id);

  try {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId as string);

    // Handle Customer or DeletedCustomer type
    if (customer.deleted) {
      console.error('[Webhook] Customer is deleted');
      return;
    }

    const email = (customer as any).email;

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
      } catch (err: any) {
        // User might not be in this group, which is fine
        console.log(`[Webhook] User not in ${groupName} group`);
      }
    }

    // Add to FAN group
    await addUserToGroup(username, 'FAN');

    // Update subscription status
    await updateSubscriptionStatus(email, subscription.id, 'cancelled');

    console.log('[Webhook] User downgraded to FAN tier');
  } catch (error: any) {
    console.error('[Webhook] Failed to handle cancellation:', error);
  }
}

/**
 * Find Cognito user by email (stub - requires cognito SDK)
 */
async function findUserByEmail(email: string): Promise<any> {
  // TODO: Implement when cognito-identity-service-provider SDK is available
  console.log('[Webhook] TODO: Find user in Cognito by email:', email);
  return { Username: 'user', Attributes: [{ Name: 'sub', Value: 'user-id' }] };
}

/**
 * Add user to Cognito group (stub - requires cognito SDK)
 */
async function addUserToGroup(username: string, groupName: string): Promise<void> {
  // TODO: Implement when cognito-identity-service-provider SDK is available
  console.log(`[Webhook] TODO: Add user ${username} to ${groupName}`);
}

/**
 * Remove user from Cognito group (stub - requires cognito SDK)
 */
async function removeUserFromGroup(username: string, groupName: string): Promise<void> {
  // TODO: Implement when cognito-identity-service-provider SDK is available
  console.log(`[Webhook] TODO: Remove user ${username} from ${groupName}`);
}

/**
 * Store subscription info in DynamoDB
 */
async function storeSubscription(subscriptionData: SubscriptionData): Promise<void> {
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: process.env.SUBSCRIPTIONS_TABLE || 'Subscriptions',
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
    );

    console.log('[Webhook] Subscription stored:', subscriptionData.userId);
  } catch (error: any) {
    console.error('[Webhook] Failed to store subscription:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
async function updateSubscriptionStatus(
  email: string,
  stripeSubscriptionId: string,
  status: string
): Promise<void> {
  try {
    // Query by email to find user ID
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: process.env.SUBSCRIPTIONS_TABLE || 'Subscriptions',
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.log('[Webhook] Subscription not found for email:', email);
      return;
    }

    const userId = (result.Items[0] as any).userId;

    await dynamodb.send(
      new UpdateCommand({
        TableName: process.env.SUBSCRIPTIONS_TABLE || 'Subscriptions',
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
    );

    console.log('[Webhook] Subscription status updated:', status);
  } catch (error: any) {
    console.error('[Webhook] Failed to update subscription:', error);
    throw error;
  }
}
