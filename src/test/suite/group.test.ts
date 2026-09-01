import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { Group } from "../../Group";

suite("Group Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("addResource - Prevent adding duplicate resources.", () => {
    const group = new Group("test");
    group.addResource(vscode.Uri.parse("file:///usr/home"));
    group.addResource(vscode.Uri.parse("file:///usr/home"));
    assert.strictEqual(group.resources.length, 1);
  });

  test("removeResource - Prevent adding duplicate resources.", () => {
    const group = new Group("test");
    group.addResource(vscode.Uri.parse("file:///usr/home"));
    group.addResource(vscode.Uri.parse("file:///usr/foo"));
    group.addResource(vscode.Uri.parse("file:///usr/bar"));
    assert.strictEqual(group.resources.length, 3);

    group.removeResource(vscode.Uri.parse("file:///usr/home"));
    group.removeResource(vscode.Uri.parse("file:///usr/bar"));

    assert.strictEqual(group.resources.length, 1);
    assert.strictEqual(group.resources[0].path, "/usr/foo");
  });

  test("nested groups maintain parent relationships and prevent cycles", () => {
    const parent = new Group("parent");
    const child = new Group("child");
    const grandchild = new Group("grandchild");

    parent.addChildGroup(child);
    child.addChildGroup(grandchild);

    assert.strictEqual(child.parentGroup, parent);
    assert.strictEqual(grandchild.parentGroup, child);
    assert.strictEqual(parent.getAllChildGroups().length, 2);

    grandchild.addChildGroup(parent);
    assert.strictEqual(parent.parentGroup, null);
    assert.strictEqual(grandchild.childGroups.length, 0);
  });

});
