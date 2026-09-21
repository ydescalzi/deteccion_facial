import {
  CalendarDays,
  Camera,
  CameraOff,
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  Search,
  ScanFace,
  Trash2,
  RefreshCw,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import HorarioEstudiante from "./HorarioEstudiante";
import type { Page } from "../../types";

interface Student {
  id: string;
  code: string;
  dni: string;
  firstName: string;
  lastName: string;
  faculty: string;
  career: string;
  image: string | null;
  registeredAt: string;
  faceRegistered?: boolean;
}

const STORAGE_KEY = "usmp_students";

const AI_API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface EstudiantesProps {
  onNavigate: (page: Page) => void;
}

export default function Estudiantes({ onNavigate }: EstudiantesProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // La fuente de estudiantes es SAP (actualmente SAP_MOCK).
  // No se usa localStorage para construir el directorio.
  const [students, setStudents] =
    useState<Student[]>([]);

  const [sapLoading, setSapLoading] =
    useState(false);

  const [sapError, setSapError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [selectedStudentProfile, setSelectedStudentProfile] =
    useState<Student | null>(null);

  const [showStudentSchedule, setShowStudentSchedule] =
    useState(false);

  /* =========================================================
     BIOMETRÍA FACIAL DEL ESTUDIANTE
     ========================================================= */
  const [biometricStudent, setBiometricStudent] =
    useState<Student | null>(null);
  const [biometricOpen, setBiometricOpen] =
    useState(false);
  const [cameraActive, setCameraActive] =
    useState(false);
  const [cameraError, setCameraError] =
    useState("");
  const [biometricPreview, setBiometricPreview] =
    useState<string | null>(null);
  const [biometricFile, setBiometricFile] =
    useState<File | null>(null);
  const [biometricBusy, setBiometricBusy] =
    useState(false);
  const [biometricMessage, setBiometricMessage] =
    useState("");
  const [biometricMessageType, setBiometricMessageType] =
    useState<"success" | "error" | "">("");
  const [registeredFaceIds, setRegisteredFaceIds] =
    useState<Set<string>>(new Set());
  const cameraVideoRef =
    useRef<HTMLVideoElement>(null);
  const cameraStreamRef =
    useRef<MediaStream | null>(null);
  const biometricFileInputRef =
    useRef<HTMLInputElement>(null);

  const [search, setSearch] =
    useState("");

  const [code, setCode] =
    useState("");

  const [dni, setDni] =
    useState("");

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [faculty, setFaculty] =
    useState("");

  const [career, setCareer] =
    useState("");

  const [image, setImage] =
    useState<string | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [faceDetected, setFaceDetected] =
    useState(false);

  const [registering, setRegistering] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error" | ""
    >("");

  /* =========================================================
     ABRIR SELECTOR
     ========================================================= */

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  /* =========================================================
     SELECCIONAR IMAGEN
     ========================================================= */

  const handleImage = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setMessageType("error");

      setMessage(
        "Selecciona una imagen JPG, JPEG o PNG.",
      );

      setSelectedFile(null);
      setImage(null);

      return;
    }

    /*
     * Guardamos el archivo original.
     * Este archivo será enviado a FastAPI.
     */
    setSelectedFile(file);

    /*
     * Creamos una URL únicamente
     * para mostrar la vista previa.
     */
    const previewUrl =
      URL.createObjectURL(file);

    setImage(previewUrl);

    setFaceDetected(false);

    setMessage("");

    setMessageType("");
  };

  /* =========================================================
     ELIMINAR IMAGEN
     ========================================================= */

  const removeImage = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage(null);

    setSelectedFile(null);

    setFaceDetected(false);

    setMessage("");

    setMessageType("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     RESET FORMULARIO
     ========================================================= */

  const resetForm = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }

    setCode("");
    setDni("");
    setFirstName("");
    setLastName("");
    setFaculty("");
    setCareer("");

    setImage(null);

    setSelectedFile(null);

    setFaceDetected(false);

    setRegistering(false);

    setMessage("");

    setMessageType("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     CARGAR ESTUDIANTES DESDE SAP
     ========================================================= */
  const loadStudentsFromSAP = async () => {
    setSapLoading(true);
    setSapError("");

    try {
      const response = await fetch(
        `${AI_API_URL}/api/sap-test/estudiantes`,
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `No se pudo consultar SAP. HTTP ${response.status}.`,
        );
      }

      const sapStudents = Array.isArray(data.estudiantes)
        ? data.estudiantes
        : [];

      // Consultamos los rostros registrados en InsightFace para
      // mostrar inmediatamente el estado biométrico de cada alumno.
      let faceIds = new Set<string>();

      try {
        const faceResponse = await fetch(
          `${AI_API_URL}/api/registered-people`,
        );

        if (faceResponse.ok) {
          const faceData = await faceResponse.json().catch(() => ({}));
          faceIds = new Set(
            (Array.isArray(faceData.people) ? faceData.people : [])
              .filter(
                (person: { person_type?: string }) =>
                  person.person_type === "student",
              )
              .map((person: { person_id?: string }) =>
                String(person.person_id || ""),
              ),
          );
        }
      } catch (faceError) {
        console.warn(
          "No se pudo consultar el estado biométrico:",
          faceError,
        );
      }

      const mappedStudents: Student[] = sapStudents.map(
        (item: any) => {
          const codigo = String(item.CODIGOSAP ?? "");
          const nombres = String(item.NOMBRES ?? "").trim();
          const paterno = String(
            item.APELLIDOPATERNO ?? "",
          ).trim();
          const materno = String(
            item.APELLIDOMATERNO ?? "",
          ).trim();

          return {
            id: codigo,
            code: codigo,
            dni: String(item.DNI ?? ""),
            firstName: nombres,
            lastName: [paterno, materno]
              .filter(Boolean)
              .join(" "),
            faculty: "",
            career: String(item.CARRERA ?? ""),
            image: null,
            registeredAt: "",
            faceRegistered: faceIds.has(codigo),
          };
        },
      );

      setRegisteredFaceIds(faceIds);
      setStudents(mappedStudents);
    } catch (error) {
      console.error("Error cargando estudiantes desde SAP:", error);
      setStudents([]);
      setSapError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la lista de estudiantes desde SAP.",
      );
    } finally {
      setSapLoading(false);
    }
  };

  /* =========================================================
     CÁMARA BIOMÉTRICA
     ========================================================= */
  const stopBiometricCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startBiometricCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("El navegador no permite acceder a la cámara.");
      }

      stopBiometricCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setCameraActive(true);
    } catch (error) {
      console.error("Error iniciando cámara biométrica:", error);
      setCameraError(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "El navegador bloqueó la cámara. Permite el acceso a la cámara y vuelve a intentarlo."
          : "No se pudo iniciar la cámara. Verifica que el dispositivo tenga una cámara disponible.",
      );
      setCameraActive(false);
    }
  };

  const captureBiometricPhoto = () => {
    const video = cameraVideoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setBiometricMessageType("error");
      setBiometricMessage("La cámara todavía no está lista.");
      return;
    }

    const canvas = document.createElement("canvas");
    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBiometricMessageType("error");
      setBiometricMessage("No se pudo preparar la fotografía.");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setBiometricMessageType("error");
        setBiometricMessage("No se pudo capturar la fotografía.");
        return;
      }

      const file = new File(
        [blob],
        `rostro_${biometricStudent?.code || "estudiante"}.jpg`,
        { type: "image/jpeg" },
      );
      const preview = URL.createObjectURL(blob);

      if (biometricPreview) {
        URL.revokeObjectURL(biometricPreview);
      }

      setBiometricFile(file);
      setBiometricPreview(preview);
      setBiometricMessageType("success");
      setBiometricMessage("Fotografía capturada. Verifica que el rostro esté centrado.");
    }, "image/jpeg", 0.92);
  };

  const handleBiometricFile = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setBiometricMessageType("error");
      setBiometricMessage("Selecciona una imagen JPG, JPEG o PNG.");
      return;
    }

    if (biometricPreview) {
      URL.revokeObjectURL(biometricPreview);
    }

    setBiometricFile(file);
    setBiometricPreview(URL.createObjectURL(file));
    setBiometricMessageType("success");
    setBiometricMessage("Fotografía seleccionada. Puedes registrar la biometría.");
    stopBiometricCamera();
  };

  const openBiometricRegistration = (student: Student) => {
    setBiometricStudent(student);
    setBiometricOpen(true);
    setBiometricPreview(null);
    setBiometricFile(null);
    setBiometricMessage("");
    setBiometricMessageType("");
    setCameraError("");
  };

  const closeBiometricRegistration = () => {
    if (biometricBusy) return;
    stopBiometricCamera();
    if (biometricPreview) URL.revokeObjectURL(biometricPreview);
    setBiometricOpen(false);
    setBiometricStudent(null);
    setBiometricPreview(null);
    setBiometricFile(null);
    setBiometricMessage("");
    setBiometricMessageType("");
  };

  const registerStudentFace = async () => {
    if (!biometricStudent || !biometricFile || biometricBusy) return;

    setBiometricBusy(true);
    setBiometricMessageType("");
    setBiometricMessage("Analizando rostro con InsightFace...");

    try {
      const formData = new FormData();
      formData.append("file", biometricFile);
      // El CODIGOSAP/código académico es el identificador estable del estudiante.
      formData.append("person_id", biometricStudent.code.trim());
      formData.append(
        "name",
        `${biometricStudent.firstName.trim()} ${biometricStudent.lastName.trim()}`,
      );
      formData.append("person_type", "student");

      const response = await fetch(
        `${AI_API_URL}/api/register-face`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `El servidor respondió con HTTP ${response.status}.`,
        );
      }

      if (
        typeof result.faces_detected === "number" &&
        result.faces_detected !== 1
      ) {
        throw new Error(
          result.message ||
            "La fotografía debe contener exactamente un rostro.",
        );
      }

      setRegisteredFaceIds((current) => {
        const next = new Set(current);
        next.add(biometricStudent.code);
        return next;
      });

      setStudents((current) =>
        current.map((student) =>
          student.id === biometricStudent.id
            ? { ...student, faceRegistered: true }
            : student,
        ),
      );

      setSelectedStudentProfile((current) =>
        current?.id === biometricStudent.id
          ? { ...current, faceRegistered: true }
          : current,
      );

      setBiometricMessageType("success");
      setBiometricMessage(
        "Rostro registrado correctamente. El estudiante ya puede ser identificado por reconocimiento facial.",
      );
      stopBiometricCamera();
    } catch (error) {
      console.error("Error registrando rostro del estudiante:", error);
      setBiometricMessageType("error");
      setBiometricMessage(
        error instanceof TypeError
          ? "No se pudo conectar con FastAPI. Verifica que el servidor esté ejecutándose en http://127.0.0.1:8000."
          : error instanceof Error
            ? error.message
            : "No se pudo registrar el rostro.",
      );
    } finally {
      setBiometricBusy(false);
    }
  };

  const deleteStudentFace = async (student: Student) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el registro facial de ${student.firstName} ${student.lastName}?`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${AI_API_URL}/api/registered-people/${encodeURIComponent(student.code)}`,
        { method: "DELETE" },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      setRegisteredFaceIds((current) => {
        const next = new Set(current);
        next.delete(student.code);
        return next;
      });
      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? { ...item, faceRegistered: false }
            : item,
        ),
      );
      setSelectedStudentProfile((current) =>
        current?.id === student.id
          ? { ...current, faceRegistered: false }
          : current,
      );
    } catch (error) {
      console.error("Error eliminando rostro:", error);
      alert(
        error instanceof Error
          ? `No se pudo eliminar la biometría: ${error.message}`
          : "No se pudo eliminar la biometría.",
      );
    }
  };

  /* =========================================================
     CERRAR FORMULARIO
     ========================================================= */

  const closeForm = () => {
    if (registering) {
      return;
    }

    setShowForm(false);

    resetForm();
  };

  const openStudentProfile = (
    student: Student,
  ) => {
    setSelectedStudentProfile(student);
  };

  const closeStudentProfile = () => {
    setSelectedStudentProfile(null);
    setShowStudentSchedule(false);
  };

  /* =========================================================
     REGISTRAR ESTUDIANTE
     ========================================================= */

  const registerStudent =
    async () => {
      if (registering) {
        return;
      }

      /* -----------------------------------------------------
         VALIDACIONES
         ----------------------------------------------------- */

      if (
        !code.trim() ||
        !dni.trim() ||
        !firstName.trim() ||
        !lastName.trim() ||
        !faculty.trim() ||
        !career.trim()
      ) {
        setMessageType("error");

        setMessage(
          "Completa todos los campos obligatorios.",
        );

        return;
      }

      if (!selectedFile) {
        setMessageType("error");

        setMessage(
          "Debes seleccionar una fotografía.",
        );

        return;
      }

      /*
       * Validación básica del DNI.
       */
      if (!/^\d{8}$/.test(dni.trim())) {
        setMessageType("error");

        setMessage(
          "El DNI debe contener exactamente 8 dígitos.",
        );

        return;
      }

      setRegistering(true);

      setMessageType("");

      setMessage(
        "Conectando con el motor de IA...",
      );

      try {
        /* ---------------------------------------------------
           ID DEL ESTUDIANTE
           --------------------------------------------------- */

        // El código académico se mantiene como identificador estable
        // para que SAP, matrícula y reconocimiento facial utilicen la misma clave.
        const personId = code.trim();

        const fullName =
          `${firstName.trim()} ${lastName.trim()}`;

        /* ---------------------------------------------------
           FORMDATA PARA FASTAPI
           --------------------------------------------------- */

        const formData =
          new FormData();

        formData.append(
          "file",
          selectedFile,
        );

        formData.append(
          "person_id",
          personId,
        );

        formData.append(
          "name",
          fullName,
        );

        formData.append(
          "person_type",
          "student",
        );

        /* ---------------------------------------------------
           ENVÍO A FASTAPI
           --------------------------------------------------- */

        setMessage(
          "Analizando rostro...",
        );

        const response =
          await fetch(
            `${AI_API_URL}/api/register-face`,
            {
              method: "POST",
              body: formData,
            },
          );

        /* ---------------------------------------------------
           ERROR HTTP
           --------------------------------------------------- */

        if (!response.ok) {
          throw new Error(
            `El servidor respondió con HTTP ${response.status}.`,
          );
        }

        const result =
          await response.json();

        console.log(
          "Respuesta de FastAPI:",
          result,
        );

        /* ---------------------------------------------------
           ERROR DE LA API
           --------------------------------------------------- */

        if (!result.success) {
          throw new Error(
            result.message ||
              "La IA no pudo registrar el rostro.",
          );
        }

        /* ---------------------------------------------------
           VALIDAR ROSTROS
           --------------------------------------------------- */

        if (
          typeof result.faces_detected ===
            "number" &&
          result.faces_detected !== 1
        ) {
          throw new Error(
            result.message ||
              "La fotografía debe contener exactamente un rostro.",
          );
        }

        /* ---------------------------------------------------
           CREAR ESTUDIANTE
           --------------------------------------------------- */

        const newStudent: Student = {
          id: personId,

          code:
            code.trim(),

          dni:
            dni.trim(),

          firstName:
            firstName.trim(),

          lastName:
            lastName.trim(),

          faculty:
            faculty.trim(),

          career:
            career.trim(),

          image,

          registeredAt:
            new Date().toISOString(),

          faceRegistered: true,
        };

        /* ---------------------------------------------------
           ACTUALIZAR LISTA
           --------------------------------------------------- */

        const updatedStudents = [
          ...students,
          newStudent,
        ];

        setStudents(
          updatedStudents,
        );

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            updatedStudents,
          ),
        );

        /* ---------------------------------------------------
           ÉXITO
           --------------------------------------------------- */

        setFaceDetected(true);

        setMessageType(
          "success",
        );

        setMessage(
          "Estudiante y rostro registrados correctamente.",
        );

        /*
         * Cerramos el formulario después
         * de mostrar el mensaje de éxito.
         */
        window.setTimeout(() => {
          setShowForm(false);

          resetForm();
        }, 1000);

      } catch (error) {
        console.error(
          "Error registrando estudiante:",
          error,
        );

        let errorMessage =
          "No se pudo registrar el estudiante.";

        if (
          error instanceof TypeError
        ) {
          errorMessage =
            "No se pudo conectar con el servidor de IA. Verifica que FastAPI esté ejecutándose en http://127.0.0.1:8000.";
        } else if (
          error instanceof Error
        ) {
          errorMessage =
            error.message;
        }

        setMessageType("error");

        setMessage(
          errorMessage,
        );

      } finally {
        setRegistering(false);
      }
    };

  /* =========================================================
     ELIMINAR ESTUDIANTE
     ========================================================= */

  const deleteStudent = (
    id: string,
  ) => {
    const student = students.find(
      (item) => item.id === id,
    );

    if (!student) return;

    window.alert(
      "Los estudiantes provienen de SAP y no se eliminan desde este módulo.",
    );
  };

  /* =========================================================
     FILTRAR
     ========================================================= */

  const filteredStudents =
    students.filter(
      (student) => {
        const text =
          `${student.code} ${student.dni} ${student.firstName} ${student.lastName} ${student.faculty} ${student.career}`
            .toLowerCase();

        return text.includes(
          search.toLowerCase(),
        );
      },
    );

  /* =========================================================
     CARGA INICIAL DEL ESTADO BIOMÉTRICO
     ========================================================= */
  useEffect(() => {
    void loadStudentsFromSAP();
  }, []);

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="page">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="page-title page-title-with-action">

        <div>
          <h2>
            Estudiantes
          </h2>

          <p>
            Registro y gestión de estudiantes
            del sistema universitario.
          </p>
        </div>

        <button
          className="btn-primary"
          type="button"
          onClick={() => void loadStudentsFromSAP()}
          disabled={sapLoading}
        >
          <RefreshCw
            size={17}
            className={sapLoading ? "spin" : ""}
          />

          {sapLoading ? "Actualizando..." : "Actualizar desde SAP"}
        </button>

      </div>

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <div className="student-mini-stats">

        <div className="student-mini-card">

          <div className="student-mini-icon">
            <Users size={19} />
          </div>

          <div>

            <span>
              Estudiantes en SAP
            </span>

            <strong>
              {students.length}
            </strong>

          </div>

        </div>

        <div className="student-mini-card">

          <div className="student-mini-icon success">
            <ScanFace size={19} />
          </div>

          <div>

            <span>
              Rostros registrados
            </span>

            <strong>
              {
                students.filter(
                  (student) =>
                    student.faceRegistered ===
                      true,
                ).length
              }
            </strong>

          </div>

        </div>

        <div className="student-mini-card">

          <div className="student-mini-icon blue">
            <CheckCircle2 size={19} />
          </div>

          <div>

            <span>
              Estado del registro
            </span>

            <strong>
              Activo
            </strong>

          </div>

        </div>

      </div>

      {/* =====================================================
          DIRECTORIO
          ===================================================== */}

      <section className="content-card">

        <div className="students-toolbar">

          <div>

            <h3>
              Directorio de estudiantes
            </h3>

            <p>
              Estudiantes obtenidos directamente de la base académica SAP.
            </p>

          </div>

          <div className="students-search">

            <Search size={16} />

            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

        </div>

        {filteredStudents.length === 0 ? (

          <div className="students-empty">

            <div className="students-empty-icon">
              <Users size={30} />
            </div>

            <h3>
              {sapLoading
                ? "Cargando estudiantes..."
                : sapError
                  ? "No se pudo cargar SAP"
                  : "No hay estudiantes en SAP"}
            </h3>

            <p>
              {sapError ||
                "La lista se obtiene desde /api/sap-test/estudiantes."}
            </p>

            <button
              className="btn-primary"
              type="button"
              onClick={() => void loadStudentsFromSAP()}
              disabled={sapLoading}
            >
              <RefreshCw size={16} />
              {sapLoading ? "Consultando SAP..." : "Volver a consultar SAP"}
            </button>

          </div>

        ) : (

          <div className="students-table-wrapper">

            <table className="students-table">

              <thead>

                <tr>
                  <th>
                    Estudiante
                  </th>

                  <th>
                    Código
                  </th>

                  <th>
                    DNI
                  </th>

                  <th>
                    Facultad
                  </th>

                  <th>
                    Rostro
                  </th>

                  <th>
                    Acciones
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredStudents.map(
                  (student) => (

                    <tr
                      key={student.id}
                    >

                      <td>

                        <div className="student-person">

                          {student.image ? (

                            <img
                              src={
                                student.image
                              }
                              alt=""
                            />

                          ) : (

                            <div className="student-avatar">

                              {student.firstName
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}

                            </div>

                          )}

                          <div>

                            <strong>
                              {
                                student.firstName
                              }{" "}
                              {
                                student.lastName
                              }
                            </strong>

                            <span>
                              {
                                student.career
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        {student.code}
                      </td>

                      <td>
                        {student.dni}
                      </td>

                      <td>
                        {student.faculty}
                      </td>

                      <td>

                        {(student.faceRegistered || registeredFaceIds.has(student.code)) ? (

                          <span className="student-status success">

                            <CheckCircle2
                              size={13}
                            />

                            Registrado

                          </span>

                        ) : (

                          <span className="student-status warning">
                            Pendiente
                          </span>

                        )}

                      </td>

                      <td>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <button
                            className="btn-secondary"
                            type="button"
                            title={
                              student.faceRegistered || registeredFaceIds.has(student.code)
                                ? "Gestionar rostro"
                                : "Registrar rostro"
                            }
                            onClick={() => openBiometricRegistration(student)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: student.faceRegistered || registeredFaceIds.has(student.code)
                                ? "#15803d"
                                : "#b45309",
                            }}
                          >
                            {student.faceRegistered || registeredFaceIds.has(student.code) ? (
                              <RefreshCw size={15} />
                            ) : (
                              <ScanFace size={15} />
                            )}
                          </button>

                          <button
                            className="btn-secondary"
                            type="button"
                            title="Ver perfil completo"
                            onClick={() =>
                              openStudentProfile(
                                student,
                              )
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#1d4ed8",
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            className="student-delete"
                            type="button"
                            title="Eliminar"
                            onClick={() =>
                              deleteStudent(
                                student.id,
                              )
                            }
                          >

                            <Trash2
                              size={15}
                            />

                          </button>
                        </div>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* =====================================================
          MODAL PERFIL COMPLETO
          ===================================================== */}

      {selectedStudentProfile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.66)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100,
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeStudentProfile();
            }
          }}
        >
          <div
            style={{
              width: "min(820px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "var(--card-bg, #fff)",
              borderRadius: "22px",
              boxShadow: "0 30px 90px rgba(15, 23, 42, 0.28)",
              padding: 0,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "22px 24px",
                borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(59, 130, 246, 0.10)",
                    color: "#2563eb",
                  }}
                >
                  <Users size={24} />
                </div>

                <div>
                  <div
                    style={{
                      color: "#2563eb",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      marginBottom: "5px",
                    }}
                  >
                    PERFIL COMPLETO
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "22px",
                    }}
                  >
                    {selectedStudentProfile.firstName} {selectedStudentProfile.lastName}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={closeStudentProfile}
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
                padding: "22px 24px 26px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.4fr",
                  gap: "18px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(15,23,42,0.03))",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: "18px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "86px",
                      height: "86px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(59, 130, 246, 0.10)",
                      color: "#2563eb",
                      margin: "0 auto 14px",
                      overflow: "hidden",
                    }}
                  >
                    {selectedStudentProfile.image ? (
                      <img
                        src={selectedStudentProfile.image}
                        alt="Estudiante"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "32px",
                          fontWeight: 800,
                        }}
                      >
                        {selectedStudentProfile.firstName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "18px",
                        marginBottom: "4px",
                      }}
                    >
                      {selectedStudentProfile.firstName} {selectedStudentProfile.lastName}
                    </strong>
                    <span
                      style={{
                        fontSize: "12px",
                        opacity: 0.7,
                      }}
                    >
                      {selectedStudentProfile.code}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      gap: "8px",
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
                        background:
                          selectedStudentProfile.faceRegistered
                            ? "rgba(34, 197, 94, 0.10)"
                            : "rgba(245, 158, 11, 0.12)",
                        color: selectedStudentProfile.faceRegistered
                          ? "#15803d"
                          : "#b45309",
                      }}
                    >
                      {selectedStudentProfile.faceRegistered ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <ScanFace size={13} />
                      )}
                      {selectedStudentProfile.faceRegistered
                        ? "Biometría registrada"
                        : "Biometría pendiente"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(148, 163, 184, 0.06)",
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: "8px",
                      }}
                    >
                      DNI
                    </div>
                    <strong>{selectedStudentProfile.dni}</strong>
                  </div>

                  <div
                    style={{
                      background: "rgba(148, 163, 184, 0.06)",
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: "8px",
                      }}
                    >
                      Fecha de registro
                    </div>
                    <strong>
                      {new Date(selectedStudentProfile.registeredAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "rgba(148, 163, 184, 0.06)",
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: "8px",
                      }}
                    >
                      Facultad
                    </div>
                    <strong>{selectedStudentProfile.faculty}</strong>
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "rgba(148, 163, 184, 0.06)",
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: "8px",
                      }}
                    >
                      Carrera / especialidad
                    </div>
                    <strong>{selectedStudentProfile.career}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(59, 130, 246, 0.16)",
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(255,255,255,0.86))",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(59, 130, 246, 0.10)",
                      color: "#2563eb",
                    }}
                  >
                    <ScanFace size={17} />
                  </div>

                  <strong style={{ fontSize: "14px" }}>
                    Registro biométrico
                  </strong>
                </div>

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                    opacity: 0.75,
                    fontSize: "13px",
                  }}
                >
                  {selectedStudentProfile.faceRegistered
                    ? "Este estudiante ya cuenta con un rostro registrado en el sistema y puede ser identificado automáticamente por reconocimiento facial."
                    : "Este estudiante aún no tiene un rostro registrado. Puede completar el registro desde el módulo de estudiantes."}
                </p>
              </div>

              <button
                type="button"
                className="student-schedule-open-button"
                onClick={() => setShowStudentSchedule(true)}
              >
                <CalendarDays size={17} />
                Ver horario y registrar asistencia
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudentProfile && showStudentSchedule && (
        <HorarioEstudiante
          estudiante={selectedStudentProfile}
          onClose={() => setShowStudentSchedule(false)}
          onOpenRecognition={() => {
            setShowStudentSchedule(false);
            closeStudentProfile();
            onNavigate("deteccion");
          }}
        />
      )}

      {/* =====================================================
          MODAL REGISTRO / GESTIÓN BIOMÉTRICA
          ===================================================== */}
      {biometricOpen && biometricStudent && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1300 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeBiometricRegistration();
            }
          }}
        >
          <div
            className="student-modal"
            style={{ width: "min(860px, 96vw)" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="student-modal-header">
              <div>
                <span>BIOMETRÍA FACIAL</span>
                <h3>
                  {biometricStudent.faceRegistered || registeredFaceIds.has(biometricStudent.code)
                    ? "Gestionar rostro"
                    : "Registrar rostro"}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeBiometricRegistration}
                disabled={biometricBusy}
              >
                <X size={19} />
              </button>
            </div>

            <div className="student-modal-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  marginBottom: "18px",
                  borderRadius: "14px",
                  background: "rgba(59,130,246,0.06)",
                  border: "1px solid rgba(59,130,246,0.14)",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(59,130,246,0.10)",
                    color: "#2563eb",
                  }}
                >
                  <ScanFace size={24} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "16px" }}>
                    {biometricStudent.firstName} {biometricStudent.lastName}
                  </strong>
                  <span style={{ fontSize: "12px", opacity: 0.7 }}>
                    Código SAP / matrícula: {biometricStudent.code}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.45fr) minmax(260px, 0.8fr)",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    minHeight: "360px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    background: "#0f172a",
                    border: "1px solid rgba(148,163,184,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {biometricPreview ? (
                    <img
                      src={biometricPreview}
                      alt="Vista previa del rostro"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "360px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "360px",
                        objectFit: "cover",
                        transform: "scaleX(-1)",
                      }}
                    />
                  )}

                  {!biometricPreview && (
                    <div
                      style={{
                        position: "absolute",
                        inset: "12% 22%",
                        border: "2px solid rgba(255,255,255,0.82)",
                        borderRadius: "46% 46% 42% 42%",
                        boxShadow: "0 0 0 999px rgba(15,23,42,0.16)",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {!cameraActive && !biometricPreview && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        textAlign: "center",
                        padding: "24px",
                      }}
                    >
                      <CameraOff size={34} style={{ marginBottom: 10 }} />
                      <strong>Cámara desactivada</strong>
                      <span style={{ fontSize: "12px", opacity: 0.72, marginTop: 5 }}>
                        Inicia la cámara para capturar el rostro.
                      </span>
                    </div>
                  )}

                  {cameraActive && !biometricPreview && (
                    <div
                      style={{
                        position: "absolute",
                        left: 14,
                        top: 14,
                        padding: "7px 10px",
                        borderRadius: "999px",
                        background: "rgba(22,163,74,0.88)",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      ● CÁMARA ACTIVA
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div
                    style={{
                      padding: "15px",
                      borderRadius: "14px",
                      background: "rgba(148,163,184,0.06)",
                      border: "1px solid rgba(148,163,184,0.15)",
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "8px" }}>
                      Instrucciones
                    </strong>
                    <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", lineHeight: 1.7, opacity: 0.78 }}>
                      <li>Ubica el rostro dentro del óvalo.</li>
                      <li>Mira directamente a la cámara.</li>
                      <li>Evita personas adicionales en la imagen.</li>
                      <li>Captura con buena iluminación.</li>
                    </ol>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={cameraActive ? captureBiometricPhoto : startBiometricCamera}
                    disabled={biometricBusy}
                    style={{ justifyContent: "center" }}
                  >
                    {cameraActive ? <Camera size={16} /> : <Camera size={16} />}
                    {cameraActive ? "Capturar rostro" : "Iniciar cámara"}
                  </button>

                  <input
                    ref={biometricFileInputRef}
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleBiometricFile}
                    disabled={biometricBusy}
                  />

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => biometricFileInputRef.current?.click()}
                    disabled={biometricBusy}
                    style={{ justifyContent: "center" }}
                  >
                    <ImagePlus size={16} />
                    Seleccionar fotografía
                  </button>

                  {biometricPreview && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        if (biometricPreview) URL.revokeObjectURL(biometricPreview);
                        setBiometricPreview(null);
                        setBiometricFile(null);
                        setBiometricMessage("");
                        setBiometricMessageType("");
                        void startBiometricCamera();
                      }}
                      disabled={biometricBusy}
                      style={{ justifyContent: "center" }}
                    >
                      <RefreshCw size={16} />
                      Volver a capturar
                    </button>
                  )}

                  {cameraActive && !biometricPreview && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={stopBiometricCamera}
                      disabled={biometricBusy}
                      style={{ justifyContent: "center" }}
                    >
                      <CameraOff size={16} />
                      Detener cámara
                    </button>
                  )}

                  {cameraError && (
                    <div className="student-form-message" style={{ marginTop: 0 }}>
                      {cameraError}
                    </div>
                  )}

                  {biometricMessage && (
                    <div
                      className={
                        biometricMessageType === "success"
                          ? "student-form-message student-form-message-success"
                          : "student-form-message"
                      }
                    >
                      {biometricMessage}
                    </div>
                  )}

                  {biometricPreview && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={registerStudentFace}
                      disabled={biometricBusy}
                      style={{ justifyContent: "center", marginTop: "auto" }}
                    >
                      {biometricBusy ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          Registrando rostro...
                        </>
                      ) : (
                        <>
                          <ScanFace size={16} />
                          Guardar biometría
                        </>
                      )}
                    </button>
                  )}

                  {(biometricStudent.faceRegistered || registeredFaceIds.has(biometricStudent.code)) && (
                    <button
                      type="button"
                      className="student-remove-photo"
                      onClick={() => deleteStudentFace(biometricStudent)}
                      disabled={biometricBusy}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <Trash2 size={15} />
                      Eliminar registro facial
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="student-modal-footer">
              <button
                type="button"
                className="student-cancel"
                onClick={closeBiometricRegistration}
                disabled={biometricBusy}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL
          ===================================================== */}

      {showForm && (

        <div className="modal-overlay">

          <div className="student-modal">

            {/* =================================================
                CABECERA
                ================================================= */}

            <div className="student-modal-header">

              <div>

                <span>
                  REGISTRO DE PERSONA
                </span>

                <h3>
                  Nuevo estudiante
                </h3>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeForm}
                disabled={registering}
              >
                <X size={19} />
              </button>

            </div>

            {/* =================================================
                CUERPO
                ================================================= */}

            <div className="student-modal-body">

              {/* =================================================
                  DATOS PERSONALES
                  ================================================= */}

              <div className="student-form-section">

                <div className="student-form-title">

                  <Users size={16} />

                  Información personal

                </div>

                <div className="student-form-grid">

                  <label>
                    Código / matrícula

                    <input
                      value={code}
                      onChange={(event) =>
                        setCode(
                          event.target.value,
                        )
                      }
                      placeholder="Ej. 2026123456"
                      disabled={
                        registering
                      }
                    />

                  </label>

                  <label>
                    DNI

                    <input
                      value={dni}
                      maxLength={8}
                      inputMode="numeric"
                      onChange={(event) => {
                        const value =
                          event.target.value.replace(
                            /\D/g,
                            "",
                          );

                        setDni(value);
                      }}
                      placeholder="Ej. 12345678"
                      disabled={
                        registering
                      }
                    />

                  </label>

                  <label>
                    Nombres

                    <input
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(
                          event.target.value,
                        )
                      }
                      placeholder="Nombres"
                      disabled={
                        registering
                      }
                    />

                  </label>

                  <label>
                    Apellidos

                    <input
                      value={lastName}
                      onChange={(event) =>
                        setLastName(
                          event.target.value,
                        )
                      }
                      placeholder="Apellidos"
                      disabled={
                        registering
                      }
                    />

                  </label>

                  <label>
                    Facultad

                    <input
                      value={faculty}
                      onChange={(event) =>
                        setFaculty(
                          event.target.value,
                        )
                      }
                      placeholder="Facultad"
                      disabled={
                        registering
                      }
                    />

                  </label>

                  <label>
                    Carrera profesional

                    <input
                      value={career}
                      onChange={(event) =>
                        setCareer(
                          event.target.value,
                        )
                      }
                      placeholder="Carrera profesional"
                      disabled={
                        registering
                      }
                    />

                  </label>

                </div>

              </div>

              {/* =================================================
                  FOTOGRAFÍA
                  ================================================= */}

              <div className="student-form-section">

                <div className="student-form-title">

                  <ScanFace size={16} />

                  Fotografía facial

                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleImage}
                  disabled={registering}
                />

                {!image ? (

                  <div
                    className="student-photo-upload"
                    onClick={
                      registering
                        ? undefined
                        : openFileSelector
                    }
                  >

                    <div className="student-photo-icon">

                      <ImagePlus
                        size={27}
                      />

                    </div>

                    <strong>
                      Seleccionar fotografía
                    </strong>

                    <span>
                      JPG, JPEG o PNG
                    </span>

                    <button
                      type="button"
                      className="btn-primary"
                      disabled={
                        registering
                      }
                      onClick={(event) => {

                        event.stopPropagation();

                        openFileSelector();

                      }}
                    >

                      <ImagePlus
                        size={16}
                      />

                      Seleccionar

                    </button>

                  </div>

                ) : (

                  <div className="student-photo-preview">

                    <img
                      src={image}
                      alt="Fotografía del estudiante"
                    />

                    <div className="student-photo-actions">

                      <div className="student-photo-name">

                        <ImagePlus
                          size={15}
                        />

                        <span>
                          {selectedFile?.name ||
                            "Fotografía seleccionada"}
                        </span>

                      </div>

                      <div>

                        <button
                          type="button"
                          className="student-change-photo"
                          onClick={
                            openFileSelector
                          }
                          disabled={
                            registering
                          }
                        >
                          Cambiar
                        </button>

                        <button
                          type="button"
                          className="student-remove-photo"
                          onClick={
                            removeImage
                          }
                          disabled={
                            registering
                          }
                        >
                          Eliminar
                        </button>

                      </div>

                    </div>

                  </div>

                )}

              </div>

              {/* =================================================
                  ROSTRO DETECTADO
                  ================================================= */}

              {faceDetected && (

                <div className="student-face-success">

                  <CheckCircle2
                    size={18}
                  />

                  <div>

                    <strong>
                      Rostro registrado
                    </strong>

                    <span>
                      La representación facial
                      fue generada correctamente
                      por el motor de IA.
                    </span>

                  </div>

                </div>

              )}

              {/* =================================================
                  MENSAJE
                  ================================================= */}

              {message && (

                <div
                  className={
                    messageType ===
                    "success"
                      ? "student-form-message student-form-message-success"
                      : "student-form-message"
                  }
                >

                  {message}

                </div>

              )}

            </div>

            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="student-modal-footer">

              <button
                type="button"
                className="student-cancel"
                onClick={closeForm}
                disabled={
                  registering
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={
                  registerStudent
                }
                disabled={
                  registering
                }
              >

                {registering ? (

                  <>
                    <Loader2
                      size={16}
                      className="spin"
                    />

                    Registrando rostro...

                  </>

                ) : (

                  <>
                    <UserPlus
                      size={16}
                    />

                    Registrar estudiante
                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}