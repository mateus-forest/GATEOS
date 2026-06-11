"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Upload, FileText, File, FileImage, FileSpreadsheet, FolderOpen, Download, Trash2, Eye, Grid, List, Plus, Filter, MoreVertical, Clock, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { featureInPreparation } from "@/lib/cta-actions"
import { getDocuments, uploadDocumentFile } from "@/lib/data/documents"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { clientLabel, contractLabel } from "@/lib/data/display-labels"

type DocumentoView = {
  id: string
  nome: string
  tipo: string
  tamanho: string
  categoria: string
  cliente: string | null
  dataUpload: string
  usuario: string
}

type SelectOption = { label: string; value: string }

const categorias = ["Todos", "Contratos", "Notas Fiscais", "Relatórios", "Propostas", "Termos", "Imagens", "Laudos", "Controles"]

const getFileIcon = (tipo: string) => {
  switch (tipo) {
    case "pdf": return <FileText className="h-8 w-8 text-red-500" />
    case "xlsx": case "xls": return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    case "docx": case "doc": return <FileText className="h-8 w-8 text-blue-500" />
    case "zip": return <FolderOpen className="h-8 w-8 text-yellow-500" />
    case "jpg": case "png": return <FileImage className="h-8 w-8 text-purple-500" />
    default: return <File className="h-8 w-8 text-muted-foreground" />
  }
}

