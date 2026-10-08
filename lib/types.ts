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
  created_at: string;
};

export type TxType = "deposit" | "withdrawal" | "client_credit" | "admin_credit" | "admin_fee";

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

export type Plan = {
  id: string;
  name: string;
  price: number;
  credits: number;
  max_clients: number;
  highlight: boolean;
};

export type Credentials = { name: string; email: string; password: string };

export type ActionState = { ok: boolean; message: string; credentials?: Credentials } | null;
