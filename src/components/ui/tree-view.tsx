import * as React from 'react';
import { ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// TreeView — a collapsible file/nav tree. Dependency-free, recursive markup.
export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

interface TreeViewProps {
  data: TreeNode[];
  defaultExpanded?: string[];
  className?: string;
}

function TreeView({ data, defaultExpanded = [], className }: TreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(defaultExpanded));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      // Use if/else instead of ternary-as-statement to avoid no-unused-expressions
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const render = (nodes: TreeNode[], depth: number): React.ReactNode =>
    nodes.map((node) => {
      const hasChildren = !!node.children?.length;
      const isOpen = expanded.has(node.id);
      return (
        <li
          key={node.id}
          role="treeitem"
          aria-expanded={hasChildren ? isOpen : undefined}
          // aria-selected is required for role="treeitem" per ARIA spec.
          // TreeView does not implement selection; false indicates unselected.
          aria-selected={false}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggle(node.id)}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren ? (
              <ChevronRightIcon
                className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')}
              />
            ) : (
              <span className="w-3.5" />
            )}
            {hasChildren ? (
              <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {node.label}
          </button>
          {hasChildren && isOpen && (
            <ul role="group">{render(node.children!, depth + 1)}</ul>
          )}
        </li>
      );
    });

  return (
    <ul role="tree" className={cn('select-none', className)}>
      {render(data, 0)}
    </ul>
  );
}

export { TreeView };