export function DocumentosContent() {
  const [busca, setBusca] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos")
  const [visualizacao, setVisualizacao] = useState<"grid" | "list">("grid")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [documentType, setDocumentType] = useState("")
  const [clientId, setClientId] = useState("")
  const [contractId, setContractId] = useState("")
  const [notes, setNotes] = useState("")
  const [clientOptions, setClientOptions] = useState<SelectOption[]>([])
  const [contractOptions, setContractOptions] = useState<SelectOption[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [documentosAtuais, setDocumentosAtuais] = useState<DocumentoView[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getDocuments().then((items) => {
      setDocumentosAtuais(items.map((item) => {
        const record = item as Record<string, unknown>
        return {
          id: String(record.id ?? ""),
          nome: String(record.name ?? record.file_name ?? record.nome ?? ""),
          tipo: String(record.type ?? record.category ?? record.tipo ?? ""),
          tamanho: record.size ? `${Math.round(Number(record.size) / 1024)} KB` : "-",
          categoria: String(record.category ?? record.tipo ?? "Documento"),
          cliente: record.client_name ? String(record.client_name) : null,
          dataUpload: String(record.created_at ?? new Date().toISOString()),
          usuario: String(record.created_by ?? "GATE OS"),
        }
      }))
    })
    getClients().then((items) => {
      setClientOptions(items.map((item) => {
        const record = item as Record<string, unknown>
        return {
          value: String(record.id ?? ""),
          label: clientLabel(record),
        }
      }).filter((item) => item.value))
    })
    getContracts().then((items) => {
      setContractOptions(items.map((item) => {
        const record = item as Record<string, unknown>
        return {
          value: String(record.id ?? ""),
          label: contractLabel(record),
        }
      }).filter((item) => item.value))
    })
  }, [])

  const documentosFiltrados = documentosAtuais.filter(doc => {
    const matchBusca = doc.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       (doc.cliente && doc.cliente.toLowerCase().includes(busca.toLowerCase()))
    const matchCategoria = categoriaFiltro === "Todos" || doc.categoria === categoriaFiltro
    return matchBusca && matchCategoria
  })

  const estatisticas = {
    total: documentosAtuais.length,
    tamanhoTotal: `${documentosAtuais.reduce((sum, doc) => sum + (Number.parseInt(doc.tamanho) || 0), 0)} KB`,
    ultimoUpload: documentosAtuais[0]?.dataUpload ? new Date(documentosAtuais[0].dataUpload).toLocaleDateString("pt-BR") : "-",
    porCategoria: categorias.slice(1).map(cat => ({
      nome: cat,
      quantidade: documentosAtuais.filter(d => d.categoria === cat).length
    }))
  }

  const handleUpload = async () => {
    setUploadError("")
    if (selectedFiles.length === 0) {
      setUploadError("Selecione pelo menos um arquivo.")
      return
    }
    if (!documentType) {
      setUploadError("Selecione o tipo do documento.")
      return
    }
    setUploading(true)
    try {
      const createdRecords: DocumentoView[] = []
      for (const file of selectedFiles) {
        const created = await uploadDocumentFile({
          bucket: "gate-documents",
          file,
          folder: "documents",
          record: {
            name: file.name,
            file_name: file.name,
            type: documentType,
            category: documentType,
            size: file.size,
            client_id: clientId || null,
            contract_id: contractId || null,
            notes: notes || null,
          },
        })
        const record = created as Record<string, unknown>
        createdRecords.push({
          id: String(record.id ?? crypto.randomUUID()),
          nome: file.name,
          tipo: documentType,
          tamanho: `${Math.round(file.size / 1024)} KB`,
          categoria: documentType,
          cliente: null,
          dataUpload: new Date().toISOString(),
          usuario: "GATE OS",
        })
      }
      toast.success("Documento enviado com sucesso")
      setDocumentosAtuais((current) => [...createdRecords, ...current])
      setSelectedFiles([])
      setDocumentType("")
      setClientId("")
      setContractId("")
      setNotes("")
      setDialogOpen(false)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar o documento.")
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentView = () => {
    toast.error("Documento sem arquivo real vinculado para visualizacao.")
  }

  const handleDocumentDownload = () => {
    toast.error("Documento sem arquivo real vinculado para download.")
  }

  const handleDocumentDelete = () => {
    featureInPreparation("Exclusao de documento depende do registro real no Supabase Storage e na tabela de documentos.")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground">Gestão de arquivos e documentos da empresa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload de Documento</DialogTitle>
              <DialogDescription>Adicione um novo documento ao sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Arraste e solte arquivos aqui ou</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                />
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Selecionar Arquivos
                </Button>
                {selectedFiles.length > 0 && (
                  <div className="mt-4 rounded-md bg-muted/50 p-3 text-left">
                    <p className="text-sm font-medium">Arquivos selecionados</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {selectedFiles.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Contrato", "Boleto", "Recibo", "Nota fiscal", "Comprovante", "Petição", "Sentença", "Acordo", "Documento interno", "Outro"].map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientOptions.map((client) => (
                        <SelectItem key={client.value} value={client.value}>{client.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contrato (opcional)</Label>
                  <Select value={contractId} onValueChange={setContractId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractOptions.map((contract) => (
                        <SelectItem key={contract.value} value={contract.value}>{contract.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observações sobre o documento" />
                </div>
                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={uploading}>{uploading ? "Enviando..." : "Enviar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{estatisticas.total}</p>
                <p className="text-xs text-muted-foreground">Total de documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{estatisticas.tamanhoTotal}</p>
                <p className="text-xs text-muted-foreground">Espaço utilizado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{estatisticas.ultimoUpload}</p>
                <p className="text-xs text-muted-foreground">Último upload</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <User className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{estatisticas.porCategoria.filter((item) => item.quantidade > 0).length}</p>
                <p className="text-xs text-muted-foreground">Categorias usadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={visualizacao === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setVisualizacao("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={visualizacao === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setVisualizacao("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      {visualizacao === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {documentosFiltrados.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  {getFileIcon(doc.tipo)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDocumentView}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDocumentDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={handleDocumentDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-medium text-foreground text-sm truncate mb-1" title={doc.nome}>
                  {doc.nome}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">{doc.categoria}</Badge>
                  <span className="text-xs text-muted-foreground">{doc.tamanho}</span>
                </div>
                {doc.cliente && (
                  <p className="text-xs text-muted-foreground truncate">{doc.cliente}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(doc.dataUpload).toLocaleDateString("pt-BR")} por {doc.usuario}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Tamanho</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentosFiltrados.map((doc) => (
                    <tr key={doc.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.tipo)}
                          <span className="text-sm text-foreground">{doc.nome}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{doc.categoria}</Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {doc.cliente || "-"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.tamanho}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(doc.dataUpload).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.usuario}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDocumentView}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDocumentDownload}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDocumentDelete}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
