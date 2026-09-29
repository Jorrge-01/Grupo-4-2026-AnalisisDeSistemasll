using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaMuniAtiende.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSubidoPorAArchivoCaso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubidoPorUserId",
                table: "ArchivosCaso",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubidoPorUserId",
                table: "ArchivosCaso");
        }
    }
}
