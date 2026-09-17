import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionItemEditor } from './ActionItemEditor'

vi.mock('../../lib/api', () => ({ searchUsers: vi.fn().mockResolvedValue([]) }))

describe('ActionItemEditor', () => {
  it('manuel aksiyon açıklaması boşken kaydetmeyi engeller ve geçerli veriyi gönderir', () => {
    const onSave = vi.fn()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <ActionItemEditor action={null} open saving={false} includeDescription onClose={vi.fn()} onSave={onSave} />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: 'Görev / aksiyon açıklaması' }), { target: { value: 'Yeni aksiyon' } })
    fireEvent.change(screen.getByLabelText('Termin tarihi'), { target: { value: '2026-09-25' } })

    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }))

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ description: 'Yeni aksiyon', priority: 'Medium' })
    expect(onSave.mock.calls[0]?.[0].dueAt).toContain('2026-09-25')
  })
})
