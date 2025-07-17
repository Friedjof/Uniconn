# 🧨 Technische Risiken

| Risiko                                              | Auswirkung                               | Mögliche Maßnahme                         |
|-----------------------------------------------------|-------------------------------------------|-------------------------------------------|
| WebSocket-Stabilität bei Mobilnutzung               | Nachrichtenverlust, schlechter UX         | Fallback auf Polling / Auto-Reconnect     |
| JWT/2FA fehlerhafte Implementierung                 | Sicherheitslücken                         | Penetration-Tests / Review durch Dritte   |
| Upload-Handling (z. B. DoS, Speicherverbrauch)      | Server-Ausfall, hohe Kosten               | Throttling, Budget-System, File Size Limit|
| Authentifizierungs-Bypass (z. B. URL Manipulation)  | Datenleak                                 | E2E-Tests, Zugriffskontrolle serverseitig  |
| Rate Limits falsch gesetzt                          | Brute Force möglich oder false positives  | Logs analysieren + adaptive Limits        |
