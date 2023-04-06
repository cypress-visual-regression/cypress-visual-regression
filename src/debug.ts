import Debug from "debug";

// Wrap debug module to ensure common namespace
export default function (name: string): Debug.Debugger {
  return Debug(`cypress-visual-regression: ${name}`);
}
