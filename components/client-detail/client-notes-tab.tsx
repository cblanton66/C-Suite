"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Edit, Copy, Archive, X, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Client } from "@/types/client"

interface ClientNotesTabProps {
  client: Client
  userEmail: string
  workspaceOwner: string
}

export function ClientNotesTab({
  client,
  userEmail,
  workspaceOwner
}: ClientNotesTabProps) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchivedNotes, setShowArchivedNotes] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [noteContent, setNoteContent] = useState('')
  const [loadingNote, setLoadingNote] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [editedNoteContent, setEditedNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [archivingNote, setArchivingNote] = useState(false)
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [savingNewNote, setSavingNewNote] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<any>(null)
  const [deletingNote, setDeletingNote] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const clientSlug = client.clientName.toLowerCase().replace(/\s+/g, '-')
      const clientOwner = client.workspaceOwner || workspaceOwner
      console.log('[ClientNotesTab] Fetching notes for client slug:', clientSlug, 'owner:', clientOwner)
      const response = await fetch(
        `/api/list-files?userEmail=${encodeURIComponent(userEmail)}&workspaceOwner=${encodeURIComponent(clientOwner)}&folder=client-files/${clientSlug}/notes`
      )
      const data = await response.json()
      console.log('[ClientNotesTab] Notes response:', data)
      console.log('[ClientNotesTab] Notes files:', data.files)
      setNotes(data.files || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNote = async (note: any) => {
    setSelectedNote(note)
    setLoadingNote(true)
    try {
      const response = await fetch(
        `/api/get-file-content?filePath=${encodeURIComponent(note.name)}`
      )
      if (response.ok) {
        const data = await response.json()
        setNoteContent(data.content || '')
      } else {
        setNoteContent('Failed to load note content')
      }
    } catch (error) {
      console.error('Error loading note:', error)
      setNoteContent('Failed to load note content')
    } finally {
      setLoadingNote(false)
    }
  }

  const handleCopyNote = () => {
    navigator.clipboard.writeText(noteContent)
    toast.success('Note content copied to clipboard!')
  }

  const handleCloseNote = () => {
    setSelectedNote(null)
    setNoteContent('')
    setIsEditingNote(false)
    setEditedNoteContent('')
  }

  const handleEditNote = () => {
    setEditedNoteContent(noteContent)
    setIsEditingNote(true)
  }

  const handleCancelEditNote = () => {
    setIsEditingNote(false)
    setEditedNoteContent('')
  }

  const handleSaveNote = async () => {
    if (!selectedNote) return

    setSavingNote(true)
    try {
      const response = await fetch('/api/save-private-note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedNote.name,
          content: editedNoteContent,
          userEmail,
          workspaceOwner
        })
      })

      if (response.ok) {
        setNoteContent(editedNoteContent)
        setIsEditingNote(false)
        toast.success('Note updated successfully!')
      } else {
        toast.error('Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleArchiveNote = async () => {
    if (!selectedNote) return

    setArchivingNote(true)
    try {
      const fileName = selectedNote.name.split('/').pop()
      const folderPath = selectedNote.name.substring(0, selectedNote.name.lastIndexOf('/'))
      const newFileName = fileName?.startsWith('[ARCHIVED]') ? fileName : `[ARCHIVED] ${fileName}`
      const newFilePath = `${folderPath}/${newFileName}`

      const response = await fetch('/api/rename-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath: selectedNote.name,
          newPath: newFilePath
        })
      })

      if (response.ok) {
        toast.success('Note archived successfully!')
        handleCloseNote()
        fetchNotes()
      } else {
        toast.error('Failed to archive note')
      }
    } catch (error) {
      console.error('Error archiving note:', error)
      toast.error('Failed to archive note')
    } finally {
      setArchivingNote(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!noteToDelete) return

    setDeletingNote(true)
    try {
      const response = await fetch('/api/delete-file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: noteToDelete.name
        })
      })

      if (response.ok) {
        toast.success('Note deleted successfully!')
        setShowDeleteConfirm(false)
        setNoteToDelete(null)

        // Close note viewer if the deleted note was open
        if (selectedNote?.name === noteToDelete.name) {
          handleCloseNote()
        }

        fetchNotes()
      } else {
        toast.error('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    } finally {
      setDeletingNote(false)
    }
  }

  const handleCreateNewNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error('Note content cannot be empty')
      return
    }

    setSavingNewNote(true)
    try {
      const response = await fetch('/api/save-private-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          workspaceOwner: client.workspaceOwner || workspaceOwner,
          clientName: client.clientName,
          content: newNoteContent,
          title: newNoteTitle.trim() || `Note - ${new Date().toLocaleDateString()}`
        })
      })

      if (response.ok) {
        toast.success('Note created successfully!')
        setShowNewNoteModal(false)
        setNewNoteContent('')
        setNewNoteTitle('')
        fetchNotes()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create note')
      }
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error('Failed to create note')
    } finally {
      setSavingNewNote(false)
    }
  }

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
    const phoneRegex = /(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/g

    const combinedRegex = new RegExp(
      `${urlRegex.source}|${emailRegex.source}|${phoneRegex.source}`,
      'g'
    )

    const parts = text.split(combinedRegex).filter(Boolean)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      if (part.match(emailRegex)) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      if (part.match(phoneRegex)) {
        const cleanPhone = part.replace(/[^\d+]/g, '')
        return (
          <a
            key={index}
            href={`tel:${cleanPhone}`}
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  const filteredNotes = notes.filter((note: any) => {
    if (note.name?.endsWith('.placeholder')) return false
    const fileName = note.name?.split('/').pop() || ''
    if (!showArchivedNotes && fileName.startsWith('[ARCHIVED]')) return false
    return true
  })

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {showArchivedNotes ? 'All Notes' : 'Active Notes'} ({filteredNotes.length})
          </h3>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowNewNoteModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchivedNotes(!showArchivedNotes)}
            >
              {showArchivedNotes ? 'Hide Archive' : 'Show Archive'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-800/30 rounded-lg animate-pulse">
                <div className="h-5 bg-gray-700 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notes found for this client</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((note: any, index: number) => {
              const fileName = note.name?.split('/').pop() || ''
              const isArchived = fileName.startsWith('[ARCHIVED]')
              const noteTitle = note.title || fileName || 'Untitled Note'
              const noteDate = note.uploadedAt ? new Date(note.uploadedAt).toLocaleDateString() : ''

              return (
                <div
                  key={note.name || index}
                  className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => handleOpenNote(note)}>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{noteTitle}</h4>
                        {isArchived && (
                          <span className="px-2 py-0.5 bg-orange-600 text-white rounded text-xs">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{noteDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-500" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNoteToDelete(note)
                          setShowDeleteConfirm(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Note Viewer Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedNote.title || 'Note'}</h2>
              <div className="flex items-center gap-2">
                {isEditingNote ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={savingNote}
                    >
                      {savingNote ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditNote}
                      disabled={savingNote}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEditNote}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyNote}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveNote}
                      disabled={archivingNote}
                      className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {archivingNote ? 'Archiving...' : 'Archive'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNoteToDelete(selectedNote)
                        setShowDeleteConfirm(true)
                      }}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleCloseNote}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingNote ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isEditingNote ? (
                <Textarea
                  value={editedNoteContent}
                  onChange={(e) => setEditedNoteContent(e.target.value)}
                  className="w-full h-full min-h-[400px] font-mono text-sm resize-none"
                  placeholder="Enter note content..."
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {renderTextWithLinks(noteContent)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Note for {client.clientName}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewNoteModal(false)
                  setNewNoteContent('')
                  setNewNoteTitle('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Note Title</label>
                <Input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title (optional)"
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Note Content</label>
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full min-h-[350px] font-mono text-sm resize-none"
                  placeholder="Enter your note content here..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewNoteModal(false)
                  setNewNoteContent('')
                  setNewNoteTitle('')
                }}
                disabled={savingNewNote}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNewNote}
                disabled={savingNewNote || !newNoteContent.trim()}
              >
                {savingNewNote ? 'Creating...' : 'Create Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-500">
              <Trash2 className="w-6 h-6" />
              Delete Note
            </h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to permanently delete this note? This action cannot be undone.
            </p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded p-3 mb-6">
              <p className="text-sm font-medium">{noteToDelete.title || noteToDelete.name?.split('/').pop() || 'Untitled Note'}</p>
              {noteToDelete.uploadedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(noteToDelete.uploadedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setNoteToDelete(null)
                }}
                disabled={deletingNote}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteNote}
                disabled={deletingNote}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingNote ? 'Deleting...' : 'Delete Note'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
