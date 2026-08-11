const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadAsciiTableTools() {
  const source = fs.readFileSync(path.join(__dirname, "..", "ascii-table.js"), "utf8");
  const document = { addEventListener() {} };
  const window = { document };
  const sandbox = { window, document, Array, Number, String };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "ascii-table.js" });
  return sandbox.window.asciiTableTools;
}

test("ASCII table exposes all 128 standard code positions", () => {
  const tools = loadAsciiTableTools();
  const rows = tools.createAsciiRows();
  assert.equal(rows.length, 128);
  assert.deepEqual({ ...rows[0] }, { decimal: 0, hex: "00", octal: "000", binary: "0000000", character: "NUL", name: "Null", category: "control" });
  assert.deepEqual({ ...rows[65] }, { decimal: 65, hex: "41", octal: "101", binary: "1000001", character: "A", name: "Latin capital letter A", category: "printable" });
  assert.equal(rows[127].character, "DEL");
});

test("ASCII table search matches characters, names, and numeric representations", () => {
  const tools = loadAsciiTableTools();
  const rows = tools.createAsciiRows();
  assert.deepEqual(tools.filterAsciiRows(rows, "41", "all").map((row) => row.decimal), [41, 65]);
  assert.deepEqual(tools.filterAsciiRows(rows, "line feed", "control").map((row) => row.decimal), [10]);
  assert.deepEqual(tools.filterAsciiRows(rows, "A", "printable").map((row) => row.decimal), [65]);
  assert.equal(tools.filterAsciiRows(rows, "emoji", "all").length, 0);
});
