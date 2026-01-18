declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      username: string;
      roleId: string;
      roleName?: string;
      permissions?: any;
    };
  }
}
