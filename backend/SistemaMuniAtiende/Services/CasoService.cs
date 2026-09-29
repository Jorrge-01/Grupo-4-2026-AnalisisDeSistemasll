using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SistemaMuniAtiende.Api.Data;
using SistemaMuniAtiende.DTOs;
using SistemaMuniAtiende.Models;

namespace SistemaMuniAtiende.Services
{
    public class CasoService
    {
        private readonly AppDbContext _context;
        private readonly BolsonCasosService _bolsonCasosService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly BlobStorageService _blobStorageService;
        private readonly IEmailService _emailService;



        private readonly PlantillaCorreoService _plantillaCorreo;

        public CasoService(AppDbContext context, BolsonCasosService bolsonCasosService, UserManager<ApplicationUser> userManager, BlobStorageService blobStorageService, PlantillaCorreoService plantillaCorreo)
        {
            _context = context;
            _bolsonCasosService = bolsonCasosService;
            _userManager = userManager;
            _blobStorageService = blobStorageService;
            _plantillaCorreo = plantillaCorreo;
        }

        private async Task EnviarCorreoCasoAsync(string email, string nombreDestinatario, string asunto, string titulo, string mensaje, (string Etiqueta, string Valor)? destacado = null)
        {
            var bloqueDestacado = destacado.HasValue
                ? $"""
                   <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#EEF1F5; border-radius:8px; width:100%; margin-bottom:24px;">
                     <tr>
                       <td style="padding:16px 20px;">
                         <p style="margin:0; color:#475569; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">{destacado.Value.Etiqueta}</p>
                         <p style="margin:8px 0 0; color:#0F172A; font-size:17px; font-weight:600; line-height:1.4;">{destacado.Value.Valor}</p>
                       </td>
                     </tr>
                   </table>
                   """
                : "";

            await _emailService.EnviarAsync(
                email,
                asunto,
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
                              <h1 style="margin:0 0 16px; color:#0F172A; font-size:22px;">Hola {nombreDestinatario},</h1>
                              <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">{titulo}</p>
                              {bloqueDestacado}
                              <p style="margin:0; color:#334155; font-size:15px; line-height:1.6;">{mensaje}</p>
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

        public async Task<(bool Exito, string Mensaje, CasoCreadoResponse? Caso)> RegistrarQuejaAsync(
            string vecinoId,
            CrearCasoRequest req)
        {
            var perfil = await _context.PerfilesVecino
                .FirstOrDefaultAsync(p => p.UserId == vecinoId);

            if (perfil == null)
                return (false, "No se encontró el perfil del vecino.", null);

            if (string.IsNullOrWhiteSpace(req.Direccion))
                return (false, "La dirección es obligatoria.", null);

            if (req.Direccion.Trim().Length > 120)
                return (false, "La dirección no debe exceder 120 caracteres.", null);

            var telefono = new string((req.TelefonoContacto ?? "").Where(char.IsDigit).ToArray());

            if (telefono.Length != 8)
                return (false, "El teléfono debe tener 8 dígitos.", null);

            if (string.IsNullOrWhiteSpace(req.Descripcion))
                return (false, "La descripción de la queja es obligatoria.", null);

            if (req.Descripcion.Trim().Length > 2000)
                return (false, "La descripción no debe exceder 2000 caracteres.", null);

            var area = await _context.Areas
                .FirstOrDefaultAsync(a =>
                    a.Id == req.AreaId &&
                    a.Activo &&
                    a.AplicaQueja);

            if (area == null)
                return (false, "El área seleccionada no está disponible para registrar quejas.", null);

            var aldea = await _context.Aldeas
                .FirstOrDefaultAsync(a =>
                    a.Id == req.AldeaId &&
                    a.Activo);

            if (aldea == null)
                return (false, "La aldea o comunidad seleccionada no está disponible.", null);

            var caso = new Caso
            {
                VecinoId = vecinoId,
                AreaId = area.Id,
                AldeaId = aldea.Id,
                Direccion = req.Direccion.Trim(),
                TelefonoContacto = telefono,
                Descripcion = req.Descripcion.Trim(),
                FechaRegistro = DateTime.UtcNow,
                Estado = EstadoCaso.Registrada
            };

            _context.Casos.Add(caso);
            await _context.SaveChangesAsync();

            caso.Codigo = $"Q-{caso.Id:D6}";

            await _context.SaveChangesAsync();

            await _bolsonCasosService.AsignarCasoAsync(caso);

            var vecino = await _userManager.FindByIdAsync(vecinoId);
            if (vecino?.Email != null)
            {
                try
                {
                    await _plantillaCorreo.EnviarCorreoCasoAsync(
                          vecino.Email,
                          vecino.Nombre,
                          $"Caso registrado - {caso.Codigo} - Sistema QRDS",
                          "Hemos recibido tu caso correctamente.",
                          "Puedes dar seguimiento al estado de tu caso desde tu Portal Municipal, en la sección \"Mis casos\". Te avisaremos por este medio cuando haya novedades.",
                          ("Código del caso", caso.Codigo)
                      );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"No se pudo enviar el correo de confirmación del caso: {ex.Message}");
                }
            }

            var respuesta = new CasoCreadoResponse(
                caso.Id,
                caso.Codigo,
                "Queja",
                area.Nombre,
                aldea.Nombre,
                caso.Direccion,
                caso.TelefonoContacto,
                caso.Descripcion,
                caso.FechaRegistro,
                caso.Estado.ToString(),
                new List<ArchivoResponse>()
            );

            return (true, "La queja fue registrada correctamente.", respuesta);
        }

        public async Task<List<Area>> ObtenerAreasParaQuejasAsync()
        {
            return await _context.Areas
                .Where(a => a.Activo && a.AplicaQueja)
                .OrderBy(a => a.Nombre)
                .ToListAsync();
        }

        public async Task<List<Aldea>> ObtenerAldeasActivasAsync()
        {
            return await _context.Aldeas
                .Where(a => a.Activo)
                .OrderBy(a => a.Nombre)
                .ToListAsync();
        }

        public async Task<CasoVecinoDetalleResponse?> ObtenerPorIdAsync(int id, string vecinoId)
        {
            var caso = await _context.Casos
                .Include(c => c.Area)
                .Include(c => c.Aldea)
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.VecinoId == vecinoId);

            if (caso == null)
                return null;

            var archivos = await _context.ArchivosCaso
                .Where(a => a.CasoId == caso.Id)
                .Select(a => new ArchivoResponse(a.Id, a.NombreArchivo, a.RutaArchivo, a.TipoContenido))
                .ToListAsync();

            var solicitudInformacion = await _context.SolicitudesInformacionCaso
                .Where(s =>
                    s.CasoId == caso.Id &&
                    s.Estado == EstadoSolicitudInformacion.Pendiente)
                .OrderByDescending(s => s.FechaSolicitud)
                .Select(s => s.Mensaje)
                .FirstOrDefaultAsync();

            return new CasoVecinoDetalleResponse(
                caso.Id,
                caso.Codigo,
                caso.Area?.Nombre ?? "",
                caso.Aldea?.Nombre ?? "",
                caso.Direccion,
                caso.TelefonoContacto,
                caso.Descripcion,
                caso.FechaRegistro,
                caso.Estado.ToString(),
                archivos,
                solicitudInformacion
            );
        }
        public async Task<List<CasoAnalistaResponse>> ObtenerCasosDelAnalistaAsync(string analistaId)
        {
            return await _context.Casos
                .AsNoTracking()
                .Where(c => c.AnalistaId == analistaId)
                .Include(c => c.Area)
                .Include(c => c.Aldea)
                .OrderByDescending(c => c.FechaRegistro)
                .Select(c => new CasoAnalistaResponse(
                    c.Id,
                    c.Codigo,
                    c.Area != null ? c.Area.Nombre : "",
                    c.Aldea != null ? c.Aldea.Nombre : "",
                    c.Direccion,
                    c.Descripcion,
                    c.FechaRegistro,
                    c.Estado.ToString()
                ))
                .ToListAsync();
        }

