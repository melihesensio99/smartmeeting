using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartMeeting.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SpeakerParticipantMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SpeakerLabel",
                table: "meeting_participants",
                type: "TEXT",
                maxLength: 80,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpeakerLabel",
                table: "meeting_participants");
        }
    }
}
