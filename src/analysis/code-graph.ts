import type { CodeNode } from './ast-parser.js';

export interface GraphNode {
  id: string;
  file: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const';
  name: string;
  exported: boolean;
  startLine: number;
  endLine: number;
  signature?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'calls' | 'imports' | 'extends' | 'implements';
  confidence: number;
}

export class CodeGraph {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge[]>();

  addNodes(nodes: CodeNode[], file: string): void {
    for (const node of nodes) {
      const id = `${file}:${node.name}`;

      const graphNode: GraphNode = {
        id,
        file,
        type: node.type,
        name: node.name,
        exported: node.exported,
        startLine: node.startLine,
        endLine: node.endLine
      };

      if (node.signature !== undefined) {
        graphNode.signature = node.signature;
      }

      this.nodes.set(id, graphNode);

      // Initialize edges array for this node
      if (!this.edges.has(id)) {
        this.edges.set(id, []);
      }
    }
  }

  addImport(fromFile: string, toFile: string, specifiers: string[]): void {
    // Normalize the toFile path (resolve relative imports)
    const resolvedTo = this.resolveImportPath(fromFile, toFile);

    for (const spec of specifiers) {
      const edge: GraphEdge = {
        from: fromFile,
        to: `${resolvedTo}:${spec}`,
        type: 'imports',
        confidence: 1.0
      };

      const edges = this.edges.get(fromFile) ?? [];
      edges.push(edge);
      this.edges.set(fromFile, edges);
    }
  }

  analyzeCallRelationships(code: string, file: string, functionName: string): void {
    const nodeId = `${file}:${functionName}`;

    // Simple regex-based call detection (can be enhanced with AST later)
    const callPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    const calls = new Set<string>();

    let match;
    while ((match = callPattern.exec(code)) !== null) {
      if (match[1]) {
        calls.add(match[1]);
      }
    }

    const edges = this.edges.get(nodeId) ?? [];

    for (const calledFunction of calls) {
      // Try to find the called function in the graph
      const targetNode = this.findNodeByName(calledFunction);

      if (targetNode) {
        edges.push({
          from: nodeId,
          to: targetNode.id,
          type: 'calls',
          confidence: 0.8 // Lower confidence for regex-based detection
        });
      } else {
        // Unknown function, possibly from import
        edges.push({
          from: nodeId,
          to: `unknown:${calledFunction}`,
          type: 'calls',
          confidence: 0.5
        });
      }
    }

    this.edges.set(nodeId, edges);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdges(nodeId: string): GraphEdge[] {
    return this.edges.get(nodeId) ?? [];
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  private findNodeByName(name: string): GraphNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.name === name) {
        return node;
      }
    }
    return undefined;
  }

  private resolveImportPath(fromFile: string, importPath: string): string {
    // Simple resolution - can be enhanced
    if (importPath.startsWith('.')) {
      // Relative import
      const fromDir = fromFile.split('/').slice(0, -1).join('/');
      const parts = importPath.split('/');

      let resolved = fromDir;
      for (const part of parts) {
        if (part === '..') {
          resolved = resolved.split('/').slice(0, -1).join('/');
        } else if (part !== '.') {
          resolved += '/' + part;
        }
      }

      return resolved.replace(/\.js$/, '');
    }

    // Package import
    return importPath;
  }

  toJSON(): { nodes: GraphNode[]; edges: Array<{ from: string; to: string; type: string }> } {
    const allEdges: GraphEdge[] = [];
    for (const edges of this.edges.values()) {
      allEdges.push(...edges);
    }

    return {
      nodes: Array.from(this.nodes.values()),
      edges: allEdges.map(e => ({ from: e.from, to: e.to, type: e.type }))
    };
  }
}
