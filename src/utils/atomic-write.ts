import { writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Atomically write content to a file.
 *
 * Writes to a temporary file first, then renames it to the target path.
 * The rename operation is atomic on POSIX systems, ensuring that the file
 * is never in a partially-written state even if the process crashes.
 *
 * @param filePath - The target file path
 * @param content - The content to write
 */
export async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  // Ensure parent directory exists
  await mkdir(dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.tmp.${String(Date.now())}.${String(process.pid)}`;
  await writeFile(tempPath, content, 'utf-8');
  await rename(tempPath, filePath);
}

/**
 * Synchronously and atomically write content to a file.
 *
 * Writes to a temporary file first, then renames it to the target path.
 * The rename operation is atomic on POSIX systems, ensuring that the file
 * is never in a partially-written state even if the process crashes.
 *
 * @param filePath - The target file path
 * @param content - The content to write
 */
export function atomicWriteFileSync(filePath: string, content: string): void {
  // Ensure parent directory exists
  mkdirSync(dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.tmp.${String(Date.now())}.${String(process.pid)}`;
  writeFileSync(tempPath, content, 'utf-8');
  renameSync(tempPath, filePath);
}
