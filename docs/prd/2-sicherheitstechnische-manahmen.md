# 🔐 2. Sicherheitstechnische Maßnahmen

| Bereich               | Maßnahme / Technik                                                  |
|------------------------|---------------------------------------------------------------------|
| Passwörter             | Argon2 oder bcrypt, Salting, min. 10 Zeichen                       |
| Token Handling         | JWT + optional Refresh Token, kurze TTL                            |
| Zwei-Faktor-Auth (2FA) | TOTP via Authenticator-App                                         |
| Ratenbegrenzung        | Rate Limiting auf Login & Registrierung                            |
| E-Mail-Verifikation    | Pflicht vor Nutzung                                                |
| Verifikation           | Manuelle Codes durch Moderatoren                                   |
| Uploads                | Whitelisting MIME-Typen, UUID-Filenames, keine Metadaten           |
| Datenbank              | Rollenspezifische Rechte, Soft Deletes, keine raw SQL              |
| Logging                | Nur UUIDs, keine IPs/Klartexte, mit Rotation                       |

---
