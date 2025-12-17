# React Hooks Patterns and Best Practices

## Custom Hooks

Custom hooks let you extract component logic into reusable functions.

### useLocalStorage

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}
```

### useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage
function SearchComponent() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery)
    }
  }, [debouncedQuery])
}
```

### useFetch

```typescript
interface FetchState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        setState(prev => ({ ...prev, loading: true }))
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(response.statusText)
        const data = await response.json()
        setState({ data, loading: false, error: null })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setState({ data: null, loading: false, error })
        }
      }
    }

    fetchData()
    return () => controller.abort()
  }, [url])

  return state
}
```

## Rules of Hooks

1. **Only call hooks at the top level** - not inside loops, conditions, or nested functions
2. **Only call hooks from React functions** - components or custom hooks
3. **Name custom hooks with "use" prefix** - enables linting rules

## Performance Patterns

### useMemo for expensive calculations

```typescript
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(a, b)
}, [a, b])
```

### useCallback for stable function references

```typescript
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```
