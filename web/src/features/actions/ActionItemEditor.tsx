import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchUsers } from '../../lib/api'
import type { ActionItem, ActionPriority, UserResponse } from '../../types/meeting'

type Props = { action: ActionItem | null; open: boolean; saving: boolean; onClose: () => void; onSave: (input: { assigneeUserId: string | null; dueAt: string | null; priority: ActionPriority }) => void }

export function ActionItemEditor({ action, open, saving, onClose, onSave }: Props) {
  const [assigneeSearch, setAssigneeSearch] = useState(action?.assignee ?? '')
  const [selectedAssignee, setSelectedAssignee] = useState<UserResponse | null>(action?.assigneeUserId ? { userId: action.assigneeUserId, displayName: action.assignee ?? '', email: '' } : null)
  const [dueAt, setDueAt] = useState(action?.dueAt ? action.dueAt.slice(0, 10) : '')
  const [priority, setPriority] = useState<ActionPriority>(action?.priority ?? 'Medium')

  const users = useQuery({ queryKey: ['action-assignees', assigneeSearch], queryFn: () => searchUsers(assigneeSearch), enabled: open && assigneeSearch.trim().length >= 2 })

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Aksiyon bilgilerini düzenle</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Kayıtlı kullanıcı ara" value={assigneeSearch} onChange={(event) => { setAssigneeSearch(event.target.value); setSelectedAssignee(null) }} slotProps={{ htmlInput: { maxLength: 160 } }} />{users.data?.map((user) => <Button key={user.userId} variant={selectedAssignee?.userId === user.userId ? 'contained' : 'outlined'} onClick={() => { setSelectedAssignee(user); setAssigneeSearch(user.displayName) }} sx={{ justifyContent: 'flex-start' }}>{user.displayName} · {user.email}</Button>)}{assigneeSearch && !selectedAssignee && <Typography variant="caption" color="text.secondary">Sorumluyu kaydetmek için sistemde kayıtlı bir kullanıcı seçin.</Typography>}<TextField label="Termin tarihi" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField select label="Öncelik" value={priority} onChange={(event) => setPriority(event.target.value as ActionPriority)}><MenuItem value="High">Yüksek</MenuItem><MenuItem value="Medium">Orta</MenuItem><MenuItem value="Low">Düşük</MenuItem></TextField></Stack></DialogContent><DialogActions><Button onClick={onClose}>İptal</Button><Button variant="contained" disabled={saving || (assigneeSearch.trim().length > 0 && !selectedAssignee)} onClick={() => onSave({ assigneeUserId: selectedAssignee?.userId ?? null, dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null, priority })}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Button></DialogActions></Dialog>
}
