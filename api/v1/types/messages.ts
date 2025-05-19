export enum MessageStatus {
  SUBMITTED = 0,
  QUEUED = 1,
  SENT_TO_TELCO = 2,
  DELIVERED = 3,
  FAILED = 4,
  INVALID_NUMBER = 5
}

export interface SendSmsRequest {
  from: string;
  to: string;
  content: string;
  clientId: string;
  clientSecret: string;
}

export interface SendSmsResponse {
  rate: number;
  messageId: string;
  status: MessageStatus;
  statusDescription: string;
  networkId: string;
}

export interface BatchSmsRequest {
  from: string;
  recipients: string[];
  content: string;
  clientId: string;
  clientSecret: string;
}

export interface PersonalizedBatchSmsRequest {
  from: string;
  personalizedRecipients: {
    to: string;
    content: string;
  }[];
  clientId: string;
  clientSecret: string;
}

export interface BatchSmsResponse {
  batchId: string;
  status: MessageStatus;
  data: {
    recipient: string;
    content: string;
    messageId: string;
  }[];
}

export interface MessageStatusResponse {
  rate: number;
  messageId: string;
  status: MessageStatus;
  updateTime: string;
  time: string;
  to: string;
  from: string;
  content: string;
}

export interface DeliveryReport {
  messageId: string;
  status: MessageStatus;
  errorCode?: string;
  errorDescription?: string;
  timestamp: string;
  telco: string;
} 