"use client";

import { useCallback, useEffect, useState } from "react";
import { Contact, PRELOADED_CONTACTS } from "@/config/app";
import { isStellarAddress } from "@/util/address";

const STORAGE_KEY = "slice:contacts:v1";

const normalizeAddress = (address: string) => address.trim().toUpperCase();

const dedupeContacts = (contacts: Contact[]) => {
  const map = new Map<string, Contact>();

  for (const contact of contacts) {
    const address = normalizeAddress(contact.address);
    if (!address) continue;

    const current = map.get(address);
    map.set(address, {
      ...current,
      ...contact,
      address,
    });
  }

  return Array.from(map.values());
};

const parseStoredContacts = (raw: string | null): Contact[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Contact[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (contact) =>
        typeof contact?.name === "string" &&
        typeof contact?.address === "string" &&
        contact.name.trim().length > 0 &&
        contact.address.trim().length > 0,
    );
  } catch {
    return [];
  }
};

export const useAddressBook = () => {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    if (typeof window === "undefined") {
      return dedupeContacts(PRELOADED_CONTACTS);
    }

    const stored = parseStoredContacts(window.localStorage.getItem(STORAGE_KEY));
    if (stored.length === 0) {
      return dedupeContacts(PRELOADED_CONTACTS);
    }

    return dedupeContacts([...PRELOADED_CONTACTS, ...stored]);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  const addContact = useCallback(
    (name: string, address: string, avatar?: string) => {
      const trimmedName = name.trim();
      const normalizedAddress = normalizeAddress(address);

      if (!trimmedName || !isStellarAddress(normalizedAddress)) {
        return false;
      }

      setContacts((prev) =>
        dedupeContacts([
          ...prev.filter(
            (contact) =>
              normalizeAddress(contact.address) !== normalizedAddress,
          ),
          {
            name: trimmedName,
            address: normalizedAddress,
            avatar,
          },
        ]),
      );

      return true;
    },
    [],
  );

  const removeContact = useCallback((address: string) => {
    const normalizedAddress = normalizeAddress(address);
    setContacts((prev) =>
      prev.filter(
        (contact) => normalizeAddress(contact.address) !== normalizedAddress,
      ),
    );
  }, []);

  return {
    contacts,
    addContact,
    removeContact,
  };
};
