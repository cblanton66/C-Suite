// Export utilities for chat conversations
// Extracted from chat-interface.tsx for better code organization

export interface UploadedFile {
  name: string
  size: number
  type: string
  content?: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  file?: UploadedFile
  files?: UploadedFile[]
  isBookmarked?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  lastUpdated: Date
}

// Utility function to format file sizes
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Show a toast notification
const showToast = (message: string, bgColor: string = '#10b981') => {
  const existingToast = document.querySelector('.copy-toast')
  if (existingToast) existingToast.remove()

  const toast = document.createElement('div')
  toast.className = 'copy-toast'
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 1000;
    background: ${bgColor}; color: white; padding: 12px 20px;
    border-radius: 8px; font-size: 14px; font-weight: 500;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  `
  toast.textContent = message

  const style = document.createElement('style')
  style.textContent = '@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }'
  document.head.appendChild(style)

  document.body.appendChild(toast)
  setTimeout(() => {
    toast.remove()
    style.remove()
  }, 3000)
}

// Export conversation as plain text file
export const exportConversationAsText = (session: ChatSession): void => {
  if (!session) return

  let content = `PeakSuite.ai Conversation Export\n`
  content += `Title: ${session.title}\n`
  content += `Date: ${session.createdAt.toLocaleDateString()}\n`
  content += `Messages: ${session.messages.length}\n`
  content += `\n${'='.repeat(50)}\n\n`

  session.messages.forEach((message, index) => {
    content += `${message.role.toUpperCase()}: ${message.createdAt.toLocaleString()}\n`
    if (message.file) {
      content += `[File: ${message.file.name} (${formatFileSize(message.file.size)})]\n`
    }
    content += `${message.content}\n\n`
    if (index < session.messages.length - 1) {
      content += `${'-'.repeat(30)}\n\n`
    }
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${session.createdAt.toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export conversation as HTML file (styled like the app)
export const exportConversationAsPDF = (session: ChatSession): void => {
  if (!session) return

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${session.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.7;
          color: #0f172a;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .header {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          padding: 40px;
          margin-bottom: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8, #6366f1);
        }

        .header h1 {
          color: #1e293b;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header h1::before {
          content: '';
          font-size: 28px;
        }

        .header-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-top: 25px;
        }

        .header-info-item {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .header-info-item strong {
          color: #334155;
          font-weight: 600;
          font-size: 14px;
          display: block;
          margin-bottom: 4px;
        }

        .header-info-item span {
          color: #64748b;
          font-size: 14px;
        }

        .conversation {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 20px 0;
        }

        .message {
          display: flex;
          width: 100%;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 75%;
          padding: 20px 24px;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
          position: relative;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-bottom-right-radius: 6px;
        }

        .message.assistant .message-content {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 6px;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 20px;
          margin-bottom: 14px;
          letter-spacing: 0.5px;
        }

        .message.user .role-badge {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .message.assistant .role-badge {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .file-attachment {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #1e40af;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message-text {
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .message.user .message-text {
          color: white;
        }

        .message.assistant .message-text {
          color: #374151;
        }

        .message.assistant .message-text h1,
        .message.assistant .message-text h2,
        .message.assistant .message-text h3 {
          font-weight: 600;
          margin: 16px 0 8px 0;
          color: #1f2937;
        }

        .message.assistant .message-text h1 { font-size: 18px; }
        .message.assistant .message-text h2 { font-size: 16px; }
        .message.assistant .message-text h3 { font-size: 14px; }

        .message.assistant .message-text p { margin: 8px 0; }

        .message.assistant .message-text ul,
        .message.assistant .message-text ol {
          margin: 12px 0;
          padding-left: 0;
          list-style: none;
        }

        .message.assistant .message-text li {
          margin: 8px 0;
          padding-left: 28px;
          position: relative;
          line-height: 1.6;
        }

        .message.assistant .message-text ul > li::before {
          content: "";
          position: absolute;
          left: 8px;
          color: #6b7280;
          font-weight: bold;
        }

        .message.assistant .message-text code {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          padding: 4px 8px;
          border-radius: 6px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 13px;
          color: #475569;
          border: 1px solid #e2e8f0;
          font-weight: 500;
        }

        .message.assistant .message-text pre {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #e2e8f0;
          padding: 20px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 16px 0;
          border: 1px solid #334155;
        }

        .message.assistant .message-text blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          margin: 12px 0;
          font-style: italic;
          color: #6b7280;
        }

        .message.assistant .message-text table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .message.assistant .message-text th,
        .message.assistant .message-text td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }

        .message.assistant .message-text th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .message.assistant .message-text strong {
          font-weight: 600;
          color: #1f2937;
        }

        .timestamp {
          font-size: 12px;
          color: #64748b;
          margin-top: 12px;
          font-weight: 500;
          opacity: 0.8;
        }

        .message.user .timestamp {
          color: rgba(255, 255, 255, 0.75);
        }

        @media (max-width: 768px) {
          body { padding: 20px 16px; }
          .header { padding: 24px; margin-bottom: 24px; }
          .header h1 { font-size: 24px; }
          .header-info { grid-template-columns: 1fr; gap: 12px; }
          .message-content { max-width: 90%; padding: 16px 20px; border-radius: 16px; }
          .conversation { gap: 20px; }
        }

        @media print {
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body { background: white !important; font-size: 12px; padding: 20px; }
          .header { background: white !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid; }
          .message-content { box-shadow: none !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid; }
          .message.user .message-content { background: #f1f5f9 !important; color: #1e293b !important; }
          .conversation { gap: 16px; }
          .message { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PeakSuite.ai Conversation Export</h1>
        <div class="header-info">
          <div class="header-info-item">
            <strong>Title:</strong> ${session.title}
          </div>
          <div class="header-info-item">
            <strong>Date:</strong> ${session.createdAt.toLocaleDateString()}
          </div>
          <div class="header-info-item">
            <strong>Messages:</strong> ${session.messages.length}
          </div>
          <div class="header-info-item">
            <strong>Export Date:</strong> ${new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div class="conversation">
  `

  session.messages.forEach(message => {
    const fileAttachment = message.file ? `
      <div class="file-attachment">
        <span class="file-icon">Attached:</span>
        <strong>Attached:</strong> ${message.file.name} (${formatFileSize(message.file.size)})
      </div>` : ''

    const multipleFiles = message.files && message.files.length > 0 ? `
      <div class="file-attachment">
        <span class="file-icon">Attached:</span>
        <strong>Attached ${message.files.length} files:</strong> ${message.files.map(f => f.name).join(', ')}
      </div>` : ''

    htmlContent += `
      <div class="message ${message.role}">
        <div class="message-content">
          <div class="role-badge">${message.role === 'user' ? 'You' : 'Assistant'}</div>
          ${fileAttachment}
          ${multipleFiles}
          <div class="message-text">${message.content.replace(/\n/g, '<br>')}</div>
          <div class="timestamp">${message.createdAt.toLocaleDateString()} at ${message.createdAt.toLocaleTimeString()}</div>
        </div>
      </div>
    `
  })

  htmlContent += `
      </div>
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${session.createdAt.toISOString().split('T')[0]}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Copy conversation as rich text (for pasting in emails/documents)
export const copyAsRichText = async (session: ChatSession): Promise<void> => {
  if (!session) return

  try {
    const richContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            ${session.title}
          </h2>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">
            Exported on ${new Date().toLocaleDateString()} - ${session.messages.length} messages
          </p>
        </div>

        ${session.messages.map(message => {
          const isUser = message.role === 'user'
          const bgColor = isUser ? 'background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;' : 'background: #f8fafc; color: #1e293b; border: 1px solid #e2e8f0;'
          const alignment = isUser ? 'margin-left: 60px;' : 'margin-right: 60px;'

          return `
            <div style="margin: 16px 0; ${alignment}">
              <div style="${bgColor} padding: 16px 20px; border-radius: 16px; ${isUser ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; opacity: 0.8;">
                  ${isUser ? 'You' : 'Assistant'}
                </div>
                <div style="white-space: pre-wrap; word-wrap: break-word;">
                  ${message.content.replace(/\n/g, '<br>')}
                </div>
                <div style="font-size: 11px; margin-top: 8px; opacity: 0.7;">
                  ${message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          `
        }).join('')}
      </div>
    `

    const plainText = `${session.title}\nExported on ${new Date().toLocaleDateString()}\n\n${session.messages.map(msg =>
      `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
    ).join('\n\n')}`

    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([richContent], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' })
    })

    await navigator.clipboard.write([clipboardItem])
    showToast('Rich text copied! Ready to paste in email or documents', '#10b981')

  } catch (error) {
    console.error('Failed to copy rich text:', error)
    const plainText = `${session.title}\n\n${session.messages.map(msg =>
      `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
    ).join('\n\n')}`

    await navigator.clipboard.writeText(plainText)
    alert('Copied as plain text (rich text not supported by your browser)')
  }
}

