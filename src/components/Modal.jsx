import React, { useState } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden animate-[slideUp_200ms_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          </div>
        )}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export function ConfirmModal({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-text-secondary text-sm mb-5">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-md border border-border text-text-secondary text-sm font-medium hover:bg-border/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium text-white transition-colors ${
            danger ? 'bg-danger hover:bg-red-600' : 'bg-primary hover:bg-primary-hover'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export function NoteModal({ isOpen, onSave, onClose, initialValue = '' }) {
  const [note, setNote] = useState(initialValue)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a Note">
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Hotel gym was rough... or 'Felt great after travel day'"
        className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none h-24 focus:outline-none focus:border-primary"
        autoFocus
      />
      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-md border border-border text-text-secondary text-sm font-medium hover:bg-border/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => { onSave(note); setNote('') }}
          className="flex-1 px-4 py-2.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          Save Note
        </button>
      </div>
    </Modal>
  )
}
