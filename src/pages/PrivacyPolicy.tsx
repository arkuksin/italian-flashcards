
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Anwendung
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Datenschutzerklärung
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Stand: 14. Oktober 2025
        </p>

        <div className="space-y-8 prose prose-lg dark:prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-semibold">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher für die Datenverarbeitung auf dieser Webseite ist:
            </p>
            <p>
              [Dein Name/Firmenname]
              <br />
              [Deine Adresse]
              <br />
              [Deine E-Mail-Adresse]
            </p>
            <p>
              (Bitte ersetzen Sie diese Platzhalter durch Ihre eigenen Daten.)
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Hosting und Web-Analyse durch Vercel</h2>
            <p>
              Unsere Webseite wird bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA, gehostet. Vercel dient zur Auslieferung unserer Webinhalte.
            </p>
            <p>
              Wir nutzen Vercel Web Analytics und Vercel Speed Insights, um die Nutzung unserer Webseite zu analysieren und die Leistung zu optimieren. Beide Dienste sind datenschutzfreundlich konzipiert:
            </p>
            <ul>
              <li>
                <strong>Keine Cookies:</strong> Zur Analyse werden keine Cookies auf Ihrem Gerät gespeichert.
              </li>
              <li>
                <strong>Anonymisierte Daten:</strong> Es werden keine personenbezogenen Daten erfasst, die eine Identifizierung einzelner Nutzer ermöglichen. Erfasst werden lediglich allgemeine Nutzungsdaten wie aufgerufene Seiten, Referrer-URL, und das Herkunftsland.
              </li>
            </ul>
            <p>
              Die Nutzung dieser Dienste erfolgt auf Grundlage unseres berechtigten Interesses an einer ansprechenden und performanten Darstellung unseres Online-Angebots (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Backend und Datenbank (Supabase)</h2>
            <p>
              Für die Authentifizierung von Nutzern und die Speicherung von Anwendungsdaten (z.B. Lernfortschritt) nutzen wir den Dienst Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992.
            </p>
            <p>
              Wenn Sie sich registrieren oder anmelden, werden folgende Daten verarbeitet:
            </p>
            <ul>
              <li>E-Mail-Adresse</li>
              <li>Ein verschlüsseltes Passwort (Passworthash)</li>
              <li>Ihr Lernfortschritt und Ihre Präferenzen</li>
            </ul>
            <p>
              Zur Aufrechterhaltung Ihrer Sitzung (d.h. damit Sie eingeloggt bleiben) verwendet Supabase den <strong>localStorage</strong> Ihres Browsers, um ein Authentifizierungstoken (JWT) zu speichern. Dies ist für die Funktionalität der Anwendung technisch notwendig (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Authentifizierung über OAuth (Google/GitHub)</h2>
            <p>
              Wir bieten Ihnen die Möglichkeit, sich über Ihr Google- oder GitHub-Konto anzumelden. Wenn Sie diese Funktion nutzen, werden Sie zur jeweiligen Plattform weitergeleitet. Dort gelten die Datenschutzbestimmungen des jeweiligen Anbieters:
            </p>
            <ul>
              <li>
                <strong>Google:</strong> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Zur Datenschutzerklärung: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>
              </li>
              <li>
                <strong>GitHub:</strong> GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA. Zur Datenschutzerklärung: <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement</a>
              </li>
            </ul>
            <p>
              Nach erfolgreicher Authentifizierung erhalten wir von dem jeweiligen Anbieter Ihren Namen, Ihre E-Mail-Adresse und optional Ihr Profilbild, um Ihr Benutzerkonto bei uns zu erstellen und zu verwalten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Nutzung von LocalStorage für Einstellungen</h2>
            <p>
              Neben dem Authentifizierungstoken speichern wir auch rein funktionale Einstellungen im <strong>localStorage</strong> Ihres Browsers. Dazu gehört Ihre Präferenz für den "Dark Mode" (Dunkelmodus). Diese Speicherung dient ausschließlich dem Komfort und es findet kein Tracking statt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Ihre Rechte als betroffene Person</h2>
            <p>
              Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};
