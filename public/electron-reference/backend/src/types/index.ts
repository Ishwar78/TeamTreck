export interface AuthPayload {
  user_id: string;
  company_id: string | null;
  role: 'super_admin' | 'company_admin' | 'sub_admin' | 'user';
  device_id: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export type AppRole =
  | 'super_admin'
  | 'company_admin'
  | 'sub_admin'
  | 'user';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface TimeRangeQuery {
  start?: string;
  end?: string;
  date?: string;
  range?: number;
  period?: 'daily' | 'weekly';
}
