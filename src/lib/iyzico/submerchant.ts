import { iyzipay, SubMerchantData } from "./client";
export type { SubMerchantData };
import { v4 as uuidv4 } from "uuid";

/**
 * Register an instructor as a sub-merchant in Iyzico Marketplace
 */
export async function createSubMerchant(
    data: SubMerchantData
): Promise<{ success: boolean; subMerchantKey?: string; error?: string }> {
    return new Promise((resolve) => {
        const request = {
            locale: "tr",
            conversationId: uuidv4(),
            subMerchantExternalId: uuidv4(),
            subMerchantType: data.subMerchantType,
            address: data.address,
            contactName: data.name,
            contactSurname: data.name.split(" ").pop() || "",
            email: data.email,
            gsmNumber: data.gsmNumber,
            name: data.name,
            iban: data.iban,
            identityNumber: data.identityNumber,
            taxNumber: data.taxNumber,
            legalCompanyTitle: data.legalCompanyTitle,
            currency: "TRY",
        };

        iyzipay.subMerchant.create(request, (err: any, result: any) => {
            if (err) {
                resolve({ success: false, error: err.message || "Sub-merchant creation failed" });
                return;
            }

            if (result.status === "success") {
                resolve({ success: true, subMerchantKey: result.subMerchantKey });
            } else {
                resolve({ success: false, error: result.errorMessage || "Unknown error" });
            }
        });
    });
}

/**
 * Retrieve sub-merchant details
 */
export async function getSubMerchant(
    subMerchantKey: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
        const request = {
            locale: "tr",
            conversationId: uuidv4(),
            subMerchantKey,
        };

        iyzipay.subMerchant.retrieve(request, (err: any, result: any) => {
            if (err) {
                resolve({ success: false, error: err.message });
                return;
            }

            if (result.status === "success") {
                resolve({ success: true, data: result });
            } else {
                resolve({ success: false, error: result.errorMessage });
            }
        });
    });
}
