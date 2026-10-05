using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaMuniAtiende.DTOs;
using SistemaMuniAtiende.Services;
using System.Security.Claims;


namespace SistemaMuniAtiende.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }
        [HttpPost("registro-vecino")]
        public async Task<IActionResult> RegistroVecino(RegistroVecinoRequest req)
        {
            var resultado = await _authService.RegistrarUsuarioAsync(
                new RegistroUsuarioRequest(
                    req.Email, req.Password, req.Nombre, req.Apellido, "Vecino",
                    req.Cui, req.Direccion, req.AldeaId, req.Telefono, req.FechaNacimiento,
                    null));

            if (!resultado.exito) return BadRequest(new { mensaje = resultado.mensaje });
            return Ok(new { mensaje = resultado.mensaje });
        }

        [HttpPost("registro-usuario")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> RegistroUsuario(RegistroUsuarioRequest req)
        {
            var generarTemporal = req.Rol != "Vecino";

            var (exito, mensaje) = await _authService.RegistrarUsuarioAsync(req, generarPasswordTemporal: generarTemporal);
            if (!exito) return BadRequest(new { mensaje });
            return Ok(new { mensaje });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest req)
        {
            var (respuesta, error) = await _authService.LoginAsync(req);
            if (respuesta == null) return Unauthorized(new { mensaje = error });
            return Ok(respuesta);
        }

        [HttpPost("olvide-password")]
        public async Task<IActionResult> OlvidePassword(RecuperarPasswordRequest req)
        {
            var resultado = await _authService.RecuperarPasswordAsync(
                req.Email,
                req.Cui);

            if (!resultado.exito)
                return BadRequest(new { mensaje = resultado.mensaje });

            return Ok(new { mensaje = resultado.mensaje });
        }

        [HttpPost("cambiar-password")]
        public async Task<IActionResult> CambiarPassword(CambiarPasswordRequest req)
        {
            var (exito, mensaje) = await _authService.CambiarPasswordAsync(req);
            if (!exito) return BadRequest(new { mensaje });
            return Ok(new { mensaje });
        }


        [HttpGet("usuarios")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ListarUsuarios()
        {
            var usuarios = await _authService.ListarUsuariosAsync();
            return Ok(usuarios);
        }

        [HttpPut("usuarios/{id}/toggle-activo")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ToggleActivo(string id)
        {
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var (exito, mensaje) = await _authService.ToggleActivoAsync(id, adminId);
            if (!exito) return BadRequest(new { mensaje });
            return Ok(new { mensaje });
        }

        [HttpPost("usuarios/{id}/reset-password")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ResetPassword(string id)
        {
            var (exito, mensaje) = await _authService.ResetPasswordAdminAsync(id);
            if (!exito) return BadRequest(new { mensaje });
            return Ok(new { mensaje });
        }
        [HttpGet("mi-perfil")]
        [Authorize]
        public async Task<IActionResult> MiPerfil()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var perfil = await _authService.ObtenerMiPerfilAsync(userId);
            if (perfil == null) return NotFound();

            return Ok(perfil);
        }

        [HttpPut("mi-perfil")]
        [Authorize]
        public async Task<IActionResult> ActualizarMiPerfil(ActualizarPerfilVecinoRequest req)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var (exito, mensaje) = await _authService.ActualizarMiPerfilAsync(userId, req);
            if (!exito) return BadRequest(new { mensaje });
            return Ok(new { mensaje });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? "";
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            await _authService.RegistrarBitacoraLogoutAsync(userId, email, ip);
            return Ok(new { mensaje = "Sesión cerrada." });
        }



    }
}