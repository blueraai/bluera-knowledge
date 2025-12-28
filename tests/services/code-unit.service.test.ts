import { describe, it, expect } from 'vitest';
import { CodeUnitService } from '../../src/services/code-unit.service.js';

describe('CodeUnitService', () => {
  it('should extract full function from TypeScript code', () => {
    const code = `
export function validateToken(token: string): boolean {
  if (!token) return false;
  return token.length > 0;
}

export function parseToken(token: string): object {
  return JSON.parse(token);
}
`;

    const service = new CodeUnitService();
    const unit = service.extractCodeUnit(code, 'validateToken', 'typescript');

    expect(unit).toBeDefined();
    expect(unit.type).toBe('function');
    expect(unit.name).toBe('validateToken');
    expect(unit.signature).toBe('validateToken(token: string): boolean');
    expect(unit.fullContent).toContain('export function validateToken');
    expect(unit.startLine).toBe(2);
    expect(unit.endLine).toBe(5);
  });

  it('should extract class with methods', () => {
    const code = `
export class UserService {
  constructor(private repo: UserRepo) {}

  async create(data: CreateUserData): Promise<User> {
    return this.repo.save(data);
  }
}
`;

    const service = new CodeUnitService();
    const unit = service.extractCodeUnit(code, 'UserService', 'typescript');

    expect(unit.type).toBe('class');
    expect(unit.name).toBe('UserService');
    expect(unit.fullContent).toContain('class UserService');
  });
});
