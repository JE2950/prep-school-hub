import { CrudPage } from "../components/CrudPage";
import { FieldDef } from "../components/ResourceForm";

const fields: FieldDef[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "role", label: "Role", type: "text" },
  {
    key: "type",
    label: "Type",
    type: "select",
    required: true,
    options: [
      { value: "school", label: "School (colleague, department, office, medical)" },
      { value: "external", label: "External (coach, exam board, supplier)" },
    ],
  },
  { key: "department", label: "Department", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "credentialsLocation", label: "Where credentials are stored (e.g. \"in password manager\")", type: "text", span: 2 },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

export function ContactsPage() {
  return (
    <CrudPage
      title="Contacts"
      description="School and external contacts. Actual passwords are never stored here — just where to find them."
      apiPath="/contacts"
      fields={fields}
      addLabel="Add contact"
      columns={[
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "type", label: "Type", render: (r: any) => (r.type === "school" ? "School" : "External") },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
      ]}
      emptyLabel="No contacts added yet."
    />
  );
}
