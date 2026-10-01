using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaMuniAtiende.Api.Data;


namespace SistemaMuniAtiende.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador")]
    public class BitacoraController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BitacoraController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        [HttpGet]
        public async Task<IActionResult> Listar(
    [FromQuery] int pagina = 1,
    [FromQuery] int tamano = 50,
    [FromQuery] string? entidad = null,
    [FromQuery] string? accion = null,
    [FromQuery] int? anio = null,
    [FromQuery] int? mes = null,
    [FromQuery] DateTime? desde = null,
    [FromQuery] DateTime? hasta = null)
        {
            var query = _context.Bitacoras.AsQueryable();

            if (!string.IsNullOrWhiteSpace(entidad))
                query = query.Where(b => b.Entidad == entidad);

            if (!string.IsNullOrWhiteSpace(accion))
                query = query.Where(b => b.Accion == accion);

            if (anio.HasValue || mes.HasValue)
            {
                var zonaGt = TimeZoneInfo.FindSystemTimeZoneById("America/Guatemala");

                var anioFiltro = anio ?? DateTime.UtcNow.Year;
                var mesFiltro = mes ?? 1;
                var rangoCompleto = mes.HasValue ? 1 : 12;

                var inicioLocal = new DateTime(anioFiltro, mesFiltro, 1, 0, 0, 0, DateTimeKind.Unspecified);
                var finLocal = inicioLocal.AddMonths(rangoCompleto);

                var inicioUtc = TimeZoneInfo.ConvertTimeToUtc(inicioLocal, zonaGt);
                var finUtc = TimeZoneInfo.ConvertTimeToUtc(finLocal, zonaGt);

                query = query.Where(b => b.Fecha >= inicioUtc && b.Fecha < finUtc);
            }

            if (desde.HasValue)
                query = query.Where(b => b.Fecha >= DateTime.SpecifyKind(desde.Value, DateTimeKind.Utc));

            if (hasta.HasValue)
                query = query.Where(b => b.Fecha <= DateTime.SpecifyKind(hasta.Value, DateTimeKind.Utc));

            var total = await query.CountAsync();

            var registrosCrudos = await query
                .OrderByDescending(b => b.Fecha)
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .ToListAsync();

            var userIds = registrosCrudos.Where(r => r.UserId != null).Select(r => r.UserId).Distinct().ToList();
            var usuarios = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => $"{u.Nombre} {u.Apellido} ({u.Email})");

            var registros = registrosCrudos.Select(r => new
            {
                r.Id,
                r.Accion,
                r.Entidad,
                r.EntidadId,
                r.Detalle,
                r.Ip,
                r.Fecha,
                Usuario = r.UserId != null && usuarios.ContainsKey(r.UserId)
                    ? usuarios[r.UserId]
                    : "Sistema / usuario no identificado"
            });

            return Ok(new { total, pagina, tamano, registros });
        }

        [HttpGet("entidades")]
        public async Task<IActionResult> ListarEntidades()
        {
            var entidades = await _context.Bitacoras
                .Select(b => b.Entidad)
                .Distinct()
                .OrderBy(e => e)
                .ToListAsync();

            return Ok(entidades);
        }
    }
}