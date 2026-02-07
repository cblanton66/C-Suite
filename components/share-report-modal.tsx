"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Copy, CheckCheck, ExternalLink, X } from 'lucide-react'

interface ShareReportModalProps {
  isOpen: boolean
  onClose: () => void
  shareableUrl: string | null
  reportTitle: string
}

export function ShareReportModal({ isOpen, onClose, shareableUrl, reportTitle }: ShareReportModalProps) {
  const [copied, setCopied] = useState(false)
  const [htmlCopied, setHtmlCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
      setHtmlCopied(false)
    }
  }, [isOpen])

  const copyToClipboard = async () => {
    if (!shareableUrl) return

    try {
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const copyHtmlLink = async () => {
    if (!shareableUrl) return

    try {
      const htmlLink = `<a href="${shareableUrl}">View Your Report</a>`
      await navigator.clipboard.writeText(htmlLink)
      setHtmlCopied(true)
      setTimeout(() => setHtmlCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy HTML: ', err)
    }
  }

  const openInNewTab = () => {
    if (shareableUrl) {
      window.open(shareableUrl, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - slides up from bottom on mobile, centered on desktop */}
      <Card className="relative w-full sm:max-w-md shadow-2xl border-2 border-primary/20 rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ maxHeight: 'min(85vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px))' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2 border-b shrink-0">
          <h3 className="text-lg font-semibold text-foreground">Report Shared Successfully!</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Your report "<span className="font-medium">{reportTitle}</span>" has been saved and is ready to share.
            </p>
          </div>

          {shareableUrl && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Shareable Link:</label>
                <div className="flex gap-2">
                  <Input
                    value={shareableUrl}
                    readOnly
                    className="text-xs"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy URL
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email-Friendly Link:</label>
                <div className="flex gap-2">
                  <Input
                    value={`<a href="${shareableUrl}">View Your Report</a>`}
                    readOnly
                    className="text-xs"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyHtmlLink}
                    className="shrink-0"
                  >
                    {htmlCopied ? (
                      <>
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy HTML
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste this in your email client - it will display as "View Your Report"
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Link is active and ready to share with clients</p>
                <p>• Report includes all charts and formatting</p>
                <p>• View count and analytics are tracked</p>
              </div>
            </>
          )}
        </div>

        {/* Fixed Footer Buttons */}
        {shareableUrl && (
          <div className="flex gap-2 p-4 sm:p-6 pt-4 border-t shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <Button
              variant="outline"
              onClick={openInNewTab}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}