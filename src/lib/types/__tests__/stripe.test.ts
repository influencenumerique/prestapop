/**
 * Tests unitaires pour les utilitaires Stripe
 * Pour exécuter : npm test src/lib/types/__tests__/stripe.test.ts
 */

import {
  calculateMissionPrice,
  formatPrice,
  eurosToCents,
  centsToEuros,
  isPaymentCompleted,
  canRefundPayment,
  isPaymentIntentResponse,
  isNoPaymentResponse,
} from "../stripe"

describe("Stripe Utils - Mission Price Calculation", () => {
  const dayRate = 15000 // 150€

  it("should calculate DAY mission price correctly", () => {
    expect(calculateMissionPrice(dayRate, "DAY")).toBe(15000)
  })

  it("should calculate HALF_DAY mission price correctly", () => {
    expect(calculateMissionPrice(dayRate, "HALF_DAY")).toBe(7500)
  })

  it("should calculate WEEK mission price correctly", () => {
    expect(calculateMissionPrice(dayRate, "WEEK")).toBe(75000)
  })

  it("should handle rounding for HALF_DAY correctly", () => {
    const oddDayRate = 15001 // 150.01€
    expect(calculateMissionPrice(oddDayRate, "HALF_DAY")).toBe(7500)
  })
})

describe("Stripe Utils - Price Formatting", () => {
  it("should format price in euros correctly", () => {
    expect(formatPrice(15000)).toBe("150,00 €")
  })

  it("should format zero correctly", () => {
    expect(formatPrice(0)).toBe("0,00 €")
  })

  it("should format cents correctly", () => {
    expect(formatPrice(99)).toBe("0,99 €")
  })

  it("should format large amounts correctly", () => {
    expect(formatPrice(1234567)).toBe("12 345,67 €")
  })
})

describe("Stripe Utils - Currency Conversion", () => {
  it("should convert euros to cents correctly", () => {
    expect(eurosToCents(150)).toBe(15000)
    expect(eurosToCents(0.99)).toBe(99)
    expect(eurosToCents(1234.56)).toBe(123456)
  })

  it("should convert cents to euros correctly", () => {
    expect(centsToEuros(15000)).toBe(150)
    expect(centsToEuros(99)).toBe(0.99)
    expect(centsToEuros(123456)).toBe(1234.56)
  })

  it("should handle rounding for euros to cents", () => {
    expect(eurosToCents(150.999)).toBe(15100)
  })
})

describe("Stripe Utils - Payment Status", () => {
  it("should identify completed payments", () => {
    expect(isPaymentCompleted("succeeded")).toBe(true)
    expect(isPaymentCompleted("pending")).toBe(false)
    expect(isPaymentCompleted("failed")).toBe(false)
    expect(isPaymentCompleted("refunded")).toBe(false)
  })

  it("should identify refundable payments", () => {
    expect(canRefundPayment("succeeded")).toBe(true)
    expect(canRefundPayment("pending")).toBe(false)
    expect(canRefundPayment("failed")).toBe(false)
    expect(canRefundPayment("refunded")).toBe(false)
  })
})

describe("Stripe Utils - Type Guards", () => {
  it("should identify PaymentIntentResponse correctly", () => {
    const paymentResponse = {
      clientSecret: "pi_xxx_secret_yyy",
      paymentIntentId: "pi_xxx",
    }
    expect(isPaymentIntentResponse(paymentResponse)).toBe(true)
  })

  it("should identify NoPaymentResponse correctly", () => {
    const noPaymentResponse = {
      status: "no_payment" as const,
      message: "No payment initiated",
    }
    expect(isNoPaymentResponse(noPaymentResponse)).toBe(true)
  })

  it("should distinguish between response types", () => {
    const paymentResponse = {
      clientSecret: "pi_xxx_secret_yyy",
      paymentIntentId: "pi_xxx",
    }
    const noPaymentResponse = {
      status: "no_payment" as const,
      message: "No payment initiated",
    }

    expect(isPaymentIntentResponse(paymentResponse)).toBe(true)
    expect(isNoPaymentResponse(paymentResponse)).toBe(false)

    expect(isPaymentIntentResponse(noPaymentResponse)).toBe(false)
    expect(isNoPaymentResponse(noPaymentResponse)).toBe(true)
  })
})
