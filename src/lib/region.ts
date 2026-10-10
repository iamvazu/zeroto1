// zeroto1.academy — Region & Currency Localization (Sprint 13)

export type RegionCode = 'US' | 'IN';
export type Region = RegionCode;

export interface PlanPricing {
  monthly: number;
  yearly: number;
  monthlyAmount: number;
  yearlyAmount: number;
  currency: string;
  currencySymbol: string;
  foundingYearly: number;
}

export const REGION_PRICING: Record<RegionCode, PlanPricing> = {
  US: {
    monthly: 19,
    yearly: 99,
    monthlyAmount: 19,
    yearlyAmount: 99,
    currency: 'USD',
    currencySymbol: '$',
    foundingYearly: 99,
  },
  IN: {
    monthly: 999,
    yearly: 7999,
    monthlyAmount: 999,
    yearlyAmount: 7999,
    currency: 'INR',
    currencySymbol: '₹',
    foundingYearly: 7999,
  },
};

export function getPricingForRegion(region: string = 'US'): PlanPricing {
  const code = (region.toUpperCase() === 'IN' ? 'IN' : 'US') as RegionCode;
  return REGION_PRICING[code];
}

export const getRegionPricing = getPricingForRegion;

export function formatPrice(amount: number, region: string = 'US'): string {
  const pricing = getPricingForRegion(region);
  return `${pricing.currencySymbol}${amount.toLocaleString()}`;
}