// Export as email-friendly format
export const exportAsEmailFormat = (session: ChatSession): void => {
  if (!session) return

  const emailContent = `
PEAKSUITE.AI CONVERSATION REPORT

CONVERSATION DETAILS
Title: ${session.title}
Date: ${session.createdAt.toLocaleDateString()}
Time: ${session.createdAt.toLocaleTimeString()}
Messages: ${session.messages.length}
Exported: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

${'='.repeat(50)}

CONVERSATION TRANSCRIPT

${session.messages.map((message, index) => {
  const prefix = message.role === 'user' ? 'YOU' : 'ASSISTANT'
  const timestamp = message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return `${index + 1}. ${prefix} (${timestamp})
${message.content.split('\n').map(line => `   ${line}`).join('\n')}
`
}).join('\n')}

${'='.repeat(50)}

CONVERSATION SUMMARY
Total exchanges: ${Math.ceil(session.messages.length / 2)}
User messages: ${session.messages.filter(m => m.role === 'user').length}
AI responses: ${session.messages.filter(m => m.role === 'assistant').length}

This report was generated by PeakSuite.ai
For more information, visit: https://peaksuite.ai

${'='.repeat(50)}
  `.trim()

  navigator.clipboard.writeText(emailContent).then(() => {
    showToast('Email format copied! Ready to paste', '#3b82f6')
  }).catch(() => {
    alert('Failed to copy to clipboard')
  })
}

