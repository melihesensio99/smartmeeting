using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Domain.Meetings;
using SmartMeeting.Persistence.Identity;
using SmartMeeting.Persistence.Serialization;

namespace SmartMeeting.Persistence;

public sealed class MeetingDbContext(DbContextOptions<MeetingDbContext> options) : IdentityDbContext<ApplicationUser>(options), IApplicationDbContext
{
    public DbSet<Meeting> MeetingSet => Set<Meeting>();

    public void AddMeeting(Meeting meeting) => MeetingSet.Add(meeting);

    public Task<Meeting?> GetMeetingAsync(Guid meetingId, CancellationToken cancellationToken)
        => MeetingSet.Include(x => x.Participants).SingleOrDefaultAsync(x => x.Id == meetingId, cancellationToken);

    public async Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken)
    {
        var query = MeetingSet.AsNoTracking().Include(x => x.Participants).AsQueryable();
        if (!string.IsNullOrWhiteSpace(organizerId)) query = query.Where(x => x.OrganizerId == organizerId);
        var meetings = await query.ToListAsync(cancellationToken);
        return meetings.OrderByDescending(x => x.StartsAt).ToList();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.ToTable("meetings");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.OrganizerId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Transcript).HasColumnType("TEXT");
            entity.Property(x => x.Notes).HasColumnType("TEXT");
            entity.Property(x => x.Summary).HasConversion(new ValueConverter<MeetingSummary?, string?>(value => SerializeSummary(value), value => DeserializeSummary(value)));
            entity.Ignore(x => x.DomainEvents);
            entity.HasMany(x => x.Participants).WithOne().HasForeignKey(x => x.MeetingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MeetingParticipant>(entity =>
        {
            entity.ToTable("meeting_participants");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).ValueGeneratedNever();
            entity.HasIndex(x => new { x.MeetingId, x.UserId }).IsUnique();
            entity.Property(x => x.UserId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(320).IsRequired();
            entity.Property(x => x.DisplayName).HasMaxLength(160).IsRequired();
            entity.Property(x => x.SpeakerLabel).HasMaxLength(80);
            entity.Ignore(x => x.DomainEvents);
        });

        modelBuilder.Entity<ApplicationUser>(entity => entity.Property(x => x.DisplayName).HasMaxLength(160));
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static string? SerializeSummary(MeetingSummary? summary)
        => summary is null ? null : JsonSerializer.Serialize(new SummaryData(summary.Overview, summary.Decisions, summary.ActionItems.Select(x => new ActionData(x.Id, x.Description, x.Assignee, x.AssigneeUserId, x.DueAt, x.Priority, x.Completed)).ToList()), JsonOptions);

    private static MeetingSummary? DeserializeSummary(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        var data = JsonSerializer.Deserialize<SummaryData>(json, JsonOptions) ?? throw new InvalidOperationException("Toplantı özeti okunamadı.");
        var actionItems = data.ActionItems.ToList();
        var items = actionItems.Select(x => new ActionItem(x.Description, x.Assignee, x.DueAt, x.Id == Guid.Empty ? Guid.NewGuid() : x.Id, x.Priority ?? ActionPriority.Medium, x.AssigneeUserId)).ToList();
        foreach (var pair in items.Zip(actionItems)) if (pair.Second.Completed) pair.First.Complete();
        return MeetingSummary.Create(data.Overview, data.Decisions, items);
    }

}
