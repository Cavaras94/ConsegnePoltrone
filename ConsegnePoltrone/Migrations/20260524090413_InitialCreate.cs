using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConsegnePoltrone.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cognome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Consegne",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumeroOrdine = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DataOrdine = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClienteNome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteIndirizzo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteCitta = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteCap = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteProvincia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClienteTelefono = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClienteEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClienteNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProdottoDescrizione = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProdottoCodice = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Quantita = table.Column<int>(type: "int", nullable: false),
                    ProdottoNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImportoDaPagare = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PagamentoRicevuto = table.Column<bool>(type: "bit", nullable: false),
                    ModalitaPagamento = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Stato = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataPrevistaConsegna = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FasciaDalle = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FasciaAlle = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataEffettivaConsegna = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Esito = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NoteConsegna = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NoteInterne = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrasportatoreId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Consegne", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Consegne_Users_TrasportatoreId",
                        column: x => x.TrasportatoreId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Documenti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConsegnaId = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_Documenti", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documenti_Consegne_ConsegnaId",
                        column: x => x.ConsegnaId,
                        principalTable: "Consegne",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Documenti_Users_UploadedById",
                        column: x => x.UploadedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Consegne_TrasportatoreId",
                table: "Consegne",
                column: "TrasportatoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Documenti_ConsegnaId",
                table: "Documenti",
                column: "ConsegnaId");

            migrationBuilder.CreateIndex(
                name: "IX_Documenti_UploadedById",
                table: "Documenti",
                column: "UploadedById");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Documenti");

            migrationBuilder.DropTable(
                name: "Consegne");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
