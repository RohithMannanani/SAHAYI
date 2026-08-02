using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sahayi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountBalanceToAyalkoottamUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AccountBalance",
                table: "AyalkoottamUnits",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccountBalance",
                table: "AyalkoottamUnits");
        }
    }
}
