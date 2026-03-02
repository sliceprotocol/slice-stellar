"use client";

import { useState, useEffect, useCallback } from "react";
import { PRELOADED_CONTACTS, type Contact } from "@/config/app";

const STORAGE_KEY = "slice_address_book";

/**
 * Hook for managing user's address book (contacts)
 * Stores contacts in localStorage for persistence
 * 
 * @returns Object with contacts array and management functions
 */
export function useAddressBook() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load contacts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Contact[];
        setContacts(parsed);
      } else {
        // Initialize with preloaded contacts if no stored data
        setContacts(PRELOADED_CONTACTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PRELOADED_CONTACTS));
      }
    } catch (error) {
      console.error("Failed to load address book:", error);
      setContacts(PRELOADED_CONTACTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save contacts to localStorage
  const saveContacts = useCallback((newContacts: Contact[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
      setContacts(newContacts);
    } catch (error) {
      console.error("Failed to save address book:", error);
    }
  }, []);

  // Add a new contact
  const addContact = useCallback(
    (nameOrContact: string | Contact, address?: string, avatar?: string) => {
      let contact: Contact;
      
      // Support multiple signatures:
      // - addContact(contact)
      // - addContact(name, address)
      // - addContact(name, address, avatar)
      if (typeof nameOrContact === "string") {
        if (!address) {
          console.error("Address is required when providing name as string");
          return false;
        }
        contact = {
          name: nameOrContact,
          address: address,
          avatar: avatar,
        };
      } else {
        contact = nameOrContact;
      }

      // Check if contact already exists
      const exists = contacts.some(
        (c) => c.address.toLowerCase() === contact.address.toLowerCase()
      );

      if (exists) {
        console.warn("Contact already exists:", contact.address);
        return false;
      }

      const newContacts = [...contacts, contact];
      saveContacts(newContacts);
      return true;
    },
    [contacts, saveContacts]
  );

  // Remove a contact by address
  const removeContact = useCallback(
    (address: string) => {
      const newContacts = contacts.filter(
        (c) => c.address.toLowerCase() !== address.toLowerCase()
      );
      saveContacts(newContacts);
    },
    [contacts, saveContacts]
  );

  // Update an existing contact
  const updateContact = useCallback(
    (address: string, updates: Partial<Contact>) => {
      const newContacts = contacts.map((c) =>
        c.address.toLowerCase() === address.toLowerCase()
          ? { ...c, ...updates }
          : c
      );
      saveContacts(newContacts);
    },
    [contacts, saveContacts]
  );

  // Find a contact by address
  const findContact = useCallback(
    (address: string) => {
      return contacts.find(
        (c) => c.address.toLowerCase() === address.toLowerCase()
      );
    },
    [contacts]
  );

  // Clear all contacts
  const clearContacts = useCallback(() => {
    saveContacts([]);
  }, [saveContacts]);

  // Reset to preloaded contacts
  const resetToDefaults = useCallback(() => {
    saveContacts(PRELOADED_CONTACTS);
  }, [saveContacts]);

  return {
    contacts,
    isLoading,
    addContact,
    removeContact,
    updateContact,
    findContact,
    clearContacts,
    resetToDefaults,
  };
}
