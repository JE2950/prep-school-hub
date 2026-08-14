import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { CrudPage } from "../components/CrudPage";
import { FieldDef } from "../components/ResourceForm";
import { formatDate } from "../lib/dates";

interface TutorGroup {
  id: string;
  name: string;
}

export function PupilsPage() {
  const [tutorGroups, setTutorGroups] = useState<TutorGroup[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<TutorGroup[]>("/tutor-groups").then((tg) => {
      setTutorGroups(tg);
      setLoaded(true);
    });
  }, []);

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
  ];

  return (
    <div>
      <p className="text-sm text-ink-500 -mt-2 mb-4">
        Your master pupil list. Add pupils here once, then assign them to classes, teams and tutor groups.
      </p>
      <CrudPage
        title="Pupils"
        apiPath="/pupils"
        addLabel="Add pupil"
        fields={fields}
        columns={[
          { key: "name", label: "Name", render: (r: any) => `${r.firstName} ${r.lastName}` },
          { key: "tutorGroup", label: "Tutor group", render: (r: any) => r.tutorGroup?.name ?? "—" },
          { key: "dob", label: "Date of birth", render: (r: any) => formatDate(r.dob) },
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
