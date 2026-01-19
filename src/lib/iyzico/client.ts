import Iyzipay from "iyzipay";

// Initialize Iyzipay with environment variables
export const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY || "sandbox",
    secretKey: process.env.IYZICO_SECRET_KEY || "sandbox",
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
});

// Types for Iyzico operations
export interface SubMerchantData {
    name: string;
    email: string;
    gsmNumber: string;
    address: string;
    iban: string;
    identityNumber: string; // TC Kimlik No
    taxNumber?: string; // Vergi No (for companies)
    legalCompanyTitle?: string;
    subMerchantType: "PERSONAL" | "PRIVATE_COMPANY" | "LIMITED_OR_JOINT_STOCK_COMPANY";
}

export interface PaymentItem {
    id: string;
    name: string;
    category: string;
    price: string;
    subMerchantKey: string;
    subMerchantPrice: string; // Amount going to sub-merchant
}

export interface CheckoutFormData {
    price: string;
    paidPrice: string;
    currency: "TRY";
    basketId: string;
    paymentGroup: "PRODUCT" | "LISTING" | "SUBSCRIPTION";
    callbackUrl: string;
    buyer: {
        id: string;
        name: string;
        surname: string;
        email: string;
        gsmNumber?: string;
        identityNumber: string;
        registrationAddress: string;
        city: string;
        country: string;
        ip: string;
    };
    shippingAddress: {
        contactName: string;
        city: string;
        country: string;
        address: string;
    };
    billingAddress: {
        contactName: string;
        city: string;
        country: string;
        address: string;
    };
    basketItems: PaymentItem[];
}
