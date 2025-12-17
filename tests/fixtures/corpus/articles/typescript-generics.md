# TypeScript Generics: From Basics to Advanced Patterns

## Why Generics?

Generics allow you to write reusable code that works with multiple types while maintaining type safety.

## Basic Generic Functions

```typescript
// Without generics - loses type information
function identity(arg: any): any {
  return arg
}

// With generics - preserves type
function identity<T>(arg: T): T {
  return arg
}

const str = identity<string>('hello') // string
const num = identity(42) // number (inferred)
```

## Generic Constraints

Constrain generics to types with specific properties:

```typescript
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length)
  return arg
}

logLength('hello') // OK
logLength([1, 2, 3]) // OK
logLength(123) // Error: number doesn't have length
```

## Generic Interfaces

```typescript
interface Repository<T> {
  find(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Omit<T, 'id'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}

interface User {
  id: string
  name: string
  email: string
}

class UserRepository implements Repository<User> {
  async find(id: string): Promise<User | null> {
    // implementation
  }
  // ... other methods
}
```

## Conditional Types

```typescript
type IsArray<T> = T extends any[] ? true : false

type A = IsArray<string[]> // true
type B = IsArray<number>   // false

// Extract element type from array
type ElementType<T> = T extends (infer E)[] ? E : never

type C = ElementType<string[]> // string
```

## Mapped Types

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K]
}

type Partial<T> = {
  [K in keyof T]?: T[K]
}

type Required<T> = {
  [K in keyof T]-?: T[K]
}
```

## Utility Type Patterns

```typescript
// Make specific keys optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Make specific keys required
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

// Deep partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
```
