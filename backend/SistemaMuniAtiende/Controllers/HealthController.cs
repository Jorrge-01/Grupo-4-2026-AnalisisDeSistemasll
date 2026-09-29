using Microsoft.AspNetCore.Mvc;

namespace SistemaMuniAtiende.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { estado = "ok" });
        }
    }
}