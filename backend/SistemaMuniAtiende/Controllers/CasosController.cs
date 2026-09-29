using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaMuniAtiende.DTOs;
using SistemaMuniAtiende.Models;
using SistemaMuniAtiende.Services;
using System.Security.Claims;

namespace SistemaMuniAtiende.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CasosController : ControllerBase
    {
        private readonly CasoService _casoService;

        public CasosController(CasoService casoService)
        {
            _casoService = casoService;
        }

        [HttpGet("areas-quejas")]
        [Authorize(Roles = "Vecino")]
        public async Task<IActionResult> ObtenerAreasParaQuejas()
        {
            var areas = await _casoService.ObtenerAreasParaQuejasAsync();
            return Ok(areas);
        }

        [HttpGet("aldeas")]
        [Authorize(Roles = "Vecino")]
        public async Task<IActionResult> ObtenerAldeas()
        {
            var aldeas = await _casoService.ObtenerAldeasActivasAsync();
            return Ok(aldeas);
        }

        [HttpPost]
        [Authorize(Roles = "Vecino")]
        public async Task<IActionResult> Registrar(CrearCasoRequest req)
        {
            var vecinoId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (vecinoId == null)
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario." });

            var resultado = await _casoService.RegistrarQuejaAsync(vecinoId, req);

            if (!resultado.Exito)
                return BadRequest(new { mensaje = resultado.Mensaje });

            return CreatedAtAction(
                nameof(ObtenerPorId),
                new { id = resultado.Caso!.Id },
                resultado.Caso);
        }
              

        [HttpGet("{id}")]
        [Authorize(Roles = "Vecino")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var vecinoId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (vecinoId == null)
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario." });

            var caso = await _casoService.ObtenerPorIdAsync(id, vecinoId);

            if (caso == null)
                return NotFound(new { mensaje = "Caso no encontrado." });

            return Ok(caso);
        }

        [HttpGet("mis-casos")]
        [Authorize(Roles = "Analista")]
        public async Task<IActionResult> ObtenerMisCasos()
        {
            var analistaId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (analistaId == null)
                return Unauthorized(new { mensaje = "No se pudo identificar al analista." });

            var casos = await _casoService.ObtenerCasosDelAnalistaAsync(analistaId);

            return Ok(casos);
        }

        [HttpGet("{id}/detalle")]
        [Authorize(Roles = "Analista")]
        public async Task<IActionResult> ObtenerDetalleParaAnalista(int id)
        {
            var analistaId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (analistaId == null)
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al analista."
                });

            var caso = await _casoService
                .ObtenerDetalleParaAnalistaAsync(id, analistaId);

            if (caso == null)
                return NotFound(new
                {
                    mensaje = "El caso no existe o no está asignado a este analista."
                });

            return Ok(caso);
        }

        [HttpPost("{id}/validar")]
        [Authorize(Roles = "Analista")]
        public async Task<IActionResult> ValidarCaso(int id)
        {
            var analistaId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (analistaId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al analista."
                });
            }

            var resultado = await _casoService.ValidarCasoAsync(
                id,
                analistaId
            );

            if (!resultado.Exito)
            {
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });
            }

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.EnAnalisis.ToString()
            });
        }

        [HttpPost("{id}/solicitar-informacion")]
        [Authorize(Roles = "Analista")]
        public async Task<IActionResult> SolicitarInformacion(int id, SolicitarInformacionRequest request)
        {
            var analistaId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (analistaId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al analista."
                });
            }

            var resultado = await _casoService.SolicitarInformacionAsync(
                id,
                analistaId,
                request
            );

            if (!resultado.Exito)
            {
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });
            }

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.PendienteInformacion.ToString()
            });
        }

        [HttpPost("{id}/responder-informacion")]
        [Authorize(Roles = "Vecino")]
        public async Task<IActionResult> ResponderInformacion(int id, [FromForm] string respuesta, [FromForm] List<IFormFile>? archivos)
        {
            var vecinoId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (vecinoId == null)
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al vecino."
                });

            var resultado = await _casoService.ResponderInformacionAsync(
                id,
                vecinoId,
                respuesta,
                archivos);

            if (!resultado.Exito)
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.EnValidacion.ToString()
            });
        }

        [HttpPost("{id}/instruccion")]
        [Authorize(Roles = "Analista")]
        public async Task<IActionResult> CrearInstruccion(int id, CrearInstruccionTrabajoRequest request)
        {
            var analistaId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (analistaId == null)
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al analista."
                });

            var resultado = await _casoService.CrearInstruccionTrabajoAsync(
                id,
                analistaId,
                request);

            if (!resultado.Exito)
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.AsignadaAOperario.ToString()
            });
        }

        [HttpGet("mis-casos-operario")]
        [Authorize(Roles = "Empleado")]
        public async Task<IActionResult> ObtenerMisCasosOperario()
        {
            var operarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (operarioId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al operario."
                });
            }

            var casos = await _casoService.ObtenerCasosDelOperarioAsync(
                operarioId);

            return Ok(casos);
        }

        [HttpGet("{id}/detalle-operario")]
        [Authorize(Roles = "Empleado")]
        public async Task<IActionResult> ObtenerDetalleParaOperario(int id)
        {
            var operarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (operarioId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al operario."
                });
            }

            var caso = await _casoService.ObtenerDetalleParaOperarioAsync(
                id,
                operarioId);

            if (caso == null)
            {
                return NotFound(new
                {
                    mensaje = "El caso no existe o no está asignado a este operario."
                });
            }

            return Ok(caso);
        }

        [HttpPost("{id}/iniciar-trabajo")]
        [Authorize(Roles = "Empleado")]
        public async Task<IActionResult> IniciarTrabajo(int id)
        {
            var operarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (operarioId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al operario."
                });
            }

            var resultado = await _casoService.IniciarTrabajoAsync(
                id,
                operarioId);

            if (!resultado.Exito)
            {
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });
            }

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.EnEjecucion.ToString()
            });
        }

        [HttpPost("{id}/registrar-trabajo")]
        [Authorize(Roles = "Empleado")]
        public async Task<IActionResult> RegistrarTrabajo(int id, RegistrarTrabajoRequest request)
        {
            var operarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (operarioId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al operario."
                });
            }

            var resultado = await _casoService.RegistrarTrabajoAsync(
                id,
                operarioId,
                request);

            if (!resultado.Exito)
            {
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });
            }

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.EnVerificacion.ToString()
            });
        }

        [HttpPost("{id}/aprobar-trabajo")]
        [Authorize(Roles = "Analista")]
        public async Task<IActionResult> AprobarTrabajo(int id)
        {
            var analistaId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (analistaId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al analista."
                });
            }

            var resultado = await _casoService.AprobarTrabajoAsync(
                id,
                analistaId);

            if (!resultado.Exito)
            {
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });
            }

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.Solucionada.ToString()
            });
        }

        [HttpPost("{id}/solicitar-correccion")]
        [Authorize(Roles = "Analista")]
        public async Task<IActionResult> SolicitarCorreccion(int id, SolicitarCorreccionRequest request)
        {
            var analistaId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;


            if (analistaId == null)
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al analista."
                });
            }

            var resultado = await _casoService.SolicitarCorreccionAsync(
                id,
                analistaId,
                request);

            if (!resultado.Exito)
            {
                return BadRequest(new
                {
                    mensaje = resultado.Mensaje
                });
            }

            return Ok(new
            {
                mensaje = resultado.Mensaje,
                estado = EstadoCaso.EnEjecucion.ToString()
            });
        }


        [HttpPost("{id}/evidencia")]
        [Authorize(Roles = "Vecino")]
        public async Task<IActionResult> SubirEvidencia(int id, [FromForm] List<IFormFile> archivos)
        {
            var vecinoId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (vecinoId == null) return Unauthorized(new { mensaje = "No se pudo identificar al usuario." });

            var resultado = await _casoService.SubirEvidenciaAsync(id, vecinoId, archivos);

            if (!resultado.Exito) return BadRequest(new { mensaje = resultado.Mensaje });
            return Ok(new { mensaje = resultado.Mensaje });
        }

        [HttpGet("mis-casos-vecino")]
        [Authorize(Roles = "Vecino")]
        public async Task<IActionResult> ObtenerMisCasosVecino()
        {
            var vecinoId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (vecinoId == null) return Unauthorized(new { mensaje = "No se pudo identificar al usuario." });

            var casos = await _casoService.ObtenerCasosDelVecinoAsync(vecinoId);
            return Ok(casos);
        }

        [HttpGet]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ObtenerTodos()
        {
            var casos = await _casoService.ObtenerTodosLosCasosAsync();
            return Ok(casos);
        }

        [HttpGet("{id}/admin-detalle")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ObtenerDetalleAdmin(int id)
        {
            var caso = await _casoService.ObtenerDetalleAdminAsync(id);
            if (caso == null) return NotFound(new { mensaje = "El caso no existe." });
            return Ok(caso);
        }

        [HttpGet("{id}/solucion")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ObtenerSolucion(int id)
        {
            var solucion = await _casoService.ObtenerSolucionAsync(id);
            if (solucion == null) return NotFound(new { mensaje = "El caso no existe." });
            return Ok(solucion);
        }
    }
}






