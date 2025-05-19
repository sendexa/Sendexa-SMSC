export interface SendSMSRequest {
  From: string;
  To: string;
  Content: string;
}

export interface BatchSMSRequest {
  From: string;
  Recipients: string[];
  Content: string;
}

export interface PersonalizedBatchSMSRequest {
  From: string;
  personalizedRecipients: {
    To: string;
    Content: string;
  }[];
}

export interface MessageResponse {
  rate: number;
  messageId: string;
  status: number;
  statusDescription: string;
  networkId: string;
}

export interface BatchMessageResponse {
  batchId: string;
  status: number;
  data: {
    recipient: string;
    content: string;
    messageId: string;
  }[];
}

export interface MessageStatusResponse {
  rate: number;
  messageId: string;
  status: string;
  updateTime: string;
  time: string;
  to: string;
  from: string;
  content: string;
}

export enum MessageStatus {
  REQUEST_SUBMITTED = 0,
  QUEUED = 1,
  SENT_TO_TELCO = 2,
  DELIVERED = 3,
  FAILED = 4,
  INVALID_NUMBER = 5
} 