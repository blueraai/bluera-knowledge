import { describe, it, expect } from 'vitest';
import { uninstallCommands } from './uninstall.commands.js';

describe('uninstall.commands', () => {
  it('should export uninstall command', () => {
    expect(uninstallCommands).toHaveLength(1);
    expect(uninstallCommands[0].name).toBe('uninstall');
  });

  it('should have correct command definition', () => {
    const cmd = uninstallCommands[0];
    expect(cmd.description).toContain('Remove Bluera Knowledge data');
    expect(cmd.argsSchema).toBeDefined();
    expect(cmd.handler).toBeTypeOf('function');
  });

  it('should have valid schema for global and keepDefinitions options', () => {
    const cmd = uninstallCommands[0];
    const schema = cmd.argsSchema;

    // Validate the schema accepts expected args
    const result = schema?.safeParse({
      global: true,
      keepDefinitions: false,
    });
    expect(result?.success).toBe(true);
  });

  it('should have optional args in schema', () => {
    const cmd = uninstallCommands[0];
    const schema = cmd.argsSchema;

    // Empty args should be valid
    const result = schema?.safeParse({});
    expect(result?.success).toBe(true);
  });
});
