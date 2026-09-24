import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — GestorClub",
  description:
    "Términos y condiciones de uso de la plataforma GestorClub para la gestión de clubes deportivos en Ecuador.",
};

export default function TerminosPage() {
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
          Términos y Condiciones de Uso
        </h1>
        <p className="text-muted-foreground">
          Al registrar una organización o acceder a la plataforma GestorClub,
          aceptas los presentes Términos y Condiciones. Si no estás de acuerdo,
          no debes usar el servicio.
        </p>
      </div>

      <nav
        aria-label="Tabla de contenidos"
        className="mb-10 rounded-lg border bg-muted/50 p-4 text-sm"
      >
        <p className="mb-2 font-semibold">Contenido</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li><a href="#definiciones" className="hover:text-foreground underline underline-offset-2">Definiciones</a></li>
          <li><a href="#objeto" className="hover:text-foreground underline underline-offset-2">Objeto del servicio</a></li>
          <li><a href="#registro" className="hover:text-foreground underline underline-offset-2">Registro y cuenta</a></li>
          <li><a href="#planes" className="hover:text-foreground underline underline-offset-2">Planes y pagos</a></li>
          <li><a href="#uso-aceptable" className="hover:text-foreground underline underline-offset-2">Uso aceptable</a></li>
          <li><a href="#datos" className="hover:text-foreground underline underline-offset-2">Propiedad y responsabilidad sobre los datos</a></li>
          <li><a href="#propiedad-intelectual" className="hover:text-foreground underline underline-offset-2">Propiedad intelectual</a></li>
          <li><a href="#disponibilidad" className="hover:text-foreground underline underline-offset-2">Disponibilidad del servicio</a></li>
          <li><a href="#responsabilidad" className="hover:text-foreground underline underline-offset-2">Limitación de responsabilidad</a></li>
          <li><a href="#suspension" className="hover:text-foreground underline underline-offset-2">Suspensión y terminación</a></li>
          <li><a href="#modificaciones" className="hover:text-foreground underline underline-offset-2">Modificaciones</a></li>
          <li><a href="#ley" className="hover:text-foreground underline underline-offset-2">Ley aplicable y jurisdicción</a></li>
        </ol>
      </nav>

      <div className="space-y-10 text-sm leading-relaxed">

        {/* 1 */}
        <section id="definiciones">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            1. Definiciones
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">GestorClub</strong>: La plataforma de software como servicio (SaaS) para gestión de clubes deportivos, incluyendo su aplicación web, API y componentes relacionados.</li>
            <li><strong className="text-foreground">Proveedor</strong>: El titular y operador de la plataforma GestorClub.</li>
            <li><strong className="text-foreground">Club / Organización</strong>: El club deportivo, academia o gimnasio que contrata y usa GestorClub como responsable administrativo.</li>
            <li><strong className="text-foreground">Usuario administrador</strong>: La persona natural que representa al Club y gestiona la cuenta (owner, admin, staff, trainer).</li>
            <li><strong className="text-foreground">Miembro</strong>: El deportista o afiliado registrado en el Club dentro de la plataforma.</li>
            <li><strong className="text-foreground">Cuenta</strong>: El registro de acceso creado por el usuario administrador para usar GestorClub.</li>
            <li><strong className="text-foreground">Datos del Club</strong>: Toda información cargada, procesada o generada por el Club dentro de la plataforma, incluyendo datos de miembros, pagos y asistencia.</li>
          </ul>
        </section>

        {/* 2 */}
        <section id="objeto">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            2. Objeto del servicio
          </h2>
          <p className="text-muted-foreground">
            GestorClub ofrece una plataforma web multi-tenant que permite a
            clubes deportivos:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Gestionar miembros y sus membresías.</li>
            <li>Registrar y hacer seguimiento de pagos.</li>
            <li>Enviar recordatorios automáticos de pago por WhatsApp y correo electrónico.</li>
            <li>Controlar el acceso y asistencia mediante código QR.</li>
            <li>Gestionar clases, horarios e inscripciones.</li>
            <li>Generar reportes e indicadores de gestión.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            El servicio se presta exclusivamente a través de la plataforma web.
            No existe aplicación móvil nativa.
          </p>
        </section>

        {/* 3 */}
        <section id="registro">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            3. Registro y cuenta
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Para usar GestorClub, el representante del Club debe registrar una
              cuenta proporcionando información verdadera, actual y completa.
            </li>
            <li>
              Cada cuenta corresponde a un Club. Un mismo usuario puede administrar
              varias organizaciones.
            </li>
            <li>
              El titular de la cuenta es responsable de mantener la
              confidencialidad de sus credenciales y de todas las acciones
              realizadas bajo su cuenta.
            </li>
            <li>
              Debes notificarnos inmediatamente si detectas acceso no autorizado
              a tu cuenta.
            </li>
            <li>
              El registro de nuevas cuentas incluye un período de prueba gratuito
              según las condiciones vigentes en el momento del registro.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section id="planes">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            4. Planes y pagos
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              GestorClub ofrece distintos planes de suscripción con diferentes
              funcionalidades y límites. Los precios vigentes se muestran en la
              plataforma.
            </li>
            <li>
              Los pagos de suscripción se realizan mediante transferencia
              bancaria al Proveedor, con aprobación manual. En fases futuras
              podrán habilitarse pagos automáticos con pasarela.
            </li>
            <li>
              Los precios se expresan en <strong>dólares estadounidenses (USD)</strong>,
              moneda oficial de la República del Ecuador.
            </li>
            <li>
              La suscripción se renueva automáticamente al vencimiento salvo
              cancelación previa con al menos 5 días hábiles de anticipación.
            </li>
            <li>
              El impuesto al valor agregado (IVA) aplicable según la legislación
              ecuatoriana vigente se añadirá al precio base cuando corresponda.
            </li>
            <li>
              <strong>No se realizan reembolsos</strong> por períodos ya
              facturados y pagados, salvo error imputable al Proveedor.
            </li>
            <li>
              Si el pago no se recibe en la fecha de vencimiento, la cuenta
              pasará a estado <em>atrasada</em>. Tras 7 días sin regularización,
              el acceso se suspenderá en modo de solo lectura hasta el pago.
            </li>
          </ul>
        </section>

        {/* 5 */}
        <section id="uso-aceptable">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            5. Uso aceptable
          </h2>
          <p className="text-muted-foreground">
            Al usar GestorClub, el Club y sus usuarios se comprometen a:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Usar la plataforma únicamente para fines lícitos de gestión deportiva.</li>
            <li>No registrar datos de personas sin su consentimiento o el de su representante legal.</li>
            <li>Informar a sus miembros sobre el tratamiento de sus datos, conforme a la LOPDP.</li>
            <li>No intentar acceder a datos de otras organizaciones ni realizar ingeniería inversa de la plataforma.</li>
            <li>No usar la plataforma para enviar comunicaciones masivas no relacionadas con la gestión del club.</li>
            <li>Mantener actualizados los datos de contacto del Club.</li>
            <li>No ceder credenciales de acceso a terceros no autorizados.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            El incumplimiento de estas condiciones puede resultar en la suspensión
            o terminación inmediata de la cuenta.
          </p>
        </section>

        {/* 6 */}
        <section id="datos">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            6. Propiedad y responsabilidad sobre los datos
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Los <strong>Datos del Club</strong> (miembros, pagos, asistencia)
              son propiedad exclusiva del Club. GestorClub los procesa en calidad
              de encargado del tratamiento y no ejerce derechos sobre ellos.
            </li>
            <li>
              El Club es el <strong>responsable del tratamiento</strong> ante sus
              miembros y ante la Superintendencia de Protección de Datos
              Personales, conforme a la LOPDP.
            </li>
            <li>
              El Club garantiza que cuenta con las autorizaciones necesarias para
              cargar y procesar los datos de sus miembros en la plataforma,
              especialmente los datos sensibles de menores de edad.
            </li>
            <li>
              Ante la terminación del servicio, el Club puede solicitar la
              exportación de sus datos en formato CSV durante los 30 días
              posteriores a la cancelación. Transcurrido ese plazo, los datos
              serán eliminados.
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section id="propiedad-intelectual">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            7. Propiedad intelectual
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              La plataforma GestorClub, su código fuente, diseño, marca y
              materiales son propiedad exclusiva del Proveedor y están protegidos
              por la Ley de Propiedad Intelectual del Ecuador.
            </li>
            <li>
              El contrato de uso otorga al Club una <strong>licencia no exclusiva,
              intransferible y revocable</strong> para usar la plataforma durante
              la vigencia de la suscripción.
            </li>
            <li>
              El Club conserva todos los derechos sobre los datos que carga en la
              plataforma.
            </li>
            <li>
              El Club puede usar el logotipo de GestorClub para indicar que usa
              la plataforma, previa aprobación escrita del Proveedor.
            </li>
          </ul>
        </section>

        {/* 8 */}
        <section id="disponibilidad">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            8. Disponibilidad del servicio
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              GestorClub se esfuerza por mantener una disponibilidad del{" "}
              <strong>99% mensual</strong>. Sin embargo, no garantizamos
              disponibilidad ininterrumpida.
            </li>
            <li>
              Realizamos mantenimientos programados con notificación previa
              siempre que sea posible. Los mantenimientos de emergencia pueden
              ocurrir sin previo aviso.
            </li>
            <li>
              La disponibilidad depende también de los proveedores de
              infraestructura (Supabase, Vercel). Sus interrupciones están fuera
              de nuestro control directo.
            </li>
          </ul>
        </section>

        {/* 9 */}
        <section id="responsabilidad">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            9. Limitación de responsabilidad
          </h2>
          <p className="text-muted-foreground">
            En la máxima medida permitida por la legislación ecuatoriana:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              El Proveedor no será responsable por daños indirectos, incidentales
              o consecuentes derivados del uso o imposibilidad de uso de la
              plataforma.
            </li>
            <li>
              La responsabilidad total del Proveedor ante el Club no superará el
              monto pagado por el Club en los últimos 3 meses de suscripción.
            </li>
            <li>
              El Proveedor no es responsable por la veracidad de los datos
              ingresados por el Club ni por las decisiones administrativas que
              el Club tome basándose en la plataforma.
            </li>
            <li>
              GestorClub <strong>no es una herramienta de facturación
              electrónica válida ante el SRI</strong>. El módulo de facturación
              simulada es solo para uso interno de referencia. El Club es
              responsable de cumplir sus obligaciones tributarias.
            </li>
            <li>
              Los recordatorios de pago por WhatsApp dependen de la disponibilidad
              del servicio Twilio y de que el Club cuente con cuenta verificada
              de WhatsApp Business. El Proveedor no garantiza la entrega de
              mensajes.
            </li>
          </ul>
        </section>

        {/* 10 */}
        <section id="suspension">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            10. Suspensión y terminación
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong>Por el Club:</strong> puedes cancelar tu suscripción en
              cualquier momento desde el panel de configuración. El acceso
              permanece activo hasta el final del período facturado.
            </li>
            <li>
              <strong>Por el Proveedor:</strong> podemos suspender o terminar
              el servicio con 30 días de aviso por cese de operaciones o cambios
              fundamentales en la plataforma.
            </li>
            <li>
              <strong>Por incumplimiento:</strong> podemos suspender el servicio
              inmediatamente y sin aviso si el Club viola los términos de uso
              aceptable, incurre en fraude, o pone en riesgo la seguridad de
              otros usuarios.
            </li>
            <li>
              Tras la terminación, el Club dispone de 30 días para exportar sus
              datos antes de su eliminación definitiva.
            </li>
          </ul>
        </section>

        {/* 11 */}
        <section id="modificaciones">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            11. Modificaciones
          </h2>
          <p className="text-muted-foreground">
            El Proveedor puede modificar estos Términos y Condiciones. Los cambios
            materiales se notificarán con al menos{" "}
            <strong>15 días de anticipación</strong> mediante correo electrónico
            al administrador del Club y/o aviso en la plataforma. El uso
            continuado del servicio tras ese plazo implica la aceptación de los
            nuevos términos. Si no estás de acuerdo con los cambios, puedes
            cancelar tu suscripción antes de la fecha de vigencia.
          </p>
        </section>

        {/* 12 */}
        <section id="ley">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            12. Ley aplicable y jurisdicción
          </h2>
          <p className="text-muted-foreground">
            Estos Términos se rigen por las leyes de la{" "}
            <strong>República del Ecuador</strong>, incluyendo sin limitación:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Ley Orgánica de Protección de Datos Personales (LOPDP)</li>
            <li>Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos</li>
            <li>Código Orgánico de la Economía Social del Conocimiento (COESC)</li>
            <li>Código Civil</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Cualquier controversia que no pueda resolverse amigablemente entre
            las partes será sometida a los{" "}
            <strong>jueces competentes de la República del Ecuador</strong>,
            renunciando expresamente a cualquier otro fuero que pudiera
            corresponder.
          </p>
          <p className="mt-3 text-muted-foreground">
            Las partes acuerdan intentar resolver los conflictos mediante
            mediación antes de acudir a la vía judicial, conforme a la{" "}
            <strong>Ley de Arbitraje y Mediación del Ecuador</strong>.
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
          <Link href="/legal/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </main>
  );
}
