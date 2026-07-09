"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-1 mb-2 text-base font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 flex items-center gap-2 text-[13px] font-semibold tracking-tight text-foreground first:mt-0">
      <span className="h-3 w-1 rounded-full bg-[#7c3aed]" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-2 leading-relaxed text-foreground first:mt-0 last:mb-0">{children}</p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--info)] underline decoration-[var(--info)]/30 underline-offset-2 transition-colors hover:decoration-[var(--info)]"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-muted">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-2 flex list-disc flex-col gap-1.5 pl-5 marker:text-[#7c3aed]/70 first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 flex list-decimal flex-col gap-1.5 pl-5 marker:font-medium marker:text-muted-2 first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 leading-relaxed text-foreground [&>ul]:mt-1.5 [&>ol]:mt-1.5">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-[var(--radius-sm)] nu-inset px-3.5 py-2.5 text-muted [&>p]:my-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-0 border-t border-[var(--border)]" />,
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return <code className={cn("font-mono text-[12px]", className)}>{children}</code>;
    }
    return (
      <code className="rounded-md nu-inset-sm px-1.5 py-0.5 font-mono text-[12px] text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-[var(--radius-sm)] nu-inset p-3 text-[12px] leading-relaxed">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-[var(--radius-sm)] nu-flat">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[var(--border)] px-3 py-2 text-foreground last:border-0">
      {children}
    </td>
  ),
  tr: ({ children }) => <tr className="[&:last-child>td]:border-0">{children}</tr>,
};

function MarkdownImpl({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-sm", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(
  MarkdownImpl,
  (prev, next) => prev.children === next.children && prev.className === next.className
);
