import { Alert, Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import { navigate } from '../../app/navigation'
import type { Meeting } from '../../types/meeting'

const statusLabels: Record<string, string> = { '0': 'Planlandı', '1': 'Kayıt alınıyor', '2': 'İşleniyor', '3': 'Hazır', '4': 'Başarısız', '5': 'İptal', '6': 'Tamamlandı', Scheduled: 'Planlandı', Recording: 'Kayıt alınıyor', Processing: 'İşleniyor', Ready: 'Hazır', Failed: 'Başarısız', Cancelled: 'İptal', Completed: 'Tamamlandı' }
const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = { '0': 'default', '1': 'warning', '2': 'info', '3': 'success', '4': 'error', '5': 'default', '6': 'success', Completed: 'success' }
function statusOf(meeting: Meeting): string { return String(meeting.status) }

export function DashboardPage({ meetings, canCreateMeetings }: { meetings: Meeting[]; canCreateMeetings: boolean }) {
  const today = new Date().toDateString()
  const todayMeetings = meetings.filter((meeting) => new Date(meeting.startsAt).toDateString() === today)
  const visibleMeetings = [...meetings].sort((first, second) => new Date(second.startsAt).getTime() - new Date(first.startsAt).getTime())
  const completedSummaries = meetings.filter((meeting) => meeting.summary !== null).length
  const openActions = meetings.reduce((total, meeting) => total + (meeting.summary?.actionItems.filter((action) => !action.completed).length ?? 0), 0)
  
  return (
    <Stack spacing={4}>
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        sx={{ 
          justifyContent: 'space-between', 
          gap: 2, 
          p: 5, 
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%), linear-gradient(120deg, #241640 0%, #3B246B 62%, #6D52A5 100%)', 
          color: 'white', 
          borderRadius: 4, 
          position: 'relative', 
          overflow: 'hidden', 
          '&::after': { 
            content: '""', 
            position: 'absolute', 
            width: 240, 
            height: 240, 
            borderRadius: '50%', 
            right: -70, 
            top: -110, 
            bgcolor: 'rgba(255, 107, 107, 0.22)' 
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            left: -100,
            bottom: -150,
            bgcolor: 'rgba(79, 140, 255, 0.15)'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{ color: 'secondary.light', fontWeight: 800, letterSpacing: 2, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            MEETING WORKSPACE
          </Typography>
          <Typography variant="h4" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Toplantılarınızı netleştirin 👋
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.74)', textShadow: '0 1px 2px rgba(0,0,0,0.2)', mt: 1 }}>
            {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full' }).format(new Date())} — Takvim, AI özetleri ve aksiyonlar tek yerde
          </Typography>
        </Box>
        {canCreateMeetings && (
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => navigate('/meetings')} 
            sx={{ position: 'relative', zIndex: 1, alignSelf: { xs: 'flex-start', md: 'center' }, borderRadius: '12px' }}
          >
            ＋ Yeni toplantı başlat
          </Button>
        )}
      </Stack>
      
      <Grid container spacing={2}>
        {[
          ['📊 Toplam Toplantı', meetings.length, '#3B246B', '#6D52A5', 'primary.main'], 
          ['📆 Bugünkü Program', todayMeetings.length, '#FF6B6B', '#ff9999', 'secondary.main'], 
          ['🤖 Tamamlanan AI Özetler', completedSummaries, '#2e7d32', '#4caf50', 'success.main'], 
          ['⚡ Açık Görevler / Aksiyonlar', openActions, '#ed6c02', '#ff9800', 'warning.main']
        ].map(([label, value, grad1, grad2, textColor]) => (
          <Grid key={String(label)} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                borderTop: '5px solid', 
                borderImage: `linear-gradient(90deg, ${grad1}, ${grad2}) 1`,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 3,
                }
              }}
            >
              <CardContent>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
                <Typography variant="h3" sx={{ color: textColor, fontVariantNumeric: 'tabular-nums', mt: 1 }}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">📅 Toplantılarım & Akış</Typography>
                <Chip label={`${visibleMeetings.length} toplantı`} variant="outlined" />
              </Stack>
              {visibleMeetings.length ? (
                <Stack spacing={2}>
                  {visibleMeetings.map((meeting) => (
                    <Card 
                      key={meeting.id} 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderLeft: '4px solid', 
                        borderImage: 'linear-gradient(to bottom, #FF6B6B, #ff9999) 1',
                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 107, 0.04)',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: 'text.secondary' }} variant="body2">
                          {new Date(meeting.startsAt).toLocaleDateString('tr-TR')} · {new Date(meeting.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} {meeting.endsAt ? `- ${new Date(meeting.endsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/meetings/${meeting.id}`)}
                          sx={{ borderRadius: '12px' }}
                        >
                          İncele & Not Al →
                        </Button>
                      </Stack>
                      <Typography variant="h6" sx={{ mb: 1 }}>{meeting.title}</Typography>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography color="text.secondary" variant="body2">
                          Düzenleyen: {meeting.organizerEmail ?? meeting.organizerId}
                        </Typography>
                        <Chip size="small" label={statusLabels[statusOf(meeting)] ?? statusOf(meeting)} color={statusColors[statusOf(meeting)] ?? 'default'} />
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">Henüz dahil olduğunuz bir toplantı bulunmuyor.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
          <Card 
            sx={{ 
              height: '100%', 
              borderTop: '5px solid', 
              borderImage: 'linear-gradient(to right, #FF6B6B, #3B246B) 1' 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5">🤖 Son AI Toplantı Özeti</Typography>
              {meetings.find((meeting) => meeting.summary)?.summary ? (
                <>
                  <Typography variant="h6" sx={{ mt: 3 }}>
                    {meetings.find((meeting) => meeting.summary)?.title}
                  </Typography>
                  <Typography 
                    sx={{ 
                      mt: 2, 
                      p: 2.5, 
                      bgcolor: 'grey.50', 
                      borderRadius: 2, 
                      fontStyle: 'italic',
                      borderLeft: '4px solid',
                      borderColor: 'primary.main',
                      color: 'text.secondary',
                      lineHeight: 1.6
                    }}
                  >
                    "{meetings.find((meeting) => meeting.summary)?.summary?.overview}"
                  </Typography>
                  <Button 
                    fullWidth 
                    sx={{ mt: 3, borderRadius: '12px' }} 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate(`/meetings/${meetings.find((meeting) => meeting.summary)?.id}`)}
                  >
                    Toplantıyı İncele
                  </Button>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>Henüz AI özeti bulunmuyor.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
