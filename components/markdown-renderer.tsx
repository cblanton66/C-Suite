"use client"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github.css"
import { ChartRenderer, parseChartFromText } from "@/components/chart-renderer"
import { Button } from "@/components/ui/button"
import { Copy, CheckCheck } from "lucide-react"
import { useState } from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)
  
  // Check for embedded charts in the content
  const chartData = parseChartFromText(content)
  
  // Remove chart syntax from content for normal markdown rendering
  const cleanContent = content.replace(/CHART:(LINE|BAR|PIE):(.+?)\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/gi, '')
  
  const copyCodeToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCodeId(id)
      setTimeout(() => setCopiedCodeId(null), 2000)
    } catch (err) {
      console.error('Failed to copy code: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedCodeId(id)
        setTimeout(() => setCopiedCodeId(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }
  
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {chartData && <ChartRenderer chartData={chartData} />}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom styling for different markdown elements
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold text-foreground mb-3 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-foreground mb-2 mt-2 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-foreground mb-2 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm text-foreground mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm text-foreground mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
                  {children}
                </code>
              )
            }
            return (
              <code className={className}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => {
            // Extract the code content from children
            const codeContent = typeof children === 'object' && children && 'props' in children 
              ? children.props.children 
              : String(children)
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
            
            return (
              <div className="relative group mb-2">
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono">
                  {children}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyCodeToClipboard(codeContent, codeId)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-muted-foreground/10"
                  title="Copy code"
                >
                  {copiedCodeId === codeId ? (
                    <CheckCheck className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/20 pl-4 py-2 bg-muted/30 rounded-r-lg mb-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-foreground border-b border-border">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">
              {children}
            </em>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  )
}
