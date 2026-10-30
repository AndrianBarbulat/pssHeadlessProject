/**
 * Minimal structural types for the Wix Cart V2 objects this app consumes.
 * These mirror the fields returned by the Wix eCommerce Cart V2 API and keep the
 * rest of the code independent of Wix's internal type names (and easy to test).
 */

export interface CartMoney {
  amount?: string;
  convertedAmount?: string;
}

export interface CartLineItemName {
  original?: string;
  translated?: string | null;
}

export interface CartLineItemQuantity {
  confirmedQuantity?: number;
  requestedQuantity?: number;
  availableQuantity?: number | null;
  fixedQuantity?: boolean;
}

export interface CartLineItemPricing {
  unitPrice?: CartMoney;
  totalPrice?: CartMoney;
}

export interface CartLineItemDescriptionLine {
  name?: { original?: string; translated?: string | null };
  plainText?: { original?: string; translated?: string | null };
}

export interface CartLineItemAttributes {
  image?: string;
  url?: string;
  descriptionLines?: CartLineItemDescriptionLine[];
}

export interface CartLineItem {
  _id?: string | null;
  name?: CartLineItemName;
  quantityInfo?: CartLineItemQuantity;
  pricing?: CartLineItemPricing;
  attributes?: CartLineItemAttributes;
  /** IN_STOCK | PARTIALLY_IN_STOCK | OUT_OF_STOCK | REMOVED_FROM_CATALOG */
  status?: string;
}

export interface Cart {
  _id?: string;
  lineItems?: CartLineItem[];
  subtotal?: CartMoney;
  businessInfo?: { currencyCode?: string; languageCode?: string };
  customerInfo?: { currencyCode?: string; languageCode?: string; visitorId?: string };
}
