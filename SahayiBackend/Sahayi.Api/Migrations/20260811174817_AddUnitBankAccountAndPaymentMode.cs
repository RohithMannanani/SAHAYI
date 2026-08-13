using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sahayi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitBankAccountAndPaymentMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentMode",
                table: "SavingsTransactions",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "UnitBankAccounts",
                columns: table => new
                {
                    BankAccountId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnitId = table.Column<int>(type: "int", nullable: false),
                    AccountNumber = table.Column<string>(type: "varchar(50)", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    IFSCCode = table.Column<string>(type: "varchar(20)", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitBankAccounts", x => x.BankAccountId);
                    table.ForeignKey(
                        name: "FK_UnitBankAccounts_AyalkoottamUnits_UnitId",
                        column: x => x.UnitId,
                        principalTable: "AyalkoottamUnits",
                        principalColumn: "UnitId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UnitBankAccounts_UnitId",
                table: "UnitBankAccounts",
                column: "UnitId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UnitBankAccounts");

            migrationBuilder.DropColumn(
                name: "PaymentMode",
                table: "SavingsTransactions");
        }
    }
}
