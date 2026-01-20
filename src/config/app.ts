// === Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// === Pinata
export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY!;
export const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET!;
export const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL!;
export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;
export const PINATA_GROUP_ID = process.env.NEXT_PUBLIC_PINATA_GROUP_ID!;

// === Constants
export enum DISPUTE_STATUS {
    CREATED = 0,
    COMMIT = 1,
    REVEAL = 2,
    RESOLVED = 3
}

// === Contacts
export interface Contact {
  name: string;
  address: string;
  avatar?: string; // Optional visual helper
}

// Available avatar images for contact selection
export const AVAILABLE_AVATARS = [
  "/images/profiles-mockup/profile-1.jpg",
  "/images/profiles-mockup/profile-2.jpg",
  "/images/profiles-mockup/profile-3.jpg",
  "/images/profiles-mockup/profile-4.jpg",
  "/images/profiles-mockup/profile-5.jpg",
  "/images/profiles-mockup/profile-6.jpg",
  "/images/profiles-mockup/profile-7.jpg",
  "/images/profiles-mockup/profile-8.jpg",
  "/images/profiles-mockup/profile-9.jpg",
  "/images/profiles-mockup/profile-10.jpg",
  "/images/profiles-mockup/profile-11.jpg",
  "/images/profiles-mockup/profile-12.jpg",
];

// You can expand this later to load from LocalStorage or an API
export const PRELOADED_CONTACTS: Contact[] = [
  {
    name: "John Claimer",
    address: "GBZXN7PIRZGNMHGAH7B27SSEDBM7J4ORL2VYSXDM2R4GJ3EDT4K7W2ZB",
    avatar: "/images/profiles-mockup/profile-1.jpg",
  },
  {
    name: "Jane Defender",
    address: "GC6HBWKBUDK4WAFM3I7CPS7FCOXG4MJXOG7T3VKR7NY4CKELNC2I2E4F",
    avatar: "/images/profiles-mockup/profile-2.jpg",
  },
  {
    name: "Bob Claimer",
    address: "GBZXN7PIRZGNMHGAH7B27SSEDBM7J4ORL2VYSXDM2R4GJ3EDT4K7W2ZC",
    avatar: "/images/profiles-mockup/profile-3.jpg",
  },
  {
    name: "Alice Defender",
    address: "GC6HBWKBUDK4WAFM3I7CPS7FCOXG4MJXOG7T3VKR7NY4CKELNC2I2E4G",
    avatar: "/images/profiles-mockup/profile-4.jpg",
  },
];
