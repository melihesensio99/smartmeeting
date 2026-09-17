import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createMeetingSchema, type CreateMeetingInput } from '../../types/meeting'
type Props = { onSubmit: (input: CreateMeetingInput) => void; loading: boolean }
type PickerTarget = 'startsAt' | 'endsAt'

function formatDateTime(value: string | undefined) {
  if (!value) return 'Seçilmedi'
  const [date, time] = value.split('T')
  if (!date || !time) return value
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year} ${time}`
}

function initialPickerValue(value: string | undefined) {
  const [date = '', time = ''] = value?.split('T') ?? []
  return { date, time: time.slice(0, 5) }
}

export function MeetingForm({ onSubmit, loading }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateMeetingInput>({ resolver: zodResolver(createMeetingSchema) })
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [draftDate, setDraftDate] = useState('')
  const [draftTime, setDraftTime] = useState('')
  const startsAt = watch('startsAt')
  const endsAt = watch('endsAt')
  const openPicker = (target: PickerTarget) => {
    const current = initialPickerValue(target === 'startsAt' ? startsAt : endsAt)
    setDraftDate(current.date)
    setDraftTime(current.time)
    setPickerTarget(target)
  }
  const confirmPicker = () => {
    if (!pickerTarget || !draftDate || !draftTime) return
    setValue(pickerTarget, `${draftDate}T${draftTime}`, { shouldDirty: true, shouldValidate: true })
    setPickerTarget(null)
  }
  const selectedValue = pickerTarget === 'startsAt' ? startsAt : endsAt
  const targetLabel = pickerTarget === 'startsAt' ? 'Başlangıç' : 'Bitiş'
  return <>
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <TextField label="Toplantı adı" {...register('title')} error={Boolean(errors.title)} helperText={errors.title?.message} />
      <input type="hidden" {...register('startsAt')} />
      <Stack spacing={0.75}><Button variant="outlined" onClick={() => openPicker('startsAt')} sx={{ justifyContent: 'space-between', textTransform: 'none', minHeight: 56 }}><span>Başlangıç zamanı</span><strong>{formatDateTime(startsAt)}</strong></Button>{errors.startsAt && <Typography variant="caption" color="error">{errors.startsAt.message}</Typography>}</Stack>
      <input type="hidden" {...register('endsAt')} />
      <Stack spacing={0.75}><Button variant="outlined" onClick={() => openPicker('endsAt')} sx={{ justifyContent: 'space-between', textTransform: 'none', minHeight: 56 }}><span>Bitiş zamanı (isteğe bağlı)</span><strong>{formatDateTime(endsAt)}</strong></Button>{endsAt && <Button size="small" onClick={() => setValue('endsAt', '', { shouldDirty: true })} sx={{ alignSelf: 'flex-start' }}>Bitiş zamanını kaldır</Button>}</Stack>
      <Button type="submit" variant="contained" disabled={loading}>Toplantı oluştur</Button>
    </Stack>
    <Dialog open={pickerTarget !== null} onClose={() => setPickerTarget(null)} fullWidth maxWidth="xs"><DialogTitle>{targetLabel} zamanı seç</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Tarih" type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth /><TextField label="Saat" type="time" value={draftTime} onChange={(event) => setDraftTime(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth /><Typography variant="body2" color="text.secondary">Seçimini tamamladıktan sonra “Tamam” butonuna bas. Dışarı tıklamak seçimi kaydetmez.</Typography>{selectedValue && <Typography variant="caption" color="text.secondary">Mevcut seçim: {formatDateTime(selectedValue)}</Typography>}</Stack></DialogContent><DialogActions><Button onClick={() => setPickerTarget(null)}>İptal</Button><Button variant="contained" onClick={confirmPicker} disabled={!draftDate || !draftTime}>Tamam</Button></DialogActions></Dialog>
  </>
}
