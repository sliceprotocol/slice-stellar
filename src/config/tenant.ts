export enum Tenant {
  WEB = "web",
}

export const getTenantFromHost = (_host: string | null): Tenant => {
  return Tenant.WEB;
};
