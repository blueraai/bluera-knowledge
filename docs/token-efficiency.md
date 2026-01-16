# Token Efficiency

Beyond speed and accuracy, Bluera Knowledge can **significantly reduce token consumption** for code-related queries—typically saving 60-75% compared to web search approaches.

## How It Works

**Without Bluera Knowledge:**
- Web searches return 5-10 results (~500-2,000 tokens each)
- Total per search: **3,000-10,000 tokens**
- Often need multiple searches to find the right answer
- Lower signal-to-noise ratio (blog posts mixed with actual docs)

**With Bluera Knowledge:**
- Semantic search returns top 10 relevant code chunks (~200-400 tokens each)
- Structured metadata (file paths, imports, purpose)
- Total per search: **1,500-3,000 tokens**
- Higher relevance due to vector search (fewer follow-up queries needed)

---

## Real-World Examples

### Example 1: Library Implementation Question

**Question:** "How does Express handle middleware errors?"

| Approach | Token Cost | Result |
|----------|-----------|--------|
| **Web Search** | ~8,000 tokens (3 searches: general query → refined query → source code) | Blog posts + Stack Overflow + eventual guess |
| **Bluera Knowledge** | ~2,000 tokens (1 semantic search) | Actual Express source code, authoritative |
| **Savings** | **75% fewer tokens** | Higher accuracy |

### Example 2: Dependency Exploration

**Question:** "How does LanceDB's vector search work?"

| Approach | Token Cost | Result |
|----------|-----------|--------|
| **Web Search** | ~9,500 tokens (General docs → API docs → fetch specific page) | Documentation, might miss implementation details |
| **Bluera Knowledge** | ~1,500 tokens (Search returns source + tests + examples) | Source code from Python + Rust implementation |
| **Savings** | **84% fewer tokens** | Complete picture |

### Example 3: Version-Specific Behavior

**Question:** "What changed in React 18's useEffect cleanup?"

| Approach | Token Cost | Result |
|----------|-----------|--------|
| **Training Data** | 0 tokens (but might be outdated) | Uncertain if accurate for React 18 |
| **Web Search** | ~5,000 tokens (Search changelog → blog posts → docs) | Mix of React 17 and 18 info |
| **Bluera Knowledge** | ~2,000 tokens (Search indexed React 18 source) | Exact React 18 implementation |
| **Savings** | **60% fewer tokens** | Version-accurate |

---

## When BK Uses More Tokens

Bluera Knowledge isn't always the most token-efficient choice:

| Scenario | Best Approach | Why |
|----------|---------------|-----|
| **Simple concept questions** ("What is a JavaScript closure?") | Training data | Claude already knows this (0 tokens) |
| **Current events** ("Latest Next.js 15 release notes") | Web search | BK only has what you've indexed |
| **General advice** ("How to structure a React app?") | Training data | Opinion-based, not code-specific |

---

## Summary: Token Savings by Query Type

| Query Type | Typical Token Savings | When to Use BK |
|------------|----------------------|----------------|
| **Library internals** | 60-75% | Always |
| **Version-specific behavior** | 50-70% | Always |
| **"How does X work internally?"** | 70-85% | Always |
| **API usage examples** | 40-60% | Recommended |
| **General concepts** | -100% (uses more) | Skip BK |
| **Current events** | -100% (uses more) | Skip BK |

---

## Best Practice

**Default to BK for library questions.** It's cheap, fast, and authoritative:

| Question Type | Action | Why |
|--------------|--------|-----|
| Library internals, APIs, errors, versions, config | **Query BK first** | Source code is definitive, 60-85% token savings |
| General programming concepts | Skip BK | Training data is sufficient |
| Breaking news, release notes | Web search | BK only has indexed content |

The plugin's Skills teach Claude Code these patterns automatically. When in doubt about a dependency, query BK—it's faster and more accurate than guessing or web searching.
