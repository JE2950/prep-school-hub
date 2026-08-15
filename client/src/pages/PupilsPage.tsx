import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { CrudPage } from "../components/CrudPage";
import { FieldDef } from "../components/ResourceForm";
import { ImportExportBar } from "../components/ImportExportBar";
import { formatDate } from "../lib/dates";

interface TutorGroup {
  id: string;
  name: string;
}

export function PupilsPage() {
  const [tutorGroups, setTutorGroups] = useState<TutorGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get<TutorGroup[]>("/tutor-groups").then((tg) => {
      setTutorGroups(tg);
      setLoaded(true);
    });
  }, [refreshKey]);

  if (!loaded) return <p className="text-sm text-ink-400">Loading…</p>;

  const fields: FieldDef[] = [
    { key: "firstName", label: "First name", type: "text", required: true },
    { key: "lastName", label: "Last name", type: "text", required: true },
    { key: "dob", label: "Date of birth", type: "date" },
    {
      key: "tutorGroupId",
      label: "Tutor group",
      type: "select",
      options: tutorGroups.map((t) => ({ value: t.id, label: t.name })),
    },
    { key: "parentName", label: "Parent / guardian name", type: "text" },
    { key: "parentEmail", label: "Parent / guardian email", type: "text" },
    { key: "parentEmail2", label: "Second parent / guardian email", type: "text" },
    { key: "notes", label: "Notes (e.g. allergies, dietary)", type: "textarea", span: 2 },
  ];

  return (
    <div>
      <p className="text-sm text-ink-500 -mt-2 mb-3">
        Your master pupil list. Add pupils here once, then assign them to classes, teams and tutor groups.
      </p>
      <div className="mb-4">
        <ImportExportBar
          label="Pupils"
          templateUrl="/api/imports/pupils/template"
          exportUrl="/api/imports/pupils/export"
          importUrl="/imports/pupils"
          onImported={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <CrudPage
        key={refreshKey}
        title="Pupils"
        apiPath="/pupils"
        addLabel="Add pupil"
        fields={fields}
        columns={[
          { key: "name", label: "Name", render: (r: any) => `${r.firstName} ${r.lastName}` },
          { key: "tutorGroup", label: "Tutor group", render: (r: any) => r.tutorGroup?.name ?? "—" },
          { key: "dob", label: "Date of birth", render: (r: any) => formatDate(r.dob) },
          { key: "parentEmail", label: "Parent email", render: (r: any) => r.parentEmail ?? "—" },
          {
            key: "classes",
            label: "Classes",
            render: (r: any) => r.classes?.map((cp: any) => cp.class?.name).join(", ") || "—",
          },
        ]}
        emptyLabel="No pupils added yet."
      />
    </div>
  );
}
