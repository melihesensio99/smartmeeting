import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionsPage } from './ActionsPage'
import type { Meeting } from '../../types/meeting'

const meeting: Meeting = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Aksiyon test toplantısı',
  organizerId: 'owner-1',
  startsAt: '2026-09-17T10:00:00Z',
  endsAt: null,
  status: 3,
  transcript: 'transkript',
  notes: null,
  participants: [],
  summary: {
    overview: 'Özet',
    decisions: [],
    actionItems: [
      { id: '22222222-2222-2222-2222-222222222222', description: 'Açık aksiyonu tamamla', assignee: 'Melih', assigneeUserId: 'user-1', dueAt: '2026-09-20T20:59:59Z', priority: 'High', completed: false },
      { id: '33333333-3333-3333-3333-333333333333', description: 'Tamamlanmış aksiyon', assignee: null, assigneeUserId: null, dueAt: null, priority: 'Low', completed: true },
    ],
  },
}

describe('ActionsPage', () => {
  it('aksiyonları öncelik etiketi, termin ve sorumlu bilgisiyle gösterir', () => {
    render(<ActionsPage meetings={[meeting]} onComplete={vi.fn()} />)

    expect(screen.getByText('Açık aksiyonu tamamla')).toBeInTheDocument()
    expect(screen.getByText('Tamamlanmış aksiyon')).toBeInTheDocument()
    expect(screen.getByText('Yüksek')).toBeInTheDocument()
    expect(screen.getByText('Düşük')).toBeInTheDocument()
    expect(screen.getByText(/Sorumlu:.*Melih/)).toBeInTheDocument()
  })

  it('açık ve tamamlanan filtrelerini uygular, checkbox ile aksiyonu tamamlar', () => {
    const onComplete = vi.fn()
    render(<ActionsPage meetings={[meeting]} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: 'Açık' }))
    expect(screen.getByText('Açık aksiyonu tamamla')).toBeInTheDocument()
    expect(screen.queryByText('Tamamlanmış aksiyon')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox'))
    expect(onComplete).toHaveBeenCalledWith(meeting.id, '22222222-2222-2222-2222-222222222222')

    fireEvent.click(screen.getByRole('button', { name: 'Tamamlanan' }))
    expect(screen.getByText('Tamamlanmış aksiyon')).toBeInTheDocument()
    expect(screen.queryByText('Açık aksiyonu tamamla')).not.toBeInTheDocument()
  })
})
