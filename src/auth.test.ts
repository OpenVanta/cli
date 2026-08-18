import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  useSystemCredentialStore,
} from "./auth.js";

describe("credential store selection", () => {
  it("uses the system store on darwin and win32", () => {
    if (process.platform === "darwin" || process.platform === "win32") {
      assert.equal(useSystemCredentialStore(), true);
    } else {
      assert.equal(useSystemCredentialStore(), false);
    }
  });

  it("describes the active store", () => {
    if (process.platform === "darwin") {
      assert.equal(credentialStorageDescription(), "macOS Keychain");
    } else if (process.platform === "win32") {
      assert.equal(credentialStorageDescription(), "Windows Credential Manager");
    } else {
      assert.equal(credentialStorageDescription(), "config file");
    }
  });
});

describe("go-keyring encoding", () => {
  it("round-trips passwords with the go-keyring-base64 prefix", () => {
    const original = '{"oauth_client_id":"abc"}';
    const encoded = encodeKeyringPassword(original);
    assert.equal(encoded.startsWith("go-keyring-base64:"), true);
    assert.equal(decodeKeyringPassword(encoded), original);
  });

  it("decodes legacy go-keyring hex encoding", () => {
    const original = '{"a":1}';
    const encoded =
      "go-keyring-encoded:" + Buffer.from(original, "utf8").toString("hex");
    assert.equal(decodeKeyringPassword(encoded), original);
  });

  it("passes through legacy plaintext values", () => {
    assert.equal(decodeKeyringPassword('{"a":1}'), '{"a":1}');
  });
});
