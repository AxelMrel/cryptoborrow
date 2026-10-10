export type Role = "super_admin" | "admin" | "client";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  created_by: string | null;
  balance: number;
  credits: number;
  max_clients: number;
  phone?: string | null;
  status: "active" | "pending";
  yield_at?: string | null;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  kind: "card" | "bank";
  label: string;
  holder: string;
  last4: string;
  expiry: string | null;
  is_default: boolean;
  created_at: string;
};

export type TxType = "deposit" | "withdrawal" | "client_credit" | "admin_credit" | "admin_fee" | "yield";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  from_user: string | null;
  to_user: string | null;
  created_at: string;
};

export type WithdrawalCode = {
  id: string;
  code: string;
  client_id: string;
  admin_id: string;
  amount: number | null;
  status: "active" | "used" | "expired";
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type Credentials = { clientId: string; name: string; email: string; password: string };

export type PaymentKind = "client_creation" | "withdrawal_code" | "pack";

export type Payment = {
  id: string;
  user_id: string;
  kind: PaymentKind;
  amount_xof: number;
  target_client_id: string | null;
  code_amount: number | null;
  fedapay_id: number | null;
  status: "pending" | "approved" | "declined" | "canceled";
  created_at: string;
  paid_at: string | null;
};

export type ActionState = { ok: boolean; message: string; credentials?: Credentials; redirectTo?: string } | null;
