export type OrderStatus = "PENDING" | "REVIEWING" | "PAID" | "DELIVERED" | "FAILED" | "REFUNDED";
export type CodeStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "VOID";
export type PaymentMethod = "bkash" | "nagad" | "rocket" | "bank";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  blurb: string;
  faceValue: number;
  price: number;
  active: boolean;
  categoryId: string;
};

export type VoucherCode = {
  id: string;
  productId: string;
  cipher: string;
  hash: string;
  status: CodeStatus;
  orderId?: string;
  reservedAt?: string;
  soldAt?: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  number: string;
  email: string;
  phone?: string;
  status: OrderStatus;
  total: number;
  paymentRef?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  proofFile?: string;
  proofSubmittedAt?: string;
  items: OrderItem[];
  codeIds: string[];
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
};

export type Audit = {
  id: string;
  actor: string;
  action: string;
  targetId?: string;
  createdAt: string;
};

export type Db = {
  version: 1;
  categories: Category[];
  products: Product[];
  codes: VoucherCode[];
  orders: Order[];
  audit: Audit[];
  webhooks: string[];
  nextNumber: number;
};

export type PublicProduct = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  faceValue: number;
  price: number;
  stock: number;
};

export type AdminSnapshot = {
  products: Array<
    PublicProduct & {
      reserved: number;
      sold: number;
      voided: number;
    }
  >;
  orders: Array<{
    id: string;
    number: string;
    email: string;
    phone?: string;
    status: OrderStatus;
    total: number;
    quantity: number;
    title: string;
    createdAt: string;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
    proofFile?: string;
    proofSubmittedAt?: string;
  }>;
  audit: Audit[];
};

export type BuyerOrder = {
  id: string;
  number: string;
  email: string;
  phone?: string;
  status: OrderStatus;
  total: number;
  quantity: number;
  title: string;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  proofSubmittedAt?: string;
  codes: string[];
};