        public async Task<CasoAnalistaDetalleResponse?> ObtenerDetalleParaAnalistaAsync(int casoId, string analistaId)
        {
            return await _context.Casos
                .AsNoTracking()
                .Where(c =>
                    c.Id == casoId &&
                    c.AnalistaId == analistaId)
                .Include(c => c.Area)
                .Include(c => c.Aldea)
                .Select(c => new CasoAnalistaDetalleResponse(
                    c.Id,
                    c.Codigo,
                    c.Area != null ? c.Area.Nombre : "",
                    c.Aldea != null ? c.Aldea.Nombre : "",
                    c.Direccion,
                    c.TelefonoContacto,
                    c.Descripcion,
                    c.FechaRegistro,
                    c.Estado.ToString(),

                    _context.InstruccionesTrabajo
                        .Where(i => i.CasoId == c.Id)
                        .Select(i => i.Instruccion)
                        .FirstOrDefault(),

                    _context.TrabajosCaso
                        .Where(t => t.CasoId == c.Id)
                        .OrderByDescending(t => t.FechaRegistro)
                        .Select(t => t.Resultado)
                        .FirstOrDefault(),

                    _context.TrabajosCaso
                        .Where(t => t.CasoId == c.Id)
                        .OrderByDescending(t => t.FechaRegistro)
                        .Select(t => (DateTime?)t.FechaRegistro)
                        .FirstOrDefault(),

                    _context.ArchivosCaso
                        .Where(a => a.CasoId == c.Id)
                        .Select(a => new ArchivoResponse(a.Id, a.NombreArchivo, a.RutaArchivo, a.TipoContenido))
                        .ToList()
                ))
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Exito, string Mensaje)> ValidarCasoAsync(int casoId, string analistaId)
        {
            var caso = await _context.Casos
                .FirstOrDefaultAsync(c =>
                    c.Id == casoId &&
                    c.AnalistaId == analistaId);

            if (caso == null)
                return (false, "El caso no existe o no está asignado a este analista.");

            if (caso.Estado != EstadoCaso.Asignada &&
                caso.Estado != EstadoCaso.EnValidacion)
            {
                return (false, "El caso no se encuentra disponible para validación.");
            }

            if (caso.Estado == EstadoCaso.EnValidacion)
            {
                var solicitud = await _context.SolicitudesInformacionCaso
                    .Where(s =>
                        s.CasoId == casoId &&
                        s.Estado == EstadoSolicitudInformacion.Respondida)
                    .OrderByDescending(s => s.FechaRespuesta)
                    .FirstOrDefaultAsync();

                if (solicitud == null)
                {
                    return (false, "El caso está en validación, pero no tiene una respuesta de información registrada.");
                }
            }

            caso.Estado = EstadoCaso.EnAnalisis;

            await _context.SaveChangesAsync();

            return (true, "El caso fue validado correctamente y pasó a análisis.");
        }

