"use server";

export type CategoryActionState = { ok: boolean; message: string };

export async function saveCategory(
  _previousState: CategoryActionState,
  _formData: FormData,
): Promise<CategoryActionState> {
  return {
    ok: false,
    message: "This legacy category action is disabled. Use the live Categories page backed by the canonical PHP/MySQL catalog.",
  };
}