using System.ComponentModel.DataAnnotations;

namespace SistemaMuniAtiende.Models
{
    public class ArchivoCaso
    {
        public int Id { get; set; }

        [Required]
        public int CasoId { get; set; }
        public Caso? Caso { get; set; }

        [Required, MaxLength(255)]
        public string NombreArchivo { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string TipoContenido { get; set; } = string.Empty;

        [Required, MaxLength(500)]
        public string RutaArchivo { get; set; } = string.Empty;

        public long TamanoBytes { get; set; }

        public DateTime FechaCarga { get; set; } = DateTime.UtcNow;

        public string? SubidoPorUserId { get; set; }
    }
}