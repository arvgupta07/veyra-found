import { supabase } from "@/integrations/supabase/client";

const BUCKET = "user-uploads";
const MAX_BYTES = 5 * 1024 * 1024;
const YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Uploads an image to the private user-uploads bucket and returns a long-lived
 * signed URL so it can be stored in a column and rendered with a plain <img>.
 */
export async function uploadImage(file: File, folder: "avatars" | "forum"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please pick an image file");
  if (file.size > MAX_BYTES) throw new Error("Image must be under 5 MB");

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("You must be signed in to upload");

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${uid}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, YEAR_SECONDS);
  if (sErr || !data?.signedUrl) throw new Error(sErr?.message ?? "Could not create image link");
  return data.signedUrl;
}

const DOC_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

/**
 * Uploads a CV / document (PDF or Word) to the private user-uploads bucket and
 * returns a long-lived signed URL that can be stored in a column.
 */
export async function uploadDocument(file: File, folder: "cv"): Promise<string> {
  if (!DOC_TYPES.includes(file.type)) throw new Error("Please upload a PDF or Word document");
  if (file.size > MAX_BYTES) throw new Error("File must be under 5 MB");

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("You must be signed in to upload");

  const ext = (file.name.split(".").pop() ?? "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${uid}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, YEAR_SECONDS);
  if (sErr || !data?.signedUrl) throw new Error(sErr?.message ?? "Could not create file link");
  return data.signedUrl;
}
