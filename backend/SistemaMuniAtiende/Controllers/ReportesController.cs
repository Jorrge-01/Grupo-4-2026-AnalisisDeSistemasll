using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaMuniAtiende.Api.Data;
using SistemaMuniAtiende.Models;

namespace SistemaMuniAtiende.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador")]
    public class ReportesController : ControllerBase
    {
        private const int DesfaseGuatemala = 6;

        private static readonly EstadoCaso[] EstadosActivosAnalista =
        {
            EstadoCaso.Asignada,
            EstadoCaso.EnValidacion,
            EstadoCaso.PendienteInformacion,
            EstadoCaso.EnAnalisis,
            EstadoCaso.AsignadaAOperario,
            EstadoCaso.EnEjecucion,
            EstadoCaso.TrabajoRealizado,
            EstadoCaso.EnVerificacion,
            EstadoCaso.Reabierta
        };

        private static readonly EstadoCaso[] EstadosActivosOperario =
        {
            EstadoCaso.AsignadaAOperario,
            EstadoCaso.EnEjecucion,
            EstadoCaso.TrabajoRealizado,
            EstadoCaso.EnVerificacion
        };

        private static readonly EstadoCaso[] EstadosFinalizados =
        {
            EstadoCaso.Solucionada,
            EstadoCaso.Finalizada
        };

        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ReportesController(
            AppDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private sealed record FilaCarga(
            string Id,
            string Nombre,
            string Rol,
            string Areas,
            bool Activo,
            int CasosActivos,
            int CasosFinalizados,
            int TotalAsignados);

        [HttpGet("filtros")]
        public async Task<IActionResult> Filtros()
        {
            var areas = await _context.Areas
                .OrderBy(a => a.Nombre)
                .Select(a => new { a.Id, a.Nombre })
                .ToListAsync();

            var aldeas = await _context.Aldeas
                .OrderBy(a => a.Nombre)
                .Select(a => new { a.Id, a.Nombre })
                .ToListAsync();

            var estados = Enum.GetValues<EstadoCaso>()
                .Where(e => e != EstadoCaso.Reabierta)
                .Select(e => e.ToString())
                .ToList();

            return Ok(new { areas, aldeas, estados });
        }

        [HttpGet("casos")]
        public async Task<IActionResult> Casos(
            [FromQuery] string? estado = null,
            [FromQuery] int? areaId = null,
            [FromQuery] int? aldeaId = null,
            [FromQuery] DateTime? desde = null,
            [FromQuery] DateTime? hasta = null)
        {
            if (desde.HasValue && hasta.HasValue && desde.Value.Date > hasta.Value.Date)
                return BadRequest(new { mensaje = "La fecha inicial no puede ser mayor que la fecha final." });

            var query = _context.Casos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(estado))
            {
                if (!Enum.TryParse<EstadoCaso>(estado, out var estadoCaso))
                    return BadRequest(new { mensaje = "El estado seleccionado no es válido." });

                query = query.Where(c => c.Estado == estadoCaso);
            }

            if (areaId.HasValue)
                query = query.Where(c => c.AreaId == areaId.Value);

            if (aldeaId.HasValue)
                query = query.Where(c => c.AldeaId == aldeaId.Value);

            if (desde.HasValue)
            {
                var inicio = DateTime.SpecifyKind(
                    desde.Value.Date.AddHours(DesfaseGuatemala),
                    DateTimeKind.Utc);

                query = query.Where(c => c.FechaRegistro >= inicio);
            }

            if (hasta.HasValue)
            {
                var fin = DateTime.SpecifyKind(
                    hasta.Value.Date.AddDays(1).AddHours(DesfaseGuatemala),
                    DateTimeKind.Utc);

                query = query.Where(c => c.FechaRegistro < fin);
            }

            var casos = await query
                .OrderByDescending(c => c.FechaRegistro)
                .Select(c => new
                {
                    c.Id,
                    c.Codigo,
                    c.Estado,
                    Area = c.Area != null ? c.Area.Nombre : "",
                    Aldea = c.Aldea != null ? c.Aldea.Nombre : "",
                    Vecino = c.Vecino != null ? c.Vecino.Nombre + " " + c.Vecino.Apellido : "",
                    Analista = c.Analista != null ? c.Analista.Nombre + " " + c.Analista.Apellido : null,
                    c.FechaRegistro
                })
                .ToListAsync();

            var registros = casos.Select(c => new
            {
                id = c.Id,
                codigo = c.Codigo,
                estado = c.Estado.ToString(),
                area = c.Area,
                aldea = c.Aldea,
                vecino = c.Vecino,
                analista = c.Analista,
                fechaRegistro = c.FechaRegistro
            }).ToList();

            return Ok(new { total = registros.Count, registros });
        }

        [HttpGet("carga-personal")]
        public async Task<IActionResult> CargaPersonal(
            [FromQuery] string? rol = null,
            [FromQuery] int? areaId = null)
        {
            var roles = new[] { "Analista", "Empleado" };

            if (!string.IsNullOrWhiteSpace(rol))
            {
                if (!roles.Contains(rol))
                    return BadRequest(new { mensaje = "El rol seleccionado no es válido." });

                roles = new[] { rol };
            }

            var perfiles = await _context.PerfilesEmpleado
                .Include(p => p.Areas)
                .ToListAsync();

            var casos = await _context.Casos
                .Select(c => new { c.Id, c.AnalistaId, c.Estado })
                .ToListAsync();

            var instrucciones = await _context.InstruccionesTrabajo
                .Select(i => new { i.CasoId, i.OperarioId })
                .Distinct()
                .ToListAsync();

            var estadoPorCaso = casos.ToDictionary(c => c.Id, c => c.Estado);
            var filas = new List<FilaCarga>();

            foreach (var nombreRol in roles)
            {
                var esAnalista = nombreRol == "Analista";
                var usuarios = await _userManager.GetUsersInRoleAsync(nombreRol);

                foreach (var usuario in usuarios)
                {
                    var areasUsuario = perfiles
                        .Where(p => p.UserId == usuario.Id)
                        .SelectMany(p => p.Areas)
                        .DistinctBy(a => a.Id)
                        .OrderBy(a => a.Nombre)
                        .ToList();

                    if (areaId.HasValue && !areasUsuario.Any(a => a.Id == areaId.Value))
                        continue;

                    List<EstadoCaso> estados;

                    if (esAnalista)
                    {
                        estados = casos
                            .Where(c => c.AnalistaId == usuario.Id)
                            .Select(c => c.Estado)
                            .ToList();
                    }
                    else
                    {
                        estados = instrucciones
                            .Where(i => i.OperarioId == usuario.Id && estadoPorCaso.ContainsKey(i.CasoId))
                            .Select(i => estadoPorCaso[i.CasoId])
                            .ToList();
                    }

                    var estadosActivos = esAnalista ? EstadosActivosAnalista : EstadosActivosOperario;

                    filas.Add(new FilaCarga(
                        usuario.Id,
                        (usuario.Nombre + " " + usuario.Apellido).Trim(),
                        nombreRol,
                        string.Join(", ", areasUsuario.Select(a => a.Nombre)),
                        usuario.Activo,
                        estados.Count(e => estadosActivos.Contains(e)),
                        estados.Count(e => EstadosFinalizados.Contains(e)),
                        estados.Count));
                }
            }

            var registros = filas
                .OrderBy(f => f.Rol)
                .ThenByDescending(f => f.CasosActivos)
                .ThenBy(f => f.Nombre)
                .Select(f => new
                {
                    id = f.Id,
                    nombre = f.Nombre,
                    rol = f.Rol,
                    areas = f.Areas,
                    activo = f.Activo,
                    casosActivos = f.CasosActivos,
                    casosFinalizados = f.CasosFinalizados,
                    totalAsignados = f.TotalAsignados
                })
                .ToList();

            return Ok(new { total = registros.Count, registros });
        }
    }
}