        public async Task<(bool Exito, string Mensaje)> SolicitarInformacionAsync(int casoId, string analistaId, SolicitarInformacionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Mensaje))
                return (false, "Debe indicar qué información necesita del vecino.");

            if (request.Mensaje.Length > 2000)
                return (false, "La solicitud no puede superar los 2000 caracteres.");

            var caso = await _context.Casos
                .FirstOrDefaultAsync(c =>
                    c.Id == casoId &&
                    c.AnalistaId == analistaId);

            if (caso == null)
                return (false, "El caso no existe o no está asignado a este analista.");

            if (caso.Estado != EstadoCaso.Asignada)
                return (false, "El caso no se encuentra disponible para solicitar información.");

            var solicitudPendiente = await _context.SolicitudesInformacionCaso
                .AnyAsync(s =>
                    s.CasoId == casoId &&
                    s.Estado == EstadoSolicitudInformacion.Pendiente);

            if (solicitudPendiente)
                return (false, "El caso ya tiene una solicitud de información pendiente.");

            var solicitud = new SolicitudInformacionCaso
            {
                CasoId = casoId,
                AnalistaId = analistaId,
                Mensaje = request.Mensaje.Trim(),
                FechaSolicitud = DateTime.UtcNow,
                Estado = EstadoSolicitudInformacion.Pendiente
            };

            _context.SolicitudesInformacionCaso.Add(solicitud);

            caso.Estado = EstadoCaso.PendienteInformacion;

            await _context.SaveChangesAsync();

