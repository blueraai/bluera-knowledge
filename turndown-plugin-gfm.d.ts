declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';

  /**
   * GitHub Flavored Markdown plugin for TurndownService
   * Adds support for tables, strikethrough, task lists, and highlighted code blocks
   */
  export const gfm: TurndownService.Plugin;

  /**
   * Plugin for highlighted code blocks (e.g., <div class="highlight-source-js">)
   */
  export const highlightedCodeBlock: TurndownService.Plugin;

  /**
   * Plugin for strikethrough text (e.g., <del>, <s>, <strike>)
   */
  export const strikethrough: TurndownService.Plugin;

  /**
   * Plugin for GitHub-style tables
   */
  export const tables: TurndownService.Plugin;

  /**
   * Plugin for task list items (e.g., checkboxes in lists)
   */
  export const taskListItems: TurndownService.Plugin;
}
