import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — GestorClub",
  description:
    "Política de privacidad y tratamiento de datos personales de GestorClub, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador.",
};

export default function PoliticaPrivacidadPage() {
  const fechaActualizacion = "24 de septiembre de 2026";

  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-4 py-12 text-foreground"
    >
      <div className="mb-8 space-y-2">
        <p className="text-sm text-muted-foreground">
          Última actualización: {fechaActualizacion}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Política de Privacidad
        </h1>
        <p className="text-muted-foreground">
          Esta política describe cómo GestorClub recopila, usa y protege los
          datos personales, de conformidad con la{" "}
          <strong>
            Ley Orgánica de Protección de Datos Personales (LOPDP)
          </strong>{" "}
          de la República del Ecuador y su Reglamento de aplicación.
        </p>
      </div>

      <nav
        aria-label="Tabla de contenidos"
        className="mb-10 rounded-lg border bg-muted/50 p-4 text-sm"
      >
        <p className="mb-2 font-semibold">Contenido</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li><a href="#responsable" className="hover:text-foreground underline underline-offset-2">Responsable del tratamiento</a></li>
          <li><a href="#datos" className="hover:text-foreground underline underline-offset-2">Datos que recopilamos</a></li>
          <li><a href="#finalidad" className="hover:text-foreground underline underline-offset-2">Finalidad y base legal del tratamiento</a></li>
          <li><a href="#menores" className="hover:text-foreground underline underline-offset-2">Tratamiento de datos de menores de edad</a></li>
          <li><a href="#sensibles" className="hover:text-foreground underline underline-offset-2">Datos sensibles (información médica)</a></li>
          <li><a href="#conservacion" className="hover:text-foreground underline underline-offset-2">Conservación de datos</a></li>
          <li><a href="#cookies" className="hover:text-foreground underline underline-offset-2">Cookies y tecnologías similares</a></li>
          <li><a href="#compartir" className="hover:text-foreground underline underline-offset-2">Compartir datos con terceros</a></li>
          <li><a href="#seguridad" className="hover:text-foreground underline underline-offset-2">Medidas de seguridad</a></li>
          <li><a href="#derechos" className="hover:text-foreground underline underline-offset-2">Derechos del titular</a></li>
          <li><a href="#contacto" className="hover:text-foreground underline underline-offset-2">Contacto y reclamaciones</a></li>
        </ol>
      </nav>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed">

        {/* 1 */}
        <section id="responsable">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            1. Responsable del tratamiento
          </h2>
          <p>
            El responsable del tratamiento de datos es el titular de la cuenta
            GestorClub que opera la organización (club, academia o gimnasio)
            correspondiente (en adelante, <strong>"el Club"</strong>). GestorClub
            actúa como <strong>encargado del tratamiento</strong> en nombre del
            Club, procesando los datos únicamente según sus instrucciones y los
            términos de este documento.
          </p>
          <p className="mt-2">
            La plataforma GestorClub es operada por su desarrollador, con domicilio
            en Ecuador. Para consultas sobre privacidad dirígete a la dirección
            indicada en la sección 11.
          </p>
        </section>

        {/* 2 */}
        <section id="datos">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            2. Datos que recopilamos
          </h2>
          <p>Recopilamos las siguientes categorías de datos personales:</p>
          <div className="mt-3 space-y-4">
            <div className="rounded-md border p-3">
              <p className="font-medium">Datos de identificación del miembro/deportista</p>
              <p className="mt-1 text-muted-foreground">
                Nombre completo, fecha de nacimiento, cédula de identidad,
                fotografía, unidad educativa, curso o año escolar, número de
                teléfono, correo electrónico.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Datos del representante legal</p>
              <p className="mt-1 text-muted-foreground">
                Nombre completo, parentesco, cédula de identidad, teléfono,
                correo electrónico. Estos datos son obligatorios cuando el
                miembro es menor de edad.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Datos de salud (categoría sensible)</p>
              <p className="mt-1 text-muted-foreground">
                Tipo de sangre, alergias conocidas, condiciones médicas
                relevantes, medicamentos actuales. Ver sección 5.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Datos de membresía y pagos</p>
              <p className="mt-1 text-muted-foreground">
                Plan de membresía, fechas de vigencia, historial de pagos,
                comprobantes de transferencia bancaria, número de referencia
                de transacciones.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Datos de asistencia y acceso</p>
              <p className="mt-1 text-muted-foreground">
                Registros de check-in (fecha, hora, método), participación en
                clases y sesiones.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Datos técnicos de uso de la plataforma</p>
              <p className="mt-1 text-muted-foreground">
                Dirección IP, tipo de navegador, páginas visitadas dentro de la
                plataforma (sin rastreo de terceros con fines publicitarios).
              </p>
            </div>
          </div>
        </section>

        {/* 3 */}
        <section id="finalidad">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            3. Finalidad y base legal del tratamiento
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border px-3 py-2 text-left font-medium">Finalidad</th>
                  <th className="border px-3 py-2 text-left font-medium">Base legal (LOPDP)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Gestión de membresías y control de acceso al club", "Ejecución de contrato (art. 26 lit. b)"],
                  ["Registro y seguimiento de pagos", "Ejecución de contrato (art. 26 lit. b)"],
                  ["Envío de recordatorios de pago por WhatsApp/email", "Interés legítimo del responsable (art. 26 lit. f)"],
                  ["Gestión de asistencia a clases y sesiones", "Ejecución de contrato (art. 26 lit. b)"],
                  ["Atención médica de emergencia durante entrenamientos", "Protección de intereses vitales (art. 26 lit. d)"],
                  ["Generación de reportes e informes del club", "Interés legítimo del responsable (art. 26 lit. f)"],
                  ["Verificación de identidad en el control de acceso por QR", "Ejecución de contrato (art. 26 lit. b)"],
                  ["Cumplimiento de obligaciones legales del club", "Obligación legal (art. 26 lit. c)"],
                ].map(([fin, base]) => (
                  <tr key={fin} className="even:bg-muted/30">
                    <td className="border px-3 py-2">{fin}</td>
                    <td className="border px-3 py-2 text-muted-foreground">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 */}
        <section id="menores">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            4. Tratamiento de datos de menores de edad
          </h2>
          <p>
            GestorClub está diseñado para la gestión de academias deportivas
            infantiles y juveniles. En consecuencia, procesamos datos de personas
            menores de 18 años con sujeción a las siguientes garantías:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              El <strong>consentimiento</strong> para el tratamiento de datos del
              menor es otorgado por su representante legal (padre, madre o tutor)
              mediante el formulario de inscripción, conforme al{" "}
              <strong>Código de la Niñez y Adolescencia del Ecuador</strong> y la
              LOPDP art. 26.
            </li>
            <li>
              Los datos de menores <strong>no son compartidos</strong> con terceros
              salvo las situaciones descritas en la sección 8.
            </li>
            <li>
              El representante legal puede ejercer, en nombre del menor, todos los
              derechos descritos en la sección 10 (acceso, rectificación,
              supresión, oposición).
            </li>
            <li>
              Las fotografías de los menores se almacenan en servidores seguros y
              se utilizan exclusivamente para la identificación dentro del club.
            </li>
          </ul>
        </section>

        {/* 5 */}
        <section id="sensibles">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            5. Datos sensibles — información médica
          </h2>
          <p>
            La información de salud (tipo de sangre, alergias, condiciones médicas)
            constituye <strong>dato sensible</strong> según el art. 4 numeral 14
            de la LOPDP y recibe protección reforzada:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Se recopila exclusivamente para <strong>proteger la integridad
              física del deportista</strong> durante los entrenamientos y en caso
              de emergencia médica.
            </li>
            <li>
              El acceso a esta información está restringido dentro de la plataforma:
              solo personal autorizado del club (entrenadores designados,
              administrador) puede visualizarla.
            </li>
            <li>
              No se utiliza para ninguna finalidad comercial, de seguros, ni de
              perfilado.
            </li>
            <li>
              El consentimiento para este tratamiento es <strong>explícito y
              separado</strong>, conforme al art. 26 lit. a de la LOPDP.
            </li>
          </ul>
        </section>

        {/* 6 */}
        <section id="conservacion">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            6. Conservación de datos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border px-3 py-2 text-left font-medium">Categoría</th>
                  <th className="border px-3 py-2 text-left font-medium">Plazo de conservación</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Datos del miembro activo", "Mientras dure la relación con el club"],
                  ["Datos del miembro inactivo/cancelado", "3 años desde la baja (por posibles reclamaciones)"],
                  ["Registros de pagos y comprobantes", "7 años (obligación tributaria / Código Tributario Ecuador)"],
                  ["Registros de asistencia", "2 años"],
                  ["Datos médicos", "Mientras dure la membresía + 2 años adicionales"],
                  ["Logs de acceso técnico", "90 días"],
                ].map(([cat, plazo]) => (
                  <tr key={cat} className="even:bg-muted/30">
                    <td className="border px-3 py-2">{cat}</td>
                    <td className="border px-3 py-2 text-muted-foreground">{plazo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-muted-foreground">
            Transcurridos estos plazos, los datos se eliminan o anonomizan de forma
            irreversible.
          </p>
        </section>

        {/* 7 */}
        <section id="cookies">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            7. Cookies y tecnologías similares
          </h2>
          <p>
            GestorClub utiliza únicamente <strong>cookies técnicas
            estrictamente necesarias</strong>. No utilizamos cookies de rastreo,
            publicidad o análisis de terceros.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border px-3 py-2 text-left font-medium">Cookie</th>
                  <th className="border px-3 py-2 text-left font-medium">Propósito</th>
                  <th className="border px-3 py-2 text-left font-medium">Duración</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["sb-access-token", "Token de sesión de autenticación (Supabase Auth)", "1 hora"],
                  ["sb-refresh-token", "Renovación automática de sesión", "60 días (o hasta cierre de sesión)"],
                ].map(([name, desc, dur]) => (
                  <tr key={name} className="even:bg-muted/30">
                    <td className="border px-3 py-2 font-mono text-xs">{name}</td>
                    <td className="border px-3 py-2 text-muted-foreground">{desc}</td>
                    <td className="border px-3 py-2 text-muted-foreground">{dur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-muted-foreground">
            Las cookies técnicas no requieren consentimiento según la normativa
            ecuatoriana. Puedes eliminarlas desde la configuración de tu
            navegador, aunque esto cerrará tu sesión activa.
          </p>
        </section>

        {/* 8 */}
        <section id="compartir">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            8. Compartir datos con terceros
          </h2>
          <p>
            No vendemos ni cedemos datos personales a terceros con fines
            comerciales. Los datos pueden ser accedidos por los siguientes
            proveedores de servicios, que actúan como subencargados del
            tratamiento con contratos de confidencialidad:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Supabase Inc.</strong> (EE.UU.) — Infraestructura de base
              de datos, autenticación y almacenamiento de archivos.
            </li>
            <li>
              <strong>Vercel Inc.</strong> (EE.UU.) — Alojamiento de la
              aplicación web.
            </li>
            <li>
              <strong>Twilio Inc.</strong> (EE.UU.) — Envío de mensajes de
              WhatsApp (recordatorios de pago). Solo recibe el número de teléfono
              y el contenido del mensaje.
            </li>
            <li>
              <strong>Resend Inc.</strong> (EE.UU.) — Envío de correos
              electrónicos transaccionales.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Las transferencias internacionales de datos a estos proveedores
            cuentan con garantías adecuadas (cláusulas contractuales tipo,
            certificaciones de seguridad), conforme al art. 54 de la LOPDP.
          </p>
          <p className="mt-2 text-muted-foreground">
            Adicionalmente, podemos divulgar datos cuando sea requerido por
            autoridades competentes mediante orden judicial o legal válida en
            Ecuador.
          </p>
        </section>

        {/* 9 */}
        <section id="seguridad">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            9. Medidas de seguridad
          </h2>
          <p>
            Implementamos las siguientes medidas técnicas y organizativas para
            proteger los datos personales:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Comunicaciones cifradas mediante TLS/HTTPS en toda la plataforma.</li>
            <li>Aislamiento de datos por organización mediante políticas de seguridad a nivel de fila (Row Level Security) en la base de datos.</li>
            <li>Almacenamiento de archivos sensibles en buckets privados con URLs de acceso firmadas y temporales.</li>
            <li>Contraseñas almacenadas con hash (bcrypt) — no se almacenan en texto plano.</li>
            <li>Autenticación con tokens de corta duración y renovación automática segura.</li>
            <li>Registro de auditoría de acciones sensibles (aprobación de pagos, modificación de roles, eliminación de datos).</li>
            <li>Acceso al panel de administración restringido por rol (RBAC).</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            En caso de una brecha de seguridad que afecte datos personales,
            notificaremos al responsable del tratamiento (el Club) y, cuando
            corresponda, a la{" "}
            <strong>Superintendencia de Protección de Datos Personales</strong>{" "}
            dentro del plazo establecido por la LOPDP (art. 44).
          </p>
        </section>

        {/* 10 */}
        <section id="derechos">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            10. Derechos del titular de los datos
          </h2>
          <p>
            Conforme al Capítulo IV de la LOPDP, el titular de los datos tiene
            los siguientes derechos, ejercibles sin costo:
          </p>
          <div className="mt-3 space-y-3">
            {[
              ["Derecho de acceso (art. 22)", "Conocer qué datos personales tuyos están siendo tratados, con qué finalidad y durante cuánto tiempo."],
              ["Derecho de rectificación (art. 23)", "Solicitar la corrección de datos inexactos o incompletos."],
              ["Derecho de eliminación / supresión (art. 24)", "Solicitar la eliminación de tus datos cuando ya no sean necesarios o el tratamiento sea ilícito."],
              ["Derecho de oposición (art. 25)", "Oponerte al tratamiento de tus datos en determinadas circunstancias, especialmente cuando se base en interés legítimo."],
              ["Derecho de portabilidad (art. 26)", "Recibir tus datos en un formato estructurado y legible por máquina para transferirlos a otro responsable."],
              ["Derecho a no ser objeto de decisiones automatizadas (art. 27)", "No ser sometido a decisiones basadas únicamente en tratamiento automatizado que te afecten significativamente."],
              ["Derecho de limitación del tratamiento (art. 28)", "Solicitar que el tratamiento de tus datos quede restringido mientras se resuelve una disputa."],
            ].map(([titulo, desc]) => (
              <div key={titulo} className="rounded-md border p-3">
                <p className="font-medium text-foreground">{titulo}</p>
                <p className="mt-1 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-muted-foreground">
            Para ejercer estos derechos, dirígete en primera instancia al Club del
            que eres miembro (el responsable del tratamiento). Si no obtienes
            respuesta en 15 días hábiles, puedes contactar a GestorClub o
            presentar una reclamación ante la{" "}
            <strong>Superintendencia de Protección de Datos Personales</strong>.
          </p>
        </section>

        {/* 11 */}
        <section id="contacto">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            11. Contacto y reclamaciones
          </h2>
          <p>
            Para ejercer tus derechos o para cualquier consulta sobre privacidad,
            contacta al Club directamente. Si tu consulta es sobre la plataforma
            GestorClub como encargado del tratamiento, puedes escribirnos a:
          </p>
          <div className="mt-3 rounded-md border bg-muted/30 p-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">GestorClub</strong>
            </p>
            <p>Ecuador</p>
            <p>
              Correo electrónico:{" "}
              <a
                href="mailto:privacidad@gestorclub.app"
                className="text-primary hover:underline"
              >
                privacidad@gestorclub.app
              </a>
            </p>
          </div>
          <p className="mt-4 text-muted-foreground">
            Si consideras que tus derechos han sido vulnerados, puedes presentar
            una reclamación ante la{" "}
            <strong>Superintendencia de Protección de Datos Personales</strong>{" "}
            (SPDP) de Ecuador, autoridad de control competente según la LOPDP.
          </p>
          <p className="mt-3 text-muted-foreground">
            Nos reservamos el derecho de actualizar esta política para reflejar
            cambios normativos o en la plataforma. Notificaremos los cambios
            materiales con al menos 15 días de anticipación a través de la
            plataforma o por correo electrónico.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
        <p>
          ¿Tienes preguntas?{" "}
          <a
            href="mailto:privacidad@gestorclub.app"
            className="text-primary hover:underline"
          >
            Escríbenos
          </a>{" "}
          ·{" "}
          <Link href="/legal/terminos" className="text-primary hover:underline">
            Términos y Condiciones
          </Link>
        </p>
      </div>
    </main>
  );
}
