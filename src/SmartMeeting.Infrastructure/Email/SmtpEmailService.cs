using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Infrastructure.Email;

public sealed class SmtpEmailService(IOptions<EmailOptions> options) : IEmailService
{
    public async Task SendMeetingSummaryAsync(Meeting meeting, CancellationToken cancellationToken)
    {
        var configuration = options.Value;
        var recipients = meeting.Participants.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (!configuration.Enabled || string.IsNullOrWhiteSpace(configuration.Host) || string.IsNullOrWhiteSpace(configuration.FromAddress)) throw new InvalidOperationException("E-posta servisi yapılandırılmamış.");
        if (recipients.Count == 0) throw new InvalidOperationException("Toplantının e-posta alıcısı bulunmuyor.");
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(configuration.FromName, configuration.FromAddress));
        foreach (var recipient in recipients) message.To.Add(MailboxAddress.Parse(recipient));
        message.Subject = $"Toplantı özeti: {meeting.Title}";
        message.Body = new TextPart("plain") { Text = BuildBody(meeting) };
        using var client = new SmtpClient();
        await client.ConnectAsync(configuration.Host, configuration.Port, configuration.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto, cancellationToken);
        if (!string.IsNullOrWhiteSpace(configuration.Username)) await client.AuthenticateAsync(configuration.Username, configuration.Password, cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    private static string BuildBody(Meeting meeting)
    {
        var summary = meeting.Summary!;
        var decisions = string.Join(Environment.NewLine, summary.Decisions.Select(x => $"- {x}"));
        var actions = string.Join(Environment.NewLine, summary.ActionItems.Select(x => $"- {x.Description} ({x.Assignee ?? "Atanmamış"})"));
        return $"{meeting.Title}{Environment.NewLine}{Environment.NewLine}Özet:{Environment.NewLine}{summary.Overview}{Environment.NewLine}{Environment.NewLine}Kararlar:{Environment.NewLine}{decisions}{Environment.NewLine}{Environment.NewLine}Aksiyonlar:{Environment.NewLine}{actions}";
    }
}
