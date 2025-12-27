/**
 * AWS Lambda - Create Stripe Checkout Session
 * Endpoint: POST /api/payments/create-checkout-session
 * 
 * Receives tier + user info from frontend
 * Creates Stripe checkout session
 * Returns session ID + redirect URL
 */

import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const dynamodb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
);

// Pricing configuration
const PRICING: Record<string, any> = {
  BESTIE: {
    monthly: { amount: 999, currency: 'usd', interval: 'month' },
    annual: { amount: 9999, currency: 'usd', interval: 'year' },
  },
  CREATOR: {
    monthly: { amount: 2499, currency: 'usd', interval: 'month' },
    annual: { amount: 24999, currency: 'usd', interval: 'year' },
  },
};

/**
 * Lambda handler for creating Stripe checkout sessions
 */
export const handler = async (event: any): Promise<any> => {
  console.log('[Checkout] Event received:', JSON.stringify(event));

  try {
    // Parse request
    const body = JSON.parse(event.body || '{}');
    const { tier, billingCycle, userEmail, userId } = body;
    
    // Validate tier
    if (!['BESTIE', 'CREATOR'].includes(tier)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid tier' }),
      };
    }

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid billing cycle' }),
      };
    }

    const pricing = PRICING[tier][billingCycle];
    
    console.log(`[Checkout] Creating session for ${tier} (${billingCycle})`, {
      amount: pricing.amount,
      email: userEmail,
    });

    // Create or retrieve Stripe customer
    let customer: Stripe.Customer;
    try {
      // Search for existing customer
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0] as Stripe.Customer;
        console.log('[Checkout] Found existing customer:', customer.id);
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            cognitoUserId: userId,
            tier: tier,
          },
        }) as Stripe.Customer;
        console.log('[Checkout] Created new customer:', customer.id);
      }
    } catch (error: any) {
      console.error('[Checkout] Customer lookup failed:', error);
      throw error;
    }

    // Create or get product
    let product = await getOrCreateProduct(tier);

    // Create or get price
    let price = await getOrCreatePrice(product.id, tier, billingCycle);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        tier: tier,
        billingCycle: billingCycle,
        cognitoUserId: userId,
      },
    });

    console.log('[Checkout] Session created:', session.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        sessionId: session.id,
        clientSecret: session.client_secret,
        url: session.url,
      }),
    };
  } catch (error: any) {
    console.error('[Checkout] Error:', error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to create checkout session',
        error: error.message,
      }),
    };
  }
};

/**
 * Get or create Stripe product for tier
 */
async function getOrCreateProduct(tier: string): Promise<Stripe.Product> {
  const productName = `Styling Adventures - ${tier} Tier`;
  
  try {
    // Search for existing product
    const products = await stripe.products.search({
      query: `name:"${productName}"`,
    });

    if (products.data.length > 0) {
      return products.data[0] as Stripe.Product;
    }

    // Create new product
    const product = await stripe.products.create({
      name: productName,
      description: getProductDescription(tier),
      metadata: {
        tier: tier,
      },
    });

    console.log('[Checkout] Created product:', product.id);
    return product as Stripe.Product;
  } catch (error: any) {
    console.error('[Checkout] Product creation error:', error);
    throw error;
  }
}

/**
 * Get or create Stripe price for tier + billing cycle
 */
async function getOrCreatePrice(
  productId: string,
  tier: string,
  billingCycle: string
): Promise<Stripe.Price> {
  const pricing = PRICING[tier][billingCycle];
  
  try {
    // Search for existing price
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 10,
    });

    const existingPrice = prices.data.find(
      (p: any) => p.recurring?.interval === pricing.interval &&
           p.unit_amount === pricing.amount
    );

    if (existingPrice) {
      return existingPrice as Stripe.Price;
    }

    // Create new price
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: pricing.amount,
      currency: pricing.currency,
      recurring: {
        interval: pricing.interval as any,
        interval_count: 1,
      },
      metadata: {
        tier: tier,
        billingCycle: billingCycle,
      },
    });

    console.log('[Checkout] Created price:', price.id);
    return price as Stripe.Price;
  } catch (error: any) {
    console.error('[Checkout] Price creation error:', error);
    throw error;
  }
}

/**
 * Product descriptions
 */
function getProductDescription(tier: string): string {
  const descriptions: Record<string, string> = {
    BESTIE: 'Expanded closet, challenges, collaborations, and analytics',
    CREATOR: 'Full monetization, creator studio, revenue tracking, and brand partnerships',
  };
  return descriptions[tier] || 'Premium tier';
}
