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

  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
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

  const openInNewTab = () => {
    if (shareableUrl) {
      window.open(shareableUrl, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 p-6 shadow-2xl border-2 border-primary/20">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-2 top-2 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Report Shared Successfully!</h3>
        </div>
        
        <div className="space-y-4">
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
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={openInNewTab}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview Report
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Link is active and ready to share with clients</p>
                <p>• Report includes all charts and formatting</p>
                <p>• View count and analytics are tracked</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}