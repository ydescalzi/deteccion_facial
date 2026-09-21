import {
  Building2,
  Camera,
  CheckCircle2,
  GraduationCap,
  Mail,
  RefreshCw,
  ScanFace,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  UserRound,
  Video,
  VideoOff,
  X,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAcademic } from "../../context/AcademicContext";
import type { Docente } from "../../data/docentes";
import PerfilDocente from "./PerfilDocente";


interface FormularioDocente {
  codigo: string;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  facultad: string;
  escuela: string;
  especialidad: string;
  estado: "Activo" | "Inactivo";
}

const formularioInicial: FormularioDocente = {
  codigo: "",
  dni: "",
  nombres: "",
  apellidos: "",
  correo: "",
  facultad: "",
  escuela: "",
  especialidad: "",
  estado: "Activo",
};

interface PersonaFacial {
  person_id: string;
  name: string;
  person_type: string;
}

interface SAPDocente {
  CODIGOSAP: string;
  CODIGOTESO?: string | null;
  DNI?: string | null;
  NOMBRES?: string | null;
  APELLIDOPATERNO?: string | null;
  APELLIDOMATERNO?: string | null;
  NOMBRECOMPLETO?: string | null;
  VIGENCIA?: number | boolean | null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


export default function Docentes() {
  const {
    agregarDocente,
    actualizarDocente,
  } = useAcademic();

  const [search, setSearch] = useState("");
  const [docenteEditando, setDocenteEditando] =
    useState<Docente | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formulario, setFormulario] =
    useState<FormularioDocente>(formularioInicial);
  const [error, setError] = useState("");
  const [docentePerfil, setDocentePerfil] =
    useState<Docente | null>(null);

  // ---------------------------------------------------------
  // FORMULARIO Y PERFIL
  // ---------------------------------------------------------
  const abrirPerfilDocente = (docente: Docente) => {
    setDocentePerfil(docente);
  };



  const cerrarModal = () => {
    setMostrarModal(false);
    setDocenteEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
  };

  const cambiarCampo = (
    campo: keyof FormularioDocente,
    valor: string,
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    if (error) {
      setError("");
    }
  };

  const guardarDocente = () => {
    if (!formulario.codigo.trim()) {
      setError("Ingrese el código del docente.");
      return;
    }

    if (!formulario.dni.trim()) {
      setError("Ingrese el DNI del docente.");
      return;
    }

    if (!/^\d{8}$/.test(formulario.dni.trim())) {
      setError("El DNI debe contener exactamente 8 dígitos.");
      return;
    }

    if (!formulario.nombres.trim()) {
      setError("Ingrese los nombres del docente.");
      return;
    }

    if (!formulario.apellidos.trim()) {
      setError("Ingrese los apellidos del docente.");
      return;
    }

    const datos: Omit<Docente, "id"> = {
      codigo: formulario.codigo.trim(),
      dni: formulario.dni.trim(),
      nombres: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      correo: formulario.correo.trim(),
      facultad: formulario.facultad.trim(),
      escuela: formulario.escuela.trim(),
      especialidad: formulario.especialidad.trim(),
      estado: formulario.estado,
    };

    if (docenteEditando) {
      actualizarDocente({
        id: docenteEditando.id,
        ...datos,
      });
    } else {
      agregarDocente(datos);
    }

    cerrarModal();
  };


  // ---------------------------------------------------------
  // DATOS SAP
  // ---------------------------------------------------------
  const [docentesSAP, setDocentesSAP] = useState<Docente[]>([]);
  const [cargandoSAP, setCargandoSAP] = useState(false);
  const [errorSAP, setErrorSAP] = useState("");

