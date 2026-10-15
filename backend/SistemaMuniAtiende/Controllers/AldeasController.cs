using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SistemaMuniAtiende.Api.Data;
using SistemaMuniAtiende.DTOs;
using SistemaMuniAtiende.Models;

namespace SistemaMuniAtiende.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AldeasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;

        private const string CachePrefix = "aldeas_";
        private static readonly TimeSpan Duracion = TimeSpan.FromMinutes(30);

        public AldeasController(
            AppDbContext context,
            IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        // =========================================================
        // GET: api/Aldeas
        // GET: api/Aldeas?soloActivas=true
        // GET: api/Aldeas?soloActivas=false
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> Listar(
            [FromQuery] bool soloActivas = true)
        {
            var cacheKey = $"{CachePrefix}{soloActivas}";

            if (_cache.TryGetValue(cacheKey, out List<Aldea>? aldeasCache))
            {
                return Ok(aldeasCache);
            }

            var query = _context.Aldeas
                .AsNoTracking()
                .AsQueryable();

            if (soloActivas)
            {
                query = query.Where(a => a.Activo);
            }

            var aldeas = await query
                .OrderBy(a => a.Nombre)
                .ToListAsync();

            _cache.Set(cacheKey, aldeas, Duracion);

            return Ok(aldeas);
        }

        // =========================================================
        // POST: api/Aldeas
        // =========================================================
        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Crear(
            [FromBody] CrearAldeaRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return BadRequest(new
                {
                    mensaje = "El nombre es obligatorio."
                });
            }

            var nombre = req.Nombre.Trim();

            var existe = await _context.Aldeas
                .AnyAsync(a => a.Nombre.ToLower() == nombre.ToLower());

            if (existe)
            {
                return BadRequest(new
                {
                    mensaje = "Ya existe una aldea/comunidad con ese nombre."
                });
            }

            var aldea = new Aldea
            {
                Nombre = nombre,
                Activo = true
            };

            _context.Aldeas.Add(aldea);

            await _context.SaveChangesAsync();

            InvalidarCache();

            return Ok(aldea);
        }

        // =========================================================
        // PUT: api/Aldeas/5
        // =========================================================
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Actualizar(
            int id,
            [FromBody] ActualizarAldeaRequest req)
        {
            var aldea = await _context.Aldeas.FindAsync(id);

            if (aldea == null)
            {
                return NotFound(new
                {
                    mensaje = "Aldea no encontrada."
                });
            }

            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return BadRequest(new
                {
                    mensaje = "El nombre es obligatorio."
                });
            }

            var nombre = req.Nombre.Trim();

            // Verificar que no exista otra aldea con el mismo nombre
            var nombreDuplicado = await _context.Aldeas.AnyAsync(a =>
                a.Id != id &&
                a.Nombre.ToLower() == nombre.ToLower());

            if (nombreDuplicado)
            {
                return BadRequest(new
                {
                    mensaje = "Ya existe otra aldea/comunidad con ese nombre."
                });
            }

            aldea.Nombre = nombre;
            aldea.Activo = req.Activo;

            await _context.SaveChangesAsync();

            InvalidarCache();

            return Ok(aldea);
        }

        // =========================================================
        // DELETE: api/Aldeas/5
        // =========================================================
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var aldea = await _context.Aldeas.FindAsync(id);

            if (aldea == null)
            {
                return NotFound(new
                {
                    mensaje = "Aldea no encontrada."
                });
            }

            var tieneVecinosAsociados =
                await _context.PerfilesVecino
                    .AnyAsync(p => p.AldeaId == id);

            if (tieneVecinosAsociados)
            {
                return BadRequest(new
                {
                    mensaje = "La aldea o comunidad no puede eliminarse porque posee información asociada."
                });
            }

            _context.Aldeas.Remove(aldea);

            await _context.SaveChangesAsync();

            InvalidarCache();

            return Ok(new
            {
                mensaje = "Aldea eliminada correctamente."
            });
        }

        // =========================================================
        // CACHE
        // =========================================================
        private void InvalidarCache()
        {
            _cache.Remove($"{CachePrefix}True");
            _cache.Remove($"{CachePrefix}False");
        }
    }
}