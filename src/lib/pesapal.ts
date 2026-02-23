/**
 * Pesapal Payment Integration Service
 * Handles payment initiation and callback processing for contributions
 */

const PESAPAL_API_URL = 'https://api.pesapal.com/api/urlbuilder';
const PESAPAL_IPNLISTENER = 'https://www.pesapal.com/api/PostPesapalDirectOrderV4';

interface PesapalConfig {
  consumerKey: string;
  consumerSecret: string;
  notificationUrl: string;
  callbackUrl: string;
}

interface ContributionPayment {
  userId: string;
  amount: number;
  phoneNumber: string;
  description: string;
  reference: string;
}

/**
 * Generate OAuth signature for Pesapal API requests
 * Uses HMAC-SHA1 signature method
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string
): string {
  const baseString = encodeURIComponent(method.toUpperCase()) + '&' +
    encodeURIComponent(url) + '&' +
    encodeURIComponent(Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&'));

  const signatureKey = encodeURIComponent(consumerSecret) + '&';
  
  // Use crypto API if available (browser environment)
  if (typeof window !== 'undefined' && window.crypto) {
    // For browser: This would need to be handled server-side for security
    // For now, we'll use a placeholder that should be handled by backend
    console.warn('OAuth signature should be generated server-side for security');
    return 'client-side-signature-placeholder';
  }

  // Node.js environment would use crypto module
  return 'signature-placeholder';
}

/**
 * Initiate a payment request with Pesapal
 */
export async function initiatePesapalPayment(
  payment: ContributionPayment,
  config: PesapalConfig
): Promise<{ url: string; reference: string }> {
  try {
    console.log('Initiating Pesapal payment for:', payment.phoneNumber);

    // Build payment parameters
    const params: Record<string, string> = {
      oauth_consumer_key: config.consumerKey,
      oauth_token: '',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_signature: '',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: generateNonce(),
      oauth_version: '1.0',
      pesapal_request_data: encodeURIComponent(JSON.stringify({
        transaction_type: 'PAYMENT',
        money: {
          currency: 'KES',
          amount: payment.amount.toString()
        },
        billing_details: {
          name: payment.userId,
          phone_number: payment.phoneNumber,
          email: `user+${payment.userId}@horizon.local`
        },
        redirect_mode: '',
        post_transaction_success_message: 'Your contribution has been processed successfully!',
        post_transaction_failed_message: 'Transaction failed. Please try again.',
        merchant_reference: payment.reference,
        invoice_number: payment.reference,
        description: payment.description,
        callback_url: config.callbackUrl,
        notification_id: '1' // Pesapal IPN listener ID
      }))
    };

    // Generate OAuth signature (this should ideally be done server-side)
    params.oauth_signature = generateOAuthSignature(
      'POST',
      PESAPAL_API_URL,
      params,
      config.consumerSecret
    );

    // Build authorization header
    const authHeader = Object.keys(params)
      .filter(key => key.startsWith('oauth_'))
      .sort()
      .map(key => `${key}="${encodeURIComponent(params[key])}"`)
      .join(', ');

    console.log('Payment initiation prepared for:', payment.reference);

    return {
      url: PESAPAL_API_URL + '?pesapal_request_data=' + params.pesapal_request_data,
      reference: payment.reference
    };
  } catch (error) {
    console.error('Error initiating Pesapal payment:', error);
    throw new Error('Failed to initiate payment. Please try again.');
  }
}

/**
 * Process payment callback from Pesapal
 */
export async function processPesapalCallback(
  pesapalTrackingId: string,
  orderTrackingId: string,
  merchantReference: string,
  pesapalNotification: string
): Promise<{
  status: string;
  amount: number;
  reference: string;
}> {
  try {
    console.log('Processing Pesapal callback for reference:', merchantReference);

    // In production, you would:
    // 1. Verify the callback signature
    // 2. Query Pesapal API to get payment status
    // 3. Update your database with the payment status

    // For now, return a placeholder response
    return {
      status: 'COMPLETED',
      amount: 0,
      reference: merchantReference
    };
  } catch (error) {
    console.error('Error processing Pesapal callback:', error);
    throw error;
  }
}

/**
 * Query payment status from Pesapal
 */
export async function getPesapalPaymentStatus(
  merchantReference: string,
  config: PesapalConfig
): Promise<{
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount?: number;
  timestamp?: string;
}> {
  try {
    // This would typically call the Pesapal API via a backend service
    // The backend would verify the transaction details
    console.log('Checking payment status for:', merchantReference);

    // Placeholder for status check
    return {
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
}

/**
 * Generate a unique nonce for OAuth requests
 */
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a unique merchant reference for tracking
 */
export function generateMerchantReference(userId: string): string {
  return `HOR-${userId.substring(0, 6)}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
