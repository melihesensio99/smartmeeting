using Microsoft.EntityFrameworkCore;
using System.Data;

namespace SmartMeeting.Persistence.Identity;

public static class IdentitySchemaRepair
{
    public static async Task ApplyAsync(MeetingDbContext db, CancellationToken cancellationToken = default)
    {
        var statements = new[]
        {
            "CREATE TABLE IF NOT EXISTS AspNetRoles (Id TEXT NOT NULL CONSTRAINT PK_AspNetRoles PRIMARY KEY, Name TEXT NULL, NormalizedName TEXT NULL, ConcurrencyStamp TEXT NULL)",
            "CREATE TABLE IF NOT EXISTS AspNetUsers (Id TEXT NOT NULL CONSTRAINT PK_AspNetUsers PRIMARY KEY, DisplayName TEXT NOT NULL, UserName TEXT NULL, NormalizedUserName TEXT NULL, Email TEXT NULL, NormalizedEmail TEXT NULL, EmailConfirmed INTEGER NOT NULL, PasswordHash TEXT NULL, SecurityStamp TEXT NULL, ConcurrencyStamp TEXT NULL, PhoneNumber TEXT NULL, PhoneNumberConfirmed INTEGER NOT NULL, TwoFactorEnabled INTEGER NOT NULL, LockoutEnd TEXT NULL, LockoutEnabled INTEGER NOT NULL, AccessFailedCount INTEGER NOT NULL)",
            "CREATE TABLE IF NOT EXISTS AspNetRoleClaims (Id INTEGER NOT NULL CONSTRAINT PK_AspNetRoleClaims PRIMARY KEY AUTOINCREMENT, RoleId TEXT NOT NULL, ClaimType TEXT NULL, ClaimValue TEXT NULL, CONSTRAINT FK_AspNetRoleClaims_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id) ON DELETE CASCADE)",
            "CREATE TABLE IF NOT EXISTS AspNetUserClaims (Id INTEGER NOT NULL CONSTRAINT PK_AspNetUserClaims PRIMARY KEY AUTOINCREMENT, UserId TEXT NOT NULL, ClaimType TEXT NULL, ClaimValue TEXT NULL, CONSTRAINT FK_AspNetUserClaims_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE)",
            "CREATE TABLE IF NOT EXISTS AspNetUserLogins (LoginProvider TEXT NOT NULL, ProviderKey TEXT NOT NULL, ProviderDisplayName TEXT NULL, UserId TEXT NOT NULL, CONSTRAINT PK_AspNetUserLogins PRIMARY KEY (LoginProvider, ProviderKey), CONSTRAINT FK_AspNetUserLogins_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE)",
            "CREATE TABLE IF NOT EXISTS AspNetUserRoles (UserId TEXT NOT NULL, RoleId TEXT NOT NULL, CONSTRAINT PK_AspNetUserRoles PRIMARY KEY (UserId, RoleId), CONSTRAINT FK_AspNetUserRoles_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE, CONSTRAINT FK_AspNetUserRoles_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id) ON DELETE CASCADE)",
            "CREATE TABLE IF NOT EXISTS AspNetUserTokens (UserId TEXT NOT NULL, LoginProvider TEXT NOT NULL, Name TEXT NOT NULL, Value TEXT NULL, CONSTRAINT PK_AspNetUserTokens PRIMARY KEY (UserId, LoginProvider, Name), CONSTRAINT FK_AspNetUserTokens_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE)",
            "CREATE UNIQUE INDEX IF NOT EXISTS UserNameIndex ON AspNetUsers (NormalizedUserName)",
            "CREATE INDEX IF NOT EXISTS EmailIndex ON AspNetUsers (NormalizedEmail)",
            "CREATE UNIQUE INDEX IF NOT EXISTS RoleNameIndex ON AspNetRoles (NormalizedName)",
            "CREATE INDEX IF NOT EXISTS IX_AspNetRoleClaims_RoleId ON AspNetRoleClaims (RoleId)",
            "CREATE INDEX IF NOT EXISTS IX_AspNetUserClaims_UserId ON AspNetUserClaims (UserId)",
            "CREATE INDEX IF NOT EXISTS IX_AspNetUserLogins_UserId ON AspNetUserLogins (UserId)",
            "CREATE INDEX IF NOT EXISTS IX_AspNetUserRoles_RoleId ON AspNetUserRoles (RoleId)"
        };

        foreach (var statement in statements)
            await db.Database.ExecuteSqlRawAsync(statement, cancellationToken);

        await EnsureColumnsAsync(db, "meetings", new Dictionary<string, string>
        {
            ["AudioFilePath"] = "TEXT NULL",
            ["Transcript"] = "TEXT NULL",
            ["Notes"] = "TEXT NULL",
            ["Summary"] = "TEXT NULL",
            ["CreatedAt"] = "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
            ["UpdatedAt"] = "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"
        }, cancellationToken);
        await EnsureColumnsAsync(db, "meeting_participants", new Dictionary<string, string>
        {
            ["CreatedAt"] = "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
            ["UpdatedAt"] = "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
            ["CanManageMeeting"] = "INTEGER NOT NULL DEFAULT 0",
            ["SpeakerLabel"] = "TEXT NULL"
        }, cancellationToken);
    }

    private static async Task EnsureColumnsAsync(MeetingDbContext db, string tableName, IReadOnlyDictionary<string, string> columns, CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose) await connection.OpenAsync(cancellationToken);
        try
        {
            var existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            await using (var command = connection.CreateCommand())
            {
                command.CommandText = $"PRAGMA table_info(\"{tableName}\")";
                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                    existingColumns.Add(reader.GetString(1));
            }

            foreach (var column in columns.Where(column => !existingColumns.Contains(column.Key)))
            {
                await using var command = connection.CreateCommand();
                command.CommandText = $"ALTER TABLE \"{tableName}\" ADD COLUMN \"{column.Key}\" {column.Value}";
                await command.ExecuteNonQueryAsync(cancellationToken);
            }
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }
}