  // ---------------------------------------------------------
  // ESTADO BIOMÉTRICO
  // ---------------------------------------------------------
  const [personasFaciales, setPersonasFaciales] = useState<
    PersonaFacial[]
  >([]);
  const [cargandoBiometria, setCargandoBiometria] =
    useState(false);
  const [mostrarModalFacial, setMostrarModalFacial] =
    useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [procesandoRostro, setProcesandoRostro] =
    useState(false);
  const [mensajeFacial, setMensajeFacial] = useState("");
  const [errorFacial, setErrorFacial] = useState("");
  const [capturaPreview, setCapturaPreview] =
    useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ---------------------------------------------------------
  // CARGAR DOCENTES DESDE SAP MOCK
  // ---------------------------------------------------------
  const cargarDocentesSAP = async () => {
    setCargandoSAP(true);
    setErrorSAP("");

    try {
      const response = await fetch(
        `${API_URL}/api/sap-test/docentes`,
      );

      if (!response.ok) {
        throw new Error(
          `Servidor SAP respondió con ${response.status}`,
        );
      }

      const data: {
        success: boolean;
        source?: string;
        count?: number;
        docentes?: SAPDocente[];
        message?: string;
      } = await response.json();

      if (!data.success) {
        throw new Error(
          data.message ||
            "No se pudieron obtener los docentes desde SAP.",
        );
      }

      const docentesMapeados: Docente[] = (data.docentes || []).map(
        (item) => {
          const nombres = String(item.NOMBRES ?? "").trim();
          const apellidos = [
            item.APELLIDOPATERNO,
            item.APELLIDOMATERNO,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          return {
            id: String(item.CODIGOSAP),
            codigo: String(item.CODIGOSAP),
            dni: String(item.DNI ?? ""),
            nombres,
            apellidos,
            correo: "",
            facultad: "",
            escuela: "",
            especialidad: "",
            estado:
              Number(item.VIGENCIA) === 1 || item.VIGENCIA === true
                ? "Activo"
                : "Inactivo",
          };
        },
      );

      setDocentesSAP(docentesMapeados);
    } catch (err) {
      console.error("Error cargando docentes desde SAP:", err);
      setErrorSAP(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los docentes desde SAP.",
      );
      setDocentesSAP([]);
    } finally {
      setCargandoSAP(false);
    }
  };

  useEffect(() => {
    void cargarDocentesSAP();
  }, []);

  // ---------------------------------------------------------
  // ESTADÍSTICAS
  // ---------------------------------------------------------
  const totalDocentes = docentesSAP.length;

  const docentesActivos = docentesSAP.filter(
    (docente) => docente.estado === "Activo",
  ).length;

  const docentesInactivos = docentesSAP.filter(
    (docente) => docente.estado === "Inactivo",
  ).length;

  const docentesConRostro = useMemo(() => {
    const ids = new Set(
      personasFaciales
        .filter(
          (persona) =>
            persona.person_type === "teacher",
        )
        .map((persona) => persona.person_id),
    );

    return docentesSAP.filter((docente) =>
      ids.has(docente.id),
    ).length;
  }, [docentesSAP, personasFaciales]);

  // ---------------------------------------------------------
  // FILTRO
  // ---------------------------------------------------------
  const docentesFiltrados = useMemo(() => {
    const texto = search.trim().toLowerCase();

    if (!texto) {
      return docentesSAP;
    }

    return docentesSAP.filter((docente) => {
      const nombreCompleto =
        `${docente.nombres} ${docente.apellidos}`;

      return (
        nombreCompleto.toLowerCase().includes(texto) ||
        docente.codigo.toLowerCase().includes(texto) ||
        docente.dni.toLowerCase().includes(texto) ||
        docente.correo.toLowerCase().includes(texto) ||
        docente.escuela.toLowerCase().includes(texto) ||
        docente.especialidad.toLowerCase().includes(texto)
      );
    });
  }, [docentesSAP, search]);

  // ---------------------------------------------------------
  // CARGAR PERSONAS CON ROSTRO
  // ---------------------------------------------------------
  const cargarBiometria = async () => {
    setCargandoBiometria(true);

    try {
      const response = await fetch(
        `${API_URL}/api/registered-people`,
      );

      if (!response.ok) {
        throw new Error(
          `Servidor respondió con ${response.status}`,
        );
      }

      const data: {
        success: boolean;
        count: number;
        people: PersonaFacial[];
      } = await response.json();

      if (!data.success) {
        throw new Error(
          "No se pudieron obtener los registros faciales.",
        );
      }

      setPersonasFaciales(data.people || []);
    } catch (err) {
      console.error(
        "Error cargando registros faciales:",
        err,
      );
    } finally {
      setCargandoBiometria(false);
    }
  };

  useEffect(() => {
    void cargarBiometria();
  }, []);

  // ---------------------------------------------------------
  // HELPERS BIOMÉTRICOS
  // ---------------------------------------------------------
  const rostroRegistrado = (docente: Docente) => {
    return personasFaciales.some(
      (persona) =>
        persona.person_id === docente.id &&
        persona.person_type === "teacher",
    );
  };

  const nombreDocente = (docente: Docente) =>
    `${docente.nombres} ${docente.apellidos}`.trim();


  // ---------------------------------------------------------
  // ABRIR REGISTRO FACIAL
  // ---------------------------------------------------------
  const abrirRegistroFacial = (docente: Docente) => {
    setDocenteEditando(docente);
    setMostrarModalFacial(true);
    setCamaraActiva(false);
    setProcesandoRostro(false);
    setMensajeFacial("");
    setErrorFacial("");
    setCapturaPreview(null);
  };

  // ---------------------------------------------------------
  // CERRAR REGISTRO FACIAL
  // ---------------------------------------------------------
  const cerrarModalFacial = () => {
    detenerCamara();
    setMostrarModalFacial(false);
    setCamaraActiva(false);
    setProcesandoRostro(false);
    setMensajeFacial("");
    setErrorFacial("");
    setCapturaPreview(null);
  };

  // ---------------------------------------------------------
  // INICIAR CÁMARA
  // ---------------------------------------------------------
  const iniciarCamara = async () => {
    setErrorFacial("");
    setMensajeFacial("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "El navegador no permite acceder a la cámara.",
        );
      }

      detenerCamara();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCamaraActiva(true);
      setMensajeFacial(
        "Cámara activa. Centre el rostro dentro del marco.",
      );
    } catch (err) {
      console.error("Error accediendo a cámara:", err);

      setErrorFacial(
        "No se pudo acceder a la cámara. Verifique los permisos del navegador.",
      );
      setCamaraActiva(false);
    }
  };

  // ---------------------------------------------------------
  // DETENER CÁMARA
  // ---------------------------------------------------------
  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamaraActiva(false);
  };

  // ---------------------------------------------------------
  // CAPTURAR IMAGEN
  // ---------------------------------------------------------
  const capturarRostro = async () => {
    if (!docenteEditando) {
      setErrorFacial(
        "Primero seleccione un docente.",
      );
      return;
    }

    const video = videoRef.current;

    if (
      !video ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setErrorFacial(
        "La cámara todavía no está lista.",
      );
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      setErrorFacial(
        "No fue posible preparar la captura.",
      );
      return;
    }

    const maxWidth = 720;
    const scale = Math.min(
      1,
      maxWidth / video.videoWidth,
    );

    canvas.width = Math.round(
      video.videoWidth * scale,
    );
    canvas.height = Math.round(
      video.videoHeight * scale,
    );

    const context = canvas.getContext("2d");

    if (!context) {
      setErrorFacial(
        "No fue posible procesar la imagen.",
      );
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const dataUrl = canvas.toDataURL(
      "image/jpeg",
      0.9,
    );

    setCapturaPreview(dataUrl);
    setMensajeFacial(
      "Captura realizada. Validando rostro con el motor de IA...",
    );
    setErrorFacial("");
    setProcesandoRostro(true);

    try {
      const blob = await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            (resultado) => resolve(resultado),
            "image/jpeg",
            0.9,
          );
        },
      );

      if (!blob) {
        throw new Error(
          "No se pudo generar la imagen.",
        );
      }

      const file = new File(
        [blob],
        `rostro-${docenteEditando.id}.jpg`,
        {
          type: "image/jpeg",
        },
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "person_id",
        docenteEditando.id,
      );
      formData.append(
        "name",
        nombreDocente(docenteEditando),
      );
      formData.append("person_type", "teacher");

      const response = await fetch(
        `${API_URL}/api/register-face`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data: {
        success: boolean;
        message?: string;
        person?: PersonaFacial;
        faces_detected?: number;
      } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "No fue posible registrar el rostro.",
        );
      }

      await cargarBiometria();

      setMensajeFacial(
        "Rostro registrado correctamente. El docente ya puede ser reconocido por el sistema.",
      );
      setErrorFacial("");
    } catch (err) {
      console.error(
        "Error registrando rostro:",
        err,
      );

      setErrorFacial(
        err instanceof Error
          ? err.message
          : "No fue posible registrar el rostro.",
      );

      setMensajeFacial("");
    } finally {
      setProcesandoRostro(false);
    }
  };

  // ---------------------------------------------------------
  // ELIMINAR REGISTRO FACIAL
  // ---------------------------------------------------------
  const eliminarRostro = async () => {
    if (!docenteEditando) {
      return;
    }

    const confirmado = window.confirm(
      `¿Desea eliminar el registro facial de "${nombreDocente(
        docenteEditando,
      )}"?`,
    );

    if (!confirmado) {
      return;
    }

    setProcesandoRostro(true);
    setErrorFacial("");
    setMensajeFacial("");

    try {
      const response = await fetch(
        `${API_URL}/api/registered-people/${encodeURIComponent(
          docenteEditando.id,
        )}`,
        {
          method: "DELETE",
        },
      );

      const data: {
        success: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "No se pudo eliminar el registro facial.",
        );
      }

      await cargarBiometria();

      setCapturaPreview(null);
      setMensajeFacial(
        "Registro facial eliminado correctamente.",
      );
    } catch (err) {
      console.error(
        "Error eliminando rostro:",
        err,
      );

      setErrorFacial(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el registro facial.",
      );
    } finally {
      setProcesandoRostro(false);
    }
  };

  // ---------------------------------------------------------
  // LIMPIAR CÁMARA AL DESMONTAR
  // ---------------------------------------------------------
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="page">
      {/* =====================================================
          CABECERA
          ===================================================== */}
      <div
        className="page-title page-title-with-action"
        style={{
          marginBottom: "22px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "6px 10px",
              borderRadius: "999px",
              background: "rgba(148, 27, 52, 0.08)",
              color: "#941b34",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            <GraduationCap size={13} />
            GESTIÓN DE PERSONAL
          </div>

          <h2>Docentes</h2>

          <p>
            Información académica proveniente de SAP y
            registro biométrico del personal docente.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => void cargarDocentesSAP()}
          disabled={cargandoSAP}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <RefreshCw
            size={18}
            style={{
              animation: cargandoSAP
                ? "spin 1s linear infinite"
                : undefined,
            }}
          />
          {cargandoSAP ? "Actualizando SAP..." : "Actualizar desde SAP"}
        </button>
      </div>

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="content-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(148, 27, 52, 0.10)",
                color: "#941b34",
              }}
            >
              <Users size={21} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.68,
                  marginBottom: "3px",
                }}
              >
                Total docentes
              </div>

              <strong
                style={{
                  fontSize: "24px",
                }}
              >
                {totalDocentes}
              </strong>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(34, 197, 94, 0.10)",
                color: "#15803d",
              }}
            >
              <CheckCircle2 size={21} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.68,
                  marginBottom: "3px",
                }}
              >
                Docentes activos
              </div>

              <strong
                style={{
                  fontSize: "24px",
                }}
              >
                {docentesActivos}
              </strong>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(239, 68, 68, 0.10)",
                color: "#dc2626",
              }}
            >
              <XCircle size={21} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.68,
                  marginBottom: "3px",
                }}
              >
                Docentes inactivos
              </div>

              <strong
                style={{
                  fontSize: "24px",
                }}
              >
                {docentesInactivos}
              </strong>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(59, 130, 246, 0.10)",
                color: "#2563eb",
              }}
            >
              <ShieldCheck size={21} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.68,
                  marginBottom: "3px",
                }}
              >
                Rostros registrados
              </div>

              <strong
                style={{
                  fontSize: "24px",
                }}
              >
                {cargandoBiometria
                  ? "..."
                  : docentesConRostro}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          TABLA
          ===================================================== */}
      <section className="content-card">
        <div
          className="content-toolbar"
          style={{
            gap: "14px",
          }}
        >
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por nombre, código, DNI..."
            />
          </div>

          <div
            className="toolbar-info"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            {docentesFiltrados.length}{" "}
            {docentesFiltrados.length === 1
              ? "docente"
              : "docentes"}
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 9px",
              borderRadius: "999px",
              background: "rgba(148,27,52,0.08)",
              color: "#941b34",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.05em",
            }}
            title="Fuente de datos académicos"
          >
            {cargandoSAP ? "SAP · ACTUALIZANDO" : "SAP_MOCK"}
          </div>
        </div>

        {docentesFiltrados.length === 0 ? (
          <div className="empty-table">
            <div className="empty-table-icon">
              <UserPlus size={28} />
            </div>

            <h3>
              {search
                ? "No se encontraron docentes"
                : "No hay docentes registrados"}
            </h3>

            <p>
              {search
                ? "Intente con otro nombre, código o DNI."
                : errorSAP
                  ? errorSAP
                  : cargandoSAP
                    ? "Consultando docentes en SAP..."
                    : "No se encontraron docentes activos en SAP."}
            </p>

            {!search && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => void cargarDocentesSAP()}
                disabled={cargandoSAP}
              >
                <RefreshCw
                  size={18}
                  style={{
                    animation: cargandoSAP
                      ? "spin 1s linear infinite"
                      : undefined,
                  }}
                />
                Volver a consultar SAP
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1050px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px",
                    }}
                  >
                    Docente
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px",
                    }}
                  >
                    Código
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px",
                    }}
                  >
                    DNI
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px",
                    }}
                  >
                    Escuela
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px",
                    }}
                  >
                    Especialidad
                  </th>

                  <th
                    style={{
                      textAlign: "center",
                      padding: "14px",
                    }}
                  >
                    Biometría
                  </th>

                  <th
                    style={{
                      textAlign: "center",
                      padding: "14px",
                    }}
                  >
                    Estado
                  </th>

                  <th
                    style={{
                      textAlign: "center",
                      padding: "14px",
                    }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {docentesFiltrados.map((docente) => {
                  const tieneRostro =
                    rostroRegistrado(docente);

                  return (
                    <tr key={docente.id}>
                      <td
                        style={{
                          padding: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background:
                                "rgba(148, 27, 52, 0.09)",
                              color: "#941b34",
                              flexShrink: 0,
                            }}
                          >
                            <GraduationCap size={19} />
                          </div>

                          <div>
                            <strong>
                              {docente.nombres}{" "}
                              {docente.apellidos}
                            </strong>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                                opacity: 0.65,
                                marginTop: "3px",
                              }}
                            >
                              <Mail size={12} />
                              {docente.correo}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "5px 9px",
                            borderRadius: "7px",
                            background:
                              "rgba(148, 27, 52, 0.07)",
                            color: "#941b34",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {docente.codigo}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                        }}
                      >
                        {docente.dni}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          <Building2 size={15} />
                          {docente.escuela}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                        }}
                      >
                        {docente.especialidad}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: tieneRostro
                              ? "rgba(34, 197, 94, 0.10)"
                              : "rgba(245, 158, 11, 0.12)",
                            color: tieneRostro
                              ? "#15803d"
                              : "#b45309",
                          }}
                        >
                          {tieneRostro ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <ScanFace size={13} />
                          )}

                          {tieneRostro
                            ? "Registrado"
                            : "Pendiente"}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background:
                              docente.estado ===
                              "Activo"
                                ? "rgba(34, 197, 94, 0.10)"
                                : "rgba(239, 68, 68, 0.10)",
                            color:
                              docente.estado ===
                              "Activo"
                                ? "#15803d"
                                : "#dc2626",
                          }}
                        >
                          {docente.estado ===
                          "Activo" ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <XCircle size={13} />
                          )}

                          {docente.estado}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "7px",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-secondary"
                            title="Ver perfil"
                            onClick={() =>
                              abrirPerfilDocente(
                                docente,
                              )
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <UserRound size={16} />
                          </button>

                          <button
                            type="button"
                            className="btn-secondary"
                            title={
                              tieneRostro
                                ? "Gestionar rostro"
                                : "Registrar rostro"
                            }
                            onClick={() =>
                              abrirRegistroFacial(
                                docente,
                              )
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent:
                                "center",
                              color: tieneRostro
                                ? "#15803d"
                                : "#941b34",
                            }}
                          >
                            <ScanFace size={16} />
                          </button>

