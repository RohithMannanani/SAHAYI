using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Collections.Generic;

namespace Sahayi.Api.Services
{
    public class MemberCredentialInfo
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string CommonPassword { get; set; } = string.Empty;
    }

    public class PdfGeneratorService
    {
        public byte[] GenerateCredentialsPdf(string unitName, int wardNumber, List<MemberCredentialInfo> members)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(30);
                    page.Header().Text($"SAHAYI - Ayalkoottam Registration Credentials")
                                 .FontSize(18).Bold().AlignCenter().FontColor(Colors.Blue.Medium);

                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        col.Item().Text($"Unit Name: {unitName} | Ward Number: {wardNumber}").FontSize(12).Bold();
                        col.Item().PaddingBottom(10).LineHorizontal(1);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(1.5f);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Name").Bold();
                                header.Cell().Text("Phone (Username)").Bold();
                                header.Cell().Text("Role").Bold();
                                header.Cell().Text("Temp Password").Bold();
                            });

                            foreach (var member in members)
                            {
                                table.Cell().Text(member.FullName);
                                table.Cell().Text(member.PhoneNumber);
                                table.Cell().Text(member.Role);
                                table.Cell().Text(member.CommonPassword);
                            }
                        });
                    });

                    page.Footer().Text("Note: Members must change their password upon first login.")
                                 .FontSize(10).Italic().AlignCenter();
                });
            });

            return document.GeneratePdf();
        }
    }
}