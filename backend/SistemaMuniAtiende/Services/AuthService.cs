using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SistemaMuniAtiende.Api.Data;
using SistemaMuniAtiende.DTOs;
using SistemaMuniAtiende.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SistemaMuniAtiende.Services
{
    public class AuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            AppDbContext context,
            IConfiguration config,
            IEmailService emailService,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _context = context;
            _config = config;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<(bool exito, string mensaje)> RegistrarUsuarioAsync(RegistroUsuarioRequest req, bool generarPasswordTemporal = false)
        {
            var rolesValidos = new[] { "Vecino", "Analista", "Empleado", "Administrador" };
            if (!rolesValidos.Contains(req.Rol))
                return (false, "Rol inválido.");

            string? passwordTemporalGenerada = generarPasswordTemporal ? GenerarPasswordTemporal() : null;
            var passwordAUsar = generarPasswordTemporal ? passwordTemporalGenerada! : req.Password!;

            var user = new ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                Nombre = req.Nombre,
                Apellido = req.Apellido,
                DebeCambiarPassword = generarPasswordTemporal
            };

            var result = await _userManager.CreateAsync(user, passwordAUsar);
            if (!result.Succeeded)
                return (false, string.Join(" | ", result.Errors.Select(e => e.Description)));

            await _userManager.AddToRoleAsync(user, req.Rol);

            if (req.Rol == "Vecino")
            {
                if (string.IsNullOrWhiteSpace(req.Cui))
                    return (false, "El CUI es obligatorio para el rol Vecino.");

                if (await _context.PerfilesVecino.AnyAsync(p => p.Cui == req.Cui))
                    return (false, "El CUI ya está registrado.");

                if (req.Cui.Length != 13 || !req.Cui.All(char.IsDigit))
                    return (false, "El CUI debe tener 13 dígitos numéricos.");

                if (!req.Cui.EndsWith("0110"))
                    return (false, "El CUI ingresado no corresponde a un vecino registrado en este municipio.");

                _context.PerfilesVecino.Add(new PerfilVecino
                {
                    UserId = user.Id,
                    Cui = req.Cui,
                    Direccion = req.Direccion ?? string.Empty,
                    AldeaId = req.AldeaId,
                    Telefono = req.Telefono ?? string.Empty,
                    FechaNacimiento = DateTime.SpecifyKind(req.FechaNacimiento ?? DateTime.MinValue, DateTimeKind.Utc)
                });

                await _context.SaveChangesAsync();

                if (generarPasswordTemporal)
                {
                    // Lo creó el Administrador → correo con contraseña temporal
                    await EnviarCorreoCuentaCreadaPorAdmin(user, passwordTemporalGenerada!);
                    return (true, $"{req.Rol} registrado correctamente. Se envió la contraseña temporal por correo.");
                }

                // Se autoregistró él mismo → correo de bienvenida normal, sin contraseña
                try
                {
                    await _emailService.EnviarAsync(
     user.Email!,
     "Confirmación de registro - Sistema QRDS",
     $"""
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin:0; padding:0; background-color:#EEF1F5; font-family:'Segoe UI', Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC; border-radius:10px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

              <!-- Banner superior -->
              <tr>
                <td style="background-color:#0F172A; padding:28px 32px;" align="center">
                  <div style="width:48px; height:48px; border-radius:50%; background-color:#0D9488; display:inline-block; line-height:48px; text-align:center; color:#F8FAFC; font-size:20px; font-weight:600;">
                    M
                  </div>
                  <p style="margin:12px 0 0; color:#F8FAFC; font-size:15px; letter-spacing:0.5px; text-transform:uppercase;">
                    Municipalidad
                  </p>
                </td>
              </tr>

              <!-- Franja de acento -->
              <tr>
                <td style="height:6px; background-color:#0D9488;"></td>
              </tr>

              <!-- Cuerpo -->
              <tr>
                <td style="padding:36px 32px;">
                  <h1 style="margin:0 0 16px; color:#0F172A; font-size:22px;">
                    ¡Bienvenido/a, {user.Nombre}!
                  </h1>
                  <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                    Tu cuenta en el <strong>Sistema de Quejas, Reclamos, Denuncias y Sugerencias</strong>
                    de la Municipalidad se ha creado correctamente.
                  </p>
                  <p style="margin:0 0 24px; color:#334155; font-size:15px; line-height:1.6;">
                    Ya puedes iniciar sesión con tu correo registrado para reportar casos y
                    darles seguimiento desde el portal.
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; border-radius:8px; width:100%; margin-bottom:8px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0; color:#475569; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">
                          Correo registrado
                        </p>
                        <p style="margin:4px 0 0; color:#0F172A; font-size:15px; font-weight:600;">
                          {user.Email}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Pie -->
              <tr>
                <td style="padding:20px 32px; background-color:#0F172A;" align="center">
                  <p style="margin:0; color:#94A3B8; font-size:12px;">
                    Este es un correo automático, por favor no respondas a este mensaje.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"No se pudo enviar el correo de confirmación: {ex.Message}");
                }
            }
            else if (req.Rol is "Analista" or "Empleado")
            {
                if (req.AreaIds == null || req.AreaIds.Count == 0)
                    return (false, "Debe asignar al menos un área.");

                var areas = await _context.Areas.Where(a => req.AreaIds.Contains(a.Id)).ToListAsync();
                if (areas.Count != req.AreaIds.Count)
                    return (false, "Una o más áreas seleccionadas no existen.");

                var perfil = new PerfilEmpleado
                {
                    UserId = user.Id
                };
                foreach (var area in areas)
                    perfil.Areas.Add(area);

                _context.PerfilesEmpleado.Add(perfil);
                await _context.SaveChangesAsync();

                if (generarPasswordTemporal)
                {
                    await EnviarCorreoCuentaCreadaPorAdmin(user, passwordTemporalGenerada!);
                    return (true, $"{req.Rol} registrado correctamente. Se envió la contraseña temporal por correo.");
                }
            }
            else if (req.Rol == "Administrador" && generarPasswordTemporal)
            {
                // Un Administrador creando a otro Administrador
                await EnviarCorreoCuentaCreadaPorAdmin(user, passwordTemporalGenerada!);
                return (true, $"{req.Rol} registrado correctamente. Se envió la contraseña temporal por correo.");
            }

            return (true, $"{req.Rol} registrado correctamente.");
        }

        private async Task EnviarCorreoCuentaCreadaPorAdmin(ApplicationUser user, string passwordTemporal)
        {
            await _emailService.EnviarAsync(
                user.Email!,
                "Tu cuenta ha sido creada - Sistema QRDS",
                $"""
                <!DOCTYPE html>
                <html lang="es">
                <body style="margin:0; padding:0; background-color:#EEF1F5; font-family:'Segoe UI', Arial, sans-serif;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; padding:32px 0;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC; border-radius:10px; overflow:hidden;">
                          <tr>
                            <td style="background-color:#0F172A; padding:28px 32px;" align="center">
                              <div style="width:48px; height:48px; border-radius:50%; background-color:#0D9488; display:inline-block; line-height:48px; text-align:center; color:#F8FAFC; font-size:20px; font-weight:600;">M</div>
                              <p style="margin:12px 0 0; color:#F8FAFC; font-size:15px; letter-spacing:0.5px; text-transform:uppercase;">Municipalidad</p>
                            </td>
                          </tr>
                          <tr><td style="height:6px; background-color:#0D9488;"></td></tr>
                          <tr>
                            <td style="padding:36px 32px;">
                              <h1 style="margin:0 0 16px; color:#0F172A; font-size:22px;">Hola {user.Nombre},</h1>
                              <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                                El administrador del sistema ha creado una cuenta para ti en el Portal Municipal.
                              </p>
                              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; border-radius:8px; width:100%; margin-bottom:24px;">
                                <tr>
                                  <td style="padding:16px 20px;">
                                    <p style="margin:0; color:#475569; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Contraseña temporal</p>
                                    <p style="margin:8px 0 0; color:#0F172A; font-size:20px; font-weight:700; letter-spacing:1px;">{passwordTemporal}</p>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                                Utiliza tu correo (<strong>{user.Email}</strong>) y esta contraseña para iniciar sesión.
                              </p>
                              <p style="margin:0; color:#334155; font-size:15px; line-height:1.6;">
                                <strong>Por seguridad, deberás cambiarla al ingresar por primera vez.</strong>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 32px; background-color:#0F172A;" align="center">
                              <p style="margin:0; color:#94A3B8; font-size:12px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """);
        }

        public async Task<(LoginResponse? respuesta, string? error)> LoginAsync(LoginRequest req)
        {
            var ip = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
            var user = await _userManager.FindByEmailAsync(req.Email);

            if (user == null || !user.Activo)
            {
                await RegistrarBitacoraLogin(null, req.Email, "Fallido", ip, "Usuario no encontrado o inactivo");
                return (null, "Credenciales inválidas.");
            }

            const string mensajeBloqueo = "Tu cuenta fue bloqueada temporalmente por demasiados intentos fallidos. Intenta nuevamente en 15 minutos.";

            if (await _userManager.IsLockedOutAsync(user))
            {
                await RegistrarBitacoraLogin(user.Id, req.Email, "Fallido", ip, "Intento de acceso con cuenta bloqueada");
                return (null, mensajeBloqueo);
            }

            var passwordValida = await _userManager.CheckPasswordAsync(user, req.Password);
            if (!passwordValida)
            {
                await _userManager.AccessFailedAsync(user);

                if (await _userManager.IsLockedOutAsync(user))
                {
                    await RegistrarBitacoraLogin(user.Id, req.Email, "Fallido", ip, "Contraseña incorrecta. Cuenta bloqueada por alcanzar el máximo de intentos fallidos");
                    return (null, mensajeBloqueo);
                }

                var intentos = await _userManager.GetAccessFailedCountAsync(user);
                await RegistrarBitacoraLogin(user.Id, req.Email, "Fallido", ip, $"Contraseña incorrecta (intento fallido {intentos})");
                return (null, "Credenciales inválidas.");
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            var roles = await _userManager.GetRolesAsync(user);

            if (user.DebeCambiarPassword)
            {
                await RegistrarBitacoraLogin(user.Id, req.Email, "RequiereCambioPassword", ip, "Login con contraseña temporal");
                return (new LoginResponse(string.Empty, user.Nombre, roles, true), null);
            }

            await RegistrarBitacoraLogin(user.Id, req.Email, "Exitoso", ip, "Inicio de sesión exitoso");

            var token = GenerarToken(user, roles);
            return (new LoginResponse(token, user.Nombre, roles, false), null);
        }
        public async Task RegistrarBitacoraLogin(string? userId, string email, string resultado, string? ip, string descripcion)
        {
            _context.Bitacoras.Add(new Bitacora
            {
                UserId = userId,
                Accion = "Login",
                Entidad = "AspNetUsers",
                EntidadId = userId ?? email,
                Detalle = System.Text.Json.JsonSerializer.Serialize(new { email, resultado, descripcion }),
                Ip = ip
            });
            await _context.SaveChangesAsync();
        }


        public async Task RegistrarBitacoraLogoutAsync(string? userId, string email, string? ip)
        {
            _context.Bitacoras.Add(new Bitacora
            {
                UserId = userId,
                Accion = "Logout",
                Entidad = "AspNetUsers",
                EntidadId = userId ?? email,
                Detalle = System.Text.Json.JsonSerializer.Serialize(new { email, descripcion = "Cierre de sesión" }),
                Ip = ip
            });
            await _context.SaveChangesAsync();
        }

        public async Task<(bool exito, string mensaje)> RecuperarPasswordAsync(string email, string cui)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null || !user.Activo)
                return (false, "No se pudo procesar la solicitud.");

            var perfilVecino = await _context.PerfilesVecino
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.Cui == cui);

            if (perfilVecino == null)
                return (false, "No se pudo procesar la solicitud.");

            var passwordTemporal = GenerarPasswordTemporal();
            var hashAnterior = user.PasswordHash;
            var debeCambiarAnterior = user.DebeCambiarPassword;
            var removeResult = await _userManager.RemovePasswordAsync(user);

            if (!removeResult.Succeeded)
                return (false, "No se pudo generar la contraseña temporal.");

            var addResult = await _userManager.AddPasswordAsync(user, passwordTemporal);

            if (!addResult.Succeeded)
                return (
                    false,
                    string.Join(" | ", addResult.Errors.Select(e => e.Description))

                );

            user.DebeCambiarPassword = true;

            await _userManager.UpdateAsync(user);
            try { 
            await _emailService.EnviarAsync(
                user.Email!,
                "Recuperación de contraseña - Sistema QRDS",
                $"""
        <!DOCTYPE html>
        <html lang="es">
        <body style="margin:0; padding:0; background-color:#EEF1F5; font-family:'Segoe UI', Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; padding:32px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC; border-radius:10px; overflow:hidden;">

                  <tr>
                    <td style="background-color:#0F172A; padding:28px 32px;" align="center">
                      <div style="width:48px; height:48px; border-radius:50%; background-color:#0D9488; display:inline-block; line-height:48px; text-align:center; color:#F8FAFC; font-size:20px; font-weight:600;">
                        M
                      </div>
                      <p style="margin:12px 0 0; color:#F8FAFC; font-size:15px; letter-spacing:0.5px; text-transform:uppercase;">
                        Municipalidad
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="height:6px; background-color:#0D9488;"></td>
                  </tr>

                  <tr>
                    <td style="padding:36px 32px;">
                      <h1 style="margin:0 0 16px; color:#0F172A; font-size:22px;">
                        Recuperación de contraseña
                      </h1>

                      <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                        Hola <strong>{user.Nombre}</strong>, hemos recibido una solicitud
                        para recuperar el acceso a tu cuenta.
                      </p>

                      <p style="margin:0 0 24px; color:#334155; font-size:15px; line-height:1.6;">
                        Se ha generado una contraseña temporal para que puedas ingresar
                        nuevamente al Portal Municipal.
                      </p>

                      <table role="presentation" cellpadding="0" cellspacing="0"
                             style="background-color:#EEF1F5; border-radius:8px; width:100%; margin-bottom:24px;">
                        <tr>
                          <td style="padding:16px 20px;">
                            <p style="margin:0; color:#475569; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">
                              Contraseña temporal
                            </p>
                            <p style="margin:8px 0 0; color:#0F172A; font-size:20px; font-weight:700; letter-spacing:1px;">
                              {passwordTemporal}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                        Utiliza esta contraseña para iniciar sesión en el Portal Municipal.
                      </p>

                      <p style="margin:0; color:#334155; font-size:15px; line-height:1.6;">
                        <strong>Por seguridad, al ingresar deberás cambiar esta contraseña
                        por una nueva.</strong>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:20px 32px; background-color:#0F172A;" align="center">
                      <p style="margin:0; color:#94A3B8; font-size:12px;">
                        Este es un correo automático, por favor no respondas a este mensaje.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """);
            }
            catch (Exception)
            {
                user.PasswordHash = hashAnterior;
                user.DebeCambiarPassword = debeCambiarAnterior;
                await _userManager.UpdateAsync(user);

                await RegistrarBitacoraRecuperacion(user.Id, user.Email!, "Fallido", "No fue posible enviar el correo de recuperación");

                return (false, "No se pudo conectar con el servidor. Verifica tu conexión o intenta más tarde.");
            }

            await RegistrarBitacoraRecuperacion(user.Id, user.Email!, "Exitoso", "Contraseña temporal enviada por correo");

            return (
              true,
              "Se ha enviado una contraseña temporal al correo registrado."
          );
        }

        private async Task RegistrarBitacoraRecuperacion(string userId, string email, string resultado, string descripcion)
        {
            _context.Bitacoras.Add(new Bitacora
            {
                UserId = userId,
                Accion = "RecuperarPassword",
                Entidad = "AspNetUsers",
                EntidadId = userId,
                Detalle = System.Text.Json.JsonSerializer.Serialize(new { email, resultado, descripcion }),
                Ip = null
            });
            await _context.SaveChangesAsync();
        }


        private string GenerarPasswordTemporal()
        {
            const string mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
            const string minusculas = "abcdefghijkmnopqrstuvwxyz";
            const string numeros = "23456789";
            const string especiales = "!@#$%*?";
            const string todos = mayusculas + minusculas + numeros + especiales;

            var random = new Random();

            var obligatorios = new[]
            {
        mayusculas[random.Next(mayusculas.Length)],
        minusculas[random.Next(minusculas.Length)],
        numeros[random.Next(numeros.Length)],
        especiales[random.Next(especiales.Length)]
    };

            var resto = Enumerable.Range(0, 6)
                .Select(_ => todos[random.Next(todos.Length)]);

            var caracteres = obligatorios.Concat(resto)
                .OrderBy(_ => random.Next())
                .ToArray();

            return new string(caracteres);
        }

        private string GenerarToken(ApplicationUser user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Email, user.Email!),
                new(ClaimTypes.GivenName, user.Nombre),
            };
            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<(bool exito, string mensaje)> CambiarPasswordAsync(CambiarPasswordRequest req)
        {
            if (req.PasswordNueva != req.ConfirmarPasswordNueva)
                return (false, "Las contraseñas no coinciden.");

            if (req.PasswordNueva == req.PasswordActual)
                return (false, "La nueva contraseña debe ser diferente a la contraseña temporal.");

            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user == null || !user.Activo)
                return (false, "No se pudo procesar la solicitud.");

            var result = await _userManager.ChangePasswordAsync(user, req.PasswordActual, req.PasswordNueva);
            if (!result.Succeeded)
                return (false, string.Join(" | ", result.Errors.Select(e => e.Description)));

            user.DebeCambiarPassword = false;
            await _userManager.UpdateAsync(user);

            return (true, "Contraseña actualizada correctamente.");
        }

        public async Task<List<UsuarioListItem>> ListarUsuariosAsync()
        {
            var usuarios = await _userManager.Users.ToListAsync();
            var lista = new List<UsuarioListItem>();

            foreach (var u in usuarios)
            {
                var roles = await _userManager.GetRolesAsync(u);
                List<string> areas = new();

                if (roles.Contains("Analista") || roles.Contains("Empleado"))
                {
                    var perfil = await _context.PerfilesEmpleado
                        .Include(p => p.Areas)
                        .FirstOrDefaultAsync(p => p.UserId == u.Id);
                    areas = perfil?.Areas.Select(a => a.Nombre).ToList() ?? new List<string>();
                }

                lista.Add(new UsuarioListItem(u.Id, u.Nombre, u.Apellido, u.Email!, u.Activo, roles.ToList(), areas));
            }

            return lista;
        }

        public async Task<(bool exito, string mensaje)> ToggleActivoAsync(string userId, string? adminId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return (false, "Usuario no encontrado.");

            user.Activo = !user.Activo;
            await _userManager.UpdateAsync(user);

            var ip = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();

            _context.Bitacoras.Add(new Bitacora
            {
                UserId = adminId,
                Accion = user.Activo ? "Activado" : "Desactivado",
                Entidad = "ApplicationUser",
                EntidadId = user.Id,
                Detalle = System.Text.Json.JsonSerializer.Serialize(new { email = user.Email, nuevoEstado = user.Activo }),
                Ip = ip
            });
            await _context.SaveChangesAsync();

            return (true, user.Activo ? "Usuario activado." : "Usuario desactivado.");
        }
        public async Task<(bool exito, string mensaje)> ResetPasswordAdminAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return (false, "Usuario no encontrado.");

            var passwordTemporal = GenerarPasswordTemporal();

            var removeResult = await _userManager.RemovePasswordAsync(user);
            if (!removeResult.Succeeded)
                return (false, "No se pudo generar la contraseña temporal.");

            var addResult = await _userManager.AddPasswordAsync(user, passwordTemporal);
            if (!addResult.Succeeded)
                return (false, string.Join(" | ", addResult.Errors.Select(e => e.Description)));

            user.DebeCambiarPassword = true;
            await _userManager.UpdateAsync(user);

            await _emailService.EnviarAsync(
     user.Email!,
     "Restablecimiento de contraseña - Sistema QRDS",
     $"""
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin:0; padding:0; background-color:#EEF1F5; font-family:'Segoe UI', Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC; border-radius:10px; overflow:hidden;">
              <tr>
                <td style="background-color:#0F172A; padding:28px 32px;" align="center">
                  <div style="width:48px; height:48px; border-radius:50%; background-color:#0D9488; display:inline-block; line-height:48px; text-align:center; color:#F8FAFC; font-size:20px; font-weight:600;">M</div>
                  <p style="margin:12px 0 0; color:#F8FAFC; font-size:15px; letter-spacing:0.5px; text-transform:uppercase;">Municipalidad</p>
                </td>
              </tr>
              <tr><td style="height:6px; background-color:#0D9488;"></td></tr>
              <tr>
                <td style="padding:36px 32px;">
                  <h1 style="margin:0 0 16px; color:#0F172A; font-size:22px;">Hola {user.Nombre},</h1>
                  <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                    El administrador del sistema ha restablecido tu contraseña en el Portal Municipal.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; border-radius:8px; width:100%; margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0; color:#475569; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Contraseña temporal</p>
                        <p style="margin:8px 0 0; color:#0F172A; font-size:20px; font-weight:700; letter-spacing:1px;">{passwordTemporal}</p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                    Utiliza tu correo (<strong>{user.Email}</strong>) y esta contraseña para iniciar sesión.
                  </p>
                  <p style="margin:0; color:#334155; font-size:15px; line-height:1.6;">
                    <strong>Por seguridad, deberás cambiarla al ingresar.</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px; background-color:#0F172A;" align="center">
                  <p style="margin:0; color:#94A3B8; font-size:12px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """);

            return (true, "Se generó una contraseña temporal y se notificó al usuario.");
        }
        public async Task<object?> ObtenerMiPerfilAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            var perfil = await _context.PerfilesVecino.Include(p => p.Aldea).FirstOrDefaultAsync(p => p.UserId == userId);

            return new
            {
                nombre = user.Nombre,
                apellido = user.Apellido,
                email = user.Email,
                cui = perfil?.Cui,
                direccion = perfil?.Direccion,
                aldeaId = perfil?.AldeaId,
                aldea = perfil?.Aldea?.Nombre,
                telefono = perfil?.Telefono,
                fechaNacimiento = perfil?.FechaNacimiento
            };
        }

        public async Task<(bool exito, string mensaje)> ActualizarMiPerfilAsync(string userId, ActualizarPerfilVecinoRequest req)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return (false, "Usuario no encontrado.");

            user.Nombre = req.Nombre;
            user.Apellido = req.Apellido;
            await _userManager.UpdateAsync(user);

            var perfil = await _context.PerfilesVecino.FirstOrDefaultAsync(p => p.UserId == userId);
            if (perfil != null)
            {
                perfil.Direccion = req.Direccion;
                perfil.AldeaId = req.AldeaId;
                perfil.Telefono = req.Telefono;
                await _context.SaveChangesAsync();
            }

            return (true, "Perfil actualizado correctamente.");
        }

    }
}