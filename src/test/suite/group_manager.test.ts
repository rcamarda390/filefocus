import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { GroupManager } from "../../GroupManager";
import { EphemeralStorage } from "../../storage/EphemeralStorage";
import { Group } from "../../Group";

suite("Group Manager Test Suite", () => {
  test("addGroup", () => {
    const groupManager = new GroupManager();
    const ephemeralStorage = new EphemeralStorage();
    groupManager.addStorageProvider(ephemeralStorage);

    const group = new Group(GroupManager.makeGroupId("Testing"));

    assert.strictEqual(groupManager.root.size, 0);

    groupManager.addGroup(group, ephemeralStorage.id);

    assert.strictEqual(groupManager.root.size, 1);
  });

  test("moveGroup validates before mutation and prevents circular nesting", () => {
    const groupManager = new GroupManager();
    const storage = new EphemeralStorage();
    groupManager.addStorageProvider(storage);

    const parent = new Group("parent");
    const child = new Group("child");
    const grandchild = new Group("grandchild");

    groupManager.addGroup(parent, storage.id);
    groupManager.addGroup(child, storage.id, parent.id);
    groupManager.addGroup(grandchild, storage.id, child.id);

    assert.strictEqual(groupManager.moveGroup(child.id, "missing-parent"), false);
    assert.strictEqual(child.parentGroup, parent);
    assert.strictEqual(parent.childGroups.includes(child), true);

    assert.strictEqual(groupManager.moveGroup(parent.id, grandchild.id), false);
    assert.strictEqual(parent.parentGroup, null);

    assert.strictEqual(groupManager.moveGroup(child.id, null), true);
    assert.strictEqual(child.parentGroup, null);
    assert.strictEqual(groupManager.rootGroups.has(child.id), true);
  });

});