</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL PRINCIPAL
          ===================================================== */}
      {mostrarModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.56)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              cerrarModal();
            }
          }}
        >
          <div
            className="content-card"
            style={{
              width: "min(900px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 0,
              borderRadius: "18px",
              boxShadow:
                "0 25px 70px rgba(15, 23, 42, 0.28)",
            }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "22px 24px",
                borderBottom:
                  "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#941b34",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    marginBottom: "6px",
                  }}
                >
                  <GraduationCap size={13} />
                  PERSONAL DOCENTE
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  {docenteEditando
                    ? "Editar docente"
                    : "Nuevo docente"}
                </h3>

                <p
                  style={{
                    margin: "5px 0 0",
                    opacity: 0.66,
                    fontSize: "13px",
                  }}
                >
                  Información académica y
                  configuración biométrica.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={cerrarModal}
                title="Cerrar"
                style={{
                  width: "38px",
                  height: "38px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "22px 24px",
              }}
            >
              {error && (
                <div
                  style={{
                    padding: "11px 13px",
                    marginBottom: "18px",
                    borderRadius: "10px",
                    background:
                      "rgba(239, 68, 68, 0.08)",
                    border:
                      "1px solid rgba(239, 68, 68, 0.18)",
                    color: "#b91c1c",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              {/* DATOS PERSONALES */}
              <div
                style={{
                  marginBottom: "22px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "rgba(148, 27, 52, 0.09)",
                      color: "#941b34",
                    }}
                  >
                    <Users size={15} />
                  </div>

                  <div>
                    <strong
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      Información personal
                    </strong>

                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.58,
                        marginTop: "2px",
                      }}
                    >
                      Identificación del docente
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "15px",
                  }}
                >
                  <div>
                    <label>Código docente</label>
                    <input
                      value={formulario.codigo}
                      onChange={(event) =>
                        cambiarCampo(
                          "codigo",
                          event.target.value.toUpperCase(),
                        )
                      }
                      placeholder="Ej. DOC-2026-004"
                    />
                  </div>

                  <div>
                    <label>DNI</label>
                    <input
                      value={formulario.dni}
                      onChange={(event) =>
                        cambiarCampo(
                          "dni",
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 8),
                        )
                      }
                      placeholder="8 dígitos"
                      maxLength={8}
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label>Nombres</label>
                    <input
                      value={formulario.nombres}
                      onChange={(event) =>
                        cambiarCampo(
                          "nombres",
                          event.target.value,
                        )
                      }
                      placeholder="Nombres"
                    />
                  </div>

                  <div>
                    <label>Apellidos</label>
                    <input
                      value={formulario.apellidos}
                      onChange={(event) =>
                        cambiarCampo(
                          "apellidos",
                          event.target.value,
                        )
                      }
                      placeholder="Apellidos"
                    />
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                    }}
                  >
                    <label>
                      Correo institucional
                    </label>

                    <div
                      style={{
                        position: "relative",
                      }}
                    >
                      <Mail
                        size={16}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          opacity: 0.55,
                        }}
                      />

                      <input
                        value={formulario.correo}
                        onChange={(event) =>
                          cambiarCampo(
                            "correo",
                            event.target.value,
                          )
                        }
                        placeholder="docente@usmp.pe"
                        style={{
                          paddingLeft: "38px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* DATOS ACADÉMICOS */}
              <div
                style={{
                  marginBottom: "22px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "rgba(59, 130, 246, 0.09)",
                      color: "#2563eb",
                    }}
                  >
                    <GraduationCap size={15} />
                  </div>

                  <div>
                    <strong
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      Información académica
                    </strong>

                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.58,
                        marginTop: "2px",
                      }}
                    >
                      Adscripción institucional
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "15px",
                  }}
                >
                  <div>
                    <label>Facultad</label>
                    <input
                      value={formulario.facultad}
                      onChange={(event) =>
                        cambiarCampo(
                          "facultad",
                          event.target.value,
                        )
                      }
                      placeholder="Facultad"
                    />
                  </div>

                  <div>
                    <label>
                      Escuela profesional
                    </label>
                    <input
                      value={formulario.escuela}
                      onChange={(event) =>
                        cambiarCampo(
                          "escuela",
                          event.target.value,
                        )
                      }
                      placeholder="Escuela profesional"
                    />
                  </div>

                  <div>
                    <label>Especialidad</label>
                    <input
                      value={formulario.especialidad}
                      onChange={(event) =>
                        cambiarCampo(
                          "especialidad",
                          event.target.value,
                        )
                      }
                      placeholder="Especialidad"
                    />
                  </div>

                  <div>
                    <label>Estado</label>
                    <select
                      value={formulario.estado}
                      onChange={(event) =>
                        cambiarCampo(
                          "estado",
                          event.target.value,
                        )
                      }
                    >
                      <option value="Activo">
                        Activo
                      </option>
                      <option value="Inactivo">
                        Inactivo
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BIOMETRÍA */}
              <div
                style={{
                  borderRadius: "15px",
                  border:
                    "1px solid rgba(148, 27, 52, 0.16)",
                  background:
                    "linear-gradient(135deg, rgba(148,27,52,0.055), rgba(248,250,252,0.85))",
                  padding: "17px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "11px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "rgba(148, 27, 52, 0.10)",
                        color: "#941b34",
                      }}
                    >
                      <ScanFace size={21} />
                    </div>

                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "14px",
                        }}
                      >
                        Registro biométrico
                      </strong>

                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          opacity: 0.62,
                          marginTop: "3px",
                        }}
                      >
                        Plantilla facial para
                        reconocimiento automático
                      </span>
                    </div>
                  </div>

                  {!docenteEditando ? (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#a16207",
                        background:
                          "rgba(245, 158, 11, 0.10)",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        fontWeight: 700,
                      }}
                    >
                      Guardar primero
                    </span>
                  ) : rostroRegistrado(
                      docenteEditando,
                    ) ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "#15803d",
                        background:
                          "rgba(34, 197, 94, 0.10)",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle2 size={13} />
                      Rostro registrado
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "#b45309",
                        background:
                          "rgba(245, 158, 11, 0.10)",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        fontWeight: 700,
                      }}
                    >
                      <ScanFace size={13} />
                      Rostro pendiente
                    </span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      maxWidth: "560px",
                      lineHeight: 1.5,
                    }}
                  >
                    {docenteEditando
                      ? rostroRegistrado(
                          docenteEditando,
                        )
                        ? "El rostro está disponible en el motor de reconocimiento facial. Puede gestionarlo desde el botón de rostro."
                        : "Este docente todavía no tiene una plantilla facial. Registre su rostro para habilitar el reconocimiento."
                      : "Después de guardar el docente podrá registrar su rostro mediante la cámara."}
                  </div>

                  {docenteEditando && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() =>
                        abrirRegistroFacial(
                          docenteEditando,
                        )
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <ScanFace size={16} />
                      {rostroRegistrado(
                        docenteEditando,
                      )
                        ? "Gestionar rostro"
                        : "Registrar rostro"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                padding: "16px 24px",
                borderTop:
                  "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={cerrarModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={guardarDocente}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <CheckCircle2 size={16} />
                {docenteEditando
                  ? "Guardar cambios"
                  : "Registrar docente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PERFIL COMPLETO DEL DOCENTE
          ===================================================== */}
      {docentePerfil && (
        <PerfilDocente
          docente={docentePerfil}
          onClose={() => setDocentePerfil(null)}
        />
      )}

      {/* =====================================================
          MODAL REGISTRO FACIAL
          ===================================================== */}
      {mostrarModalFacial &&
        docenteEditando && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.70)",
              backdropFilter: "blur(7px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1100,
            }}
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                cerrarModalFacial();
              }
            }}
          >
            <div
              style={{
                width: "min(820px, 100%)",
                maxHeight: "94vh",
                overflowY: "auto",
                background: "var(--card-bg, #fff)",
                borderRadius: "20px",
                boxShadow:
                  "0 30px 90px rgba(0,0,0,0.32)",
              }}
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 22px",
                  borderBottom:
                    "1px solid rgba(148, 163, 184, 0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "rgba(148, 27, 52, 0.10)",
                      color: "#941b34",
                    }}
                  >
                    <ScanFace size={23} />
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#941b34",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.09em",
                        marginBottom: "4px",
                      }}
                    >
                      REGISTRO BIOMÉTRICO
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize: "19px",
                      }}
                    >
                      Rostro del docente
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarModalFacial}
                  title="Cerrar"
                  style={{
                    width: "38px",
                    height: "38px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  padding: "20px 22px 22px",
                }}
              >
                {/* IDENTIDAD */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background:
                      "rgba(148, 163, 184, 0.07)",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "rgba(148, 27, 52, 0.10)",
                      color: "#941b34",
                    }}
                  >
                    <GraduationCap size={19} />
                  </div>

                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                      }}
                    >
                      {nombreDocente(
                        docenteEditando,
                      )}
                    </strong>

                    <span
                      style={{
                        fontSize: "11px",
                        opacity: 0.62,
                      }}
                    >
                      {docenteEditando.codigo} · DNI{" "}
                      {docenteEditando.dni}
                    </span>
                  </div>

                  <div
                    style={{
                      marginLeft: "auto",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "6px 9px",
                        borderRadius: "999px",
                        background:
                          "rgba(148, 27, 52, 0.08)",
                        color: "#941b34",
                      }}
                    >
                      ID {docenteEditando.id}
                    </span>
                  </div>
                </div>

                {/* CÁMARA */}
                <div
                  style={{
                    position: "relative",
                    background: "#0f172a",
                    borderRadius: "16px",
                    overflow: "hidden",
                    minHeight: "390px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!camaraActiva &&
                  !capturaPreview ? (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#fff",
                        padding: "35px",
                      }}
                    >
                      <div
                        style={{
                          width: "72px",
                          height: "72px",
                          margin: "0 auto 15px",
                          borderRadius: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "rgba(255,255,255,0.08)",
                          border:
                            "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        <Camera size={34} />
                      </div>

                      <h4
                        style={{
                          margin: "0 0 7px",
                          fontSize: "17px",
                        }}
                      >
                        Cámara lista
                      </h4>

                      <p
                        style={{
                          margin: 0,
                          maxWidth: "390px",
                          opacity: 0.7,
                          fontSize: "12px",
                          lineHeight: 1.55,
                        }}
                      >
                        Active la cámara y coloque
                        al docente frente a ella.
                        Procure buena iluminación y
                        mantenga el rostro visible.
                      </p>
                    </div>
                  ) : capturaPreview &&
                    !camaraActiva ? (
                    <img
                      src={capturaPreview}
                      alt="Captura facial"
                      style={{
                        width: "100%",
                        height: "390px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        height: "390px",
                        objectFit: "cover",
                        transform: "scaleX(-1)",
                      }}
                    />
                  )}

                  {/* MARCO FACIAL */}
                  {camaraActiva && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "235px",
                          height: "300px",
                          border:
                            "2px solid rgba(255,255,255,0.9)",
                          borderRadius: "48% 48% 45% 45%",
                          boxShadow:
                            "0 0 0 999px rgba(15,23,42,0.14)",
                        }}
                      />
                    </div>
                  )}

                  {/* INDICADOR */}
                  {camaraActiva && (
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        background:
                          "rgba(0,0,0,0.45)",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#22c55e",
                        }}
                      />
                      Cámara activa
                    </div>
                  )}
                </div>

                <canvas
                  ref={canvasRef}
                  style={{
                    display: "none",
                  }}
                />

                {/* MENSAJES */}
                {mensajeFacial && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background:
                        "rgba(34, 197, 94, 0.08)",
                      border:
                        "1px solid rgba(34, 197, 94, 0.16)",
                      color: "#166534",
                      fontSize: "12px",
                      lineHeight: 1.45,
                    }}
                  >
                    {mensajeFacial}
                  </div>
                )}

                {errorFacial && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background:
                        "rgba(239, 68, 68, 0.08)",
                      border:
                        "1px solid rgba(239, 68, 68, 0.16)",
                      color: "#b91c1c",
                      fontSize: "12px",
                      lineHeight: 1.45,
                    }}
                  >
                    {errorFacial}
                  </div>
                )}

                {/* INSTRUCCIONES */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, minmax(0, 1fr))",
                    gap: "9px",
                    marginTop: "14px",
                  }}
                >
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      background:
                        "rgba(148,163,184,0.06)",
                      fontSize: "11px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        marginBottom: "3px",
                      }}
                    >
                      01 · Posición
                    </strong>
                    <span style={{ opacity: 0.62 }}>
                      Mire directamente a la cámara.
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      background:
                        "rgba(148,163,184,0.06)",
                      fontSize: "11px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        marginBottom: "3px",
                      }}
                    >
                      02 · Iluminación
                    </strong>
                    <span style={{ opacity: 0.62 }}>
                      Evite sombras sobre el rostro.
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      background:
                        "rgba(148,163,184,0.06)",
                      fontSize: "11px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        marginBottom: "3px",
                      }}
                    >
                      03 · Captura
                    </strong>
                    <span style={{ opacity: 0.62 }}>
                      Debe aparecer un solo rostro.
                    </span>
                  </div>
                </div>

                {/* ACCIONES */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginTop: "18px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {!camaraActiva ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          void iniciarCamara()
                        }
                        disabled={procesandoRostro}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        <Video size={16} />
                        Activar cámara
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() =>
                            void capturarRostro()
                          }
                          disabled={procesandoRostro}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          {procesandoRostro ? (
                            <RefreshCw
                              size={16}
                              style={{
                                animation:
                                  "spin 1s linear infinite",
                              }}
                            />
                          ) : (
                            <Camera size={16} />
                          )}
                          {procesandoRostro
                            ? "Procesando..."
                            : "Capturar y registrar"}
                        </button>

                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={detenerCamara}
                          disabled={procesandoRostro}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          <VideoOff size={16} />
                          Detener
                        </button>
                      </>
                    )}

                    {rostroRegistrado(
                      docenteEditando,
                    ) && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          void eliminarRostro()
                        }
                        disabled={procesandoRostro}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          color: "#b91c1c",
                        }}
                      >
                        <Trash2 size={15} />
                        Eliminar rostro
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={cerrarModalFacial}
                    disabled={procesandoRostro}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
