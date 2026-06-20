const SESSION_KEY = "sourceguard_annotator_session_id";

export function getAnnotatorSessionId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
