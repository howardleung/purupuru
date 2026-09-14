import type { ProductImageData } from "../components/product-image";

export type SearchProductResult = {
  id: string;
  brandName: string;
  productName: string;
  context: string;
  href: string;
  image: ProductImageData | null;
};

export type SearchLinkResult = {
  id: string;
  label: string;
  context: string | null;
  href: string;
};

export type GroupedSearchResults = {
  products: SearchProductResult[];
  brands: SearchLinkResult[];
  categories: SearchLinkResult[];
};

export const emptySearchResults: GroupedSearchResults = {
  products: [],
  brands: [],
  categories: [],
};
