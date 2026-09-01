import * as assert from "assert";
import { Group } from "../../Group";
import { GroupManager } from "../../GroupManager";
import { StateStorage } from "../../storage/StateStorage";
import { StorageService } from "../../storage/StorageService";

function createStorage() {
  const values = new Map<string, unknown>();
  const memento = {
    get: (key: string, defaultValue?: unknown) =>
      values.has(key) ? values.get(key) : defaultValue,
    update: (key: string, value: unknown) => {
      if (value === undefined) {
        values.delete(key);
      } else {
        values.set(key, value);
      }
      return Promise.resolve();
    },
    keys: () => Array.from(values.keys()),
  };

  return new StateStorage(new StorageService(memento as any));
}

suite("Nested State Storage Test Suite", () => {
  test("nested hierarchy survives save and reload", async () => {
    const storage = createStorage();
    const manager = new GroupManager();
    manager.addStorageProvider(storage);

    const parent = new Group("parent");
    parent.name = "Parent";
    const child = new Group("child");
    child.name = "Child";

    manager.addGroup(parent, storage.id);
    manager.addGroup(child, storage.id, parent.id);

    const loaded = await storage.loadRootNodes();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].id, parent.id);
    assert.strictEqual(loaded[0].childGroups.length, 1);
    assert.strictEqual(loaded[0].childGroups[0].id, child.id);
    assert.strictEqual(loaded[0].childGroups[0].parentGroup?.id, parent.id);
  });

  test("moving a nested group to root survives reload", async () => {
    const storage = createStorage();
    const manager = new GroupManager();
    manager.addStorageProvider(storage);

    const parent = new Group("parent");
    parent.name = "Parent";
    const child = new Group("child");
    child.name = "Child";

    manager.addGroup(parent, storage.id);
    manager.addGroup(child, storage.id, parent.id);
    assert.strictEqual(manager.moveGroup(child.id, null), true);

    const loaded = await storage.loadRootNodes();
    const ids = loaded.map((group) => group.id).sort();
    assert.deepStrictEqual(ids, [child.id, parent.id].sort());
    const reloadedParent = loaded.find((group) => group.id === parent.id);
    assert.strictEqual(reloadedParent?.childGroups.length, 0);
  });

  test("removing a nested group is removed from persisted parent", async () => {
    const storage = createStorage();
    const manager = new GroupManager();
    manager.addStorageProvider(storage);

    const parent = new Group("parent");
    parent.name = "Parent";
    const child = new Group("child");
    child.name = "Child";

    manager.addGroup(parent, storage.id);
    manager.addGroup(child, storage.id, parent.id);
    manager.removeGroup(child.id);

    const loaded = await storage.loadRootNodes();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].childGroups.length, 0);
  });
});
