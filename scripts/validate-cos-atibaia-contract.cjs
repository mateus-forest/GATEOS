const fs = require("node:fs")
const path = require("node:path")
const Module = require("node:module")
const { execFileSync } = require("node:child_process")
const ts = require("typescript")

const root = path.resolve(__dirname, "..")
const sourcePath = path.join(root, "lib", "cos", "cos-file-analysis.ts")
const actionUtilsPath = path.join(root, "lib", "cos", "cos-action-utils.ts")
const headerPath = path.join(root, "components", "header.tsx")
const fixturePath = path.join(__dirname, "fixtures", "cos-contract-atibaia.txt")

function loadTypescriptModule(filePath, sourceOverride) {
  const source = sourceOverride ?? fs.readFileSync(filePath, "utf8")
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText

  const mod = new Module(filePath, module)
  mod.filename = filePath
  mod.paths = Module._nodeModulePaths(path.dirname(filePath))
  mod._compile(output, filePath)
  return mod.exports
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function assertEqual(label, actual, expected, failures) {
  if (actual !== expected) {
    failures.push({ label, expected, actual })
  }
}

function assertEquipment(actualEquipment, expectedEquipment, failures) {
  assertEqual("equipment.count", actualEquipment.length, expectedEquipment.length, failures)
  expectedEquipment.forEach((expected, index) => {
    const actual = actualEquipment[index] ?? {}
    assertEqual(`equipment.${index + 1}.quantity`, actual.quantity, expected.quantity, failures)
    assertEqual(`equipment.${index + 1}.description`, normalizeText(actual.description), expected.description, failures)
  })
}

function sourceForMode() {
  if (!process.argv.includes("--git-head")) return undefined
  const headSource = execFileSync("git", ["show", "HEAD:lib/cos/cos-file-analysis.ts"], {
    cwd: root,
    encoding: "utf8",
  })
  if (headSource.includes("analyzeCosContractTextForValidation")) return headSource
  return `${headSource}

exports.analyzeCosContractTextForValidation = function(fileName, text) {
  return analyzeContractTextV2({ name: fileName, type: "text/plain", size: text.length }, normalizeDocumentText(text));
};
`
}

const { analyzeCosContractTextForValidation } = loadTypescriptModule(sourcePath, sourceForMode())
const { normalizeCosClientName, hasUnsafeCosClientName, numberField } = loadTypescriptModule(actionUtilsPath)
if (typeof analyzeCosContractTextForValidation !== "function") {
  throw new Error("analyzeCosContractTextForValidation nao foi exportado pelo parser COS.")
}

const fixture = fs.readFileSync(fixturePath, "utf8")
const actual = analyzeCosContractTextForValidation("cos-contract-atibaia.txt", fixture)
const expected = {
  lessorName: "Gamer Tech Importação Ltda",
  lessorDocument: "47.579.509/0001-02",
  lesseeName: "BELI GAMES, ENTRETENIMENTO, INOVACOES E SERVICOS LTDA",
  lesseeDocument: "60.961.002/0001-79",
  guarantorName: "Wembley Gomes Costa",
  guarantorDocument: "815.508.393-49",
  termMonths: 36,
  monthlyValue: 3697.33,
  depositValue: 3697.33,
  monthlyDueDay: 15,
  signatureDate: "27/05/2025",
  probableStartDate: "27/05/2025",
  calculatedEndDate: "27/05/2028",
  installments: 36,
  recurringRevenueValue: 3697.33,
  equipment: [
    { quantity: 8, description: "AMD Ryzen 5, RTX 3060, 16GB RAM, SSD 1TB, 650W" },
    { quantity: 4, description: "AMD Ryzen 5, RTX 3050, 16GB RAM, SSD 480GB, HD 1TB, 650W" },
    { quantity: 1, description: "AMD Ryzen 5, RTX 3060, 8GB RAM, SSD 1TB, 750W" },
    { quantity: 1, description: "AMD Ryzen 5, RTX 2060, 16GB RAM, SSD 480GB, HD 1TB, 650W" },
    { quantity: 10, description: "Monitor Gamer 165Hz 23.8”" },
  ],
}

const actualSummary = {
  lessorName: actual.extractedParties?.lessor?.legalName,
  lessorDocument: actual.extractedParties?.lessor?.documentNumber,
  lesseeName: actual.extractedClient?.legalName,
  lesseeDocument: actual.extractedClient?.documentNumber,
  guarantorName: actual.extractedParties?.guarantor?.legalName,
  guarantorDocument: actual.extractedParties?.guarantor?.documentNumber,
  termMonths: actual.extractedContract?.termMonths,
  monthlyValue: actual.extractedContract?.monthlyValue,
  depositValue: actual.extractedContract?.depositValue,
  monthlyDueDay: actual.extractedContract?.monthlyDueDay,
  signatureDate: actual.extractedContract?.signatureDate,
  probableStartDate: actual.extractedContract?.probableStartDate,
  calculatedEndDate: actual.extractedContract?.calculatedEndDate,
  installments: actual.extractedContract?.installments,
  recurringRevenueValue: actual.extractedFinancialEntries.find((entry) => entry.description.includes("Receita recorrente"))?.value,
  equipment: actual.extractedEquipment.map((item) => ({
    quantity: item.quantity,
    description: normalizeText(item.description),
  })),
}

const failures = []
for (const [key, expectedValue] of Object.entries(expected)) {
  if (key === "equipment") continue
  assertEqual(key, actualSummary[key], expectedValue, failures)
}
assertEquipment(actualSummary.equipment, expected.equipment, failures)

const contaminatedClientName =
  "BELI GAMES, ENTRETENIMENTO, INOVACOES E SERVICOS LTDA, pessoa juridica de direito privado, CNPJ 60.961.002/0001-79, denominada LOCATARIA, Endereco Rua Teste"
assertEqual(
  "clientName.sanitized",
  normalizeCosClientName(contaminatedClientName),
  "BELI GAMES, ENTRETENIMENTO, INOVACOES E SERVICOS LTDA",
  failures
)
assertEqual("clientName.rawUnsafe", hasUnsafeCosClientName(contaminatedClientName), true, failures)
assertEqual("clientName.cleanSafe", hasUnsafeCosClientName("BELI GAMES, ENTRETENIMENTO, INOVACOES E SERVICOS LTDA"), false, failures)
assertEqual("money.decimalNumberString", numberField("3697.33"), 3697.33, failures)
assertEqual("money.brazilianCurrency", numberField("R$ 3.697,33"), 3697.33, failures)
assertEqual("money.partialValueRejected", actual.extractedContract?.monthlyValue === 7.33, false, failures)

const headerSource = fs.readFileSync(headerPath, "utf8")
assertEqual("ui.localStoragePersistence", headerSource.includes("gate-cos-last-analysis-v1"), true, failures)
assertEqual("ui.clearAnalysisAction", headerSource.includes("Limpar analise"), true, failures)
assertEqual("ui.reviewFieldWhitelist", headerSource.includes("COS_REVIEW_FIELDS"), true, failures)
assertEqual("ui.reviewNoRawPayloadLoop", headerSource.includes("Object.entries(cosActionPayload)"), false, failures)
assertEqual("ui.reviewPortugueseDueDateLabel", headerSource.includes("Data de vencimento"), true, failures)
assertEqual("ui.reviewPortugueseCompetenceLabel", headerSource.includes("Competencia"), true, failures)
assertEqual("ui.reviewZIndex", headerSource.includes("z-[1301]"), true, failures)

console.log(JSON.stringify({ expected, actual: actualSummary, failures }, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
