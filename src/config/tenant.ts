export enum Tenant {
  WEB = "web",
}

export const getTenantFromHost = (host: string | null): Tenant => {
  return Tenant.WEB;
};
