import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AudioRecorderCard } from './AudioRecorderCard'
import type { Meeting } from '../../types/meeting'

const meeting: Meeting = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Canlı oda testi',
  organizerId: 'owner-1',
  startsAt: '2026-09-17T10:00:00Z',
  endsAt: null,
  status: 0,
  transcript: null,
  notes: null,
  participants: [],
  summary: null,
}

describe('AudioRecorderCard', () => {
  it('kayıt süresi, ses görselleştirmesi ve toplantı seçimini sunar', () => {
    render(
      <AudioRecorderCard
        meetings={[meeting]}
        selectedMeetingId={meeting.id}
        onMeetingChange={vi.fn()}
        onRecordingStart={vi.fn().mockResolvedValue(undefined)}
        onAudioReady={vi.fn()}
        onSaveNotes={vi.fn()}
        uploading={false}
        starting={false}
        savingNotes={false}
      />,
    )

    expect(screen.getByText('Kayıt süresi')).toBeInTheDocument()
    expect(screen.getByLabelText('Ses frekans görselleştirmesi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kaydı başlat' })).not.toBeDisabled()
  })
})
