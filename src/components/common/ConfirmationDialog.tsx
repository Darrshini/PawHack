import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmationDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Delete', loading = false,
}: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="420px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
        <div style={{
          flexShrink: 0, width: 40, height: 40,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-danger-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-danger)',
        }}>
          <AlertTriangle size={20} />
        </div>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </Modal>
  )
}