            var vecinoInfo = await _userManager.FindByIdAsync(caso.VecinoId);
            if (vecinoInfo?.Email != null)
            {
                try
                {
                                await _plantillaCorreo.EnviarCorreoCasoAsync(
                    vecinoInfo.Email,
                    vecinoInfo.Nombre,
                    $"Se necesita más información - {caso.Codigo} - Sistema QRDS",
                    $"Necesitamos información adicional para continuar con tu caso {caso.Codigo}:",
                    "Ingresa a \"Mis casos\" en tu Portal Municipal para responder.",
                    ("Mensaje del analista", request.Mensaje.Trim())
                );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"No se pudo enviar el correo de solicitud de información: {ex.Message}");
                }
            }

            return (true, "Se solicitó información al vecino correctamente.");
        }

        public async Task<(bool Exito, string Mensaje)> ResponderInformacionAsync(int casoId, string vecinoId, ResponderInformacionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Respuesta))
                return (false, "Debe proporcionar una respuesta.");

            if (request.Respuesta.Length > 2000)
                return (false, "La respuesta no puede superar los 2000 caracteres.");

            var caso = await _context.Casos
                .FirstOrDefaultAsync(c =>
                    c.Id == casoId &&
                    c.VecinoId == vecinoId);

            if (caso == null)
                return (false, "El caso no existe o no pertenece al vecino.");

            if (caso.Estado != EstadoCaso.PendienteInformacion)
                return (false, "El caso no tiene una solicitud de información pendiente.");

            var solicitud = await _context.SolicitudesInformacionCaso
                .Where(s =>
                    s.CasoId == casoId &&
                    s.Estado == EstadoSolicitudInformacion.Pendiente)
                .OrderByDescending(s => s.FechaSolicitud)
                .FirstOrDefaultAsync();

            if (solicitud == null)
                return (false, "No existe una solicitud de información pendiente para este caso.");

            solicitud.Respuesta = request.Respuesta.Trim();
            solicitud.FechaRespuesta = DateTime.UtcNow;
            solicitud.Estado = EstadoSolicitudInformacion.Respondida;

            caso.Estado = EstadoCaso.EnValidacion;

            await _context.SaveChangesAsync();

            return (true, "La información fue enviada correctamente y el caso pasó a validación.");
        }

        public async Task<(bool Exito, string Mensaje)> CrearInstruccionTrabajoAsync(int casoId, string analistaId, CrearInstruccionTrabajoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Instruccion))
                return (false, "Debe indicar las instrucciones de trabajo.");

            if (request.Instruccion.Length > 2000)
                return (false, "La instrucción no puede superar los 2000 caracteres.");

            var caso = await _context.Casos
                .FirstOrDefaultAsync(c =>
                    c.Id == casoId &&
                    c.AnalistaId == analistaId);

            if (caso == null)
                return (false, "El caso no existe o no está asignado a este analista.");

            if (caso.Estado != EstadoCaso.EnAnalisis)
                return (false, "El caso no se encuentra en estado EnAnalisis.");

            var instruccionExistente = await _context.InstruccionesTrabajo
                .AnyAsync(i => i.CasoId == casoId);

            if (instruccionExistente)
                return (false, "El caso ya tiene una instrucción de trabajo.");

            var perfilesOperarios = await _context.PerfilesEmpleado
                .Include(p => p.Areas)
                .Where(p => p.Areas.Any(a => a.Id == caso.AreaId))
                .ToListAsync();

            if (!perfilesOperarios.Any())
                return (false, "No existen empleados asociados al área del caso.");

            var usuariosEmpleado = await _userManager.GetUsersInRoleAsync("Empleado");

            var usuariosActivos = usuariosEmpleado
                .Where(u => u.Activo)
                .ToList();

            var candidatos = perfilesOperarios
                .Where(p => usuariosActivos.Any(u => u.Id == p.UserId))
                .Select(p => p.UserId)
                .Distinct()
                .ToList();

            if (!candidatos.Any())
                return (false, "No existen operarios activos disponibles para el área del caso.");

            var estadosActivosOperario = new[]
            {
                EstadoCaso.AsignadaAOperario,
                EstadoCaso.EnEjecucion,
                EstadoCaso.TrabajoRealizado,
                EstadoCaso.EnVerificacion
            };

            var cargas = await _context.InstruccionesTrabajo
                .Where(i =>
                    candidatos.Contains(i.OperarioId) &&
                    i.Caso != null &&
                    estadosActivosOperario.Contains(i.Caso.Estado))
                .GroupBy(i => i.OperarioId)
                .Select(g => new
                {
                    OperarioId = g.Key,
                    Cantidad = g.Count()
                })
                .ToListAsync();

            var operarioSeleccionado = candidatos
                .Select(id => new
                {
                    OperarioId = id,
                    Cantidad = cargas
                        .FirstOrDefault(c => c.OperarioId == id)?.Cantidad ?? 0
                })
                .OrderBy(x => x.Cantidad)
                .ThenBy(x => x.OperarioId)
                .First();

            var instruccion = new InstruccionTrabajo
            {
                CasoId = casoId,
                AnalistaId = analistaId,
                Instruccion = request.Instruccion.Trim(),
                OperarioId = operarioSeleccionado.OperarioId,
                FechaCreacion = DateTime.UtcNow,
                FechaAsignacion = DateTime.UtcNow
            };

            _context.InstruccionesTrabajo.Add(instruccion);

            caso.Estado = EstadoCaso.AsignadaAOperario;

            await _context.SaveChangesAsync();

            var operario = await _userManager.FindByIdAsync(operarioSeleccionado.OperarioId);
            if (operario?.Email != null)
            {
                try
                {
                    await _plantillaCorreo.EnviarCorreoCasoAsync(
                         operario.Email,
                         operario.Nombre,
                         $"Nuevo trabajo asignado - {caso.Codigo} - Sistema QRDS",
                         "Se te ha asignado un caso para atender en campo.",
                         "Ingresa al Portal Municipal para ver el detalle completo e iniciar el trabajo.",
                         ("Código del caso", caso.Codigo)
                     );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"No se pudo enviar el correo de asignación al operario: {ex.Message}");
                }
            }

            return (true, "La instrucción fue creada y el caso fue asignado al operario correctamente.");
        }

        public async Task<List<CasoOperarioResponse>> ObtenerCasosDelOperarioAsync(string operarioId)
        {
            return await _context.InstruccionesTrabajo
                .AsNoTracking()
                .Where(i => i.OperarioId == operarioId)
                .Include(i => i.Caso)
                    .ThenInclude(c => c!.Area)
                .Include(i => i.Caso)
                    .ThenInclude(c => c!.Aldea)
                .Where(i => i.Caso != null)
                .OrderByDescending(i => i.Caso!.FechaRegistro)
                .Select(i => new CasoOperarioResponse(
                    i.Caso!.Id,
                    i.Caso.Codigo,
                    i.Caso.Area != null ? i.Caso.Area.Nombre : "",
                    i.Caso.Aldea != null ? i.Caso.Aldea.Nombre : "",
                    i.Caso.Direccion,
                    i.Caso.Descripcion,
                    i.Caso.FechaRegistro,
                    i.Caso.Estado.ToString()
                ))
                .ToListAsync();
        }

        public async Task<CasoOperarioDetalleResponse?> ObtenerDetalleParaOperarioAsync(int casoId, string operarioId)
        {
            return await _context.InstruccionesTrabajo
                .AsNoTracking()
                .Where(i =>
                    i.CasoId == casoId &&
                    i.OperarioId == operarioId)
                .Include(i => i.Caso)
                    .ThenInclude(c => c!.Area)
                .Include(i => i.Caso)
                    .ThenInclude(c => c!.Aldea)
                .Select(i => new CasoOperarioDetalleResponse(
                    i.Caso!.Id,
                    i.Caso.Codigo,
                    i.Caso.Area != null ? i.Caso.Area.Nombre : "",
                    i.Caso.Aldea != null ? i.Caso.Aldea.Nombre : "",
                    i.Caso.Direccion,
                    i.Caso.TelefonoContacto,
                    i.Caso.Descripcion,
                    i.Caso.FechaRegistro,
                    i.Caso.Estado.ToString(),
                    i.Instruccion,

                    _context.SolicitudesCorreccionTrabajo
                        .Where(s =>
                            s.CasoId == i.CasoId &&
                            s.OperarioId == operarioId)
                        .OrderByDescending(s => s.FechaSolicitud)
                        .Select(s => s.Correccion)
                        .FirstOrDefault(),

                    _context.ArchivosCaso
                        .Where(a => a.CasoId == i.CasoId)
                        .Select(a => new ArchivoResponse(a.Id, a.NombreArchivo, a.RutaArchivo, a.TipoContenido))
                        .ToList()
                ))
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Exito, string Mensaje)> IniciarTrabajoAsync(int casoId, string operarioId)
        {
            var caso = await _context.Casos.FirstOrDefaultAsync(c => c.Id == casoId);

            if (caso == null)
                return (false, "El caso no existe.");

            var instruccion = await _context.InstruccionesTrabajo
                .FirstOrDefaultAsync(i =>
                    i.CasoId == casoId &&
                    i.OperarioId == operarioId);

            if (instruccion == null)
                return (false, "El caso no está asignado a este operario.");

            if (caso.Estado != EstadoCaso.AsignadaAOperario)
            {
                return (false, "El caso no se encuentra disponible para iniciar el trabajo.");
            }

            caso.Estado = EstadoCaso.EnEjecucion;

            await _context.SaveChangesAsync();

            return (true, "El trabajo fue iniciado correctamente.");
        }

     

        public async Task<(bool Exito, string Mensaje)> AprobarTrabajoAsync(int casoId, string analistaId)
        {
            var caso = await _context.Casos
                .FirstOrDefaultAsync(c =>
                    c.Id == casoId &&
                    c.AnalistaId == analistaId);

            if (caso == null)
                return (false, "El caso no existe o no está asignado a este analista.");

            if (caso.Estado != EstadoCaso.EnVerificacion)
                return (false, "El caso no se encuentra en estado EnVerificacion.");

            var trabajo = await _context.TrabajosCaso
                .Where(t => t.CasoId == casoId)
                .OrderByDescending(t => t.FechaRegistro)
                .FirstOrDefaultAsync();

            if (trabajo == null)
                return (false, "El caso no tiene un trabajo registrado para verificar.");

            caso.Estado = EstadoCaso.Solucionada;

            await _context.SaveChangesAsync();

            var vecinoResuelto = await _userManager.FindByIdAsync(caso.VecinoId);
            if (vecinoResuelto?.Email != null)
            {
                try
                {
                    await EnviarCorreoCasoAsync(
                        vecinoResuelto.Email,
                        vecinoResuelto.Nombre,
                        $"Tu caso {caso.Codigo} ha sido resuelto correctamente.",
                        "Puedes revisar el detalle completo desde \"Mis casos\" en tu Portal Municipal. Gracias por ayudarnos a mejorar los servicios municipales.",
                        null
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"No se pudo enviar el correo de caso resuelto: {ex.Message}");
                }
            }

            return (true, "El trabajo fue verificado correctamente y el caso quedó solucionado.");
        }

        public async Task<(bool Exito, string Mensaje)> SolicitarCorreccionAsync(int casoId, string analistaId, SolicitarCorreccionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Correccion))
                return (false, "Debe indicar qué debe corregir el operario.");

            if (request.Correccion.Length > 2000)
                return (false, "La descripción de la corrección no puede superar los 2000 caracteres.");

            var caso = await _context.Casos
                .FirstOrDefaultAsync(c =>
                    c.Id == casoId &&
                    c.AnalistaId == analistaId);

            if (caso == null)
                return (false, "El caso no existe o no está asignado a este analista.");

            if (caso.Estado != EstadoCaso.EnVerificacion)
                return (false, "El caso no se encuentra en estado EnVerificacion.");

            var trabajo = await _context.TrabajosCaso
                .Where(t => t.CasoId == casoId)
                .OrderByDescending(t => t.FechaRegistro)
                .FirstOrDefaultAsync();

            if (trabajo == null)
                return (false, "El caso no tiene un trabajo registrado para solicitar corrección.");

            var instruccion = await _context.InstruccionesTrabajo.FirstOrDefaultAsync(i => i.CasoId == casoId);

            if (instruccion == null)
                return (false, "El caso no tiene una instrucción de trabajo asignada.");

            var solicitud = new SolicitudCorreccionTrabajo
            {
                CasoId = casoId,
                AnalistaId = analistaId,
                OperarioId = instruccion.OperarioId,
                Correccion = request.Correccion.Trim(),
                FechaSolicitud = DateTime.UtcNow
            };

            _context.SolicitudesCorreccionTrabajo.Add(solicitud);

            caso.Estado = EstadoCaso.EnEjecucion;

            await _context.SaveChangesAsync();

            return (true, "Se solicitó una corrección al operario y el caso regresó a ejecución.");
        }

        public async Task<(bool Exito, string Mensaje)> SubirEvidenciaAsync(int casoId, string vecinoId, List<IFormFile> archivos)
        {
            var caso = await _context.Casos.FirstOrDefaultAsync(c => c.Id == casoId && c.VecinoId == vecinoId);
            if (caso == null)
                return (false, "El caso no existe o no pertenece al vecino.");

            if (archivos == null || archivos.Count == 0)
                return (false, "No se recibió ningún archivo.");

            if (archivos.Count > 3)
                return (false, "Solo puedes subir un máximo de 2 fotos y 1 documento.");

            var fotosExistentes = await _context.ArchivosCaso.CountAsync(a => a.CasoId == casoId && a.TipoContenido.StartsWith("image/"));
            var documentosExistentes = await _context.ArchivosCaso.CountAsync(a => a.CasoId == casoId && a.TipoContenido == "application/pdf");

            foreach (var archivo in archivos)
            {
                if (archivo.Length == 0)
                    return (false, $"El archivo {archivo.FileName} está vacío.");

                if (archivo.Length > 5 * 1024 * 1024)
                    return (false, $"El archivo {archivo.FileName} excede el tamaño máximo de 5 MB.");

                var extension = Path.GetExtension(archivo.FileName).ToLower();
                var esImagen = extension is ".png" or ".jpg" or ".jpeg";
                var esPdf = extension == ".pdf";

                if (!esImagen && !esPdf)
                    return (false, $"El archivo {archivo.FileName} tiene un formato no permitido. Usa PNG, JPG o PDF.");

                if (!await ValidarFirmaArchivoAsync(archivo, esPdf))
                    return (false, $"El archivo {archivo.FileName} no es un {(esPdf ? "PDF" : "imagen")} válido.");

                if (esImagen && fotosExistentes >= 2)
                    return (false, "Ya se alcanzó el máximo de 2 fotos para este caso.");

                if (esPdf && documentosExistentes >= 1)
                    return (false, "Ya se alcanzó el máximo de 1 documento para este caso.");

                var nombreSaneado = SanearNombreArchivo(archivo.FileName);
                var url = await _blobStorageService.SubirArchivoAsync(archivo, casoId);

                _context.ArchivosCaso.Add(new ArchivoCaso
                {
                    CasoId = casoId,
                    NombreArchivo = nombreSaneado,
                    RutaArchivo = url,
                    TipoContenido = archivo.ContentType,
                    TamanoBytes = archivo.Length
                });

                if (esImagen) fotosExistentes++;
                if (esPdf) documentosExistentes++;
            }

            await _context.SaveChangesAsync();
            return (true, "Evidencia subida correctamente.");
        }

        private static async Task<bool> ValidarFirmaArchivoAsync(IFormFile archivo, bool esPdf)
        {
            var buffer = new byte[8];
            using (var stream = archivo.OpenReadStream())
            {
                var leidos = await stream.ReadAsync(buffer, 0, buffer.Length);
                if (leidos < 4) return false;
            }

            if (esPdf)
                return buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46;

            var esPng = buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47;
            var esJpg = buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF;

            return esPng || esJpg;
        }

        private static string SanearNombreArchivo(string nombreOriginal)
        {
            var nombre = Path.GetFileName(nombreOriginal);
            var caracteresInvalidos = Path.GetInvalidFileNameChars();
            var limpio = new string(nombre.Where(c => !caracteresInvalidos.Contains(c)).ToArray());
            return limpio.Length > 255 ? limpio.Substring(0, 255) : limpio;
        }

        public async Task<List<CasoVecinoResponse>> ObtenerCasosDelVecinoAsync(string vecinoId)
        {
            return await _context.Casos
                .AsNoTracking()
                .Where(c => c.VecinoId == vecinoId)
                .Include(c => c.Area)
                .OrderByDescending(c => c.FechaRegistro)
                .Select(c => new CasoVecinoResponse(
                    c.Id,
                    c.Codigo,
                    c.Area != null ? c.Area.Nombre : "",
                    c.Descripcion,
                    c.FechaRegistro,
                    c.Estado.ToString()
                ))
                .ToListAsync();
        }

        public async Task<List<CasoAdminResponse>> ObtenerTodosLosCasosAsync()
        {
            return await _context.Casos
                .AsNoTracking()
                .Include(c => c.Area)
                .Include(c => c.Aldea)
                .Include(c => c.Analista)
                .OrderByDescending(c => c.FechaRegistro)
                .Select(c => new CasoAdminResponse(
                    c.Id,
                    c.Codigo,
                    c.Area != null ? c.Area.Nombre : "",
                    c.Aldea != null ? c.Aldea.Nombre : "",
                    c.Direccion,
                    c.Descripcion,
                    c.FechaRegistro,
                    c.Estado.ToString(),
                    c.Analista != null ? c.Analista.Nombre + " " + c.Analista.Apellido : null
                ))
                .ToListAsync();
        }

        public async Task<CasoAdminDetalleResponse?> ObtenerDetalleAdminAsync(int casoId)
        {
            var caso = await _context.Casos
                .Include(c => c.Area)
                .Include(c => c.Aldea)
                .Include(c => c.Vecino)
                .Include(c => c.Analista)
                .FirstOrDefaultAsync(c => c.Id == casoId);

            if (caso == null)
                return null;

            var archivos = await _context.ArchivosCaso
                .Where(a => a.CasoId == casoId)
                .Select(a => new ArchivoResponse(a.Id, a.NombreArchivo, a.RutaArchivo, a.TipoContenido))
                .ToListAsync();

            var solicitudesInfo = await _context.SolicitudesInformacionCaso
                .Where(s => s.CasoId == casoId)
                .OrderBy(s => s.FechaSolicitud)
                .ToListAsync();

            var instruccion = await _context.InstruccionesTrabajo
                .FirstOrDefaultAsync(i => i.CasoId == casoId);

            var trabajos = await _context.TrabajosCaso
                .Where(t => t.CasoId == casoId)
                .OrderBy(t => t.FechaRegistro)
                .ToListAsync();

            var correcciones = await _context.SolicitudesCorreccionTrabajo
                .Where(s => s.CasoId == casoId)
                .OrderBy(s => s.FechaSolicitud)
                .ToListAsync();

            string? operarioNombre = null;
            if (instruccion != null)
            {
                var operario = await _userManager.FindByIdAsync(instruccion.OperarioId);
                if (operario != null)
                    operarioNombre = $"{operario.Nombre} {operario.Apellido}";
            }

            var vecinoNombre = caso.Vecino != null ? $"{caso.Vecino.Nombre} {caso.Vecino.Apellido}" : null;
            var analistaNombre = caso.Analista != null ? $"{caso.Analista.Nombre} {caso.Analista.Apellido}" : null;

            var historial = new List<HistorialItemResponse>
    {
        new HistorialItemResponse("Registro", caso.FechaRegistro, vecinoNombre, "El vecino registró el caso.")
    };

            if (analistaNombre != null)
                historial.Add(new HistorialItemResponse("Asignación", caso.FechaRegistro, null, $"Asignado al analista {analistaNombre}."));

            foreach (var solicitud in solicitudesInfo)
            {
                historial.Add(new HistorialItemResponse("Solicitud de información", solicitud.FechaSolicitud, analistaNombre, solicitud.Mensaje));

                if (solicitud.Respuesta != null && solicitud.FechaRespuesta.HasValue)
                    historial.Add(new HistorialItemResponse("Respuesta del vecino", solicitud.FechaRespuesta.Value, vecinoNombre, solicitud.Respuesta));
            }

            if (instruccion != null)
            {
                historial.Add(new HistorialItemResponse("Instrucción de trabajo", instruccion.FechaCreacion, analistaNombre, instruccion.Instruccion));
                historial.Add(new HistorialItemResponse("Asignación a operario", instruccion.FechaAsignacion ?? instruccion.FechaCreacion, null, $"Asignado al operario {operarioNombre}."));
            }

            foreach (var trabajo in trabajos)
                historial.Add(new HistorialItemResponse("Trabajo registrado", trabajo.FechaRegistro, operarioNombre, trabajo.Resultado));

            foreach (var correccion in correcciones)
                historial.Add(new HistorialItemResponse("Corrección solicitada", correccion.FechaSolicitud, analistaNombre, correccion.Correccion));

            var historialOrdenado = historial.OrderBy(h => h.Fecha).ToList();

            return new CasoAdminDetalleResponse(
                caso.Id,
                caso.Codigo,
                caso.Area?.Nombre ?? "",
                caso.Aldea?.Nombre ?? "",
                caso.Direccion,
                caso.TelefonoContacto,
                caso.Descripcion,
                caso.FechaRegistro,
                caso.Estado.ToString(),
                vecinoNombre,
                analistaNombre,
                operarioNombre,
                archivos,
                historialOrdenado
            );
        }


       

        public async Task<(bool Exito, string Mensaje)> RegistrarTrabajoAsync(int casoId, string operarioId, RegistrarTrabajoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Resultado))
                return (false, "Debe indicar el resultado del trabajo realizado.");

            if (request.Resultado.Length > 2000)
                return (false, "El resultado no puede superar los 2000 caracteres.");

            var caso = await _context.Casos.FirstOrDefaultAsync(c => c.Id == casoId);

            if (caso == null)
                return (false, "El caso no existe.");

            var instruccion = await _context.InstruccionesTrabajo
                .FirstOrDefaultAsync(i =>
                    i.CasoId == casoId &&
                    i.OperarioId == operarioId);

            if (instruccion == null)
                return (false, "El caso no está asignado a este operario.");

            if (caso.Estado != EstadoCaso.EnEjecucion)
                return (false, "El caso no se encuentra en ejecución.");

            var trabajo = new TrabajoCaso
            {
                CasoId = casoId,
                OperarioId = operarioId,
                Resultado = request.Resultado.Trim(),
                FechaRegistro = DateTime.UtcNow
            };

            _context.TrabajosCaso.Add(trabajo);

            caso.Estado = EstadoCaso.EnVerificacion;

            await _context.SaveChangesAsync();

            return (true, "El trabajo fue registrado correctamente y el caso pasó a verificación.");
        }

        public async Task<CasoSolucionResponse?> ObtenerSolucionAsync(int casoId)
        {
            var caso = await _context.Casos.FirstOrDefaultAsync(c => c.Id == casoId);
            if (caso == null) return null;

            var trabajo = await _context.TrabajosCaso
                .Where(t => t.CasoId == casoId)
                .OrderByDescending(t => t.FechaRegistro)
                .FirstOrDefaultAsync();

            var instruccion = await _context.InstruccionesTrabajo
                .FirstOrDefaultAsync(i => i.CasoId == casoId);

            var archivos = instruccion != null
                ? await _context.ArchivosCaso
                    .Where(a => a.CasoId == casoId && a.SubidoPorUserId == instruccion.OperarioId)
                    .Select(a => new ArchivoResponse(a.Id, a.NombreArchivo, a.RutaArchivo, a.TipoContenido))
                    .ToListAsync()
                : new List<ArchivoResponse>();

            return new CasoSolucionResponse(
                caso.Codigo,
                caso.Estado.ToString(),
                trabajo?.Resultado,
                trabajo?.FechaRegistro,
                archivos
            );
        }
    }
}