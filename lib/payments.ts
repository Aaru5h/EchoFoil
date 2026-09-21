export interface PaymentProvider {
  id: "cod" | "bank";
  validate(settings: { iban: string; bankName: string; accountName: string }): void;
  status: "UNPAID";
}
export const paymentProviders: Record<string, PaymentProvider> = {
  cod: { id: "cod", status: "UNPAID", validate() {} },
  bank: {
    id: "bank",
    status: "UNPAID",
    validate(settings) {
      if (!settings.iban || !settings.bankName || !settings.accountName)
        throw new Error("BANK_UNAVAILABLE");
    },
  },
};
