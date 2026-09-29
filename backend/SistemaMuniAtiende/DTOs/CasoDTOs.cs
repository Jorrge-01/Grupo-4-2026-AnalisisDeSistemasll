namespace SistemaMuniAtiende.DTOs
{
    public record CrearCasoRequest(
        int AreaId,
        int AldeaId,
        string Direccion,
        string TelefonoContacto,
        string Descripcion
    );

    public record CasoCreadoResponse(
    int Id,
    string Codigo,
    string Tipo,
    string Area,
    string Aldea,
    string Direccion,
    string TelefonoContacto,
    string Descripcion,
    DateTime FechaRegistro,
    string Estado,
    List<ArchivoResponse> Archivos
);

    public record CasoAnalistaResponse(
        int Id,
        string Codigo,
        string Area,
        string Aldea,
        string Direccion,
        string Descripcion,
        DateTime FechaRegistro,
        string Estado
    );

    public record ArchivoResponse(
    int Id,
    string NombreArchivo,
    string RutaArchivo,
    string TipoContenido
);

    public record CasoAnalistaDetalleResponse(
        int Id,
        string Codigo,
        string Area,
        string Aldea,
        string Direccion,
        string TelefonoContacto,
        string Descripcion,
        DateTime FechaRegistro,
        string Estado,
        string? Instruccion,
        string? ResultadoTrabajo,
        DateTime? FechaTrabajo,
        List<ArchivoResponse> Archivos
    );

    public record SolicitarInformacionRequest(string Mensaje);
    public record ResponderInformacionRequest(string Respuesta);
    public record CrearInstruccionTrabajoRequest(string Instruccion);

    public record CasoOperarioResponse(
        int Id,
        string Codigo,
        string Area,
        string Aldea,
        string Direccion,
        string Descripcion,
        DateTime FechaRegistro,
        string Estado
    );

    public record CasoVecinoResponse(
    int Id,
    string Codigo,
    string Area,
    string Descripcion,
    DateTime FechaRegistro,
    string Estado
);

    public record CasoVecinoDetalleResponse(
    int Id,
    string Codigo,
    string Area,
    string Aldea,
    string Direccion,
    string TelefonoContacto,
    string Descripcion,
    DateTime FechaRegistro,
    string Estado,
    List<ArchivoResponse> Archivos,
    string? SolicitudInformacion
);



    public record CasoOperarioDetalleResponse(
        int Id,
        string Codigo,
        string Area,
        string Aldea,
        string Direccion,
        string TelefonoContacto,
        string Descripcion,
        DateTime FechaRegistro,
        string Estado,
        string Instruccion,
        string? Correccion,
        List<ArchivoResponse> Archivos
    );
    public record CasoAdminResponse(
    int Id,
    string Codigo,
    string Area,
    string Aldea,
    string Direccion,
    string Descripcion,
    DateTime FechaRegistro,
    string Estado,
    string? Analista
);
    public record HistorialItemResponse(string Tipo, DateTime Fecha, string? Actor, string? Detalle);

    public record CasoAdminDetalleResponse(
        int Id,
        string Codigo,
        string Area,
        string Aldea,
        string Direccion,
        string TelefonoContacto,
        string Descripcion,
        DateTime FechaRegistro,
        string Estado,
        string? Vecino,
        string? Analista,
        string? Operario,
        List<ArchivoResponse> Archivos,
        List<HistorialItemResponse> Historial
    );

    public record CasoSolucionResponse(
    string Codigo,
    string Estado,
    string? ResultadoTrabajo,
    DateTime? FechaTrabajo,
    List<ArchivoResponse> Archivos
);
    public record RegistrarTrabajoRequest(string Resultado);
    public record SolicitarCorreccionRequest(string Correccion);
}