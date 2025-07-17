# 🛡️ Sicherheit

| Anforderung                             | Beschreibung                              |
|-----------------------------------------|-------------------------------------------|
| Passwort-Sicherheit                     | Argon2/bcrypt Hashing, Salting            |
| E-Mail-Verifikation obligatorisch       | Kein Zugriff ohne Bestätigung             |
| 2FA optional (TOTP)                     | Opt-in über Settings                      |
| CSRF-Schutz bei Formularen              | CSRF-Token via HTTP-only Cookie           |
| Upload-Security                         | Dateityp-Filter + UUID-Umbenennung        |

---
