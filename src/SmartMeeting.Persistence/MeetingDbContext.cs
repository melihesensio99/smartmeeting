using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Persistence;

public sealed class MeetingDbContext(DbContextOptions<MeetingDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<Meeting> MeetingSet => Set<Meeting>();

    public void AddMeeting(Meeting meeting) => MeetingSet.Add(meeting);

    public async Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken)
    {
        var query = MeetingSet.AsNoTracking().Include(x => x.Participants).AsQueryable();
        if (!string.IsNullOrWhiteSpace(organizerId)) query = query.Where(x => x.OrganizerId == organizerId);
        var meetings = await query.ToListAsync(cancellationToken);
        return meetings.OrderByDescending(x => x.StartsAt).ToList();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.ToTable("meetings");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.OrganizerId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Transcript).HasColumnType("TEXT");
            entity.Property(x => x.Summary).HasConversion(new ValueConverter<MeetingSummary?, string?>(
                value => value == null ? null : JsonSerializer.Serialize(value, JsonOptions),
                value => value == null ? null : JsonSerializer.Deserialize<MeetingSummary>(value, JsonOptions)));
            entity.Ignore(x => x.DomainEvents);
            entity.HasMany(x => x.Participants).WithOne().HasForeignKey(x => x.MeetingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MeetingParticipant>(entity =>
        {
            entity.ToTable("meeting_participants");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.MeetingId, x.UserId }).IsUnique();
            entity.Property(x => x.UserId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(320).IsRequired();
            entity.Property(x => x.DisplayName).HasMaxLength(160).IsRequired();
            entity.Ignore(x => x.DomainEvents);
        });
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}
