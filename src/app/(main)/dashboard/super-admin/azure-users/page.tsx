"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  Key,
  Mail,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Building,
  Phone,
  Briefcase,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import microsoftGraphService, {
  UserInfoDto,
  CreateUserRequest,
} from "@/services/microsoft-graph-service"
import { getAllUsers } from "@/services/users-service"
import type { User as SaciUser } from "@/types/user"

export default function AzureUsersPage() {
  const [users, setUsers] = useState<UserInfoDto[]>([])
  const [saciUsers, setSaciUsers] = useState<SaciUser[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"todos" | "docente" | "administrativo" | "estudiante">("todos")
  const [error, setError] = useState<string | null>(null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserInfoDto | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState<CreateUserRequest>({
    displayName: "",
    givenName: "",
    surname: "",
    userPrincipalName: "",
    password: "",
    mailNickname: "",
    jobTitle: "",
    department: "",
    officeLocation: "",
    mobilePhone: "",
    forceChangePasswordNextSignIn: true,
  })
  const [selectedDomain, setSelectedDomain] = useState("")
  const [selectedRole, setSelectedRole] = useState("docente")
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdResult, setCreatedResult] = useState<{
    email: string
    password: string
    appCreated: boolean
    appError?: string
    emailSent: boolean
  } | null>(null)

  const availableRoles = [
    { value: "admin", label: "Administrador" },
    { value: "director", label: "Director" },
    { value: "coordinador", label: "Coordinador" },
    { value: "controlescolar", label: "Control Escolar" },
    { value: "finanzas", label: "Finanzas" },
    { value: "admisiones", label: "Admisiones" },
    { value: "academico", label: "Academico" },
    { value: "docente", label: "Docente" },
    { value: "alumno", label: "Alumno" },
  ]

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")

  const DEFAULT_DOMAIN = "usaguanajuato.edu.mx"

  const existingEmails = useMemo(
    () => users.map(u => (u.email || u.userPrincipalName || "").toLowerCase()),
    [users]
  )

  const generatedMailNickname = useMemo(() => {
    const gn = (formData.givenName || "").trim()
    const sn = (formData.surname || "").trim()
    if (!gn || !sn) return ""

    const primerNombre = normalizeText(gn.split(/\s+/)[0])
    const partsApellido = sn.split(/\s+/)
    const primerApellido = normalizeText(partsApellido[0])
    const segundoApellido = partsApellido[1] ? normalizeText(partsApellido[1]) : ""

    const nickCorto = `${primerNombre}.${primerApellido}`
    const emailCorto = `${nickCorto}@${selectedDomain || DEFAULT_DOMAIN}`

    if (!existingEmails.includes(emailCorto.toLowerCase())) {
      return nickCorto
    }

    if (segundoApellido) {
      return `${primerNombre}.${primerApellido}${segundoApellido}`
    }

    return nickCorto
  }, [formData.givenName, formData.surname, existingEmails, selectedDomain])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [usersData, domainsData, saciData] = await Promise.all([
        microsoftGraphService.getUsers(200),
        microsoftGraphService.getDomains().catch(() => [] as string[]),
        getAllUsers().catch(() => [] as SaciUser[]),
      ])
      setUsers(usersData)
      const finalDomains = domainsData.length > 0 ? domainsData : [DEFAULT_DOMAIN]
      setDomains(finalDomains)
      setSaciUsers(saciData)
      if (!selectedDomain) {
        setSelectedDomain(finalDomains[0])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar datos"
      setError(message)
      toast.error("Error al cargar usuarios de Azure AD")
      if (!selectedDomain) {
        setDomains([DEFAULT_DOMAIN])
        setSelectedDomain(DEFAULT_DOMAIN)
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedDomain])

  useEffect(() => {
    loadData()
  }, [loadData])

  const saciByEmail = useMemo(
    () => new Map(saciUsers.map((u) => [u.email.toLowerCase(), u])),
    [saciUsers]
  )

  const adminRoles = ["admin", "superadmin", "director", "coordinador", "controlescolar", "finanzas", "admisiones", "academico"]

  const getUserCategory = useCallback((user: UserInfoDto): "docente" | "administrativo" | "estudiante" | "sin clasificar" => {
    const email = (user.email || user.userPrincipalName || "").toLowerCase()
    const saciUser = saciByEmail.get(email)

    if (saciUser?.roles?.length) {
      const roles = saciUser.roles.map((r) => r.toLowerCase())
      if (roles.includes("alumno")) return "estudiante"
      if (roles.includes("docente")) return "docente"
      if (roles.some((r) => adminRoles.includes(r))) return "administrativo"
    }

    const localPart = email.split("@")[0] || ""
    if (/^[bl]/i.test(localPart)) return "estudiante"

    return "sin clasificar"
  }, [saciByEmail])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userPrincipalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false
    if (categoryFilter === "todos") return true

    return getUserCategory(user) === categoryFilter
  })

  const resetForm = () => {
    setFormData({
      displayName: "",
      givenName: "",
      surname: "",
      userPrincipalName: "",
      password: "",
      mailNickname: "",
      jobTitle: "",
      department: "",
      officeLocation: "",
      mobilePhone: "",
      forceChangePasswordNextSignIn: true,
    })
    setSelectedRole("docente")
    setSendCredentialsEmail(true)
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    let password = ""
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData((prev) => ({ ...prev, password }))
  }

  const handleCreateUser = async () => {
    if (!formData.givenName || !formData.surname || !formData.password) {
      toast.error("Por favor complete nombre, apellido y contrasena")
      return
    }

    if (!generatedMailNickname || !selectedDomain) {
      toast.error("No se pudo generar el correo. Verifique nombre y apellido")
      return
    }

    setIsSubmitting(true)
    try {
      const mailNickname = generatedMailNickname
      const userPrincipalName = `${mailNickname}@${selectedDomain}`
      const displayName = `${formData.givenName.trim()} ${formData.surname.trim()}`

      const result = await microsoftGraphService.createUser({
        displayName,
        givenName: formData.givenName.trim(),
        surname: formData.surname.trim(),
        userPrincipalName,
        mailNickname,
        password: formData.password,
        forceChangePasswordNextSignIn: true,
        createInApp: true,
        roles: [selectedRole],
        sendCredentialsEmail,
      })

      if (result.success) {
        const email = result.userPrincipalName || userPrincipalName
        setCreatedResult({
          email,
          password: formData.password,
          appCreated: result.appUserCreated ?? false,
          appError: !result.appUserCreated ? result.message : undefined,
          emailSent: result.credentialsEmailSent ?? false,
        })
        setCreateDialogOpen(false)
        resetForm()
        loadData()
      } else {
        toast.error(result.message || "Error al crear usuario")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear usuario"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      await microsoftGraphService.updateUser(selectedUser.id, {
        displayName: formData.displayName,
        givenName: formData.givenName,
        surname: formData.surname,
        jobTitle: formData.jobTitle,
        department: formData.department,
        officeLocation: formData.officeLocation,
        mobilePhone: formData.mobilePhone,
      })

      toast.success("Usuario actualizado exitosamente")
      setEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar usuario"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      await microsoftGraphService.deleteUser(selectedUser.id)
      toast.success("Usuario eliminado exitosamente")
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar usuario"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const result = await microsoftGraphService.resetPassword(selectedUser.id)
      setNewPassword(result.password)
      toast.success("Contrasena restablecida exitosamente")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al restablecer contrasena"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copiado al portapapeles")
  }

  const openEditDialog = (user: UserInfoDto) => {
    setSelectedUser(user)
    setFormData({
      displayName: user.displayName || "",
      givenName: user.givenName || "",
      surname: user.surname || "",
      userPrincipalName: user.userPrincipalName,
      password: "",
      mailNickname: "",
      jobTitle: user.jobTitle || "",
      department: user.department || "",
      officeLocation: user.officeLocation || "",
      mobilePhone: user.mobilePhone || "",
      forceChangePasswordNextSignIn: false,
    })
    setEditDialogOpen(true)
  }

  const openPasswordDialog = (user: UserInfoDto) => {
    setSelectedUser(user)
    setNewPassword(null)
    setPasswordDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios Azure AD</h1>
          <p className="text-muted-foreground">
            Gestiona usuarios corporativos y correos Office 365
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : users.length}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-400 transition-colors" onClick={() => setCategoryFilter(categoryFilter === "docente" ? "todos" : "docente")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docentes</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                users.filter((u) => getUserCategory(u) === "docente").length
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-400 transition-colors" onClick={() => setCategoryFilter(categoryFilter === "administrativo" ? "todos" : "administrativo")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrativos</CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                users.filter((u) => getUserCategory(u) === "administrativo").length
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-orange-400 transition-colors" onClick={() => setCategoryFilter(categoryFilter === "estudiante" ? "todos" : "estudiante")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                users.filter((u) => getUserCategory(u) === "estudiante").length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Lista de Usuarios</CardTitle>
                <CardDescription>
                  Usuarios registrados en Azure Active Directory
                  {categoryFilter !== "todos" && (
                    <span className="ml-2 font-medium">
                      — Filtro: {categoryFilter}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["todos", "docente", "administrativo", "estudiante"] as const).map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === "todos" ? "Todos" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  {cat !== "todos" && !isLoading && (
                    <span className="ml-1 text-xs opacity-70">
                      ({users.filter((u) => getUserCategory(u) === cat).length})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.givenName} {user.surname}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {user.email || user.userPrincipalName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cat = getUserCategory(user)
                          const styles = {
                            docente: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                            administrativo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                            estudiante: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
                            "sin clasificar": "",
                          }
                          const labels = {
                            docente: "Docente",
                            administrativo: "Administrativo",
                            estudiante: "Estudiante",
                            "sin clasificar": "Sin clasificar",
                          }
                          return (
                            <Badge variant={cat === "sin clasificar" ? "secondary" : "outline"} className={styles[cat]}>
                              {labels[cat]}
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.accountEnabled ? "default" : "secondary"}
                        >
                          {user.accountEnabled ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPasswordDialog(user)}
                            title="Restablecer Contrasena"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteDialogOpen(true)
                            }}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un usuario con correo institucional y acceso al sistema
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="givenName">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="givenName"
                  value={formData.givenName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, givenName: e.target.value }))
                  }
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, surname: e.target.value }))
                  }
                  placeholder="Perez"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correo institucional</Label>
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Mail className="h-4 w-4 text-blue-500" />
                {generatedMailNickname && selectedDomain ? (
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {generatedMailNickname}@{selectedDomain}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    Escribe nombre y apellido para generar el correo
                  </span>
                )}
              </div>
            </div>

            {domains.length > 1 && (
              <div className="space-y-2">
                <Label>Dominio</Label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dominio" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Contrasena <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimo 12 caracteres"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generar
                </Button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Rol en el sistema</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enviar credenciales por correo</Label>
                <p className="text-sm text-muted-foreground">
                  Envia el correo institucional y contrasena al usuario
                </p>
              </div>
              <Switch
                checked={sendCredentialsEmail}
                onCheckedChange={setSendCredentialsEmail}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created User Result Dialog */}
      <Dialog open={createdResult !== null} onOpenChange={(open) => !open && setCreatedResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuario Creado</DialogTitle>
            <DialogDescription>
              Comparta estas credenciales con el usuario de forma segura
            </DialogDescription>
          </DialogHeader>

          {createdResult && (
            <div className="space-y-4">
              {createdResult.appError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El correo se creo en Azure, pero hubo un error al crear en el sistema: {createdResult.appError}
                  </AlertDescription>
                </Alert>
              )}

              {createdResult.appCreated && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Usuario creado exitosamente en Azure y en el sistema
                    {createdResult.emailSent && " — Credenciales enviadas por correo"}
                  </AlertDescription>
                </Alert>
              )}

              {createdResult.appCreated && !createdResult.emailSent && sendCredentialsEmail && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No se pudo enviar el correo con las credenciales. Compartelas manualmente.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Correo institucional</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <code className="flex-1 font-mono">{createdResult.email}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(createdResult.email)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Contrasena</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <code className="flex-1 font-mono">{createdResult.password}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(createdResult.password)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El usuario debera cambiar la contrasena en su primer inicio de sesion.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (createdResult) {
                  copyToClipboard(
                    `Correo: ${createdResult.email}\nContrasena: ${createdResult.password}`
                  )
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar todo
            </Button>
            <Button onClick={() => setCreatedResult(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la informacion del usuario {selectedUser?.displayName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editGivenName">Nombre</Label>
                <Input
                  id="editGivenName"
                  value={formData.givenName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, givenName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSurname">Apellido</Label>
                <Input
                  id="editSurname"
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, surname: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Nombre para mostrar</Label>
              <Input
                id="editDisplayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editJobTitle">Cargo</Label>
                <Input
                  id="editJobTitle"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartment">Departamento</Label>
                <Input
                  id="editDepartment"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, department: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editOfficeLocation">Ubicacion</Label>
                <Input
                  id="editOfficeLocation"
                  value={formData.officeLocation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      officeLocation: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMobilePhone">Telefono</Label>
                <Input
                  id="editMobilePhone"
                  value={formData.mobilePhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mobilePhone: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedUser(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta seguro de eliminar al usuario{" "}
              <strong>{selectedUser?.displayName}</strong>?
              <br />
              <br />
              Esta accion eliminara permanentemente la cuenta de Azure AD y el
              correo corporativo asociado. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedUser(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer Contrasena</DialogTitle>
            <DialogDescription>
              {newPassword
                ? "La contrasena ha sido restablecida exitosamente."
                : `Restablecer la contrasena de ${selectedUser?.displayName}`}
            </DialogDescription>
          </DialogHeader>

          {newPassword ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Guarde esta contrasena de forma segura. No se mostrara de nuevo.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <code className="flex-1 text-lg font-mono">{newPassword}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(newPassword)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Se generara una nueva contrasena aleatoria para el usuario. El
                usuario debera cambiar esta contrasena en su proximo inicio de
                sesion.
              </p>
            </div>
          )}

          <DialogFooter>
            {newPassword ? (
              <Button
                onClick={() => {
                  setPasswordDialogOpen(false)
                  setSelectedUser(null)
                  setNewPassword(null)
                }}
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordDialogOpen(false)
                    setSelectedUser(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleResetPassword} disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Restablecer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
