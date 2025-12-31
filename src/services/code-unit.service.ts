export interface CodeUnit {
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'documentation' | 'example';
  name: string;
  signature: string;
  fullContent: string;
  startLine: number;
  endLine: number;
  language: string;
}

export class CodeUnitService {
  extractCodeUnit(code: string, symbolName: string, language: string): CodeUnit | undefined {
    const lines = code.split('\n');

    // Find the line containing the symbol
    let startLine = -1;
    let type: CodeUnit['type'] = 'function';

    // NOTE: Now supports function declarations, class declarations, and arrow functions (const/let/var).
    // Does not handle interfaces or type definitions yet.
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';

      if (line.includes(`function ${symbolName}`)) {
        startLine = i + 1; // 1-indexed
        type = 'function';
        break;
      }

      if (line.includes(`class ${symbolName}`)) {
        startLine = i + 1;
        type = 'class';
        break;
      }

      // Check for arrow functions: const/let/var name = ...
      if (line.match(new RegExp(`(?:const|let|var)\\s+${symbolName}\\s*=`))) {
        startLine = i + 1;
        type = 'const';
        break;
      }
    }

    if (startLine === -1) return undefined;

    // Find end line (naive: next empty line or next top-level declaration)
    let endLine = startLine;
    let braceCount = 0;
    let foundFirstBrace = false;

    // NOTE: This brace counting does not handle braces inside strings or comments.
    // It may incorrectly determine boundaries if code contains braces in string literals.
    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i] ?? '';

      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundFirstBrace = true;
        }
        if (char === '}') braceCount--;
      }

      if (foundFirstBrace && braceCount === 0) {
        endLine = i + 1;
        break;
      }
    }

    const fullContent = lines.slice(startLine - 1, endLine).join('\n');

    // Extract signature (first line, cleaned)
    const firstLine = lines[startLine - 1] ?? '';
    const signature = this.extractSignature(firstLine, symbolName, type);

    return {
      type,
      name: symbolName,
      signature,
      fullContent,
      startLine,
      endLine,
      language
    };
  }

  private extractSignature(line: string, name: string, type: string): string {
    // Remove 'export', 'async', trim whitespace
    const sig = line.replace(/^\s*export\s+/, '').replace(/^\s*async\s+/, '').trim();

    if (type === 'function') {
      // Extract just "functionName(params): returnType"
      // TODO: This regex is limited and may not handle complex return types, generics, or multiline signatures
      const match = sig.match(/function\s+(\w+\([^)]*\):\s*\w+)/);
      if (match?.[1] !== undefined && match[1].length > 0) return match[1];
    }

    if (type === 'class') {
      return `class ${name}`;
    }

    if (type === 'const') {
      // For arrow functions, extract the variable declaration part
      // Example: const myFunc = (param: string): void => ...
      // Returns: const myFunc = (param: string): void
      const arrowMatch = sig.match(new RegExp(`((?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)(?::\\s*[^=]+)?)`));
      if (arrowMatch?.[1] != null && arrowMatch[1] !== '') return arrowMatch[1].trim();

      // Fallback for simple arrow functions without params
      return `const ${name}`;
    }

    return sig;
  }
}
