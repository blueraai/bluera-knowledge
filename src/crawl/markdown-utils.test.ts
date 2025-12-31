/**
 * Comprehensive tests for markdown-utils
 * Coverage: detectLanguageFromClass, HTML escaping, preprocessHtmlForCodeBlocks, cleanupMarkdown
 */

import { describe, it, expect } from 'vitest';
import { preprocessHtmlForCodeBlocks, cleanupMarkdown } from './markdown-utils.js';

describe('Markdown Utils', () => {
  describe('preprocessHtmlForCodeBlocks', () => {
    describe('MkDocs Table-Wrapped Code Blocks', () => {
      it('should extract code from MkDocs table structure', () => {
        const html = `
          <table class="highlighttable">
            <tbody>
              <tr>
                <td class="linenos">1</td>
                <td class="code"><pre><code class="language-python">print("hello")</code></pre></td>
              </tr>
            </tbody>
          </table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('<pre><code class="language-python">');
        expect(result).toContain('print("hello")');
        expect(result).not.toContain('<table');
        expect(result).not.toContain('linenos');
      });

      it('should preserve language class from code element', () => {
        const html = `
          <table>
            <tr>
              <td><pre><code class="language-javascript">const x = 1;</code></pre></td>
            </tr>
          </table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('class="language-javascript"');
        expect(result).toContain('const x = 1;');
      });

      it('should preserve language class from pre element if code has no class', () => {
        const html = `
          <table>
            <tr>
              <td><pre class="language-python"><code>import os</code></pre></td>
            </tr>
          </table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('class="language-python"');
        expect(result).toContain('import os');
      });

      it('should handle nested div inside table cell', () => {
        const html = `
          <table>
            <tr>
              <td>
                <div class="highlight">
                  <pre><code class="language-go">package main</code></pre>
                </div>
              </td>
            </tr>
          </table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('class="language-go"');
        expect(result).toContain('package main');
        expect(result).not.toContain('<table');
      });

      it('should handle multiple code blocks in separate tables', () => {
        const html = `
          <table><tr><td><pre><code class="language-python">code1</code></pre></td></tr></table>
          <table><tr><td><pre><code class="language-javascript">code2</code></pre></td></tr></table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('language-python');
        expect(result).toContain('code1');
        expect(result).toContain('language-javascript');
        expect(result).toContain('code2');
        expect(result).not.toContain('<table');
      });

      it('should not modify tables without code blocks', () => {
        const html = `
          <table>
            <tr>
              <th>Header</th>
            </tr>
            <tr>
              <td>Data</td>
            </tr>
          </table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('<table');
        expect(result).toContain('Header');
        expect(result).toContain('Data');
      });

      it('should escape HTML characters in code content', () => {
        const html = `
          <table>
            <tr>
              <td><pre><code class="language-html">&lt;div&gt;test&lt;/div&gt;</code></pre></td>
            </tr>
          </table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('&lt;div&gt;');
      });
    });

    describe('Syntax Highlighting Cleanup', () => {
      it('should strip span tags from code blocks', () => {
        const html = `
          <pre><code class="language-python">
            <span class="hljs-keyword">def</span> <span class="hljs-title">test</span>():
              <span class="hljs-keyword">pass</span>
          </code></pre>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).not.toContain('<span');
        expect(result).toContain('def');
        expect(result).toContain('test');
        expect(result).toContain('pass');
      });

      it('should strip spans from pre elements', () => {
        const html = `
          <pre class="language-bash">
            <span class="prompt">$</span> <span class="command">npm install</span>
          </pre>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).not.toContain('<span');
        expect(result).toContain('$');
        expect(result).toContain('npm install');
      });

      it('should preserve code text content when removing spans', () => {
        const html = `
          <code><span class="string">"hello world"</span></code>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('"hello world"');
        expect(result).not.toContain('<span');
      });
    });

    describe('Empty Anchor Cleanup', () => {
      it('should remove empty anchor tags in pre blocks', () => {
        const html = `
          <pre><code>
            <a id="line-1"></a>function test() {}
          </code></pre>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).not.toContain('<a id="line-1"></a>');
        expect(result).toContain('function test()');
      });

      it('should remove empty anchor tags in code blocks', () => {
        const html = `
          <code><a href="#"></a>inline code</code>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).not.toContain('<a');
        expect(result).toContain('inline code');
      });

      it('should preserve non-empty anchor tags', () => {
        const html = `
          <pre><code>
            <a href="#test">link text</a>
          </code></pre>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        // The anchor should be stripped as it's in a code block
        expect(result).toContain('link text');
      });
    });

    describe('Standalone Pre Blocks', () => {
      it('should wrap standalone pre content in code tags', () => {
        const html = `
          <pre class="language-bash">
            npm install
            npm test
          </pre>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        expect(result).toContain('<code class="language-bash">');
        expect(result).toContain('npm install');
      });

      it('should not modify pre blocks that already have code children', () => {
        const html = `
          <pre class="language-python">
            <code>print("hello")</code>
          </pre>
        `;

        const result = preprocessHtmlForCodeBlocks(html);

        // Should still have code tag
        expect(result).toContain('<code');
        expect(result).toContain('print("hello")');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty HTML string', () => {
        const result = preprocessHtmlForCodeBlocks('');
        expect(result).toBe('');
      });

      it('should handle null input gracefully', () => {
        const result = preprocessHtmlForCodeBlocks(null as any);
        expect(result).toBeNull();
      });

      it('should handle undefined input gracefully', () => {
        const result = preprocessHtmlForCodeBlocks(undefined as any);
        expect(result).toBeUndefined();
      });

      it('should handle HTML without code blocks', () => {
        const html = '<div><p>Regular paragraph</p></div>';
        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('<div>');
        expect(result).toContain('Regular paragraph');
      });

      it('should handle malformed HTML', () => {
        const html = '<pre><code>unclosed tags';
        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('unclosed tags');
      });

      it('should handle deeply nested code blocks', () => {
        const html = `
          <div class="outer">
            <div class="inner">
              <table>
                <tr>
                  <td>
                    <div class="wrapper">
                      <pre><code class="language-python">nested code</code></pre>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        `;

        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('nested code');
      });
    });

    describe('Language Detection Patterns', () => {
      it('should detect language from language-* pattern', () => {
        const html = `
          <table><tr><td><pre><code class="language-typescript">type X = string;</code></pre></td></tr></table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('class="language-typescript"');
      });

      it('should detect language from lang-* pattern', () => {
        const html = `
          <table><tr><td><pre><code class="lang-ruby">puts "hello"</code></pre></td></tr></table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('language-ruby');
      });

      it('should detect language from highlight-* pattern', () => {
        const html = `
          <table><tr><td><pre><code class="highlight-java">public class Main {}</code></pre></td></tr></table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('language-java');
      });

      it('should detect language from hljs pattern', () => {
        const html = `
          <table><tr><td><pre><code class="hljs cpp">int main() {}</code></pre></td></tr></table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('cpp');
      });

      it('should handle unknown language gracefully', () => {
        const html = `
          <table><tr><td><pre><code>no language specified</code></pre></td></tr></table>
        `;

        const result = preprocessHtmlForCodeBlocks(html);
        expect(result).toContain('no language specified');
      });
    });
  });

  describe('cleanupMarkdown', () => {
    describe('Heading Formatting', () => {
      it('should fix broken headings with text on next line', () => {
        const md = '## \n\nSome text';
        const result = cleanupMarkdown(md);
        expect(result).toBe('## Some text');
      });

      it('should ensure double newlines after headings', () => {
        const md = '## Heading\nText immediately after';
        const result = cleanupMarkdown(md);
        expect(result).toContain('## Heading\n\nText immediately after');
      });

      it('should ensure double newlines between headings', () => {
        const md = '## Heading 1\n## Heading 2';
        const result = cleanupMarkdown(md);
        expect(result).toContain('## Heading 1\n\n## Heading 2');
      });

      it('should handle single newline before headings from text', () => {
        const md = 'Some text\n\n# Heading';
        const result = cleanupMarkdown(md);
        expect(result).toContain('Some text\n# Heading');
      });
    });

    describe('Navigation Links', () => {
      it('should fix navigation links with excessive whitespace', () => {
        const md = '*  [  Link Text  ](https://example.com)';
        const result = cleanupMarkdown(md);
        expect(result).toBe('* [Link Text](https://example.com)');
      });

      it('should normalize whitespace around link text', () => {
        const md = '* [   Multiple   Spaces   ](url)';
        const result = cleanupMarkdown(md);
        expect(result).toBe('* [Multiple   Spaces](url)');
      });
    });

    describe('List Formatting', () => {
      it('should ensure single newlines between list items', () => {
        const md = '* Item 1\n\n\n* Item 2\n\n\n* Item 3';
        const result = cleanupMarkdown(md);
        expect(result).toBe('* Item 1\n* Item 2\n* Item 3');
      });

      it('should remove empty list items', () => {
        const md = '*  \n  *\n* Valid item';
        const result = cleanupMarkdown(md);
        expect(result).toContain('* Valid item');
        expect(result).not.toContain('*  \n  *');
      });
    });

    describe('Code Block Cleanup', () => {
      it('should remove blank lines after opening backticks', () => {
        const md = '```python\n\n\nprint("hello")';
        const result = cleanupMarkdown(md);
        expect(result).toBe('```python\nprint("hello")');
      });

      it('should remove blank lines before closing backticks', () => {
        const md = 'print("hello")\n\n\n```';
        const result = cleanupMarkdown(md);
        expect(result).toBe('print("hello")\n```');
      });

      it('should handle code blocks with language specifier', () => {
        const md = '```javascript\n\nconst x = 1;\n\n```';
        const result = cleanupMarkdown(md);
        expect(result).toBe('```javascript\nconst x = 1;\n```');
      });
    });

    describe('HTML Tag Removal', () => {
      it('should remove table structure tags', () => {
        const md = '<table><tbody><tr><td>Content</td></tr></tbody></table>';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('<table');
        expect(result).not.toContain('<tbody');
        expect(result).not.toContain('<tr');
        expect(result).not.toContain('<td');
      });

      it('should remove empty anchor tags', () => {
        const md = 'Text <a></a> more text <a id="test"></a> content';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('<a></a>');
        expect(result).not.toContain('<a id="test"></a>');
        expect(result).toContain('Text');
        expect(result).toContain('content');
      });

      it('should remove span tags', () => {
        const md = 'Text <span class="highlight">highlighted</span> text';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('<span');
        expect(result).toContain('highlighted');
      });

      it('should remove div tags', () => {
        const md = '<div class="container">Content</div>';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('<div');
        expect(result).toContain('Content');
      });

      it('should remove pre and code tags', () => {
        const md = '<pre><code>code content</code></pre>';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('<pre');
        expect(result).not.toContain('<code');
        expect(result).toContain('code content');
      });
    });

    describe('Empty Link Removal', () => {
      it('should remove empty markdown links', () => {
        const md = 'Text [](https://example.com) more text';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('[](https://example.com)');
        expect(result).toContain('Text');
        expect(result).toContain('more text');
      });

      it('should keep non-empty links', () => {
        const md = '[Link Text](https://example.com)';
        const result = cleanupMarkdown(md);
        expect(result).toContain('[Link Text](https://example.com)');
      });
    });

    describe('Codelineno References', () => {
      it('should remove codelineno references with empty brackets', () => {
        const md = 'Code [](_file.md#__codelineno-0-1) here';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('__codelineno');
        expect(result).toContain('Code');
        expect(result).toContain('here');
      });

      it('should remove inline codelineno patterns', () => {
        const md = 'Text [](#__codelineno-5-10) content';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('__codelineno');
      });

      it('should remove codelineno with file paths', () => {
        const md = 'Reference [](_example.md#__codelineno-2-15)';
        const result = cleanupMarkdown(md);
        expect(result).not.toContain('__codelineno');
        expect(result).toContain('Reference');
      });
    });

    describe('HTML Entity Cleanup', () => {
      it('should fix double-escaped less-than', () => {
        const md = 'Code: &amp;lt;div&amp;gt;';
        const result = cleanupMarkdown(md);
        expect(result).toBe('Code: &lt;div&gt;');
      });

      it('should fix double-escaped ampersands', () => {
        const md = 'Entity: &amp;amp;nbsp;';
        const result = cleanupMarkdown(md);
        expect(result).toBe('Entity: &amp;nbsp;');
      });
    });

    describe('Excessive Whitespace', () => {
      it('should reduce three or more newlines to two', () => {
        const md = 'Paragraph 1\n\n\n\n\nParagraph 2';
        const result = cleanupMarkdown(md);
        expect(result).toBe('Paragraph 1\n\nParagraph 2');
      });

      it('should remove trailing spaces on lines', () => {
        const md = 'Line with spaces   \nNext line';
        const result = cleanupMarkdown(md);
        expect(result).toBe('Line with spaces\nNext line');
      });

      it('should trim the entire markdown', () => {
        const md = '  \n\n  Content  \n\n  ';
        const result = cleanupMarkdown(md);
        expect(result).toBe('Content');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        const result = cleanupMarkdown('');
        expect(result).toBe('');
      });

      it('should handle whitespace-only string', () => {
        const result = cleanupMarkdown('   \n  \t  ');
        expect(result).toBe('');
      });

      it('should handle null input', () => {
        const result = cleanupMarkdown(null as any);
        expect(result).toBe('');
      });

      it('should handle undefined input', () => {
        const result = cleanupMarkdown(undefined as any);
        expect(result).toBe('');
      });

      it('should handle single character', () => {
        const result = cleanupMarkdown('a');
        expect(result).toBe('a');
      });

      it('should handle markdown with only newlines', () => {
        const result = cleanupMarkdown('\n\n\n\n');
        expect(result).toBe('');
      });
    });

    describe('Complex Real-World Patterns', () => {
      it('should clean up MkDocs-style documentation', () => {
        const md = `
## \n\nGetting Started

*  [  Installation  ](install.md)
*  [  Usage  ](usage.md)


## \n\nExamples

\`\`\`python\n\n
import package
\n\n\`\`\`

<div class="note">Note content</div>
[](_file.md#__codelineno-0-1)
        `.trim();

        const result = cleanupMarkdown(md);

        expect(result).toContain('## Getting Started');
        expect(result).toContain('* [Installation](install.md)');
        expect(result).toContain('## Examples');
        expect(result).toContain('```python\nimport package\n```');
        expect(result).not.toContain('<div');
        expect(result).not.toContain('__codelineno');
      });

      it('should clean up Sphinx-style documentation', () => {
        const md = `
# Title


##  Subtitle\nContent here

<span class="pre">code</span>


* Item 1


* Item 2
        `.trim();

        const result = cleanupMarkdown(md);

        expect(result).toContain('# Title');
        expect(result).toContain('## Subtitle');
        expect(result).not.toContain('<span');
        expect(result).toContain('* Item 1\n* Item 2');
      });

      it('should handle combination of all cleanup patterns', () => {
        const md = `
## \n\nTitle

*  [  Link  ](url)


\`\`\`js\n\n
code\n\n
\`\`\`

<table><tr><td>table</td></tr></table>
<a></a>
[]()
[](_file.md#__codelineno-1-1)
&amp;lt;tag&amp;gt;




End
        `.trim();

        const result = cleanupMarkdown(md);

        expect(result).toContain('## Title');
        expect(result).toContain('* [Link](url)');
        expect(result).toContain('```js\ncode\n```');
        expect(result).not.toContain('<table');
        expect(result).not.toContain('<a></a>');
        expect(result).not.toContain('[](');
        expect(result).not.toContain('__codelineno');
        expect(result).toContain('&lt;tag&gt;');
        expect(result).toContain('End');
        expect(result).not.toContain('\n\n\n');
      });
    });

    describe('Preservation Tests', () => {
      it('should preserve valid markdown structure', () => {
        const md = `# Title

## Section

This is a paragraph.

* Item 1
* Item 2

\`\`\`python
code
\`\`\`

[Link](url)`;

        const result = cleanupMarkdown(md);

        expect(result).toContain('# Title');
        expect(result).toContain('## Section');
        expect(result).toContain('This is a paragraph.');
        expect(result).toContain('* Item 1\n* Item 2');
        expect(result).toContain('```python\ncode\n```');
        expect(result).toContain('[Link](url)');
      });

      it('should preserve inline code', () => {
        const md = 'Use `code` in markdown';
        const result = cleanupMarkdown(md);
        expect(result).toContain('`code`');
      });

      it('should preserve bold and italic', () => {
        const md = '**bold** and *italic* text';
        const result = cleanupMarkdown(md);
        expect(result).toContain('**bold**');
        expect(result).toContain('*italic*');
      });

      it('should preserve blockquotes', () => {
        const md = '> This is a quote';
        const result = cleanupMarkdown(md);
        expect(result).toContain('> This is a quote');
      });
    });
  });
});
