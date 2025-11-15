# Qooxdoo v8 Migration - Vorschläge und Analyse

## Übersicht

Dieses Dokument beschreibt die Analyse des bestehenden Migration-Systems und Vorschläge für die automatische Migration zu Qooxdoo v8.

## Analyse des bestehenden Systems

### Migration-Architektur

Das Qooxdoo Migration-System basiert auf drei Hauptkomponenten:

1. **BaseMigration** (`qx.tool.migration.BaseMigration`):
   - Abstrakte Basisklasse mit Utility-Methoden
   - `renameFilesUnlessDryRun()` - Dateien umbenennen
   - `replaceInFilesUnlessDryRun()` - Text in Dateien ersetzen
   - `updateDependencyUnlessDryRun()` - Dependencies aktualisieren
   - `updateSchemaUnlessDryRun()` - JSON-Schema aktualisieren
   - `upgradePackagesUnlessDryRun()` - Packages upgraden

2. **Runner** (`qx.tool.migration.Runner`):
   - Führt alle Migration-Klassen automatisch aus
   - Unterstützt `--dry-run` für Vorabprüfung
   - Versionserkennung über Klassenname (z.B. M8_0_0 → 8.0.0)
   - Führt alle Methoden aus, die mit "migrate" beginnen

3. **Versionsspezifische Migrationen**:
   - `M6_0_0.js` - Migration von v5 zu v6
   - `M7_0_0.js` - Migration von v6 zu v7
   - `M7_5_6.js` - Migration zu v7.5.6 (Webfonts)
   - **M8_0_0.js** - NEU: Migration zu v8 (implementiert)

### Typische Migrations-Aufgaben

Basierend auf der Analyse der bestehenden Migrationen:

1. **Manifest.json Updates**:
   - Schema-Version aktualisieren
   - Dependencies aktualisieren (z.B. @qooxdoo/framework)
   - Veraltete Properties entfernen
   - Neue Properties hinzufügen

2. **compile.json Updates**:
   - Schema-Version aktualisieren
   - ESLint-Konfiguration anpassen
   - Neue Compiler-Optionen hinzufügen

3. **Source Code Changes**:
   - Dateien umbenennen
   - API-Aufrufe aktualisieren
   - Deprecated Code ersetzen

4. **Package Management**:
   - Dependencies upgraden
   - Package-Konfiguration aktualisieren

## Breaking Changes für v8.0.0

### Dokumentiert in CHANGELOG.md:

1. **qx.ui.table.Table - Model Data während Editing**
   - **Problem**: Setzen von Model-Daten während der Bearbeitung führte zu ungültigen Edits
   - **Lösung**: Wirft nun einen Error
   - **Migration**: Manuelle Überprüfung erforderlich - Code muss sicherstellen, dass Edits
     abgeschlossen oder abgebrochen werden, bevor Model-Daten aktualisiert werden
   - **Automatisierung**: Nur Warnung möglich, keine automatische Korrektur

### Mögliche weitere Breaking Changes:

Basierend auf deprecation warnings, die in zukünftigen Versionen entfernt werden könnten:

1. **qx.lang.normalize.Date** (deprecated seit v7.0)
   - Native Date-Methoden verwenden

2. **qx.lang.String.startsWith/endsWith** (deprecated seit v6.0)
   - Native String.prototype Methoden verwenden

3. **Icon Font Loading**
   - Alte `LoadMaterialIcons*` Klassen sind deprecated
   - `@usefont` Direktive verwenden

## Implementierte v8 Migration (M8_0_0.js)

Die neue Migration-Klasse wurde erstellt mit folgenden Methoden:

### 1. `migrateManifest()`
- Aktualisiert alle Manifest.json Dateien
- Updated Schema (wenn v8 Schema verfügbar)
- Aktualisiert @qooxdoo/framework Dependency

### 2. `migrateTableModelUsage()`
- Warnt vor Breaking Change bei qx.ui.table.Table
- Informiert über notwendige manuelle Code-Reviews
- Markiert als "pending" da manuelle Anpassung erforderlich

### 3. `migrateDeprecatedAPIs()`
- Scannt nach deprecated API-Verwendungen
- Gibt Warnungen und Empfehlungen aus
- Patterns:
  - `qx.lang.normalize.Date`
  - `qx.lang.String.startsWith/endsWith`

### 4. `migrateCompileJson()`
- Aktualisiert compile.json Schema (wenn v8 Schema verfügbar)
- Bereitet auf neue Compiler-Optionen vor

### 5. `migratePackages()`
- Upgraded installierte Packages auf v8-kompatible Versionen

## Nutzung der Migration

### Dry-Run (empfohlen zuerst):
```bash
qx migrate --dry-run --verbose
```

Zeigt an, welche Änderungen vorgenommen würden, ohne sie auszuführen.

### Migration ausführen:
```bash
qx migrate --verbose
```

Führt alle anwendbaren Migrationen aus.

## Weitere Empfehlungen

### 1. Test-Migrations erstellen
Es sollten Test-Projekte erstellt werden unter:
- `test/tool/integrationtest/test-migrations/v8.0.0/unmigrated/`
- `test/tool/integrationtest/test-migrations/v8.0.0/migrated/`

Diese dienen zur Validierung der Migration.

### 2. Schema-Updates
Wenn neue Schemas für v8 erstellt werden:
- `https://qooxdoo.org/schema/Manifest-3-0-0.json`
- `https://qooxdoo.org/schema/compile-2-0-0.json`

Diese in M8_0_0.js einkommentieren.

### 3. Release Notes erweitern
Eine `release-notes-8.0.md` sollte erstellt werden mit:
- Neuen Features
- Breaking Changes (detailliert)
- Migration Guide
- Deprecations

### 4. Erweiterte Code-Scanning
Für komplexere Migrations könnte ein AST-basierter Ansatz nützlich sein:
- Verwendung von `@babel/parser` oder ähnlichen Tools
- Automatische Code-Transformationen mit `jscodeshift`
- Genauere Erkennung von API-Verwendungen

### 5. Migration für spezifische Patterns
Falls weitere Breaking Changes identifiziert werden:

```javascript
async migrateSpecificPattern() {
  await this.replaceInFilesUnlessDryRun([
    {
      files: "source/**/*.js",
      from: /oldPattern/g,
      to: "newPattern"
    }
  ]);
}
```

## Zusammenfassung

Die v8 Migration ist jetzt vorbereitet mit:

✅ Migration-Klasse M8_0_0.js erstellt
✅ Manifest-Updates implementiert
✅ Warnungen für Breaking Changes implementiert
✅ Deprecated API-Scanning implementiert
✅ Package-Upgrade vorbereitet

⚠️ Manuelle Schritte erforderlich:
- Code-Review für qx.ui.table.Table Verwendung
- Deprecated APIs aktualisieren
- Tests durchführen

📋 Nächste Schritte:
1. Test-Migrations erstellen
2. v8 Schemas definieren
3. Release Notes schreiben
4. Community-Testing durchführen

## Ausführung

Die Migration wird automatisch durch den Runner ausgeführt, wenn:
- Die App-Version < 8.0.0 ist
- Die Framework-Version >= 8.0.0 ist

Der Runner ruft automatisch alle `migrate*()` Methoden der M8_0_0 Klasse auf.
