export interface Contact {
  name: string;
  address: string;
  avatar?: string; // Optional visual helper
}

// You can expand this later to load from LocalStorage or an API
export const PRELOADED_CONTACTS: Contact[] = [
  {
    name: "John Claimer",
    address: "0xa2a3523faed7d26fe8cc791c7077a99c96ef2edd",
  },
  {
    name: "Jane Defender",
    address: "0xfe26c7555707e7353958447cf72c628552c0abb2",
  },
  {
    name: "Bob Claimer",
    address: "0x3AE66a6DB20fCC27F3DB3DE5Fe74C108A52d6F29",
  },
  {
    name: "Alice Defender",
    address: "0x58609c13942F56e17d36bcB926C413EBbD10e477",
  },
];
