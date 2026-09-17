import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MeetingDetailPage } from './MeetingDetailPage'
import type { Meeting } from '../../types/meeting'

vi.mock('../../lib/api', () => ({ searchUsers: vi.fn().mockResolvedValue([]), getApiErrorMessage: vi.fn(() => 'Hata') }))

function createMeeting(status: number, participants: Meeting['participants'] = []): Meeting {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Durum akışı toplantısı',
    organizerId: 'owner-1',
    startsAt: '2026-09-17T10:00:00Z',
    endsAt: null,
    status,
    transcript: null,
    notes: null,
    participants,
    summary: null,
  }
}

function renderPage(meeting: Meeting, onRetryProcessing = vi.fn(), currentUserId = 'owner-1') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingDetailPage
        meeting={meeting}
        currentUserId={currentUserId}
        canCompleteMeeting={false}
        onComplete={vi.fn()}
        onCompleteMeeting={vi.fn()}
        onUpdateAction={vi.fn()}
        onCreateAction={vi.fn()}
        onSaveNotes={vi.fn()}
        onRecordingStart={vi.fn().mockResolvedValue(undefined)}
        onAudioReady={vi.fn()}
        recordingUploading={false}
        recordingStarting={false}
        completingMeeting={false}
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
    fireEvent.click(screen.getByRole('button', { name: /İşlem durumu/ }))

    expect(screen.getAllByText('İşleniyor')[0]).toBeInTheDocument()
    expect(screen.getByText('Ses dosyası, transkript ve AI özeti hazırlanıyor.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Yeniden işle' })).not.toBeInTheDocument()
  })

  it('failed durumunda yeniden işleme aksiyonunu tetikler', () => {
    const onRetryProcessing = vi.fn()
    renderPage(createMeeting(4), onRetryProcessing)
    fireEvent.click(screen.getByRole('button', { name: /İşlem durumu/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Yeniden işle' }))

    expect(onRetryProcessing).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })

  it('toplantı sahibi katılımcı yönetimi ve konuşmacı onay kontrollerini görür', () => {
    const meeting = createMeeting(3, [{ id: '44444444-4444-4444-4444-444444444444', userId: 'participant-1', displayName: 'Ayşe Katılımcı', email: 'ayse@example.com', canManageMeeting: true, speakerLabel: 'Speaker 1', speakerMappingStatus: 'PendingConfirmation', speakerConfidence: 0.8 }])
    renderPage(meeting)
    fireEvent.click(screen.getByRole('button', { name: /Katılımcı ekle ve yetkiyi düzenle/ }))

    expect(screen.getByRole('button', { name: 'Katılımcı ekle' })).toBeDisabled()
    expect(screen.getByText('Toplantı yöneticisi')).toBeInTheDocument()
    expect(screen.getByText('Onay bekliyor · %80')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Onayla' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reddet' })).toBeInTheDocument()
  })

  it('normal katılımcı toplantıdan ayrılabilir ancak katılımcı yönetemez', () => {
    const meeting = createMeeting(3, [{ id: '44444444-4444-4444-4444-444444444444', userId: 'participant-1', displayName: 'Ayşe Katılımcı', email: 'ayse@example.com', canManageMeeting: false, speakerLabel: null, speakerMappingStatus: 'None', speakerConfidence: null }])
    renderPage(meeting, vi.fn(), 'participant-1')

    expect(screen.getByRole('button', { name: 'Odaya gir' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Katılımcı ekle' })).not.toBeInTheDocument()
  })
})
