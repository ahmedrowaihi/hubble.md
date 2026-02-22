import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { keymatch } from "keymatch";
import { useStoreValue } from "@simplestack/store/react";
import type { Editor } from "@tiptap/core";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem } from "@tiptap/extension-list";
import {
  getMarkdownRolloverBoundaryState,
  listExtensions,
  markdownToTiptapDoc,
  MarkdownRolloverExtension,
  tiptapDocToMarkdown,
} from "@hubble.md/editor";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { loadPath, savePathContent, viewerStore } from "./store";
import { createAppMenu } from "./appMenu";
import "./App.css";

function App() {
  const state = useStoreValue(viewerStore);

  async function openFilePicker() {
    const selected = await open({
      multiple: false,
      directory: false,
      title: "Open Markdown file",
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "mdown"] },
        { name: "Text", extensions: ["txt", "text"] },
      ],
    });
    if (typeof selected === "string") {
      await loadPath(selected);
    }
  }

  useEffect(() => {
    const setupMenu = async () => {
      const menu = await createAppMenu({ open: () => void openFilePicker() });
      await menu.setAsAppMenu();
    };
    void setupMenu();
    const onKeyDown = async (event: KeyboardEvent) => {
      if (keymatch(event, "CmdOrCtrl+O")) {
        event.preventDefault();
        await openFilePicker();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | null = null;
    const setup = async () => {
      const nextUnlisten = await listen<{ path?: string }>("hubble://open-file", async (event) => {
        const path = event.payload?.path;
        if (path) {
          await loadPath(path);
        }
      });
      if (disposed) {
        nextUnlisten();
        return;
      }
      unlisten = nextUnlisten;
    };
    void setup();
    return () => {
      disposed = true;
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const launchPath = await invoke<string | null>("get_launch_file_path");
      if (!active) return;

      if (typeof launchPath === "string" && launchPath.length > 0) {
        await loadPath(launchPath);
        return;
      }

      const lastPath = viewerStore.get().lastOpenedPath;
      if (lastPath) {
        await loadPath(lastPath);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app">
      <section className="content" aria-live="polite">
        {state.status === "loading" && <p>Loading…</p>}
        {state.status === "error" && <p>{state.error ?? "Failed to open file."}</p>}
        {state.status !== "loading" && state.status !== "error" && !state.currentPath && (
          <p>Open a markdown file to edit. Press ⌘O.</p>
        )}
        {state.status === "ready" && state.currentPath && (
          <MarkdownEditor key={state.currentPath} path={state.currentPath} initialMarkdown={state.content} />
        )}
      </section>
    </main>
  );
}
const SAVE_DEBOUNCE_MS = 120;

function MarkdownEditor({ path, initialMarkdown }: { path: string; initialMarkdown: string }) {
  const latestMarkdownRef = useRef(initialMarkdown);
  const saveTimerRef = useRef<number | null>(null);
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const initialDoc = useMemo(() => markdownToTiptapDoc(initialMarkdown), [initialMarkdown]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        listItem: false,
      }),
      MarkdownRolloverExtension,
      ...listExtensions,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialDoc,
    onUpdate: ({ editor: currentEditor }) => {
      const markdown = tiptapDocToMarkdown(currentEditor.getJSON() as JSONContent);
      latestMarkdownRef.current = markdown;

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        void savePathContent(path, latestMarkdownRef.current);
      }, SAVE_DEBOUNCE_MS);
    },
    editorProps: {
      attributes: {
        class: "editorInput",
      },
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      void savePathContent(path, latestMarkdownRef.current);
    };
  }, [path]);

  return (
    <div className="editorRoot" ref={editorRootRef}>
      <EditorContent editor={editor} />
      <VirtualCursor editor={editor} containerRef={editorRootRef} />
    </div>
  );
}

type CursorStyle = "hidden" | "solid" | "blinking";
type CursorPosition = { left: number; top: number; width: number; height: number };

function VirtualCursor({
  editor,
  containerRef,
}: {
  editor: Editor | null;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [cursorStyle, setCursorStyle] = useState<CursorStyle>("hidden");
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const blinkTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) return;

    const clearBlinkTimeout = () => {
      if (blinkTimeoutRef.current !== null) {
        window.clearTimeout(blinkTimeoutRef.current);
        blinkTimeoutRef.current = null;
      }
    };

    const queueBlink = () => {
      setCursorStyle("solid");
      clearBlinkTimeout();
      blinkTimeoutRef.current = window.setTimeout(() => {
        setCursorStyle("blinking");
      }, 500);
    };

    const updateCursor = () => {
      const container = containerRef.current;
      if (!container || !editor.view) {
        setCursorStyle("hidden");
        return;
      }

      const { state, view } = editor;
      if (!state.selection.empty || !editor.isFocused) {
        setCursorStyle("hidden");
        return;
      }

      const rootRect = container.getBoundingClientRect();
      const coords = view.coordsAtPos(state.selection.head);
      let left = coords.left - rootRect.left;
      let top = coords.top - rootRect.top;
      let height = Math.max(coords.bottom - coords.top, 1);

      const boundary = getMarkdownRolloverBoundaryState(state);
      if (boundary && boundary.boundaryPos === state.selection.from) {
        const delimiter = view.dom.querySelector(
          `.pm-md-delimiter[data-pos="${boundary.boundaryPos}"][data-mark="${boundary.markName}"][data-boundary="${boundary.boundary}"]`,
        ) as HTMLElement | null;
        if (delimiter) {
          const rect = delimiter.getBoundingClientRect();
          const useRightEdge =
            (boundary.boundary === "start" && boundary.side === "inside") ||
            (boundary.boundary === "end" && boundary.side === "outside");
          left = (useRightEdge ? rect.right : rect.left) - rootRect.left;
          top = rect.top - rootRect.top;
          height = Math.max(rect.height, height);
        }
      }

      const scale = 1.5;
      const scaledHeight = height * scale;
      const topOffset = (scaledHeight - height) / 2;
      const width = scaledHeight * 0.02 + 2;
      setCursorPosition({
        left,
        top: top - topOffset,
        width,
        height: scaledHeight,
      });
      queueBlink();
    };

    updateCursor();
    editor.on("selectionUpdate", updateCursor);
    editor.on("transaction", updateCursor);
    editor.on("focus", updateCursor);
    editor.on("blur", updateCursor);
    window.addEventListener("resize", updateCursor);
    window.addEventListener("scroll", updateCursor, true);

    return () => {
      editor.off("selectionUpdate", updateCursor);
      editor.off("transaction", updateCursor);
      editor.off("focus", updateCursor);
      editor.off("blur", updateCursor);
      window.removeEventListener("resize", updateCursor);
      window.removeEventListener("scroll", updateCursor, true);
      clearBlinkTimeout();
    };
  }, [editor, containerRef]);

  if (!cursorPosition || cursorStyle === "hidden") return null;

  return (
    <span
      className={`pm-virtual-cursor ${cursorStyle === "blinking" ? "blinking" : ""}`}
      aria-hidden="true"
      style={{
        left: `${cursorPosition.left}px`,
        top: `${cursorPosition.top}px`,
        width: `${cursorPosition.width}px`,
        height: `${cursorPosition.height}px`,
      }}
    />
  );
}

export default App;
