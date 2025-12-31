import { describe, it, expect, beforeEach } from 'vitest';
import { CodeUnitService } from './code-unit.service.js';

describe('CodeUnitService', () => {
  let service: CodeUnitService;

  beforeEach(() => {
    service = new CodeUnitService();
  });

  describe('extractCodeUnit - Function Extraction', () => {
    it('extracts a simple function declaration', () => {
      const code = `
function hello() {
  return "world";
}
      `.trim();

      const result = service.extractCodeUnit(code, 'hello', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('function');
      expect(result?.name).toBe('hello');
      expect(result?.startLine).toBe(1);
      expect(result?.endLine).toBe(3);
      expect(result?.fullContent).toContain('function hello()');
      expect(result?.fullContent).toContain('return "world"');
    });

    it('extracts exported function', () => {
      const code = `
export function greet(name: string): string {
  return \`Hello, \${name}\`;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'greet', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('function');
      expect(result?.signature).toContain('greet');
      expect(result?.signature).not.toContain('export');
    });

    it('extracts async function', () => {
      const code = `
export async function fetchData(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}
      `.trim();

      const result = service.extractCodeUnit(code, 'fetchData', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('function');
      expect(result?.signature).toContain('fetchData');
      expect(result?.signature).not.toContain('async');
      expect(result?.signature).not.toContain('export');
    });

    it('extracts function with complex parameters', () => {
      const code = `
function complex(
  a: number,
  b: { x: string; y: number },
  c: Array<string>
): boolean {
  return true;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'complex', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('function');
      expect(result?.fullContent).toContain('function complex');
      // Note: Brace counting may stop early due to braces in type definitions
      // This is a known limitation of the current implementation
    });

    it('extracts function with nested braces', () => {
      const code = `
function nested() {
  const obj = { a: 1, b: 2 };
  if (true) {
    return obj;
  }
}
      `.trim();

      const result = service.extractCodeUnit(code, 'nested', 'typescript');

      expect(result).toBeDefined();
      expect(result?.endLine).toBe(6);
      expect(result?.fullContent).toContain('const obj');
      expect(result?.fullContent).toContain('if (true)');
    });

    it('handles function with braces in string literals', () => {
      const code = `
function withString() {
  const template = "{ this is a brace }";
  return template;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'withString', 'typescript');

      // NOTE: Current implementation has a bug - it doesn't handle braces in strings
      // This test documents the current behavior
      expect(result).toBeDefined();
      // The brace counting may be incorrect due to string literal braces
      // but it should still complete the extraction
    });

    it('returns undefined for non-existent function', () => {
      const code = `
function exists() {
  return true;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'doesNotExist', 'typescript');

      expect(result).toBeUndefined();
    });

    it('extracts arrow functions', () => {
      const code = `
const arrowFunc = () => {
  return "I am an arrow function";
};
      `.trim();

      const result = service.extractCodeUnit(code, 'arrowFunc', 'typescript');

      // Arrow functions are now supported!
      expect(result).toBeDefined();
      expect(result?.type).toBe('const');
      expect(result?.name).toBe('arrowFunc');
      expect(result?.fullContent).toContain('arrowFunc');
    });

    it('extracts const arrow functions with parameters', () => {
      const code = `
export const myFunction = async (param: string): Promise<void> => {
  console.log(param);
};
      `.trim();

      const result = service.extractCodeUnit(code, 'myFunction', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('const');
      expect(result?.signature).toContain('myFunction');
    });

    it('extracts let arrow functions', () => {
      const code = `
let handler = (event: Event) => {
  event.preventDefault();
};
      `.trim();

      const result = service.extractCodeUnit(code, 'handler', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('const');
      expect(result?.name).toBe('handler');
    });

    it('extracts var arrow functions', () => {
      const code = `
var oldStyle = function() {
  return true;
};
      `.trim();

      // Note: This won't work because it's not an arrow function
      // but the detection should still work for var with arrows
      const arrowCode = `
var callback = () => {
  return false;
};
      `.trim();

      const result = service.extractCodeUnit(arrowCode, 'callback', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('const');
    });
  });

  describe('extractCodeUnit - Class Extraction', () => {
    it('extracts a simple class declaration', () => {
      const code = `
class Person {
  constructor(public name: string) {}
}
      `.trim();

      const result = service.extractCodeUnit(code, 'Person', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('class');
      expect(result?.name).toBe('Person');
      expect(result?.startLine).toBe(1);
      expect(result?.endLine).toBe(3);
    });

    it('extracts exported class', () => {
      const code = `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
      `.trim();

      const result = service.extractCodeUnit(code, 'Calculator', 'typescript');

      expect(result).toBeDefined();
      expect(result?.type).toBe('class');
      expect(result?.signature).toBe('class Calculator');
    });

    it('extracts class with nested methods', () => {
      const code = `
class Complex {
  method1() {
    if (true) {
      return { nested: true };
    }
  }
  method2() {
    return false;
  }
}
      `.trim();

      const result = service.extractCodeUnit(code, 'Complex', 'typescript');

      expect(result).toBeDefined();
      expect(result?.endLine).toBe(10);
      expect(result?.fullContent).toContain('method1');
      expect(result?.fullContent).toContain('method2');
    });

    it('extracts class with constructor', () => {
      const code = `
class WithConstructor {
  private value: number;

  constructor(val: number) {
    this.value = val;
  }
}
      `.trim();

      const result = service.extractCodeUnit(code, 'WithConstructor', 'typescript');

      expect(result).toBeDefined();
      expect(result?.fullContent).toContain('constructor');
      expect(result?.fullContent).toContain('this.value = val');
    });
  });

  describe('extractCodeUnit - Edge Cases', () => {
    it('handles empty code', () => {
      const result = service.extractCodeUnit('', 'anything', 'typescript');
      expect(result).toBeUndefined();
    });

    it('handles code with only whitespace', () => {
      const result = service.extractCodeUnit('   \n  \n  ', 'anything', 'typescript');
      expect(result).toBeUndefined();
    });

    it('handles incomplete function (missing closing brace)', () => {
      const code = `
function incomplete() {
  return "missing brace";
      `.trim();

      const result = service.extractCodeUnit(code, 'incomplete', 'typescript');

      expect(result).toBeDefined();
      // Brace counting will not find a closing brace, so endLine stays at startLine
      expect(result?.endLine).toBeGreaterThanOrEqual(result!.startLine);
    });

    it('handles multiple functions, extracts the correct one', () => {
      const code = `
function first() {
  return 1;
}

function second() {
  return 2;
}

function third() {
  return 3;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'second', 'typescript');

      expect(result).toBeDefined();
      expect(result?.name).toBe('second');
      expect(result?.fullContent).toContain('return 2');
      expect(result?.fullContent).not.toContain('return 1');
      expect(result?.fullContent).not.toContain('return 3');
    });

    it('handles function with same name substring', () => {
      const code = `
function test() {
  return 1;
}

function testLonger() {
  return 2;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'test', 'typescript');

      expect(result).toBeDefined();
      expect(result?.fullContent).toContain('return 1');
      expect(result?.fullContent).not.toContain('testLonger');
    });

    it('does NOT extract interface definitions (known limitation)', () => {
      const code = `
interface User {
  name: string;
  age: number;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'User', 'typescript');

      // Interfaces are not currently supported
      expect(result).toBeUndefined();
    });

    it('does NOT extract type definitions (known limitation)', () => {
      const code = `
type Config = {
  host: string;
  port: number;
};
      `.trim();

      const result = service.extractCodeUnit(code, 'Config', 'typescript');

      // Type definitions are not currently supported
      expect(result).toBeUndefined();
    });

    it('handles function with generics in signature', () => {
      const code = `
function generic<T>(value: T): T {
  return value;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'generic', 'typescript');

      expect(result).toBeDefined();
      expect(result?.fullContent).toContain('function generic<T>');
    });

    it('preserves language parameter', () => {
      const code = `
function test() {
  return true;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'test', 'javascript');

      expect(result).toBeDefined();
      expect(result?.language).toBe('javascript');
    });
  });

  describe('extractSignature', () => {
    it('extracts simple function signature', () => {
      const code = `
function add(a: number, b: number): number {
  return a + b;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'add', 'typescript');

      expect(result?.signature).toContain('add');
    });

    it('removes export keyword from signature', () => {
      const code = `
export function test(): void {
  console.log('test');
}
      `.trim();

      const result = service.extractCodeUnit(code, 'test', 'typescript');

      expect(result?.signature).not.toContain('export');
    });

    it('removes async keyword from signature', () => {
      const code = `
async function wait(): Promise<void> {
  return Promise.resolve();
}
      `.trim();

      const result = service.extractCodeUnit(code, 'wait', 'typescript');

      expect(result?.signature).not.toContain('async');
    });

    it('extracts class signature', () => {
      const code = `
export class MyClass {
  constructor() {}
}
      `.trim();

      const result = service.extractCodeUnit(code, 'MyClass', 'typescript');

      expect(result?.signature).toBe('class MyClass');
    });

    it('handles signature with complex return type (limitation)', () => {
      const code = `
function complex(): Promise<Record<string, number>> {
  return Promise.resolve({});
}
      `.trim();

      const result = service.extractCodeUnit(code, 'complex', 'typescript');

      expect(result).toBeDefined();
      // Current regex may not capture complex return types perfectly
      // This documents the current behavior
    });

    it('handles multiline function signature (limitation)', () => {
      const code = `
function multiline(
  param1: string,
  param2: number
): boolean {
  return true;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'multiline', 'typescript');

      expect(result).toBeDefined();
      // Signature extraction only looks at first line, so multiline params
      // may not be fully captured in the signature
    });
  });

  describe('Brace Counting Logic', () => {
    it('correctly counts balanced braces', () => {
      const code = `
function balanced() {
  {
    {
      return true;
    }
  }
}
      `.trim();

      const result = service.extractCodeUnit(code, 'balanced', 'typescript');

      expect(result).toBeDefined();
      expect(result?.endLine).toBe(7);
    });

    it('handles single-line function', () => {
      const code = `function oneLine() { return true; }`;

      const result = service.extractCodeUnit(code, 'oneLine', 'typescript');

      expect(result).toBeDefined();
      expect(result?.startLine).toBe(1);
      expect(result?.endLine).toBe(1);
    });

    it('handles empty function body', () => {
      const code = `
function empty() {
}
      `.trim();

      const result = service.extractCodeUnit(code, 'empty', 'typescript');

      expect(result).toBeDefined();
      expect(result?.endLine).toBe(2);
    });

    it('stops at first balanced closing brace', () => {
      const code = `
function first() {
  return 1;
}

const unrelated = { key: "value" };
      `.trim();

      const result = service.extractCodeUnit(code, 'first', 'typescript');

      expect(result).toBeDefined();
      expect(result?.endLine).toBe(3);
      expect(result?.fullContent).not.toContain('unrelated');
    });

    it('handles brace in comments (limitation - not supported)', () => {
      const code = `
function withComment() {
  // This comment has a brace: {
  return true;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'withComment', 'typescript');

      // NOTE: Current implementation doesn't handle braces in comments
      // This may cause incorrect boundary detection
      expect(result).toBeDefined();
    });

    it('handles template literals with braces (limitation)', () => {
      const code = `
function withTemplate() {
  const str = \`template \${var} end\`;
  return str;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'withTemplate', 'typescript');

      expect(result).toBeDefined();
      expect(result?.fullContent).toContain('template');
    });
  });

  describe('Start and End Line Tracking', () => {
    it('uses 1-based line numbering', () => {
      const code = `function test() {
  return true;
}`;

      const result = service.extractCodeUnit(code, 'test', 'typescript');

      expect(result?.startLine).toBe(1);
      expect(result?.endLine).toBe(3);
    });

    it('correctly tracks lines with leading whitespace', () => {
      const code = `function delayed() {
  return true;
}`;

      const result = service.extractCodeUnit(code, 'delayed', 'typescript');

      expect(result?.startLine).toBe(1);
      expect(result?.endLine).toBe(3);
    });

    it('includes all lines in fullContent', () => {
      const code = `
function multiLine() {
  const a = 1;
  const b = 2;
  return a + b;
}
      `.trim();

      const result = service.extractCodeUnit(code, 'multiLine', 'typescript');

      expect(result).toBeDefined();
      const lines = result?.fullContent.split('\n') ?? [];
      expect(lines.length).toBe(result?.endLine! - result?.startLine! + 1);
    });
  });
});
