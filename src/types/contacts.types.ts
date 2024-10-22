export interface ContactListResult {
    userId: number;
    name: string;
    company: string;
    department: string;
  }
  
  export interface ContactDetailResult {
    userId: number;
    name: string;
    company: string;
    department: string;
    position: string;
    email: string;
    phone: string;
  }
  
  export interface ContactRequestResult {
    requestId: number;
  }
  
  export interface ReceivedRequestResult {
    requestId: number;
    senderLoginId: string;
    senderName: string;
    requestedAt: Date;
  }
  
  export interface SentRequestResult {
    requestId: number;
    receiverLoginId: string;
    receiverName: string;
    requestedAt: Date;
  }
  
  export interface ContactResponse {
    statusCode: number;
    message: string;
    contacts?: ContactListResult[];
    contact?: ContactDetailResult;
    requests?: ReceivedRequestResult[] | SentRequestResult[];
    requestId?: number;
  }