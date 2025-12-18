/**
 * Query-aware snippet extraction service.
 * Uses proximity-based extraction for consistent results.
 */

export interface SnippetOptions {
  /** Maximum length of the snippet in characters */
  maxLength?: number;
  /** Number of characters to show before/after the match */
  contextChars?: number;
}

const DEFAULT_OPTIONS: Required<SnippetOptions> = {
  maxLength: 200,
  contextChars: 80,
};

/**
 * Extract a query-aware snippet from content.
 * Uses proximity-based extraction to find the area with the most query term matches.
 */
export function extractSnippet(
  content: string,
  query: string,
  options: SnippetOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Tokenize query into terms (lowercase for matching)
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2); // Skip very short words

  // Normalize content for extraction
  const normalizedContent = content.replace(/\s+/g, ' ').trim();

  if (normalizedContent.length <= opts.maxLength) {
    return normalizedContent;
  }

  if (queryTerms.length === 0) {
    return truncateWithEllipsis(normalizedContent, opts.maxLength);
  }

  const bestPosition = findBestMatchPosition(normalizedContent, queryTerms);

  if (bestPosition === -1) {
    return truncateWithEllipsis(normalizedContent, opts.maxLength);
  }

  return extractContextWindow(normalizedContent, bestPosition, opts);
}

/**
 * Find the position in content where the most query terms cluster together.
 */
function findBestMatchPosition(content: string, queryTerms: string[]): number {
  const lowerContent = content.toLowerCase();

  // Find all positions where query terms appear
  const termPositions: Array<{ term: string; position: number }> = [];

  for (const term of queryTerms) {
    let pos = 0;
    while ((pos = lowerContent.indexOf(term, pos)) !== -1) {
      termPositions.push({ term, position: pos });
      pos += 1;
    }
  }

  if (termPositions.length === 0) {
    return -1;
  }

  // Score each position by how many other terms are nearby (within 200 chars)
  const PROXIMITY_WINDOW = 200;
  let bestPosition = termPositions[0]!.position;
  let bestScore = 0;

  for (const { position } of termPositions) {
    // Count unique terms within proximity window
    const nearbyTerms = new Set<string>();
    for (const { term, position: otherPos } of termPositions) {
      if (Math.abs(position - otherPos) <= PROXIMITY_WINDOW) {
        nearbyTerms.add(term);
      }
    }

    const score = nearbyTerms.size;
    if (score > bestScore) {
      bestScore = score;
      bestPosition = position;
    }
  }

  return bestPosition;
}

/**
 * Extract a context window around a position.
 */
function extractContextWindow(
  content: string,
  position: number,
  opts: Required<SnippetOptions>
): string {
  const halfWindow = Math.floor(opts.maxLength / 2);

  // Calculate start and end, trying to center on the match
  let start = Math.max(0, position - halfWindow);
  let end = Math.min(content.length, position + halfWindow);

  // Adjust if we're near the edges
  if (start === 0) {
    end = Math.min(content.length, opts.maxLength);
  } else if (end === content.length) {
    start = Math.max(0, content.length - opts.maxLength);
  }

  // Try to break at word boundaries
  if (start > 0) {
    const spaceIndex = content.indexOf(' ', start);
    if (spaceIndex !== -1 && spaceIndex < start + 20) {
      start = spaceIndex + 1;
    }
  }

  if (end < content.length) {
    const spaceIndex = content.lastIndexOf(' ', end);
    if (spaceIndex !== -1 && spaceIndex > end - 20) {
      end = spaceIndex;
    }
  }

  let snippet = content.slice(start, end).trim();

  // Add ellipsis indicators
  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < content.length) {
    snippet = snippet + '...';
  }

  return snippet;
}

/**
 * Truncate content with ellipsis at word boundary.
 */
function truncateWithEllipsis(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Find last space before maxLength
  const truncateAt = content.lastIndexOf(' ', maxLength - 3);
  const cutPoint = truncateAt > maxLength * 0.5 ? truncateAt : maxLength - 3;

  return content.slice(0, cutPoint).trim() + '...';
}
