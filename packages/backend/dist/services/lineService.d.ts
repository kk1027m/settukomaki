interface LineSettings {
    channelAccessToken: string | null;
    groupId: string | null;
}
interface LineRecipient {
    id: number;
    recipient_id: string;
    recipient_type: string;
    name: string | null;
    is_active: boolean;
}
export declare const getLineSettings: () => Promise<LineSettings>;
export declare const getLineRecipients: () => Promise<LineRecipient[]>;
export declare const saveLineGroupId: (recipientId: string, recipientType?: "group" | "user", name?: string) => Promise<void>;
export declare const removeLineRecipient: (recipientId: string) => Promise<void>;
export declare const sendLineMessage: (message: string) => Promise<boolean>;
export declare const formatNotificationMessage: (urgentLubrication: any[], scheduledLubrication: any[], urgentReplacement: any[], scheduledReplacement: any[], lowStockParts: any[]) => string | null;
export {};
//# sourceMappingURL=lineService.d.ts.map