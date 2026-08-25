using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sahayi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSavingsWeeksTableAndUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UnitBankAccounts_UnitId",
                table: "UnitBankAccounts");

            migrationBuilder.CreateTable(
                name: "SavingsWeeks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnitId = table.Column<int>(type: "int", nullable: false),
                    WeekNumber = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingsWeeks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavingsWeeks_AyalkoottamUnits_UnitId",
                        column: x => x.UnitId,
                        principalTable: "AyalkoottamUnits",
                        principalColumn: "UnitId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UnitBankAccounts_UnitId",
                table: "UnitBankAccounts",
                column: "UnitId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavingsTransactions_SavingsWeekId_UserId",
                table: "SavingsTransactions",
                columns: new[] { "SavingsWeekId", "UserId" },
                unique: true,
                filter: "[SavingsWeekId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SavingsWeeks_UnitId_WeekNumber",
                table: "SavingsWeeks",
                columns: new[] { "UnitId", "WeekNumber" },
                unique: true);

            // Ensure existing transactions don't have invalid foreign key values
            migrationBuilder.Sql("UPDATE SavingsTransactions SET SavingsWeekId = NULL;");

            migrationBuilder.AddForeignKey(
                name: "FK_SavingsTransactions_SavingsWeeks_SavingsWeekId",
                table: "SavingsTransactions",
                column: "SavingsWeekId",
                principalTable: "SavingsWeeks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SavingsTransactions_SavingsWeeks_SavingsWeekId",
                table: "SavingsTransactions");

            migrationBuilder.DropTable(
                name: "SavingsWeeks");

            migrationBuilder.DropIndex(
                name: "IX_UnitBankAccounts_UnitId",
                table: "UnitBankAccounts");

            migrationBuilder.DropIndex(
                name: "IX_SavingsTransactions_SavingsWeekId_UserId",
                table: "SavingsTransactions");

            migrationBuilder.CreateIndex(
                name: "IX_UnitBankAccounts_UnitId",
                table: "UnitBankAccounts",
                column: "UnitId");
        }
    }
}
