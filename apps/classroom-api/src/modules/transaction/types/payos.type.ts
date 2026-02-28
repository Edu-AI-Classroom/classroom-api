export interface PayOSWebhookData {
  code: string;
  desc: string;
  success: boolean;
  data: PayOSPaymentData;
}

export interface PayOSPaymentData {
  orderCode: string;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentMethodId: number;
  paymentMethodName: string;
  counterPartyCode: string;
  counterPartyName: string;
  paymentLinkId: string;
  code: string;
  status: PayOSPaymentStatus;
  bookingId: string;
  createdAt: string;
  cancelledAt?: string;
  expiredAt?: string;
}

export enum PayOSPaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export interface PayOSInitiateData {
  orderCode: string;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName: string;
  buyerEmail: string;
}

export interface PayOSPaymentResponse {
  code: string;
  desc: string;
  success: boolean;
  data: {
    binLabel: string;
    checkoutUrl: string;
    accountNumber: string;
    accountName: string;
    acqId: number;
    amount: number;
    description: string;
    orderCode: string;
    currency: string;
    paymentLinkId: string;
    status: PayOSPaymentStatus;
    createdAt: string;
    expiredAt: string;
    cancelledAt?: string;
    ref?: string;
    bookingId?: string;
  };
}

export interface PayOSSignature {
  signature: string;
}

export interface WebhookSignatureData {
  code: string;
  desc: string;
  success: boolean;
  data: {
    orderCode: string;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentMethodId: number;
    paymentMethodName: string;
    counterPartyCode: string;
    counterPartyName: string;
    paymentLinkId: string;
    code: string;
    status: PayOSPaymentStatus;
    bookingId: string;
    createdAt: string;
    cancelledAt?: string;
    expiredAt?: string;
  };
  signature: string;
}
