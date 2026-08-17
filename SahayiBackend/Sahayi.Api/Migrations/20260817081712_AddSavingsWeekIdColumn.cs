using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sahayi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSavingsWeekIdColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SavingsWeekId",
                table: "SavingsTransactions",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SavingsWeekId",
                table: "SavingsTransactions");
        }
    }
}
