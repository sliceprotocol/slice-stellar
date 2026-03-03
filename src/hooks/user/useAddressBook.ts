"use client";

import { useState, useEffect, useCallback } from "react";
import { Contact, PRELOADED_CONTACTS } from "@/config/app";

const STORAGE_KEY = "slice_address_book";

/**
 * Hook for managing an address book (contacts)
 * Persists contacts to localStorage
 */
export function useAddressBook() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    // Initialize from localStorage or use preloaded contacts
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Contact[];
      } catch {
        return PRELOADED_CONTACTS;
      }
    }
    return PRELOADED_CONTACTS;
  });
  const [isLoaded] = useState(() => typeof window !== "undefined");

  // Persist contacts to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  const addContact = useCallback(
    (name: string, address: string, avatar?: string) => {
      const newContact: Contact = {
        name,
        address,
        avatar: avatar || "/images/profiles-mockup/profile-1.jpg",
      };
      setContacts((prev) => {
        // Avoid duplicates by address
        if (prev.some((c) => c.address === address)) {
          return prev;
        }
        return [...prev, newContact];
      });
    },
    []
  );

  const removeContact = useCallback((address: string) => {
    setContacts((prev) => prev.filter((c) => c.address !== address));
  }, []);

  const updateContact = useCallback(
    (address: string, updates: Partial<Omit<Contact, "address">>) => {
      setContacts((prev) =>
        prev.map((c) => (c.address === address ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const getContactByAddress = useCallback(
    (address: string): Contact | undefined => {
      return contacts.find((c) => c.address === address);
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
