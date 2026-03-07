"use client";

import { useState, useEffect, useCallback } from "react";
import { StrKey } from "@stellar/stellar-sdk";
import { Contact, PRELOADED_CONTACTS } from "@/config/app";
import storage from "@/util/storage";

const STORAGE_KEY = "slice_address_book";

const normalizeStellarAddress = (address: string): string => {
  const normalizedAddress = address.trim().toUpperCase();

  if (!StrKey.isValidEd25519PublicKey(normalizedAddress)) {
    throw new Error("Invalid Stellar address");
  }

  return normalizedAddress;
};

const sanitizeContacts = (value: unknown): Contact[] => {
  if (!Array.isArray(value)) return [];

  const seenAddresses = new Set<string>();
  const sanitized: Contact[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const contact = item as Record<string, unknown>;
    if (typeof contact.name !== "string" || typeof contact.address !== "string") {
      continue;
    }

    const normalizedName = contact.name.trim();
    if (!normalizedName) continue;

    let normalizedAddress: string;
    try {
      normalizedAddress = normalizeStellarAddress(contact.address);
    } catch {
      continue;
    }

    if (seenAddresses.has(normalizedAddress)) continue;
    seenAddresses.add(normalizedAddress);

    sanitized.push({
      name: normalizedName,
      address: normalizedAddress,
      avatar:
        typeof contact.avatar === "string" && contact.avatar.trim()
          ? contact.avatar
          : undefined,
    });
  }

  return sanitized;
};

/**
 * Hook for managing an address book (contacts)
 * Persists contacts to localStorage
 */
export function useAddressBook() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    // Initialize from localStorage or use preloaded contacts
    if (typeof window === "undefined") return [];
    const stored = storage.getItem(STORAGE_KEY, "safe");
    if (Array.isArray(stored)) {
      return sanitizeContacts(stored);
    }
    return sanitizeContacts(PRELOADED_CONTACTS);
  });
  const [isLoaded] = useState(() => typeof window !== "undefined");

  // Persist contacts to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    storage.setItem(STORAGE_KEY, contacts);
  }, [contacts]);

  const addContact = useCallback(
    (name: string, address: string, avatar?: string) => {
      const normalizedAddress = normalizeStellarAddress(address);
      const newContact: Contact = {
        name,
        address: normalizedAddress,
        avatar: avatar || "/images/profiles-mockup/profile-1.jpg",
      };
      setContacts((prev) => {
        // Avoid duplicates by address
        if (
          prev.some(
            (c) => c.address.trim().toUpperCase() === normalizedAddress
          )
        ) {
          return prev;
        }
        return [...prev, newContact];
      });
    },
    []
  );

  const removeContact = useCallback((address: string) => {
    const normalizedAddress = normalizeStellarAddress(address);
    setContacts((prev) =>
      prev.filter((c) => c.address.trim().toUpperCase() !== normalizedAddress)
    );
  }, []);

  const updateContact = useCallback(
    (address: string, updates: Partial<Omit<Contact, "address">>) => {
      const normalizedAddress = normalizeStellarAddress(address);
      setContacts((prev) =>
        prev.map((c) =>
          c.address.trim().toUpperCase() === normalizedAddress
            ? { ...c, ...updates }
            : c
        )
      );
    },
    []
  );

  const getContactByAddress = useCallback(
    (address: string): Contact | undefined => {
      const normalizedAddress = normalizeStellarAddress(address);
      return contacts.find(
        (c) => c.address.trim().toUpperCase() === normalizedAddress
      );
    },
    [contacts]
  );

  const getContactByName = useCallback(
    (name: string): Contact | undefined => {
      return contacts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    },
    [contacts]
  );

  return {
    contacts,
    isLoaded,
    addContact,
    removeContact,
    updateContact,
    getContactByAddress,
    getContactByName,
  };
}
