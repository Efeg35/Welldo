import { iyzipay, CheckoutFormData } from "./client";
import { v4 as uuidv4 } from "uuid";

// Platform commission rate (e.g., 10%)
const PLATFORM_COMMISSION_RATE = 0.10;

/**
 * Calculate platform commission and sub-merchant share
 */
export function calculatePaymentSplit(totalPrice: number): {
    platformCommission: number;
    subMerchantPrice: number;
} {
    const platformCommission = totalPrice * PLATFORM_COMMISSION_RATE;
    const subMerchantPrice = totalPrice - platformCommission;
    return { platformCommission, subMerchantPrice };
}

/**
 * Create Iyzico Checkout Form (3D Secure payment page)
 */
export async function createCheckoutForm(
    data: CheckoutFormData
): Promise<{ success: boolean; checkoutFormContent?: string; token?: string; error?: string }> {
    return new Promise((resolve) => {
        const request = {
            locale: "tr",
            conversationId: uuidv4(),
            price: data.price,
            paidPrice: data.paidPrice,
            currency: data.currency,
            basketId: data.basketId,
            paymentGroup: data.paymentGroup,
            callbackUrl: data.callbackUrl,
            enabledInstallments: [1, 2, 3, 6, 9, 12],
            buyer: {
                id: data.buyer.id,
                name: data.buyer.name,
                surname: data.buyer.surname,
                gsmNumber: data.buyer.gsmNumber || "+905000000000",
                email: data.buyer.email,
                identityNumber: data.buyer.identityNumber,
                lastLoginDate: new Date().toISOString().split("T")[0] + " 00:00:00",
                registrationDate: new Date().toISOString().split("T")[0] + " 00:00:00",
                registrationAddress: data.buyer.registrationAddress,
                ip: data.buyer.ip,
                city: data.buyer.city,
                country: data.buyer.country,
            },
            shippingAddress: {
                contactName: data.shippingAddress.contactName,
                city: data.shippingAddress.city,
                country: data.shippingAddress.country,
                address: data.shippingAddress.address,
            },
            billingAddress: {
                contactName: data.billingAddress.contactName,
                city: data.billingAddress.city,
                country: data.billingAddress.country,
                address: data.billingAddress.address,
            },
            basketItems: data.basketItems.map((item) => ({
                id: item.id,
                name: item.name,
                category1: item.category,
                itemType: "VIRTUAL",
                price: item.price,
                subMerchantKey: item.subMerchantKey,
                subMerchantPrice: item.subMerchantPrice,
            })),
        };

        iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
            if (err) {
                resolve({ success: false, error: err.message || "Checkout form creation failed" });
                return;
            }

            if (result.status === "success") {
                resolve({
                    success: true,
                    checkoutFormContent: result.checkoutFormContent,
                    token: result.token,
                });
            } else {
                resolve({ success: false, error: result.errorMessage || "Unknown error" });
            }
        });
    });
}

/**
 * Retrieve payment result after callback
 */
export async function retrievePaymentResult(
    token: string
): Promise<{ success: boolean; paymentId?: string; status?: string; error?: string }> {
    return new Promise((resolve) => {
        const request = {
            locale: "tr",
            conversationId: uuidv4(),
            token,
        };

        iyzipay.checkoutForm.retrieve(request, (err: any, result: any) => {
            if (err) {
                resolve({ success: false, error: err.message });
                return;
            }

            if (result.status === "success" && result.paymentStatus === "SUCCESS") {
                resolve({
                    success: true,
                    paymentId: result.paymentId,
                    status: result.paymentStatus,
                });
            } else {
                resolve({
                    success: false,
                    error: result.errorMessage || "Payment failed",
                });
            }
        });
    });
}
