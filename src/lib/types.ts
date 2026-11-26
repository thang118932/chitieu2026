export type TxType = "expense" | "income";

export type Family = {
  id: string;
  name: string;
  currency: string;
  invite_code: string;
};

export type Category = {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  color: string;
  type: TxType;
  sort_order: number;
};

export type Transaction = {
  id: string;
  family_id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: TxType;
  date: string; // YYYY-MM-DD
  note: string | null;
  created_at: string;
};

export type Member = {
  user_id: string;
  role: "owner" | "member";
  name: string;
  avatar_url: string | null;
};
