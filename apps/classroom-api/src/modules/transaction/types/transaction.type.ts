export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentGateway {
  PAYOS = 'PAYOS',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export interface Transaction {
  transaction_id: number;
  user_id: number;
  payment_gateway: string;
  transaction_type: string;
  amount: number;
  note: string;
  created_at: Date;
  status?: PaymentStatus;
  order_code?: string;
}
