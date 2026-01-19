declare module "iyzipay" {
    export interface IyzipayConfig {
        apiKey: string;
        secretKey: string;
        uri: string;
    }

    export default class Iyzipay {
        constructor(config: IyzipayConfig);

        subMerchant: {
            create(request: any, callback: (err: any, result: any) => void): void;
            retrieve(request: any, callback: (err: any, result: any) => void): void;
        };

        checkoutFormInitialize: {
            create(request: any, callback: (err: any, result: any) => void): void;
        };

        checkoutForm: {
            retrieve(request: any, callback: (err: any, result: any) => void): void;
        };
    }
}
