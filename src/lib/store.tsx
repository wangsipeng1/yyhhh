import React, { createContext, useContext, useEffect, useState } from "react";
import localforage from "localforage";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import { Note, Group } from "../types";

localforage.config({
  name: "NoteSpaceApp",
  storeName: "notes_data",
});

interface AppState {
  notes: Note[];
  groups: Group[];
  isLoading: boolean;
  hasLockSetup: boolean;
  isUnlocked: boolean;
  addNote: (
    note: Omit<Note, "id" | "createdAt" | "updatedAt" | "inTrash">,
  ) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentDeleteNote: (id: string) => void;
  addGroup: (name: string) => void;
  updateGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  emptyTrash: () => void;
  setupLock: (password: string) => void;
  unlockApp: (password: string) => boolean;
  lockApp: () => void;
  toggleNoteLock: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [unlockedPrivateNotes, setUnlockedPrivateNotes] = useState<Note[]>([]);
  const [encryptedPrivateNotes, setEncryptedPrivateNotes] = useState<
    string | null
  >(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [lockHash, setLockHash] = useState<string | null>(null);
  const [activeSecret, setActiveSecret] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedNotes = await localforage.getItem<Note[]>("notes");
        const storedGroups = await localforage.getItem<Group[]>("groups");
        const storedHash = await localforage.getItem<string>("lockHash");
        const storedEncrypted = await localforage.getItem<string>(
          "lockedNotesEncrypted",
        );

        if (storedNotes) setPublicNotes(storedNotes);
        if (storedGroups) setGroups(storedGroups);
        if (storedHash) setLockHash(storedHash);
        if (storedEncrypted) setEncryptedPrivateNotes(storedEncrypted);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localforage.setItem("notes", publicNotes);
      localforage.setItem("groups", groups);
      if (lockHash) localforage.setItem("lockHash", lockHash);
      if (encryptedPrivateNotes)
        localforage.setItem("lockedNotesEncrypted", encryptedPrivateNotes);
    }
  }, [publicNotes, groups, lockHash, encryptedPrivateNotes, isLoading]);

  // When active secret changes or private notes change, encrypt them
  useEffect(() => {
    if (!isLoading && activeSecret && unlockedPrivateNotes.length >= 0) {
      try {
        const json = JSON.stringify(unlockedPrivateNotes);
        const encrypted = CryptoJS.AES.encrypt(json, activeSecret).toString();
        setEncryptedPrivateNotes(encrypted);
      } catch (e) {
        console.error("Encryption failed", e);
      }
    }
  }, [unlockedPrivateNotes, activeSecret, isLoading]);

  const allNotes = [...publicNotes, ...unlockedPrivateNotes];

  const addNote = (
    noteData: Omit<Note, "id" | "createdAt" | "updatedAt" | "inTrash">,
  ) => {
    const newNote: Note = {
      ...noteData,
      id: uuidv4(),
      inTrash: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (newNote.isLocked) {
      setUnlockedPrivateNotes((prev) => [newNote, ...prev]);
    } else {
      setPublicNotes((prev) => [newNote, ...prev]);
    }
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setPublicNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
      ),
    );
    setUnlockedPrivateNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
      ),
    );
  };

  const deleteNote = (id: string) => {
    setPublicNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, inTrash: true, updatedAt: Date.now() } : n,
      ),
    );
    setUnlockedPrivateNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, inTrash: true, updatedAt: Date.now() } : n,
      ),
    );
  };

  const restoreNote = (id: string) => {
    setPublicNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, inTrash: false, updatedAt: Date.now() } : n,
      ),
    );
    setUnlockedPrivateNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, inTrash: false, updatedAt: Date.now() } : n,
      ),
    );
  };

  const permanentDeleteNote = (id: string) => {
    setPublicNotes((prev) =>
      prev
        .map((n) => (n.id === id ? { ...n, inTrash: true } : n))
        .filter((n) => n.id !== id),
    );
    setUnlockedPrivateNotes((prev) =>
      prev
        .map((n) => (n.id === id ? { ...n, inTrash: true } : n))
        .filter((n) => n.id !== id),
    );
  };

  const emptyTrash = () => {
    setPublicNotes((prev) => prev.filter((n) => !n.inTrash));
    setUnlockedPrivateNotes((prev) => prev.filter((n) => !n.inTrash));
  };

  const addGroup = (name: string) => {
    const newGroup: Group = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  const updateGroup = (id: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  };

  const deleteGroup = (id: string) => {
    setPublicNotes((prev) =>
      prev.map((n) =>
        n.groupId === id ? { ...n, groupId: "none", updatedAt: Date.now() } : n,
      ),
    );
    setUnlockedPrivateNotes((prev) =>
      prev.map((n) =>
        n.groupId === id ? { ...n, groupId: "none", updatedAt: Date.now() } : n,
      ),
    );
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const setupLock = (password: string) => {
    const hash = CryptoJS.SHA256(password).toString();
    setLockHash(hash);
    setActiveSecret(password);
  };

  const unlockApp = (password: string) => {
    const hash = CryptoJS.SHA256(password).toString();
    if (hash === lockHash) {
      setActiveSecret(password);
      if (encryptedPrivateNotes) {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedPrivateNotes, password);
          const decryptedJson = bytes.toString(CryptoJS.enc.Utf8);
          if (decryptedJson) {
            setUnlockedPrivateNotes(JSON.parse(decryptedJson));
          }
        } catch (e) {
          console.error("Decryption failed", e);
        }
      }
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setActiveSecret(null);
    setUnlockedPrivateNotes([]);
  };

  const toggleNoteLock = (id: string) => {
    const pubIndex = publicNotes.findIndex((n) => n.id === id);
    if (pubIndex >= 0) {
      const noteToLock = {
        ...publicNotes[pubIndex],
        isLocked: true,
        updatedAt: Date.now(),
      };
      setPublicNotes((prev) => prev.filter((n) => n.id !== id));
      setUnlockedPrivateNotes((prev) => [noteToLock, ...prev]);
    } else {
      const privIndex = unlockedPrivateNotes.findIndex((n) => n.id === id);
      if (privIndex >= 0) {
        const noteToUnlock = {
          ...unlockedPrivateNotes[privIndex],
          isLocked: false,
          updatedAt: Date.now(),
        };
        setUnlockedPrivateNotes((prev) => prev.filter((n) => n.id !== id));
        setPublicNotes((prev) => [noteToUnlock, ...prev]);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        notes: allNotes,
        groups,
        isLoading,
        hasLockSetup: !!lockHash,
        isUnlocked: !!activeSecret,
        addNote,
        updateNote,
        deleteNote,
        restoreNote,
        permanentDeleteNote,
        emptyTrash,
        addGroup,
        updateGroup,
        deleteGroup,
        setupLock,
        unlockApp,
        lockApp,
        toggleNoteLock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
