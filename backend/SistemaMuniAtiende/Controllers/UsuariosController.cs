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
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public UsuariosController(
            AppDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet("reporte")]
        public async Task<IActionResult> Reporte(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 25,
            [FromQuery] string? rol = null,
            [FromQuery] int? aldeaId = null,
            [FromQuery] bool? activo = null)
        {
            if (pagina < 1)
                pagina = 1;

            if (tamano < 1 || tamano > 100)
                tamano = 25;

            var query =
                from usuario in _context.Users

                join userRole in _context.UserRoles
                    on usuario.Id equals userRole.UserId
                    into rolesUsuario

                from userRole in rolesUsuario.DefaultIfEmpty()

                join role in _context.Roles
                    on userRole.RoleId equals role.Id
                    into roles

                from role in roles.DefaultIfEmpty()

                join perfilVecino in _context.PerfilesVecino
                    on usuario.Id equals perfilVecino.UserId
                    into perfiles

                from perfilVecino in perfiles.DefaultIfEmpty()

                select new
                {
                    Usuario = usuario,
                    Rol = role != null ? role.Name : null,
                    PerfilVecino = perfilVecino
                };

            // Filtro por rol
            if (!string.IsNullOrWhiteSpace(rol))
            {
                query = query.Where(x => x.Rol == rol);
            }

            // Filtro por aldea
            if (aldeaId.HasValue)
            {
                query = query.Where(x =>
                    x.PerfilVecino != null &&
                    x.PerfilVecino.AldeaId == aldeaId.Value);
            }

            // Filtro por estado
            if (activo.HasValue)
            {
                query = query.Where(x =>
                    x.Usuario.Activo == activo.Value);
            }

            var registros = await query
                .OrderBy(x => x.Usuario.Nombre)
                .ThenBy(x => x.Usuario.Apellido)
                .Select(x => new
                {
                    id = x.Usuario.Id,
                    nombre = x.Usuario.Nombre,
                    apellido = x.Usuario.Apellido,
                    email = x.Usuario.Email,

                    rol = x.Rol ?? "Sin rol",

                    cui = x.PerfilVecino != null
                        ? x.PerfilVecino.Cui
                        : null,

                    aldeaId = x.PerfilVecino != null
                        ? x.PerfilVecino.AldeaId
                        : null,

                    aldea = x.PerfilVecino != null &&
                            x.PerfilVecino.Aldea != null
                        ? x.PerfilVecino.Aldea.Nombre
                        : null,

                    telefono = x.PerfilVecino != null
                        ? x.PerfilVecino.Telefono
                        : null,

                    activo = x.Usuario.Activo,

                    fechaCreacion = x.Usuario.FechaCreacion
                })
                .ToListAsync();

            var total = registros.Count;

            var registrosPagina = registros
                .Skip((pagina - 1) * tamano)
                .Take(tamano)
                .ToList();

            return Ok(new
            {
                total,
                pagina,
                tamano,
                registros = registrosPagina
            });
        }

        [HttpGet("roles")]
        public async Task<IActionResult> ListarRoles()
        {
            var roles = await _context.Roles
                .Select(r => r.Name)
                .Where(r => r != null)
                .OrderBy(r => r)
                .ToListAsync();

            return Ok(roles);
        }

        [HttpGet("aldeas")]
        public async Task<IActionResult> ListarAldeas()
        {
            var aldeas = await _context.Aldeas
                .Where(a => a.Activo)
                .OrderBy(a => a.Nombre)
                .Select(a => new
                {
                    a.Id,
                    a.Nombre
                })
                .ToListAsync();

            return Ok(aldeas);
        }

        [HttpGet("conteo-por-rol")]
        public async Task<IActionResult> ConteoPorRol()
        {
            var conteo = await (
                from usuario in _context.Users
                join userRole in _context.UserRoles
                    on usuario.Id equals userRole.UserId
                join role in _context.Roles
                    on userRole.RoleId equals role.Id
                group role by role.Name into g
                select new
                {
                    rol = g.Key,
                    cantidad = g.Count()
                })
                .OrderBy(x => x.rol)
                .ToListAsync();

            return Ok(conteo);
        }
    }
}