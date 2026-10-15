/**
 * Google Analytics 4 (GA4) Type-Safe Helper Library for Next.js App Router
 * Supports Google Consent Mode v2, custom event tracking, e-commerce checkout events,
 * and creator workflow interactions.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getGoogleAnalyticsId(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_GA_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ||
    process.env.NEXT_PUBLIC_GTAG_ID ||
    undefined
  );
}

/**
 * Track page views manually if needed (automatic in GoogleAnalytics component)
 */
export function pageview(url: string) {
  const gaId = getGoogleAnalyticsId();
  if (typeof window === "undefined" || !window.gtag || !gaId) return;

  window.gtag("config", gaId, {
    page_path: url,
    page_location: window.location.href,
  });
}

/**
 * Send custom Google Analytics event
 */
export function trackEvent(
  action: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params ?? {});
}

/**
 * E-Commerce & Creator Conversion Events
 */
export const Analytics = {
  // 1. Box and Brief View
  viewBox: (boxSlug: string, category: string, price?: number) => {
    trackEvent("view_item", {
      item_id: boxSlug,
      item_name: `Box: ${boxSlug}`,
      item_category: category,
      value: price,
      currency: "USD",
    });
  },

  // 2. Begin Checkout
  beginCheckout: (boxSlug: string, category: string, price: number) => {
    trackEvent("begin_checkout", {
      value: price,
      currency: "USD",
      items: [
        {
          item_id: boxSlug,
          item_name: `Box: ${boxSlug}`,
          item_category: category,
          price,
          quantity: 1,
        },
      ],
    });
  },

  // 3. Purchase Success
  purchaseSuccess: (transactionId: string, boxSlug: string, price: number) => {
    trackEvent("purchase", {
      transaction_id: transactionId,
      value: price,
      currency: "USD",
      items: [
        {
          item_id: boxSlug,
          item_name: `Box: ${boxSlug}`,
          price,
          quantity: 1,
        },
      ],
    });
  },

  // 4. Card Interactions
  viewIdeaCard: (ideaId: string, title: string, category?: string) => {
    trackEvent("view_card", {
      card_id: ideaId,
      card_title: title,
      category: category ?? "general",
    });
  },

  startShootMode: (ideaId: string, title: string) => {
    trackEvent("start_shoot_mode", {
      card_id: ideaId,
      card_title: title,
    });
  },

  completeShootStep: (ideaId: string, stepIndex: number, stepPurpose: string) => {
    trackEvent("complete_shoot_step", {
      card_id: ideaId,
      step_index: stepIndex,
      step_purpose: stepPurpose,
    });
  },

  requestCardCheck: (ideaId: string) => {
    trackEvent("request_card_check", {
      card_id: ideaId,
    });
  },

  exportCardPdf: (ideaId: string) => {
    trackEvent("export_card_pdf", {
      card_id: ideaId,
    });
  },
};
