interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
    tag?: string;
}
export declare function sendPushToUser(userId: number, payload: PushPayload): Promise<void>;
export declare function sendPushToAll(payload: PushPayload): Promise<void>;
export declare function sendPushToAdmins(payload: PushPayload): Promise<void>;
export {};
//# sourceMappingURL=pushService.d.ts.map