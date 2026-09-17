import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('../lib/api', () => ({ logout: vi.fn().mockResolvedValue(undefined) }))

describe('AppShell', () => {
  it('global manager için tüm toplantı ve aksiyon menülerini gösterir', () => {
    render(
      <AppShell
        route="dashboard"
        currentUser={{ userId: 'manager-1', email: 'manager@example.com', displayName: 'Ana Yönetici', isGlobalManager: true, canCreateMeetings: true }}
      >
        <div>Dashboard içeriği</div>
      </AppShell>,
    )

    expect(screen.getByText('Global Manager')).toBeInTheDocument()
    expect(screen.getByText('Tüm Toplantılar')).toBeInTheDocument()
    expect(screen.getByText('Tüm Aksiyonlar')).toBeInTheDocument()
    expect(screen.getByText('Ana Yönetici')).toBeInTheDocument()
  })

  it('normal kullanıcı için kişisel menü adlarını korur', () => {
    render(
      <AppShell
        route="dashboard"
        currentUser={{ userId: 'user-1', email: 'user@example.com', displayName: 'Standart Kullanıcı', isGlobalManager: false, canCreateMeetings: false }}
      >
        <div>Dashboard içeriği</div>
      </AppShell>,
    )

    expect(screen.queryByText('Global Manager')).not.toBeInTheDocument()
    expect(screen.getByText('Toplantılar')).toBeInTheDocument()
    expect(screen.getByText('Aksiyonlarım')).toBeInTheDocument()
    expect(screen.queryByText('Tüm Toplantılar')).not.toBeInTheDocument()
  })
})
