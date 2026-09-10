// ﬂ«„· Ê„ı⁄œ¯· Õ”» ÿ·»ﬂ
// - ’›Õ… ⁄‰Ê«‰ ﬁ»· ﬂ· „—Õ·…
// - «· ÊÃÂ: ﬂ· ‰Ê⁄ ›Ì ’›Õ… («·ﬁÌ„ / «·—ƒÌ… / «·—”«·…)
// - «·„»«œ—«  Ê«·„‘«—Ì⁄ ·Â« »Ì«‰«  ﬂ«„·…
// - √“—ﬁ + √Œ÷—
// - »œÊ‰ Wrap / Flow

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class StrategicPlanPdfGenerator
{
    public byte[] Generate()
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            // ================= COVER =================
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.Content().AlignMiddle().AlignCenter().Column(col =>
                {
                    col.Item().Text("«·Œÿ… «·«” —« ÌÃÌ…").FontSize(32).Bold().FontColor(Colors.Blue.Medium);
                });
            });

            // ================= ANALYSIS =================
            AddStageTitle(container, "«· Õ·Ì· «·«” —« ÌÃÌ");
            AddAnalysis(container);

            // ================= DIRECTION =================
            AddStageTitle(container, "«· ÊÃÂ «·«” —« ÌÃÌ");
            AddDirectionSection(container, "«·ﬁÌ„ «·„ƒ””Ì…", new[] { "«·‘›«›Ì…", "«·ÃÊœ…", "«·⁄„· «·Ã„«⁄Ì" });
            AddDirectionSection(container, "«·—ƒÌ…", new[] { "«·—Ì«œ…", "«· „Ì“ «·„ƒ””Ì" });
            AddDirectionSection(container, "«·—”«·…", new[] { " ÕﬁÌﬁ —÷« «·„” ›Ìœ", " Õ”Ì‰ «·√œ«¡" });

            // ================= GOALS =================
            AddStageTitle(container, "«·√Âœ«› «·«” —« ÌÃÌ…");
            for (int g = 1; g <= 3; g++)
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.Content().Column(col =>
                    {
                        col.Item().Text($"«·Âœ› —ﬁ„ {g}").FontSize(22).Bold().FontColor(Colors.Green.Darken2);
                        col.Item().Text("Ê’› «·Âœ› «·«” —« ÌÃÌ").FontSize(14);

                        col.Item().PaddingTop(10);
                        BuildInitiatives(col);
                    });
                });
            }
        }).GeneratePdf();
    }

    // ================= HELPERS =================
    void AddStageTitle(IDocumentContainer container, string title)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.Content().AlignMiddle().AlignCenter()
                .Text(title)
                .FontSize(28)
                .Bold()
                .FontColor(Colors.Blue.Darken2);
        });
    }

    void AddAnalysis(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(30);
            page.Content().Column(col =>
            {
                BuildSimpleTable(col, "‰ﬁ«ÿ «·ﬁÊ…");
                BuildSimpleTable(col, "‰ﬁ«ÿ «·÷⁄›");
                BuildSimpleTable(col, "«·›—’");
                BuildSimpleTable(col, "«· ÂœÌœ« ");
            });
        });
    }

    void AddDirectionSection(IDocumentContainer container, string title, IEnumerable<string> items)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(30);
            page.Content().Column(col =>
            {
                col.Item().Text(title).FontSize(24).Bold().FontColor(Colors.Green.Darken2);
                col.Item().PaddingTop(10);

                foreach (var item in items)
                {
                    col.Item().Padding(10).Background(Colors.Grey.Lighten3).CornerRadius(8)
                        .Text(item).FontSize(14);
                }
            });
        });
    }

    void BuildInitiatives(ColumnDescriptor col)
    {
        for (int i = 1; i <= 2; i++)
        {
            col.Item().Padding(10).Background(Colors.Blue.Lighten4).CornerRadius(10).Column(c =>
            {
                c.Item().Text($"„»«œ—… {i}").Bold();
                c.Item().Text("Õ«·… «·„»«œ—…: ﬁÌœ «· ‰›Ì–");
                c.Item().Text("«·‘—ﬂ«¡: Ê“«—… ñ ÃÂ… œ«⁄„…");

                c.Item().PaddingTop(5);
                BuildProjectsTable(c);
            });

            col.Item().Height(10);
        }
    }

    void BuildProjectsTable(ColumnDescriptor col)
    {
        col.Item().Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(1);
                c.RelativeColumn(4);
                c.RelativeColumn(2);
            });

            table.Header(h =>
            {
                h.Cell().Element(HeaderCell).Text("#");
                h.Cell().Element(HeaderCell).Text("«”„ «·„‘—Ê⁄");
                h.Cell().Element(HeaderCell).Text("«·Õ«·…");
            });

            for (int p = 1; p <= 3; p++)
            {
                table.Cell().Element(BodyCell).Text(p.ToString());
                table.Cell().Element(BodyCell).Text($"„‘—Ê⁄ {p}");
                table.Cell().Element(BodyCell).Text("‰‘ÿ");
            }
        });
    }

    void BuildSimpleTable(ColumnDescriptor col, string title)
    {
        col.Item().Text(title).Bold().FontColor(Colors.Blue.Darken1);

        col.Item().Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(1);
                c.RelativeColumn(6);
            });

            table.Header(h =>
            {
                h.Cell().Element(HeaderCell).Text("#");
                h.Cell().Element(HeaderCell).Text("«·Ê’›");
            });

            for (int i = 1; i <= 3; i++)
            {
                table.Cell().Element(BodyCell).Text(i.ToString());
                table.Cell().Element(BodyCell).Text($"{title} ⁄‰’— {i}");
            }
        });

        col.Item().Height(15);
    }

    IContainer HeaderCell(IContainer container) =>
        container.Padding(5).Background(Colors.Blue.Medium).AlignCenter().DefaultTextStyle(x => x.FontColor(Colors.White).Bold());

    IContainer BodyCell(IContainer container) =>
        container.Padding(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
}
