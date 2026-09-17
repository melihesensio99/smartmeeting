using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartMeeting.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MeetingParticipantManagementPermission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CanManageMeeting",
                table: "meeting_participants",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanManageMeeting",
                table: "meeting_participants");
        }
    }
}