// Copy as markdown format
export const copyAsMarkdown = (session: ChatSession): void => {
  if (!session) return

  const markdownContent = `# ${session.title}

**Date:** ${session.createdAt.toLocaleDateString()}
**Time:** ${session.createdAt.toLocaleTimeString()}
**Messages:** ${session.messages.length}
**Exported:** ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

---

${session.messages.map((message) => {
  const role = message.role === 'user' ? '**You**' : '**Assistant**'
  const timestamp = message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return `## ${role} *(${timestamp})*

${message.content}

---`
}).join('\n\n')}

## Conversation Summary

- **Total Exchanges:** ${Math.ceil(session.messages.length / 2)}
- **Your Messages:** ${session.messages.filter(m => m.role === 'user').length}
- **AI Responses:** ${session.messages.filter(m => m.role === 'assistant').length}

*Generated by PeakSuite.ai*`

  navigator.clipboard.writeText(markdownContent).then(() => {
    showToast('Markdown copied! Paste in any markdown editor', '#6366f1')
  }).catch(() => {
    alert('Failed to copy to clipboard')
  })
}

// Print a single message
export const printMessage = (text: string, messageId: string): void => {
  const messageElement = document.querySelector(`[data-message-id='${messageId}']`)

  let renderedContent = ''

  if (messageElement) {
    const proseElement = messageElement.querySelector('.prose')

    if (proseElement) {
      renderedContent = proseElement.innerHTML
    } else {
      const cardContent = messageElement.querySelector('.prose, [class*="markdown"], .group > div')
      if (cardContent) {
        renderedContent = cardContent.innerHTML
      } else {
        renderedContent = messageElement.innerHTML
      }
    }
  }

  if (!renderedContent || renderedContent.trim() === '') {
    renderedContent = text
      .replace(/\n/g, '<br>')
      .replace(/\|(.+)\|\n\|[-\s\|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
        const headerCells = header.split('|').map((cell: string) => `<th style="padding: 12px; border: 1px solid #d1d5db; background: #f9fafb; font-weight: bold; text-align: left;">${cell.trim()}</th>`).filter((cell: string) => cell !== '<th style="padding: 12px; border: 1px solid #d1d5db; background: #f9fafb; font-weight: bold; text-align: left;"></th>').join('')
        const rowCells = rows.trim().split('\n').map((row: string) => {
          const cells = row.split('|').map((cell: string) => `<td style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">${cell.trim()}</td>`).filter((cell: string) => cell !== '<td style="padding: 12px; border: 1px solid #d1d5db; text-align: left;"></td>').join('')
          return `<tr>${cells}</tr>`
        }).join('')
        return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #d1d5db;"><thead><tr>${headerCells}</tr></thead><tbody>${rowCells}</tbody></table>`
      })
  }

  const printContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PeakSuite.ai - Professional Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #ffffff;
        }
        .message-container {
          background: #ffffff;
          color: #1f2937;
          border: 1px solid #d1d5db;
          padding: 24px 30px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
        }
        .message-content {
          font-size: 14px;
          line-height: 1.6;
        }

        table {
          min-width: 100% !important;
          border-collapse: collapse !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          margin: 8px 0 !important;
        }
        thead { background: #f1f5f9 !important; }
        th {
          padding: 8px 12px !important;
          text-align: left !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #0f172a !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        td {
          padding: 8px 12px !important;
          font-size: 12px !important;
          color: #0f172a !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        tr:nth-child(even) { background-color: #f9fafb !important; }

        .message-content h1 { font-size: 18px !important; font-weight: 600 !important; color: #0f172a !important; margin-bottom: 12px !important; margin-top: 16px !important; }
        .message-content h2 { font-size: 16px !important; font-weight: 600 !important; color: #0f172a !important; margin-bottom: 8px !important; margin-top: 12px !important; }
        .message-content h3 { font-size: 14px !important; font-weight: 600 !important; color: #0f172a !important; margin-bottom: 8px !important; margin-top: 8px !important; }
        .message-content p { font-size: 14px !important; line-height: 1.5 !important; color: #0f172a !important; margin-bottom: 8px !important; }
        .message-content ul, .message-content ol { margin-left: 24px !important; font-size: 14px !important; color: #0f172a !important; margin-bottom: 8px !important; }
        .message-content li { font-size: 14px !important; line-height: 1.5 !important; padding-left: 4px !important; margin-bottom: 4px !important; }
        .message-content code { background: #f1f5f9 !important; padding: 2px 6px !important; border-radius: 4px !important; font-size: 12px !important; font-family: 'Monaco', 'Courier New', monospace !important; }
        .message-content pre { background: #f1f5f9 !important; padding: 12px !important; border-radius: 8px !important; overflow-x: auto !important; font-size: 12px !important; font-family: 'Monaco', 'Courier New', monospace !important; margin: 8px 0 !important; }
        .message-content blockquote { border-left: 4px solid #3b82f6 !important; padding-left: 16px !important; margin: 8px 0 !important; background: #f8fafc !important; padding: 8px 16px !important; border-radius: 0 8px 8px 0 !important; }
        .message-content strong { font-weight: 600 !important; color: #0f172a !important; }
        .message-content a { color: #3b82f6 !important; text-decoration: underline !important; }

        @media print {
          body { margin: 0; padding: 15px; }
          .message-container { box-shadow: none; border: 1px solid #d1d5db; }
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="message-container">
        <div class="message-content">${renderedContent}</div>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')

  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
    }, 500)
  } else {
    alert('Pop-up blocked! Please allow pop-ups for printing functionality.')
  }
}
