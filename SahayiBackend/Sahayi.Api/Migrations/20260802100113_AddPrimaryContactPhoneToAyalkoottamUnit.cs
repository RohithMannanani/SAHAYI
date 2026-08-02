using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sahayi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPrimaryContactPhoneToAyalkoottamUnit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PrimaryContactPhone",
                table: "AyalkoottamUnits",
                type: "varchar(15)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PrimaryContactPhone",
                table: "AyalkoottamUnits");
        }
    }
}
