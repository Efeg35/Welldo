import { KJUR } from "jsrsasign";

interface SignatureParams {
    sdkKey: string;
    sdkSecret: string;
    meetingNumber: string;
    role: number; // 0 = attendee, 1 = host
}

export function generateZoomSignature({
    sdkKey,
    sdkSecret,
    meetingNumber,
    role,
}: SignatureParams): string {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours

    const header = { alg: "HS256", typ: "JWT" };

    const payload = {
        sdkKey,
        mn: meetingNumber,
        role,
        iat,
        exp,
        tokenExp: exp,
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);

    const signature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);

    return signature;
}
