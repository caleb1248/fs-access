/// <reference types="vite/client"/>

import * as monaco from "monaco-editor";
import { Registry } from "monaco-textmate";
import { loadWASM } from "onigasm";
import wasmurl from "onigasm/lib/onigasm.wasm?url";

import { htmllang, jslang, tslang, csslang } from "./languages/index";

import darkplustheme from "./darkplus";
import { wireTmGrammars } from "monaco-editor-textmate";

monaco.editor.defineTheme("darkplus", darkplustheme);

await loadWASM(wasmurl);

const registry = new Registry({
  getGrammarDefinition: async (scope) => {
    switch (scope) {
      case "text.html.basic":
        return {
          format: "json",
          content: htmllang,
        };
      case "source.tsx":
        return {
          format: "json",
          content: tslang,
        };
      case "source.js":
        return {
          format: "json",
          content: jslang,
        };
      case "source.jsx":
        return {
          format: "json",
          content: jslang,
        };
      case "source.css":
        return {
          format: "json",
          content: csslang,
        };
      default:
        console.log("language " + scope + " not found");
        throw "language not found";
    }
  },
});
const x = new Map(
  Object.entries({
    html: "text.html.basic",
    typescript: "source.tsx",
    javascript: "source.jsx",
    css: "source.css",
  })
);

wireTmGrammars(monaco, registry, x);

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  module: monaco.languages.typescript.ModuleKind.ESNext,
});

function updateTsconfig(config: string) {
  try {
    const { compilerOptions: options } = JSON.parse(config);
    if (options && typeof options == "object") {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
        options
      );
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        options
      );
    }
  } catch {}
}

monaco.editor.onDidCreateModel((model) => {
  if (model.uri.path.endsWith("tsconfig.json")) {
    model.onDidChangeContent(() => updateTsconfig(model.getValue()));
  }
});
