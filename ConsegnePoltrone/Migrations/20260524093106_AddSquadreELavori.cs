using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConsegnePoltrone.Migrations
{
    /// <inheritdoc />
    public partial class AddSquadreELavori : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SquadraId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Squadre",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Colore = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    Specializzazioni = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CaposquadraId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Squadre", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Squadre_Users_CaposquadraId",
                        column: x => x.CaposquadraId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Lavori",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumeroLavoro = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Priorita = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteNome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteIndirizzo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteCitta = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteCap = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteProvincia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteTelefono = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClienteEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClienteNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DataInizio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataFine = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FasciaDalle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FasciaAlle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DurataStimataOre = table.Column<int>(type: "int", nullable: true),
                    Stato = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Esito = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DataCompletamento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NoteEsito = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NoteInterne = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NotePerSquadra = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImportoLavoro = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SquadraId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lavori", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lavori_Squadre_SquadraId",
                        column: x => x.SquadraId,
                        principalTable: "Squadre",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DocumentiLavoro",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LavoroId = table.Column<int>(type: "int", nullable: false),
                    NomeFileOriginale = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NomeFileSalvato = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PathFile = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DimensioneBytes = table.Column<long>(type: "bigint", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataUpload = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedById = table.Column<int>(type: "int", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentiLavoro", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentiLavoro_Lavori_LavoroId",
                        column: x => x.LavoroId,
                        principalTable: "Lavori",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentiLavoro_Users_UploadedById",
                        column: x => x.UploadedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_SquadraId",
                table: "Users",
                column: "SquadraId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentiLavoro_LavoroId",
                table: "DocumentiLavoro",
                column: "LavoroId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentiLavoro_UploadedById",
                table: "DocumentiLavoro",
                column: "UploadedById");

            migrationBuilder.CreateIndex(
                name: "IX_Lavori_SquadraId",
                table: "Lavori",
                column: "SquadraId");

            migrationBuilder.CreateIndex(
                name: "IX_Squadre_CaposquadraId",
                table: "Squadre",
                column: "CaposquadraId",
                unique: true,
                filter: "[CaposquadraId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Squadre_SquadraId",
                table: "Users",
                column: "SquadraId",
                principalTable: "Squadre",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Squadre_SquadraId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "DocumentiLavoro");

            migrationBuilder.DropTable(
                name: "Lavori");

            migrationBuilder.DropTable(
                name: "Squadre");

            migrationBuilder.DropIndex(
                name: "IX_Users_SquadraId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SquadraId",
                table: "Users");
        }
    }
}
