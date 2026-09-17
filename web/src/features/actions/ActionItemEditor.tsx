import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import type { ActionItem, ActionPriority } from '../../types/meeting'

type Props = { action: ActionItem | null; open: boolean; saving: boolean; onClose: () => void; onSave: (input: { assignee: string | null; dueAt: string | null; priority: ActionPriority }) => void }

export function ActionItemEditor({ action, open, saving, onClose, onSave }: Props) {
  const [assignee, setAssignee] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState<ActionPriority>('Medium')

  useEffect(() => {
    if (!action) return
    setAssignee(action.assignee ?? '')
    setDueAt(action.dueAt ? action.dueAt.slice(0, 10) : '')
    setPriority(action.priority)
  }, [action])

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Aksiyon bilgilerini düzenle</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Sorumlu" value={assignee} onChange={(event) => setAssignee(event.target.value)} slotProps={{ htmlInput: { maxLength: 160 } }} /><TextField label="Termin tarihi" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField select label="Öncelik" value={priority} onChange={(event) => setPriority(event.target.value as ActionPriority)}><MenuItem value="High">Yüksek</MenuItem><MenuItem value="Medium">Orta</MenuItem><MenuItem value="Low">Düşük</MenuItem></TextField></Stack></DialogContent><DialogActions><Button onClick={onClose}>İptal</Button><Button variant="contained" disabled={saving} onClick={() => onSave({ assignee: assignee.trim() || null, dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null, priority })}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Button></DialogActions></Dialog>
}
