import React, { useState, useEffect } from "react";
import "./App.css";

// Color palette from requirements
const COLOR = {
  accent: "#ffdd57",
  primary: "#1e90ff",
  secondary: "#f5f6fa",
};

function generateId() {
  // Simple unique ID for demo purposes
  return "note" + Date.now() + Math.random().toString(36).substr(2, 9);
}

/**
 * Returns a human-readable timestamp string
 */
function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString();
}

// PUBLIC_INTERFACE
function App() {
  // Notes structure: [{id, title, content, updated}]
  const [notes, setNotes] = useState(() =>
    JSON.parse(localStorage.getItem("notes-app")) || []
  );
  const [selectedId, setSelectedId] = useState(notes.length ? notes[0].id : "");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingNote, setEditingNote] = useState(null); // null or note object
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Persist notes
  useEffect(() => {
    localStorage.setItem("notes-app", JSON.stringify(notes));
  }, [notes]);

  // Select new note if none selected
  useEffect(() => {
    if (selectedId && !notes.find(n => n.id === selectedId)) {
      setSelectedId(notes.length ? notes[0].id : "");
    }
  }, [notes, selectedId]);

  // Search & sort notes
  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.updated - a.updated); // newest first

  // Currently selected note
  const selectedNote =
    notes.find((n) => n.id === selectedId) || filteredNotes[0] || null;

  // PUBLIC_INTERFACE
  function handleNewNote() {
    const newNote = {
      id: generateId(),
      title: "Untitled Note",
      content: "",
      updated: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
    setEditingNote(newNote);
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedId(id);
    setEditingNote(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (window.confirm("Delete this note?")) {
      setNotes(notes.filter((n) => n.id !== id));
      if (selectedId === id) {
        setSelectedId(notes.length > 1 ? notes.find(n => n.id !== id).id : "");
      }
    }
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(note) {
    const updated = { ...note, updated: Date.now() };
    setNotes(
      notes.map((n) => (n.id === note.id ? updated : n))
    );
    setEditingNote(null);
  }

  // PUBLIC_INTERFACE
  function handleUpdateField(field, value) {
    setEditingNote({ ...editingNote, [field]: value });
  }

  // PUBLIC_INTERFACE
  function handleSearch(e) {
    setSearchTerm(e.target.value);
  }

  // Keyboard shortcut for new note
  useEffect(() => {
    function handleKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
    // eslint-disable-next-line
  }, [notes]);

  // Responsive sidebar control
  useEffect(() => {
    function updateSidebar() {
      setIsSidebarOpen(window.innerWidth > 768);
    }
    window.addEventListener("resize", updateSidebar);
    updateSidebar();
    return () => window.removeEventListener("resize", updateSidebar);
  }, []);

  // MAIN RENDER
  return (
    <div className="app-root">
      <NavBar onNewNote={handleNewNote} />
      <div className="app-body">
        <Sidebar
          open={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          searchTerm={searchTerm}
          onSearch={handleSearch}
          notes={filteredNotes}
          selectedId={selectedId}
          onSelect={handleSelectNote}
          onDelete={handleDeleteNote}
          color={COLOR}
        />
        <main className="main-content">
          <SidebarToggle
            open={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((v) => !v)}
          />
          {selectedNote ? (
            editingNote && editingNote.id === selectedNote.id ? (
              <NoteEditor
                note={editingNote}
                onSave={handleSaveNote}
                onChange={handleUpdateField}
                onCancel={() => setEditingNote(null)}
                color={COLOR}
              />
            ) : (
              <NoteView
                note={selectedNote}
                onEdit={() => setEditingNote(selectedNote)}
                color={COLOR}
              />
            )
          ) : (
            <EmptyState onNewNote={handleNewNote} color={COLOR} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

// NAVBAR COMPONENT
function NavBar({ onNewNote }) {
  return (
    <nav className="nav-bar" role="navigation">
      <span className="logo">
        <span style={{ color: COLOR.primary, fontWeight: 800 }}>NoteEase</span>
      </span>
      <button
        className="btn-accent"
        onClick={onNewNote}
        aria-label="Create New Note (Ctrl+N)"
      >
        + New Note
      </button>
    </nav>
  );
}

// SIDEBAR COMPONENT
function Sidebar({
  open,
  onToggle,
  searchTerm,
  onSearch,
  notes,
  selectedId,
  onSelect,
  onDelete,
  color,
}) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <input
          className="sidebar-search"
          type="search"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={onSearch}
          aria-label="Search notes"
        />
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
        >
          {open ? "⏴" : "⏵"}
        </button>
      </div>
      <nav className="sidebar-list" aria-label="Notes list">
        {notes.length === 0 ? (
          <div className="sidebar-empty">No notes found</div>
        ) : (
          notes.map((n) => (
            <NoteListItem
              key={n.id}
              note={n}
              selected={n.id === selectedId}
              onSelect={() => onSelect(n.id)}
              onDelete={() => onDelete(n.id)}
              color={color}
            />
          ))
        )}
      </nav>
    </aside>
  );
}

function SidebarToggle({ open, onToggle }) {
  // Hidden on larger screens
  return (
    <button className="sidebar-toggle-mobile" onClick={onToggle} aria-label={open ? "Hide sidebar" : "Show sidebar"}>
      {open ? "≡ Hide" : "≡ Menu"}
    </button>
  );
}

// INDIVIDUAL NOTE ITEM IN SIDEBAR
function NoteListItem({ note, selected, onSelect, onDelete, color }) {
  return (
    <div className={`note-list-item${selected ? " selected" : ""}`} onClick={onSelect} tabIndex={0}>
      <div>
        <span className="note-item-title">{note.title || <em>Untitled</em>}</span>
        <div className="note-item-timestamp">{formatTimestamp(note.updated)}</div>
      </div>
      <button className="note-delete-btn" onClick={e => {e.stopPropagation(); onDelete();}} aria-label="Delete note" title="Delete Note">
        🗑
      </button>
    </div>
  );
}

// NOTE VIEWER
function NoteView({ note, onEdit, color }) {
  return (
    <div className="note-view">
      <header>
        <h2 style={{ color: color.primary, marginBottom: 0 }}>{note.title}</h2>
        <div className="note-timestamp" style={{ color: "#999", fontSize: "0.95em" }}>
          Last updated: {formatTimestamp(note.updated)}
        </div>
        <button className="btn-accent" onClick={onEdit} style={{ marginTop: 10 }}>
          Edit
        </button>
      </header>
      <section className="note-content">
        {note.content ? (
          note.content.split("\n").map((line, i) => <div key={i}>{line}</div>)
        ) : (
          <em style={{ color: "#bbb" }}>No note content yet.</em>
        )}
      </section>
    </div>
  );
}

// NOTE EDITOR
function NoteEditor({ note, onSave, onChange, onCancel, color }) {
  function handleSubmit(e) {
    e.preventDefault();
    if (note.title.trim() === "") {
      alert("Title cannot be empty.");
      return;
    }
    onSave(note);
  }
  return (
    <form className="note-editor" onSubmit={handleSubmit}>
      <input
        className="note-editor-title"
        value={note.title}
        placeholder="Title"
        maxLength={128}
        onChange={e => onChange("title", e.target.value)}
        autoFocus
        style={{ borderBottom: `2px solid ${color.accent}` }}
      />
      <textarea
        className="note-editor-content"
        value={note.content}
        placeholder="Start writing your note..."
        rows={10}
        onChange={e => onChange("content", e.target.value)}
      />
      <div className="note-editor-buttons">
        <button
          type="button"
          className="btn"
          style={{ background: "#eee", color: color.primary }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button className="btn-accent" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}

// EMPTY STATE VIEW
function EmptyState({ onNewNote, color }) {
  return (
    <div className="empty-state">
      <p style={{ fontSize: "1.5em", color: "#888" }}>No note selected.</p>
      <button className="btn-accent" onClick={onNewNote}>
        + Create your first note
      </button>
      <p style={{ color: "#bbb", marginTop: "1.5em" }}>
        Tip: Use <kbd>Ctrl+N</kbd> to create a new note anytime.
      </p>
    </div>
  );
}

// FOOTER
function Footer() {
  return (
    <footer className="footer">
      <span>
        <a
          href="https://github.com/"
          style={{ color: "#aaa", textDecoration: "none" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          NoteEase • Minimal Note App
        </a>
      </span>
    </footer>
  );
}

export default App;
