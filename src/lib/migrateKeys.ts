const MIGRATION_FLAG = "stephane-ia:keys-migrated";

export function migrateLocalStorageKeys(): void {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  const toMigrate: [string, string][] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("gym-tracker:")) {
      const newKey = key.replace("gym-tracker:", "stephane-ia:");
      toMigrate.push([key, newKey]);
    }
  }

  for (const [oldKey, newKey] of toMigrate) {
    if (!localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey)!);
    }
    localStorage.removeItem(oldKey);
  }

  localStorage.setItem(MIGRATION_FLAG, "1");
}
