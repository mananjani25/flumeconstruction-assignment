// Lightweight client-facing types mirroring API responses.

export type Supplier = {
  id: string;
  name: string;
  country: string;
  website: string | null;
  createdAt: string;
};

export type SupplierWithCount = Supplier & {
  _count: { products: number };
};

export type Product = {
  id: string;
  supplierId: string;
  name: string;
  category: string;
  unitPrice: number;
  currency: string;
  unitOfMeasure: string;
  leadTimeDays: number;
};

export type ProductWithSupplier = Product & {
  supplier: { id: string; name: string; country: string };
};

export type SupplierWithProducts = Supplier & { products: Product[] };

export type Project = {
  id: string;
  name: string;
  buyerName: string;
  status: string;
  createdAt: string;
};

export type ProjectWithCount = Project & {
  _count: { specItems: number };
};

export type SourcingOption = {
  id: string;
  specItemId: string;
  productId: string;
  quotedPrice: number;
  totalCost: number;
  leadTimeDays: number;
  isSelected: boolean;
  product: Product & { supplier: Supplier };
};

export type SpecItem = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unitOfMeasure: string;
  options: SourcingOption[];
};

export type ProjectDetail = Project & { specItems: SpecItem[] };

export type SpecItemDetail = SpecItem & { project: Project };
