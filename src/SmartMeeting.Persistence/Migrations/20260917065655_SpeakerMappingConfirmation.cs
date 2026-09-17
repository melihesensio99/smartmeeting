using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartMeeting.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SpeakerMappingConfirmation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "SpeakerConfidence",
                table: "meeting_participants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpeakerMappingStatus",
                table: "meeting_participants",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "None");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpeakerConfidence",
                table: "meeting_participants");

            migrationBuilder.DropColumn(
                name: "SpeakerMappingStatus",
                table: "meeting_participants");
        }
    }
}
