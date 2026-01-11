"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, UserPlus, Users, Phone, Mail, Briefcase } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  role:
    | "colleague"
    | "manager"
    | "partner"
    | "subordinate"
    | "cross-department"
    | "client"
    | "vendor"
    | "team-lead"
    | "senior-manager"
    | "consultant"
  language: "ar" | "en"
}

interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
  contacts: Contact[]
}

export default function EmployeeContactsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [isAddingContact, setIsAddingContact] = useState(false)

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
  })

  const [newContact, setNewContact] = useState<Contact>({
    id: "",
    name: "",
    phone: "",
    email: "",
    role: "colleague" as const,
    language: "en" as const,
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = () => {
    const stored = localStorage.getItem("employees")
    if (stored) {
      try {
        setEmployees(JSON.parse(stored))
      } catch (error) {
        console.error("[v0] Error loading employees:", error)
      }
    }
  }

  const saveEmployees = (updatedEmployees: Employee[]) => {
    localStorage.setItem("employees", JSON.stringify(updatedEmployees))
    setEmployees(updatedEmployees)
  }

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) {
      alert("Please fill in employee name and email")
      return
    }

    const employee: Employee = {
      id: Date.now().toString(),
      ...newEmployee,
      contacts: [],
    }

    saveEmployees([...employees, employee])
    setNewEmployee({ name: "", email: "", department: "", position: "" })
    setIsAddingEmployee(false)
  }

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm("Are you sure you want to delete this employee and all their contacts?")) {
      saveEmployees(employees.filter((e) => e.id !== employeeId))
    }
  }

  const handleAddContact = () => {
    if (!currentEmployee || !newContact.name || !newContact.phone) {
      alert("Please fill in contact name and phone number")
      return
    }

    const contact: Contact = {
      ...newContact,
      id: Date.now().toString(),
    }

    const updatedEmployees = employees.map((emp) => {
      if (emp.id === currentEmployee.id) {
        return {
          ...emp,
          contacts: [...emp.contacts, contact],
        }
      }
      return emp
    })

    saveEmployees(updatedEmployees)
    setNewContact({ id: "", name: "", phone: "", email: "", role: "colleague", language: "en" })
    setIsAddingContact(false)
    setCurrentEmployee(null)
  }

  const handleDeleteContact = (employeeId: string, contactId: string) => {
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          contacts: emp.contacts.filter((c) => c.id !== contactId),
        }
      }
      return emp
    })
    saveEmployees(updatedEmployees)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "manager":
        return "bg-primary/20 text-primary border-primary/30"
      case "colleague":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30"
      case "partner":
        return "bg-purple-500/20 text-purple-600 border-purple-500/30"
      case "subordinate":
        return "bg-green-500/20 text-green-600 border-green-500/30"
      case "cross-department":
        return "bg-cyan-500/20 text-cyan-600 border-cyan-500/30"
      case "client":
        return "bg-orange-500/20 text-orange-600 border-orange-500/30"
      case "vendor":
        return "bg-amber-500/20 text-amber-600 border-amber-500/30"
      case "team-lead":
        return "bg-indigo-500/20 text-indigo-600 border-indigo-500/30"
      case "senior-manager":
        return "bg-violet-500/20 text-violet-600 border-violet-500/30"
      case "consultant":
        return "bg-pink-500/20 text-pink-600 border-pink-500/30"
      default:
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "manager":
        return "Manager"
      case "colleague":
        return "Colleague"
      case "partner":
        return "Partner"
      case "subordinate":
        return "Subordinate"
      case "cross-department":
        return "Cross-Department Colleague"
      case "client":
        return "Client"
      case "vendor":
        return "Vendor/Supplier"
      case "team-lead":
        return "Team Lead"
      case "senior-manager":
        return "Senior Manager"
      case "consultant":
        return "Consultant/Advisor"
      default:
        return role
    }
  }

  const totalContacts = employees.reduce((sum, emp) => sum + emp.contacts.length, 0)

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="font-sans text-3xl font-bold text-foreground">Employee Evaluation Contacts</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Manage employees and their professional contacts for comprehensive performance evaluation
          </p>
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm font-medium text-muted-foreground">Total Employees</p>
                  <h3 className="mt-2 font-sans text-3xl font-bold text-card-foreground">{employees.length}</h3>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <h3 className="mt-2 font-sans text-3xl font-bold text-success">{totalContacts}</h3>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <Phone className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm font-medium text-muted-foreground">Ready for Evaluation</p>
                  <h3 className="mt-2 font-sans text-3xl font-bold text-primary">
                    {employees.filter((e) => e.contacts.length >= 3).length}
                  </h3>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Button onClick={() => setIsAddingEmployee(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Employee
          </Button>
        </div>

        <div className="grid gap-6">
          {employees.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Employees Added</h3>
              <p className="text-muted-foreground mb-4">
                Add your first employee to start building evaluation contacts
              </p>
              <Button onClick={() => setIsAddingEmployee(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Card>
          ) : (
            employees.map((employee) => (
              <Card key={employee.id} className="bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-sans text-xl font-bold text-card-foreground">
                        {employee.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex flex-wrap gap-2 mt-2">
                          {employee.email && (
                            <span className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </span>
                          )}
                          {employee.position && <Badge variant="outline">{employee.position}</Badge>}
                          {employee.department && <Badge variant="outline">{employee.department}</Badge>}
                        </div>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(employee.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-sans text-sm font-semibold text-foreground">
                      Contacts ({employee.contacts.length})
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCurrentEmployee(employee)
                        setIsAddingContact(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>

                  {employee.contacts.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No contacts added yet. Add at least 3 contacts to enable evaluation.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {employee.contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-sans font-semibold text-foreground">{contact.name}</span>
                              <Badge variant="outline" className={getRoleBadgeColor(contact.role)}>
                                {getRoleLabel(contact.role)}
                              </Badge>
                              <Badge variant="outline">{contact.language === "ar" ? "Arabic" : "English"}</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                            {contact.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteContact(employee.id, contact.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Dialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter the employee details to start building their evaluation profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">Employee Name *</Label>
              <Input
                id="emp-name"
                placeholder="John Doe"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email">Email *</Label>
              <Input
                id="emp-email"
                type="email"
                placeholder="john.doe@ministry.gov.om"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-position">Position</Label>
              <Input
                id="emp-position"
                placeholder="Senior Engineer"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-department">Department</Label>
              <Input
                id="emp-department"
                placeholder="IT Department"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleAddEmployee} className="flex-1">
                Add Employee
              </Button>
              <Button variant="outline" onClick={() => setIsAddingEmployee(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact for {currentEmployee?.name}</DialogTitle>
            <DialogDescription>
              Add a professional contact who can provide feedback on this employee's performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact Name *</Label>
              <Input
                id="contact-name"
                placeholder="Ahmed Al-Balushi"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number *</Label>
              <Input
                id="contact-phone"
                placeholder="+96812345678"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email Address</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="ahmed@example.com"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-role">Role / Relationship *</Label>
              <Select
                value={newContact.role}
                onValueChange={(value: any) => setNewContact({ ...newContact, role: value })}
              >
                <SelectTrigger id="contact-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="senior-manager">Senior Manager</SelectItem>
                  <SelectItem value="team-lead">Team Lead</SelectItem>
                  <SelectItem value="colleague">Colleague (Same Department)</SelectItem>
                  <SelectItem value="cross-department">Colleague (Different Department)</SelectItem>
                  <SelectItem value="subordinate">Subordinate</SelectItem>
                  <SelectItem value="partner">Business Partner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="vendor">Vendor/Supplier</SelectItem>
                  <SelectItem value="consultant">Consultant/Advisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-language">Preferred Language *</Label>
              <Select
                value={newContact.language}
                onValueChange={(value: any) => setNewContact({ ...newContact, language: value })}
              >
                <SelectTrigger id="contact-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleAddContact} className="flex-1">
                Add Contact
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingContact(false)
                  setCurrentEmployee(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
