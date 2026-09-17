import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MeetingDetailPage } from './MeetingDetailPage'
import type { Meeting } from '../../types/meeting'

vi.mock('../../lib/api', () => ({ searchUsers: vi.fn().mockResolvedValue([]), getApiErrorMessage: vi.fn(() => 'Hata') }))

function createMeeting(status: number): Meeting {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Durum akışı toplantısı',
    organizerId: 'owner-1',
    startsAt: '2026-09-17T10:00:00Z',
    endsAt: null,
    status,
    transcript: null,
    notes: null,
    participants: [],
    summary: null,
  }
}

function renderPage(meeting: Meeting, onRetryProcessing = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingDetailPage
        meeting={meeting}
        currentUserId="owner-1"
        onComplete={vi.fn()}
        onUpdateAction={vi.fn()}
        onCreateAction={vi.fn()}
        onSaveNotes={vi.fn()}
        onMapSpeaker={vi.fn()}
        onConfirmSpeaker={vi.fn()}
        onRejectSpeaker={vi.fn()}
        onAddParticipant={vi.fn()}
        onUpdateParticipantPermission={vi.fn()}
        onRemoveParticipant={vi.fn()}
        onLeaveMeeting={vi.fn()}
        onSendEmail={vi.fn()}
        onRetryProcessing={onRetryProcessing}
        savingNotes={false}
        addingParticipant={false}
        updatingParticipantPermission={false}
        removingParticipant={false}
        leavingMeeting={false}
        confirmingSpeaker={false}
        rejectingSpeaker={false}
        sendingEmail={false}
        updatingAction={false}
        creatingAction={false}
        retryingProcessing={false}
        emailSent={false}
        emailError={null}
      />
    </QueryClientProvider>,
  )
}

describe('MeetingDetailPage işlem durumu', () => {
  it('processing durumunu ilerleme mesajıyla gösterir', () => {
    renderPage(createMeeting(2))

    expect(screen.getByText('İşleniyor')).toBeInTheDocument()
    expect(screen.getByText('Ses dosyası, transkript ve AI özeti hazırlanıyor.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Yeniden işle' })).not.toBeInTheDocument()
  })

  it('failed durumunda yeniden işleme aksiyonunu tetikler', () => {
    const onRetryProcessing = vi.fn()
    renderPage(createMeeting(4), onRetryProcessing)

    fireEvent.click(screen.getByRole('button', { name: 'Yeniden işle' }))

    expect(onRetryProcessing).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })
})
